"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ShoppingBag,
  CheckCircle2,
  Loader2,
  Zap,
  AlertCircle,
  ShieldCheck,
} from "lucide-react";
import type { BuyOutcome, Drop, DropStats } from "@/lib/types";
import { ProductArt } from "@/components/product-art";
import { Countdown } from "@/components/countdown";
import { BackendBanner } from "@/components/backend-banner";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { apiHeaders } from "@/lib/client-keys";
import { cn, formatCurrency, formatNumber, pct } from "@/lib/utils";

function fanId() {
  if (typeof window === "undefined") return "fan_anon";
  let id = window.localStorage.getItem("dropfront_fan_id");
  if (!id) {
    id = `fan_${Math.random().toString(36).slice(2, 10)}`;
    window.localStorage.setItem("dropfront_fan_id", id);
  }
  return id;
}

export default function DropDetailPage({ params }: { params: { slug: string } }) {
  const { slug } = params;
  const { toast } = useToast();
  const [drop, setDrop] = useState<Drop | null>(null);
  const [stats, setStats] = useState<DropStats | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [buying, setBuying] = useState(false);
  const [receipt, setReceipt] = useState<{ orderId: string } | null>(null);
  const [live, setLive] = useState(false);
  const mounted = useRef(true);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/drops/${slug}`, { headers: apiHeaders() });
      if (res.status === 404) {
        if (mounted.current) setNotFound(true);
        return;
      }
      const data = await res.json();
      if (!mounted.current) return;
      setDrop(data.drop);
      setStats(data.stats);
      setLive(Date.parse(data.drop.goLiveAt) <= Date.now());
    } catch {
      /* keep previous state */
    }
  }, [slug]);

  useEffect(() => {
    mounted.current = true;
    load();
    return () => {
      mounted.current = false;
    };
  }, [load]);

  // Live poll the stock counter so the page reflects concurrent buyers
  // (including a stress test running from the dashboard) in real time.
  useEffect(() => {
    const id = setInterval(async () => {
      try {
        const res = await fetch(`/api/drops/${slug}/stats`, { headers: apiHeaders() });
        if (!res.ok) return;
        const data = await res.json();
        if (mounted.current) setStats(data.stats);
      } catch {
        /* ignore transient errors */
      }
    }, 2000);
    return () => clearInterval(id);
  }, [slug]);

  const handleBuy = async () => {
    setBuying(true);
    try {
      const res = await fetch(`/api/drops/${slug}/buy`, {
        method: "POST",
        headers: apiHeaders(),
        body: JSON.stringify({ buyer: fanId() }),
      });
      const data = await res.json();
      const outcome: BuyOutcome = data.outcome;
      if (outcome.status === "sold") {
        setReceipt({ orderId: outcome.orderId });
        toast({ title: "Secured", description: "Your unit is locked in.", tone: "success" });
      } else if (outcome.status === "sold_out") {
        toast({ title: "Sold out", description: "Every unit is claimed. No order placed.", tone: "error" });
      } else if (outcome.status === "limit_reached") {
        toast({ title: "One per fan", description: "You already claimed your unit for this drop.", tone: "info" });
      } else if (outcome.status === "not_live") {
        toast({ title: "Not live yet", description: "Hang tight for the countdown.", tone: "info" });
      }
      await load();
    } catch {
      toast({ title: "Something went wrong", description: "Please try again.", tone: "error" });
    } finally {
      setBuying(false);
    }
  };

  const soldOut = stats ? stats.remaining <= 0 : false;
  const sellThrough = useMemo(
    () => (stats ? pct(stats.sold, stats.quantity) : 0),
    [stats]
  );

  if (notFound) {
    return (
      <div className="container flex flex-col items-center py-24 text-center">
        <AlertCircle className="h-10 w-10 text-muted-foreground" />
        <h1 className="mt-4 text-2xl font-bold">Drop not found</h1>
        <p className="mt-2 text-muted-foreground">
          This drop may have ended or the link is wrong.
        </p>
        <Link href="/drops" className={cn(buttonVariants(), "mt-6")}>
          Browse all drops
        </Link>
      </div>
    );
  }

  return (
    <div className="container py-10">
      <Link
        href="/drops"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> All drops
      </Link>

      <div className="mt-6 grid gap-8 lg:grid-cols-2">
        <div className="overflow-hidden rounded-3xl border border-border bg-card">
          {drop ? (
            <ProductArt kind={drop.image} accent={drop.accent} className="aspect-square w-full" />
          ) : (
            <Skeleton className="aspect-square w-full rounded-none" />
          )}
        </div>

        <div className="flex flex-col">
          {drop ? (
            <>
              <p className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
                {drop.creator}
              </p>
              <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">{drop.title}</h1>
              <p className="mt-3 text-muted-foreground">{drop.description}</p>

              <div className="mt-5 flex items-center gap-3">
                <span className="text-3xl font-bold">
                  {formatCurrency(drop.priceCents, drop.currency)}
                </span>
                {drop.perFanLimit > 0 ? (
                  <Badge variant="muted">{drop.perFanLimit} per fan</Badge>
                ) : null}
              </div>

              <div className="mt-6 rounded-2xl border border-border bg-background/50 p-5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">
                    {live ? "Drop is live" : "Goes live in"}
                  </span>
                  <Countdown target={drop.goLiveAt} onLive={() => setLive(true)} />
                </div>

                <div className="mt-5">
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-wider text-muted-foreground">
                        Remaining
                      </p>
                      <p className="text-4xl font-bold tabular text-primary">
                        {stats ? formatNumber(stats.remaining) : "--"}
                      </p>
                    </div>
                    <p className="text-sm text-muted-foreground tabular">
                      {stats ? `${formatNumber(stats.sold)} / ${formatNumber(stats.quantity)} sold` : ""}
                    </p>
                  </div>
                  <Progress
                    value={sellThrough}
                    className="mt-3 h-3"
                    indicatorClassName={soldOut ? "bg-muted-foreground" : "bg-primary"}
                  />
                </div>

                <div className="mt-5">
                  {receipt ? (
                    <div className="flex items-center gap-3 rounded-xl border border-success/40 bg-success/10 p-4">
                      <CheckCircle2 className="h-6 w-6 text-success" />
                      <div>
                        <p className="font-semibold text-success">Unit secured</p>
                        <p className="text-xs text-muted-foreground">
                          Order {receipt.orderId}. Guaranteed to be fulfilled.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <Button
                      size="lg"
                      className="w-full"
                      disabled={!live || soldOut || buying}
                      onClick={handleBuy}
                    >
                      {buying ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin" /> Securing your unit
                        </>
                      ) : soldOut ? (
                        "Sold out"
                      ) : !live ? (
                        <>
                          <Zap className="h-5 w-5" /> Buy unlocks at go-live
                        </>
                      ) : (
                        <>
                          <ShoppingBag className="h-5 w-5" /> Buy now
                        </>
                      )}
                    </Button>
                  )}
                </div>
                <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                  <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                  Checkout runs inside one strongly consistent transaction. No oversell, ever.
                </p>
              </div>

              <BackendBanner className="mt-5" />

              <div className="mt-5 text-sm text-muted-foreground">
                Are you the seller?{" "}
                <Link href="/dashboard" className="font-medium text-primary hover:underline">
                  Open the dashboard
                </Link>{" "}
                to run a live stress test on this drop.
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-2/3" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-40 w-full" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
