import { Pool, type PoolClient } from "pg";
import type { BuyOutcome, Drop, DropStats, Order } from "./types";
import { seedDrops, seedOrders } from "./seed";
import { pct, slugify } from "./utils";

// Aurora DSQL backend. DSQL speaks PostgreSQL wire protocol and gives strong
// consistency with snapshot isolation plus optimistic concurrency control.
// The correctness boundary is a single transaction:
//
//   UPDATE drops SET remaining = remaining - 1 WHERE id = $1 AND remaining > 0
//   INSERT INTO orders (...)
//
// The conditional WHERE means a buyer who races for the last unit either wins
// the row or gets zero rows back and is rejected cleanly. Under contention DSQL
// may abort a transaction with SQLSTATE 40001 (serialization failure); we retry
// a bounded number of times so a genuine winner is never wrongly rejected and a
// loser fails fast. No Redis, no reconciliation job, no oversell.

const SCHEMA = `
CREATE TABLE IF NOT EXISTS drops (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  creator TEXT NOT NULL,
  description TEXT NOT NULL,
  image TEXT NOT NULL,
  accent TEXT NOT NULL,
  price_cents BIGINT NOT NULL,
  currency TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  remaining INTEGER NOT NULL,
  go_live_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  per_fan_limit INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  drop_id TEXT NOT NULL,
  buyer TEXT NOT NULL,
  unit_price_cents BIGINT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  source TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS orders_drop_idx ON orders (drop_id);
`;

const MAX_RETRIES = 8;
const pools = new Map<string, Pool>();
const ready = new Map<string, Promise<void>>();

function getPool(connectionString: string): Pool {
  let pool = pools.get(connectionString);
  if (!pool) {
    pool = new Pool({
      connectionString,
      max: 12,
      ssl: connectionString.includes("sslmode=disable")
        ? undefined
        : { rejectUnauthorized: false },
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 8_000,
    });
    pools.set(connectionString, pool);
  }
  return pool;
}

function rowToDrop(r: any): Drop {
  return {
    id: r.id,
    slug: r.slug,
    title: r.title,
    creator: r.creator,
    description: r.description,
    image: r.image,
    accent: r.accent,
    priceCents: Number(r.price_cents),
    currency: r.currency,
    quantity: Number(r.quantity),
    remaining: Number(r.remaining),
    goLiveAt: new Date(r.go_live_at).toISOString(),
    createdAt: new Date(r.created_at).toISOString(),
    perFanLimit: Number(r.per_fan_limit),
  };
}

function rowToOrder(r: any): Order {
  return {
    id: r.id,
    dropId: r.drop_id,
    buyer: r.buyer,
    unitPriceCents: Number(r.unit_price_cents),
    createdAt: new Date(r.created_at).toISOString(),
    source: r.source,
  };
}

async function ensureReady(connectionString: string) {
  if (!ready.has(connectionString)) {
    ready.set(
      connectionString,
      (async () => {
        const pool = getPool(connectionString);
        for (const stmt of SCHEMA.split(";").map((s) => s.trim()).filter(Boolean)) {
          await pool.query(stmt);
        }
        const { rows } = await pool.query("SELECT COUNT(*)::int AS n FROM drops");
        if (rows[0].n === 0) await seed(pool);
      })()
    );
  }
  await ready.get(connectionString);
}

async function seed(pool: Pool) {
  for (const d of seedDrops()) {
    await pool.query(
      `INSERT INTO drops (id, slug, title, creator, description, image, accent, price_cents, currency, quantity, remaining, go_live_at, created_at, per_fan_limit)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) ON CONFLICT (id) DO NOTHING`,
      [
        d.id, d.slug, d.title, d.creator, d.description, d.image, d.accent,
        d.priceCents, d.currency, d.quantity, d.remaining, d.goLiveAt,
        d.createdAt, d.perFanLimit,
      ]
    );
  }
  for (const o of seedOrders()) {
    await pool.query(
      `INSERT INTO orders (id, drop_id, buyer, unit_price_cents, created_at, source)
       VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT (id) DO NOTHING`,
      [o.id, o.dropId, o.buyer, o.unitPriceCents, o.createdAt, o.source]
    );
  }
}

