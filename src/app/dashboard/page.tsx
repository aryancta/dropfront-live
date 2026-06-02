"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  IndianRupee,
  Package,
  TrendingUp,
  Boxes,
  Plus,
  ScrollText,
  AlertCircle,
} from "lucide-react";
import type { Drop, DropStats, Order } from "@/lib/types";
import { StressTest } from "@/components/stress-test";
import { BackendBanner } from "@/components/backend-banner";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { buttonVariants } from "@/components/ui/button";
import { apiHeaders } from "@/lib/client-keys";
import { cn, formatCurrency, formatNumber, pct } from "@/lib/utils";

export default function DashboardPage() {
  const [drops, setDrops] = useState<Drop[] | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [drop, setDrop] = useState<Drop | null>(null);
  const [stats, setStats] = useState<DropStats | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/drops", { headers: apiHeaders() })
      .then((r) => r.json())
      .then((d) => {
        if (!active) return;
        if (d.error) {
          setError(d.error);
          return;
        }
        setDrops(d.drops);
        const live = d.drops.find(
          (x: Drop) => Date.parse(x.goLiveAt) <= Date.now() && x.remaining > 0
        );
        setSelected((live ?? d.drops[0])?.slug ?? null);
      })
      .catch(() => active && setError("Could not load your drops."));
    return () => {
      active = false;
    };
  }, []);

  const refresh = useCallback(async () => {
    if (!selected) return;
    try {
      const [dRes, oRes] = await Promise.all([
        fetch(`/api/drops/${selected}`, { headers: apiHeaders() }),
        fetch(`/api/drops/${selected}/orders?limit=60`, { headers: apiHeaders() }),
      ]);
      const dData = await dRes.json();
      const oData = await oRes.json();
      if (dData.drop) {
        setDrop(dData.drop);
        setStats(dData.stats);
      }
      setOrders(oData.orders ?? []);
    } catch {
      /* keep previous */
    }
  }, [selected]);

  useEffect(() => {
    setDrop(null);
    setStats(null);
    setOrders([]);
    refresh();
  }, [selected, refresh]);

  // Keep the dashboard numbers fresh while a stress test or live buyers move stock.
  useEffect(() => {
    const id = setInterval(refresh, 3000);
    return () => clearInterval(id);
  }, [refresh]);

  if (error) {
    return (
      <div className="container py-24 text-center">
        <AlertCircle className="mx-auto h-8 w-8 text-destructive" />
        <p className="mt-3 font-semibold">{error}</p>
      </div>
    );
  }

  return (
    <div className="container py-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Seller dashboard</h1>
          <p className="mt-1 text-muted-foreground">
            Live sell-through, revenue, and a per-unit audit trail. Run the stress test to prove the guarantee.
          </p>
        </div>
        <Link href="/dashboard/new" className={cn(buttonVariants())}>
          <Plus className="h-4 w-4" /> New drop
        </Link>
      </div>

      <BackendBanner className="mt-6" />

      <div className="mt-6 flex flex-wrap gap-2">
        {drops
          ? drops.map((d) => {
              const isLive = Date.parse(d.goLiveAt) <= Date.now() && d.remaining > 0;
              return (
                <button
                  key={d.id}
                  onClick={() => setSelected(d.slug)}
                  className={cn(
                    "flex items-center gap-2 rounded-xl border px-4 py-2.5 text-left text-sm transition-colors",
                    selected === d.slug
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/40 hover:bg-secondary/50"
                  )}
                >
                  <span className="font-medium">{d.title}</span>
                  {isLive ? (
                    <Badge variant="success">Live</Badge>
                  ) : d.remaining <= 0 ? (
                    <Badge variant="muted">Sold out</Badge>
                  ) : (
                    <Badge variant="accent">Scheduled</Badge>
                  )}
                </button>
              );
            })
          : Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-11 w-40 rounded-xl" />
            ))}
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={IndianRupee}
          label="Revenue"
          value={stats && drop ? formatCurrency(stats.revenueCents, drop.currency) : null}
          sub={stats ? `${formatNumber(stats.sold)} orders` : ""}
        />
        <StatCard
          icon={Package}
          label="Sold"
          value={stats ? `${formatNumber(stats.sold)} / ${formatNumber(stats.quantity)}` : null}
          sub={stats ? `${stats.conversionPct}% sell-through` : ""}
        />
        <StatCard
          icon={Boxes}
          label="Remaining"
          value={stats ? formatNumber(stats.remaining) : null}
          sub={stats ? `${formatNumber(stats.fanOrders)} fan, ${formatNumber(stats.stressOrders)} test` : ""}
        />
        <StatCard
          icon={TrendingUp}
          label="Oversold"
          value={stats ? formatNumber(stats.oversold) : null}
          sub="always zero"
          tone={stats && stats.oversold > 0 ? "bad" : "good"}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          {drop ? (
            <StressTest drop={drop} onComplete={refresh} />
          ) : (
            <Skeleton className="h-80 w-full rounded-2xl" />
          )}
        </div>

        <div className="lg:col-span-2">
          <div className="rounded-2xl border border-border bg-card">
            <div className="flex items-center gap-2 border-b border-border p-5">
              <ScrollText className="h-5 w-5 text-primary" />
              <h2 className="font-semibold">Audit trail</h2>
              <span className="ml-auto text-xs text-muted-foreground">
                {formatNumber(orders.length)} most recent
              </span>
            </div>
            <div className="max-h-[28rem] overflow-y-auto">
              {drop && orders.length === 0 ? (
                <p className="p-6 text-sm text-muted-foreground">
                  No orders yet. Run the stress test or buy a unit on the drop page.
                </p>
              ) : (
                <ul className="divide-y divide-border">
                  {orders.map((o) => (
                    <li key={o.id} className="flex items-center justify-between gap-3 px-5 py-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{o.buyer}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(o.createdAt).toLocaleTimeString()} · {o.id}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={o.source === "fan" ? "default" : "secondary"}>
                          {o.source === "fan" ? "Fan" : "Stress"}
                        </Badge>
                        <span className="text-sm font-semibold tabular">
                          {formatCurrency(o.unitPriceCents, drop?.currency ?? "INR")}
                        </span>
                      </div>
                    </li>
                  ))}
                  {!drop
                    ? Array.from({ length: 6 }).map((_, i) => (
                        <li key={i} className="px-5 py-3">
                          <Skeleton className="h-8 w-full" />
                        </li>
                      ))
                    : null}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  tone = "default",
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | null;
  sub: string;
  tone?: "default" | "good" | "bad";
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{label}</p>
        <Icon
          className={cn(
            "h-4 w-4",
            tone === "bad" ? "text-destructive" : tone === "good" ? "text-primary" : "text-muted-foreground"
          )}
        />
      </div>
      {value === null ? (
        <Skeleton className="mt-2 h-8 w-24" />
      ) : (
        <p
          className={cn(
            "mt-2 text-2xl font-bold tabular",
            tone === "bad" ? "text-destructive" : tone === "good" ? "text-primary" : ""
          )}
        >
          {value}
        </p>
      )}
      <p className="mt-1 text-xs text-muted-foreground">{sub}</p>
    </div>
  );
}
