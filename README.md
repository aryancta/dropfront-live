# Dropfront Live

> Creator product drops that sell out exactly, never oversell, even under a million-buyer stampede.

Dropfront Live is a drops commerce platform for creators and D2C brands. A seller launches a limited-stock drop with an exact quantity and a go-live countdown. Fans hit a fast drop page with a real-time stock counter, and every purchase runs inside a single strongly consistent transaction that conditionally decrements stock and writes the order together. The database itself enforces "sell exactly N, reject the rest fast and clean." No Redis counters, no Lua scripts, no reconciliation job, no oversell-then-refund disasters.

The whole reason this project exists is correctness under extreme contention, so we built a one-click **Stress Test** into the seller dashboard. It fires thousands of concurrent simulated buyers at a live drop and plays the result back as a live race, ending on a hard receipt: units sold equals inventory exactly, oversold equals zero.

![Dropfront Live architecture](public/logo.svg)

## Demo in 30 seconds

1. Open the home page and tap **See a live drop**. You land on the Aurora Runner OG drop with a live remaining counter sitting at 100.
2. Tap **Buy now**. One unit is secured through a single atomic transaction and you get a receipt.
3. Go to the **Dashboard**, pick the live drop, and hit **Run stress test** with 5,000 buyers.
4. Watch the tiles race: green for purchased, grey for a clean sold-out. The counter drains to zero and the receipt snaps in reading sold equals inventory, oversold zero, refunds needed zero.
5. The audit trail and revenue update live alongside it.

## Why this design

Most flash-sale architectures move the stock counter into Redis with atomic Lua scripts, then run a background job to reconcile that cache against the order table. That extra layer exists because relational databases were assumed too slow or too loosely consistent under contention. We deleted it. With Amazon Aurora DSQL we get strong consistency and ACID transactions, so a single conditional-decrement-plus-insert transaction is the entire correctness boundary.

The guarantee is one SQL statement doing the work:

```sql
UPDATE drops
   SET remaining = remaining - 1
 WHERE id = $dropId
   AND remaining > 0
RETURNING remaining;
```

If two buyers race for the last unit, one transaction claims the row and the other gets zero rows back and a clean sold-out. Under heavy contention DSQL can abort a transaction with a serialization failure (SQLSTATE 40001) because it uses optimistic concurrency; we retry a bounded number of times so a genuine winner is never wrongly rejected and losers fail in milliseconds.

## Features

- **Drop Builder** - set the item, artwork, price, exact quantity, per-fan limit, and a go-live time. Live preview as you type.
- **Atomic Buy** - a fan either gets a guaranteed unit or a fast, honest sold-out. No order is ever placed that cannot be fulfilled.
- **Live Stress Test** - fire 500 to 5,000 concurrent buyers at a live drop and watch the proof render in real time.
- **Real-Time Sell-Through Dashboard** - remaining stock, revenue, conversion, and a per-unit audit trail that updates as the drop happens.
- **One-per-fan enforcement** - a per-fan limit stops tab-spammers from hoarding a limited drop, enforced inside the same transaction.

## Tech stack

- **Next.js 14** (App Router) with **TypeScript**
- **Tailwind CSS** with hand-built shadcn-style components
- **Amazon Aurora DSQL** over the PostgreSQL wire protocol via `node-postgres`
- **Vercel** for hosting and the AWS Marketplace database integration
- **Docker** for a reproducible standalone build

## Architecture

```
Fans + Seller
     |
     v
Next.js route handlers (Node runtime on Vercel)
     |
     v
Atomic buy transaction  ->  Amazon Aurora DSQL
(conditional decrement       (strong consistency,
 + order insert)              scale to zero)
```

The data layer is a single store interface with two backends behind it:

- `store-pg.ts` runs against Aurora DSQL or any PostgreSQL connection string, using the conditional-decrement transaction with bounded retries on serialization failure.
- `store-memory.ts` is a strongly consistent in-memory backend used for demo mode. Node runs each request on one thread, so the read-check-decrement runs with no await in the critical section, which makes it atomic by construction and mirrors exactly what the DSQL transaction does. The never-oversell guarantee holds in both.

The app picks the backend per request: if a valid connection string is present (from the Settings panel header or the `DATABASE_URL` environment variable) it uses Aurora DSQL, otherwise it falls back to the in-memory backend so the app is fully usable on first run with zero configuration.

## Running locally

```bash
npm install
npm run dev
# open http://localhost:3000
```

No credentials are needed. The app boots in demo mode with seed data already populated: one live drop, one scheduled drop with a countdown, and one sold-through drop with a full audit trail.

To run against a real database, open **Settings** and paste an Aurora DSQL (or PostgreSQL) connection string. It is stored in your browser only, sent per request as a header, and never logged or persisted server-side. You can also set `DATABASE_URL` in the environment for server-side use. On first connect the app creates its schema and seeds the same demo data.

## Running with Docker

```bash
docker build -t app .
docker run -p 3000:3000 app
# open http://localhost:3000
```

The image uses the Next.js standalone output for a small runtime footprint and runs as a non-root user.

## Settings and keys

Open `/settings` to connect external services. Everything is optional for the demo:

- **Amazon Aurora DSQL** (sponsored by the hackathon) - paste your cluster connection string to flip the app onto live infrastructure. Leave blank to stay in demo mode.
- **Clerk** (optional) - a publishable key enables verified one-per-fan enforcement. The demo enforces a per-fan limit by browser identity without it.

Keys live in `localStorage` under the `dropfront_api_keys` namespace. They are never written to the server or committed to git.

## Project layout

```
src/
  app/
    api/drops/...        atomic buy, stress test, stats, orders, reset, create
    drops/               drop listing and the live drop page
    dashboard/           seller dashboard and the drop builder
    settings/            connect your own database
    how-it-works/        the architecture and the transaction explained
  components/            UI primitives, drop card, countdown, stress test
  lib/                   store backends, inventory selector, stress runner, types
```

## Credits

Built by Aryan Choudhary for H0: Hack the Zero Stack with Vercel v0 and AWS Databases. Powered by Amazon Aurora DSQL and shipped on Vercel.
