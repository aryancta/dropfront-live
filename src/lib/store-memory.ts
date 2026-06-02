import type { BuyOutcome, Drop, DropStats, Order } from "./types";
import { seedDrops, seedOrders } from "./seed";
import { pct, slugify } from "./utils";

// In-memory backend used for demo mode. Node runs the request handler on a
// single thread, so the read-check-decrement below executes with no await in
// the critical section. That makes it atomic by construction: two buyers can
// never both see the last unit. It mirrors exactly what the Aurora DSQL
// conditional UPDATE does on real infrastructure, which is the whole point of
// the demo. The remaining counter is the single source of truth, so oversold
// is structurally impossible.

interface MemoryState {
  drops: Map<string, Drop>;
  orders: Order[];
  seq: number;
}

function freshState(): MemoryState {
  const drops = new Map<string, Drop>();
  for (const d of seedDrops()) drops.set(d.slug, d);
  return { drops, orders: seedOrders(), seq: 1 };
}

const g = globalThis as unknown as { __dropfront?: MemoryState };
if (!g.__dropfront) g.__dropfront = freshState();
const state = g.__dropfront;

function nextId(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${(state.seq++).toString(36)}`;
}

function isLive(drop: Drop) {
  return Date.parse(drop.goLiveAt) <= Date.now();
}

export const memoryStore = {
  async listDrops(): Promise<Drop[]> {
    return [...state.drops.values()].sort(
      (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)
    );
  },

  async getDrop(slug: string): Promise<Drop | null> {
    return state.drops.get(slug) ?? null;
  },

  async createDrop(input: {
    title: string;
    creator: string;
    description: string;
    image: string;
    accent: string;
    priceCents: number;
    currency: string;
    quantity: number;
    goLiveAt: string;
    perFanLimit: number;
  }): Promise<Drop> {
    let slug = slugify(input.title) || "drop";
    let n = 1;
    while (state.drops.has(slug)) slug = `${slugify(input.title)}-${++n}`;
    const drop: Drop = {
      id: nextId("drp"),
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
    state.drops.set(slug, drop);
    return drop;
  },

  async buy(
    slug: string,
    buyer: string,
    source: "fan" | "stress"
  ): Promise<BuyOutcome> {
    const drop = state.drops.get(slug);
    if (!drop) return { status: "sold_out", remaining: 0, attempts: 1 };

    // --- begin atomic critical section (no await) ---
    if (!isLive(drop)) {
      return { status: "not_live", remaining: drop.remaining };
    }
    if (drop.perFanLimit > 0 && source === "fan") {
      const owned = state.orders.filter(
        (o) => o.dropId === drop.id && o.buyer === buyer
      ).length;
      if (owned >= drop.perFanLimit) {
        return { status: "limit_reached", remaining: drop.remaining };
      }
    }
    if (drop.remaining <= 0) {
      return { status: "sold_out", remaining: 0, attempts: 1 };
    }
    drop.remaining -= 1;
    const order: Order = {
      id: nextId("ord"),
      dropId: drop.id,
      buyer,
      unitPriceCents: drop.priceCents,
      createdAt: new Date().toISOString(),
      source,
    };
    state.orders.push(order);
    // --- end atomic critical section ---

    return { status: "sold", orderId: order.id, remaining: drop.remaining, attempts: 1 };
  },

  async getOrders(slug: string, limit = 200): Promise<Order[]> {
    const drop = state.drops.get(slug);
    if (!drop) return [];
    return state.orders
      .filter((o) => o.dropId === drop.id)
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
      .slice(0, limit);
  },

  async getStats(slug: string): Promise<DropStats> {
    const drop = state.drops.get(slug);
    if (!drop) {
      return {
        quantity: 0,
        remaining: 0,
        sold: 0,
        oversold: 0,
        revenueCents: 0,
        conversionPct: 0,
        fanOrders: 0,
        stressOrders: 0,
      };
    }
    const orders = state.orders.filter((o) => o.dropId === drop.id);
    const sold = orders.length;
    const fanOrders = orders.filter((o) => o.source === "fan").length;
    const stressOrders = sold - fanOrders;
    const oversold = Math.max(0, sold - drop.quantity);
    return {
      quantity: drop.quantity,
      remaining: drop.remaining,
      sold,
      oversold,
      revenueCents: orders.reduce((sum, o) => sum + o.unitPriceCents, 0),
      conversionPct: pct(sold, drop.quantity),
      fanOrders,
      stressOrders,
    };
  },

  async resetDrop(slug: string): Promise<Drop | null> {
    const drop = state.drops.get(slug);
    if (!drop) return null;
    drop.remaining = drop.quantity;
    state.orders = state.orders.filter((o) => o.dropId !== drop.id);
    return drop;
  },
};

export type Store = typeof memoryStore;
