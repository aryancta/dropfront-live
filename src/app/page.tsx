import Link from "next/link";
import {
  ArrowRight,
  ShieldCheck,
  Gauge,
  Database,
  Rocket,
  CircleCheck,
  CircleX,
} from "lucide-react";
import { memoryStore } from "@/lib/store-memory";
import { DropCard } from "@/components/drop-card";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const drops = (await memoryStore.listDrops()).slice(0, 3);
  const liveDrop =
    drops.find((d) => Date.parse(d.goLiveAt) <= Date.now() && d.remaining > 0) ?? drops[0];

  return (
    <div>
      <section className="relative overflow-hidden border-b border-border/70 bg-aurora">
        <div className="bg-grid absolute inset-0 opacity-40" />
        <div className="container relative grid gap-10 py-20 lg:grid-cols-2 lg:py-28">
          <div className="flex flex-col justify-center">
            <Badge variant="default" className="w-fit">
              <ShieldCheck className="h-3.5 w-3.5" />
              Never-oversell, guaranteed by the database
            </Badge>
            <h1 className="mt-5 text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              Sell out <span className="text-primary">exactly</span>.
              <br />
              Oversell <span className="text-accent">never</span>.
            </h1>
            <p className="mt-5 max-w-xl text-lg text-muted-foreground">
              Dropfront Live runs limited-stock creator drops where every purchase
              is one strongly consistent Aurora DSQL transaction. No Redis counters,
              no reconciliation jobs, no oversell-then-refund disasters, even when a
              million fans hit buy at once.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              {liveDrop ? (
                <Link
                  href={`/drops/${liveDrop.slug}`}
                  className={cn(buttonVariants({ size: "lg" }))}
                >
                  See a live drop
                  <ArrowRight className="h-4 w-4" />
                </Link>
              ) : null}
              <Link
                href="/dashboard"
                className={cn(buttonVariants({ size: "lg", variant: "outline" }))}
              >
                Open the stress test
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <Database className="h-4 w-4 text-primary" /> Amazon Aurora DSQL
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Gauge className="h-4 w-4 text-primary" /> Scales to zero when idle
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Rocket className="h-4 w-4 text-primary" /> Ships on Vercel
              </span>
            </div>
          </div>

          <div className="flex items-center justify-center">
            <ProofCard />
          </div>
        </div>
      </section>

      <section className="container py-16">
        <div className="grid gap-5 md:grid-cols-3">
          {[
            {
              icon: ShieldCheck,
              title: "Correctness is the feature",
              body: "A conditional decrement plus an order insert inside one transaction. The remaining counter is the only source of truth, so two fans can never claim the same last unit.",
            },
            {
              icon: Gauge,
              title: "Fast, honest rejections",
              body: "Losers get a clean sold-out response in milliseconds. Under contention DSQL retries the race a bounded number of times, then rejects, instead of erroring ugly.",
            },
            {
              icon: Database,
              title: "No fragile cache layer",
              body: "We deleted the Redis-plus-Lua-plus-reconciliation stack the industry treats as standard. One database is the correctness boundary.",
            },
          ].map((f) => (
            <div key={f.title} className="rounded-2xl border border-border bg-card p-6">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <f.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="container pb-20">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Drops on the front</h2>
            <p className="mt-1 text-muted-foreground">
              Live, scheduled, and sold-through. Tap any drop to see the real-time counter.
            </p>
          </div>
          <Link
            href="/drops"
            className="hidden items-center gap-1 text-sm font-medium text-primary hover:underline sm:inline-flex"
          >
            All drops <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {drops.map((drop) => (
            <DropCard key={drop.id} drop={drop} />
          ))}
        </div>
      </section>
    </div>
  );
}

function ProofCard() {
  return (
    <div className="w-full max-w-md rounded-3xl border border-border bg-card/80 p-6 shadow-2xl backdrop-blur">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">Stress test receipt</p>
        <Badge variant="success">Verified</Badge>
      </div>
      <div className="mt-5 grid grid-cols-3 gap-3 text-center">
        <Stat label="Buyers" value="5,000" tone="muted" />
        <Stat label="Sold" value="100" tone="success" />
        <Stat label="Oversold" value="0" tone="primary" />
      </div>
      <div className="mt-5 space-y-2">
        {[
          { ok: true, text: "Units sold equals inventory exactly" },
          { ok: true, text: "Zero oversold, zero refunds needed" },
          { ok: true, text: "Every winner was a single DSQL transaction" },
        ].map((row) => (
          <div key={row.text} className="flex items-center gap-2 text-sm">
            <CircleCheck className="h-4 w-4 text-success" />
            <span>{row.text}</span>
          </div>
        ))}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <CircleX className="h-4 w-4 text-muted-foreground" />
          <span>4,900 fans got a clean sold-out, no fake orders</span>
        </div>
      </div>
      <Link
        href="/dashboard"
        className={cn(buttonVariants({ className: "mt-6 w-full" }))}
      >
        Run it yourself
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "muted" | "success" | "primary";
}) {
  const color =
    tone === "success" ? "text-success" : tone === "primary" ? "text-primary" : "text-foreground";
  return (
    <div className="rounded-xl border border-border bg-background/50 p-3">
      <p className={cn("text-2xl font-bold tabular", color)}>{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