function newId(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function createPgStore(connectionString: string) {
  const pool = getPool(connectionString);

  async function withClient<T>(fn: (c: PoolClient) => Promise<T>): Promise<T> {
    await ensureReady(connectionString);
    const client = await pool.connect();
    try {
      return await fn(client);
    } finally {
      client.release();
    }
  }

  return {
    async listDrops(): Promise<Drop[]> {
      await ensureReady(connectionString);
      const { rows } = await pool.query("SELECT * FROM drops ORDER BY created_at DESC");
      return rows.map(rowToDrop);
    },

    async getDrop(slug: string): Promise<Drop | null> {
      await ensureReady(connectionString);
      const { rows } = await pool.query("SELECT * FROM drops WHERE slug = $1", [slug]);
      return rows[0] ? rowToDrop(rows[0]) : null;
    },

    async createDrop(input: any): Promise<Drop> {
      await ensureReady(connectionString);
      let slug = slugify(input.title) || "drop";
      let n = 1;
      while ((await pool.query("SELECT 1 FROM drops WHERE slug = $1", [slug])).rowCount) {
        slug = `${slugify(input.title)}-${++n}`;
      }
      const drop: Drop = {
        id: newId("drp"),
        slug,
        title: input.title,
        creator: input.creator,
        description: input.description,
        image: input.image,
        accent: input.accent,
        priceCents: input.priceCents,
        currency: input.currency,
        quantity: input.quantity,
        remaining: input.quantity,
        goLiveAt: input.goLiveAt,
        createdAt: new Date().toISOString(),
        perFanLimit: input.perFanLimit,
      };
      await pool.query(
        `INSERT INTO drops (id, slug, title, creator, description, image, accent, price_cents, currency, quantity, remaining, go_live_at, created_at, per_fan_limit)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,
        [
          drop.id, drop.slug, drop.title, drop.creator, drop.description, drop.image,
          drop.accent, drop.priceCents, drop.currency, drop.quantity, drop.remaining,
          drop.goLiveAt, drop.createdAt, drop.perFanLimit,
        ]
      );
      return drop;
    },

    async buy(slug: string, buyer: string, source: "fan" | "stress"): Promise<BuyOutcome> {
      await ensureReady(connectionString);
      const meta = await pool.query(
        "SELECT id, go_live_at, per_fan_limit, remaining FROM drops WHERE slug = $1",
        [slug]
      );
      if (!meta.rows[0]) return { status: "sold_out", remaining: 0, attempts: 1 };
      const dropId = meta.rows[0].id as string;
      if (Date.parse(meta.rows[0].go_live_at) > Date.now()) {
        return { status: "not_live", remaining: Number(meta.rows[0].remaining) };
      }
      const perFanLimit = Number(meta.rows[0].per_fan_limit);

      let attempts = 0;
      // Bounded retry loop for DSQL optimistic concurrency aborts (40001).
      for (;;) {
        attempts++;
        const client = await pool.connect();
        try {
          await client.query("BEGIN");
          if (perFanLimit > 0 && source === "fan") {
            const owned = await client.query(
              "SELECT COUNT(*)::int AS n FROM orders WHERE drop_id = $1 AND buyer = $2",
              [dropId, buyer]
            );
            if (owned.rows[0].n >= perFanLimit) {
              await client.query("ROLLBACK");
              return { status: "limit_reached", remaining: -1 };
            }
          }
          const dec = await client.query(
            "UPDATE drops SET remaining = remaining - 1 WHERE id = $1 AND remaining > 0 RETURNING remaining",
            [dropId]
          );
          if (dec.rowCount === 0) {
            await client.query("ROLLBACK");
            return { status: "sold_out", remaining: 0, attempts };
          }
          const orderId = newId("ord");
          await client.query(
            `INSERT INTO orders (id, drop_id, buyer, unit_price_cents, created_at, source)
             VALUES ($1,$2,$3,(SELECT price_cents FROM drops WHERE id = $2),$4,$5)`,
            [orderId, dropId, buyer, new Date().toISOString(), source]
          );
          await client.query("COMMIT");
          return {
            status: "sold",
            orderId,
            remaining: Number(dec.rows[0].remaining),
            attempts,
          };
        } catch (err: any) {
          try {
            await client.query("ROLLBACK");
          } catch {
            /* connection already closed */
          }
          if (err?.code === "40001" && attempts < MAX_RETRIES) {
            // serialization failure: back off briefly and retry the race
            await new Promise((r) => setTimeout(r, 4 * attempts));
            continue;
          }
          throw err;
        } finally {
          client.release();
        }
      }
    },

    async getOrders(slug: string, limit = 200): Promise<Order[]> {
      await ensureReady(connectionString);
      const { rows } = await pool.query(
        `SELECT o.* FROM orders o JOIN drops d ON d.id = o.drop_id
         WHERE d.slug = $1 ORDER BY o.created_at DESC LIMIT $2`,
        [slug, limit]
      );
      return rows.map(rowToOrder);
    },

    async getStats(slug: string): Promise<DropStats> {
      await ensureReady(connectionString);
      const dropRes = await pool.query("SELECT * FROM drops WHERE slug = $1", [slug]);
      if (!dropRes.rows[0]) {
        return {
          quantity: 0, remaining: 0, sold: 0, oversold: 0,
          revenueCents: 0, conversionPct: 0, fanOrders: 0, stressOrders: 0,
        };
      }
      const drop = rowToDrop(dropRes.rows[0]);
      const agg = await pool.query(
        `SELECT
           COUNT(*)::int AS sold,
           COALESCE(SUM(unit_price_cents),0)::bigint AS revenue,
           COUNT(*) FILTER (WHERE source = 'fan')::int AS fan_orders
         FROM orders WHERE drop_id = $1`,
        [drop.id]
      );
      const sold = agg.rows[0].sold as number;
      const fanOrders = agg.rows[0].fan_orders as number;
      return {
        quantity: drop.quantity,
        remaining: drop.remaining,
        sold,
        oversold: Math.max(0, sold - drop.quantity),
        revenueCents: Number(agg.rows[0].revenue),
        conversionPct: pct(sold, drop.quantity),
        fanOrders,
        stressOrders: sold - fanOrders,
      };
    },

    async resetDrop(slug: string): Promise<Drop | null> {
      return withClient(async (client) => {
        const res = await client.query("SELECT id, quantity FROM drops WHERE slug = $1", [slug]);
        if (!res.rows[0]) return null;
        const dropId = res.rows[0].id as string;
        await client.query("DELETE FROM orders WHERE drop_id = $1", [dropId]);
        await client.query("UPDATE drops SET remaining = quantity WHERE id = $1", [dropId]);
        const fresh = await client.query("SELECT * FROM drops WHERE id = $1", [dropId]);
        return rowToDrop(fresh.rows[0]);
      });
    },
  };
}
