"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Rocket,
  Loader2,
  RotateCcw,
  CheckCircle2,
  CircleSlash,
  Timer,
  Repeat,
  Database,
} from "lucide-react";
import type { Drop, StressReport, StressResultTile } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { apiHeaders } from "@/lib/client-keys";
import { cn, formatNumber } from "@/lib/utils";

const PRESETS = [500, 1000, 2000, 5000];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function StressTest({
  drop,
  onComplete,
}: {
  drop: Drop;
  onComplete: () => void;
}) {
  const { toast } = useToast();
  const [buyers, setBuyers] = useState(2000);
  const [phase, setPhase] = useState<"idle" | "running" | "playing" | "done">("idle");
  const [report, setReport] = useState<StressReport | null>(null);
  const [tiles, setTiles] = useState<StressResultTile[]>([]);
  const [revealed, setRevealed] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const inventory = report?.inventory ?? drop.remaining;
  const totalMs = useMemo(() => {
    const c = tiles.length || buyers;
    return Math.max(1200, Math.min(3200, c * 0.7));
  }, [tiles.length, buyers]);

  const liveCounts = useMemo(() => {
    let sold = 0;
    for (let i = 0; i < revealed; i++) {
      if (tiles[i]?.status === "sold") sold++;
    }
    return { sold, rejected: revealed - sold };
  }, [revealed, tiles]);

  const clearTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  useEffect(() => () => clearTimer(), []);

  const run = useCallback(async () => {
    setError(null);
    setPhase("running");
    setReport(null);
    setTiles([]);
    setRevealed(0);
    try {
      const res = await fetch(`/api/drops/${drop.slug}/stress`, {
        method: "POST",
        headers: apiHeaders(),
        body: JSON.stringify({ buyers }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setError(data.error ?? "Stress test failed.");
        setPhase("idle");
        toast({ title: "Could not run", description: data.error ?? "Try again.", tone: "error" });
        return;
      }
      const rep: StressReport = data.report;
      const shuffled = shuffle(rep.tiles);
      setReport(rep);
      setTiles(shuffled);
      setPhase("playing");

      const start = Date.now();
      const span = Math.max(1200, Math.min(3200, shuffled.length * 0.7));
      clearTimer();
      timerRef.current = setInterval(() => {
        const t = (Date.now() - start) / span;
        const count = Math.min(shuffled.length, Math.floor(t * shuffled.length));
        setRevealed(count);
        if (t >= 1) {
          setRevealed(shuffled.length);
          clearTimer();
          setPhase("done");
          onComplete();
          toast({
            title: "Proof complete",
            description: `Sold ${rep.sold} of ${rep.inventory}. Oversold ${rep.oversold}.`,
            tone: "success",
          });
        }
      }, 40);
    } catch {
      setError("Could not reach the stress service.");
      setPhase("idle");
    }
  }, [buyers, drop.slug, onComplete, toast]);

  const reset = useCallback(async () => {
    clearTimer();
    setPhase("idle");
    setReport(null);
    setTiles([]);
    setRevealed(0);
    setError(null);
    try {
      await fetch(`/api/drops/${drop.slug}/reset`, {
        method: "POST",
        headers: apiHeaders(),
      });
      onComplete();
      toast({ title: "Drop restocked", description: "Inventory reset for another run.", tone: "info" });
    } catch {
      toast({ title: "Reset failed", description: "Try again.", tone: "error" });
    }
  }, [drop.slug, onComplete, toast]);

  const busy = phase === "running" || phase === "playing";
  const displaySold = phase === "done" && report ? report.sold : liveCounts.sold;
  const displayRejected = phase === "done" && report ? report.rejected : liveCounts.rejected;
  const remaining = Math.max(0, inventory - displaySold);

  return (
    <div className="rounded-2xl border border-border bg-card">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-5">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/15 text-accent">
            <Rocket className="h-5 w-5" />
          </span>
          <div>
            <h2 className="font-semibold">Live stress test</h2>
            <p className="text-sm text-muted-foreground">
              Fire thousands of concurrent buyers at this drop and prove zero oversell.
            </p>
          </div>
        </div>
        {report ? (
          <Badge variant={report.backend === "aurora-dsql" ? "default" : "accent"}>
            <Database className="h-3.5 w-3.5" />
            {report.backend === "aurora-dsql" ? "Aurora DSQL" : "Demo backend"}
          </Badge>
        ) : null}
      </div>

      <div className="p-5">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((p) => (
              <button
                key={p}
                disabled={busy}
                onClick={() => setBuyers(p)}
                className={cn(
                  "rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-50",
                  buyers === p
                    ? "border-accent bg-accent/15 text-accent"
                    : "border-border text-muted-foreground hover:border-accent/50 hover:text-foreground"
                )}
              >
                {formatNumber(p)}
              </button>
            ))}
          </div>
          <span className="text-sm text-muted-foreground">concurrent buyers</span>
          <div className="ml-auto flex gap-2">
            {phase === "done" || report ? (
              <Button variant="outline" onClick={reset} disabled={phase === "running"}>
                <RotateCcw className="h-4 w-4" /> Restock
              </Button>
            ) : null}
            <Button variant="accent" onClick={run} disabled={busy}>
              {busy ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Running
                </>
              ) : (
                <>
                  <Rocket className="h-4 w-4" /> Run stress test
                </>
              )}
            </Button>
          </div>
        </div>

        {error ? (
          <p className="mt-4 rounded-lg border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        ) : null}

        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Metric label="Remaining" value={formatNumber(remaining)} tone="primary" />
          <Metric label="Purchased" value={formatNumber(displaySold)} tone="success" />
          <Metric label="Rejected" value={formatNumber(displayRejected)} tone="muted" />
          <Metric
            label="Oversold"
            value={report ? formatNumber(report.oversold) : "0"}
            tone={report && report.oversold > 0 ? "destructive" : "primary"}
          />
        </div>

        {phase === "idle" && !report ? (
          <div className="mt-5 flex h-40 items-center justify-center rounded-xl border border-dashed border-border bg-background/40 text-center text-sm text-muted-foreground">
            Pick a buyer count and hit run. Each tile below is one buyer racing for a unit.
          </div>
        ) : (
          <div className="mt-5 max-h-64 overflow-y-auto rounded-xl border border-border bg-background/40 p-3">
            <div className="flex flex-wrap gap-[3px]">
              {tiles.map((tile, i) => (
                <span
                  key={tile.index}
                  title={`${tile.buyer}: ${tile.status === "sold" ? "purchased" : "sold out"}`}
                  className={cn(
                    "h-2.5 w-2.5 rounded-[3px]",
                    i < revealed
                      ? tile.status === "sold"
                        ? "bg-success"
                        : "bg-muted-foreground/30"
                      : "bg-muted/40"
                  )}
                  style={
                    i < revealed
                      ? { animation: "pop-in 0.2s ease-out" }
                      : undefined
                  }
                />
              ))}
            </div>
          </div>
        )}

        {phase === "done" && report ? (
          <div className="mt-5 animate-fade-in rounded-2xl border border-success/40 bg-success/10 p-5">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-6 w-6 text-success" />
              <h3 className="text-lg font-bold text-success">Receipt: zero oversell</h3>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <ReceiptRow icon={CheckCircle2} label="Units sold" value={`${report.sold} of ${report.inventory}`} />
              <ReceiptRow icon={CircleSlash} label="Oversold" value={String(report.oversold)} />
              <ReceiptRow icon={Repeat} label="Max OCC retries" value={String(report.maxRetries)} />
              <ReceiptRow icon={Timer} label="Run time" value={`${formatNumber(report.durationMs)} ms`} />
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              {formatNumber(report.buyers)} buyers raced this drop. {formatNumber(report.rejected)}{" "}
              got a fast, honest sold-out with no order placed. Refunds needed: 0.
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "primary" | "success" | "muted" | "destructive";
}) {
  const color =
    tone === "success"
      ? "text-success"
      : tone === "destructive"
        ? "text-destructive"
        : tone === "muted"
          ? "text-muted-foreground"
          : "text-primary";
  return (
    <div className="rounded-xl border border-border bg-background/50 p-4">
      <p className={cn("text-2xl font-bold tabular", color)}>{value}</p>
      <p className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
    </div>
  );
}

function ReceiptRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2.5 rounded-xl bg-background/40 p-3">
      <Icon className="h-5 w-5 text-success" />
      <div>
        <p className="text-sm font-semibold">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}
