import Link from "next/link";
import { ArrowRight, Database, ShieldCheck, Repeat, ServerCrash } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "How Dropfront Live works",
};

export default function HowItWorksPage() {
  return (
    <div className="container max-w-4xl py-12">
      <Badge variant="default" className="w-fit">
        <ShieldCheck className="h-3.5 w-3.5" /> The database is the correctness boundary
      </Badge>
      <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
        One transaction does the whole job
      </h1>
      <p className="mt-3 text-lg text-muted-foreground">
        Overselling looks like an inventory problem, so most teams reach for a Redis
        counter with Lua scripts plus a background job to reconcile it against the order
        table. That is a consistency problem in disguise. Aurora DSQL gives us strong
        consistency with ACID transactions, so we delete that whole fragile layer.
      </p>

      <div className="mt-10 overflow-hidden rounded-2xl border border-border bg-card">
        <ArchitectureDiagram />
      </div>

      <section className="mt-12">
        <h2 className="text-2xl font-bold tracking-tight">The transaction</h2>
        <p className="mt-2 text-muted-foreground">
          Every purchase, whether from a real fan or a stress-test buyer, runs the same
          tiny transaction. The conditional WHERE clause is the entire guarantee.
        </p>
        <pre className="mt-4 overflow-x-auto rounded-xl border border-border bg-background/60 p-5 text-sm leading-relaxed">
          <code>{`BEGIN;

-- Conditionally claim one unit. Returns 0 rows if stock is gone.
UPDATE drops
   SET remaining = remaining - 1
 WHERE id = $dropId
   AND remaining > 0
RETURNING remaining;

-- Only reached when a unit was actually claimed.
INSERT INTO orders (id, drop_id, buyer, unit_price_cents, created_at, source)
VALUES ($id, $dropId, $buyer, $price, now(), $source);

COMMIT;`}</code>
        </pre>
        <p className="mt-3 text-sm text-muted-foreground">
          If two buyers race for the last unit, one transaction wins the row and the other
          gets zero rows back and a clean sold-out. Under heavy contention DSQL may abort a
          transaction with a serialization failure (SQLSTATE 40001); we retry a bounded
          number of times so a genuine winner is never wrongly rejected.
        </p>
      </section>

      <section className="mt-12 grid gap-5 sm:grid-cols-3">
        {[
          {
            icon: ShieldCheck,
            title: "Strong consistency",
            body: "The remaining counter is the single source of truth. No cache to drift, no reconciliation job to catch up.",
          },
          {
            icon: Repeat,
            title: "Bounded retries",
            body: "Optimistic concurrency aborts are retried briefly, then rejected fast. Losers fail clean instead of erroring ugly.",
          },
          {
            icon: ServerCrash,
            title: "Scale to zero",
            body: "DSQL is serverless. It costs nothing when a drop is idle and scales itself when a launch goes viral.",
          },
        ].map((f) => (
          <div key={f.title} className="rounded-2xl border border-border bg-card p-6">
            <f.icon className="h-6 w-6 text-primary" />
            <h3 className="mt-3 font-semibold">{f.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{f.body}</p>
          </div>
        ))}
      </section>

      <section className="mt-12 rounded-2xl border border-border bg-aurora p-8 text-center">
        <h2 className="text-2xl font-bold tracking-tight">See the proof</h2>
        <p className="mx-auto mt-2 max-w-xl text-muted-foreground">
          Open the dashboard, pick the live drop, and fire thousands of concurrent buyers.
          Watch sold equal inventory exactly, with oversold pinned at zero.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/dashboard" className={cn(buttonVariants({ size: "lg" }))}>
            Run the stress test <ArrowRight className="h-4 w-4" />
          </Link>
          <Link href="/drops" className={cn(buttonVariants({ size: "lg", variant: "outline" }))}>
            Browse drops
          </Link>
        </div>
      </section>
    </div>
  );
}

function ArchitectureDiagram() {
  return (
    <svg viewBox="0 0 900 360" className="w-full" role="img" aria-label="Dropfront Live architecture diagram">
      <defs>
        <linearGradient id="g1" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="hsl(158 84% 45%)" />
          <stop offset="100%" stopColor="hsl(200 90% 50%)" />
        </linearGradient>
        <marker id="arrow" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto">
          <path d="M0,0 L8,3 L0,6 Z" fill="hsl(230 12% 62%)" />
        </marker>
      </defs>
      <rect width="900" height="360" fill="hsl(240 24% 7%)" />

      <Node x={40} y={60} w={180} h={70} title="Fans" sub="Drop page + buy" />
      <Node x={40} y={210} w={180} h={70} title="Seller" sub="Stress test button" />

      <Node x={300} y={130} w={220} h={90} title="Next.js on Vercel" sub="Route handlers (Node)" accent />

      <Node x={620} y={60} w={240} h={70} title="Atomic buy transaction" sub="conditional decrement + insert" />
      <Node x={620} y={210} w={240} h={90} title="Amazon Aurora DSQL" sub="strong consistency, scale to zero" db />

      <line x1="220" y1="95" x2="300" y2="150" stroke="hsl(230 12% 62%)" strokeWidth="2" markerEnd="url(#arrow)" />
      <line x1="220" y1="245" x2="300" y2="200" stroke="hsl(230 12% 62%)" strokeWidth="2" markerEnd="url(#arrow)" />
      <line x1="520" y1="160" x2="620" y2="100" stroke="hsl(230 12% 62%)" strokeWidth="2" markerEnd="url(#arrow)" />
      <line x1="740" y1="130" x2="740" y2="210" stroke="url(#g1)" strokeWidth="3" markerEnd="url(#arrow)" />
      <line x1="520" y1="190" x2="620" y2="240" stroke="hsl(230 12% 62%)" strokeWidth="2" markerEnd="url(#arrow)" />

      <text x="450" y="330" textAnchor="middle" fill="hsl(230 12% 62%)" fontSize="13">
        No Redis. No reconciliation job. The transaction is the single correctness boundary.
      </text>
    </svg>
  );
}

function Node({
  x,
  y,
  w,
  h,
  title,
  sub,
  accent,
  db,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  title: string;
  sub: string;
  accent?: boolean;
  db?: boolean;
}) {
  const stroke = db ? "hsl(158 84% 45%)" : accent ? "hsl(268 84% 62%)" : "hsl(240 16% 24%)";
  const fill = db ? "hsl(158 84% 45% / 0.1)" : accent ? "hsl(268 84% 62% / 0.1)" : "hsl(240 20% 10%)";
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={14} fill={fill} stroke={stroke} strokeWidth="1.5" />
      <text x={x + w / 2} y={y + h / 2 - 6} textAnchor="middle" fill="hsl(220 20% 96%)" fontSize="15" fontWeight="600">
        {title}
      </text>
      <text x={x + w / 2} y={y + h / 2 + 15} textAnchor="middle" fill="hsl(230 12% 62%)" fontSize="12">
        {sub}
      </text>
    </g>
  );
}
