"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

function parts(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const d = Math.floor(total / 86400);
  const h = Math.floor((total % 86400) / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return { d, h, m, s };
}

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

export function Countdown({
  target,
  onLive,
  className,
}: {
  target: string;
  onLive?: () => void;
  className?: string;
}) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const diff = Date.parse(target) - now;
  const live = diff <= 0;

  useEffect(() => {
    if (live) onLive?.();
  }, [live, onLive]);

  if (live) {
    return (
      <div className={cn("inline-flex items-center gap-2", className)}>
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-primary" />
        </span>
        <span className="font-semibold text-primary">Live now</span>
      </div>
    );
  }

  const { d, h, m, s } = parts(diff);
  const blocks = [
    ...(d > 0 ? [{ label: "days", v: d }] : []),
    { label: "hrs", v: h },
    { label: "min", v: m },
    { label: "sec", v: s },
  ];

  return (
    <div className={cn("flex items-center gap-2 tabular", className)}>
      {blocks.map((b, i) => (
        <div key={b.label} className="flex items-center gap-2">
          <div className="flex flex-col items-center">
            <span className="text-2xl font-bold leading-none">{pad(b.v)}</span>
            <span className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">
              {b.label}
            </span>
          </div>
          {i < blocks.length - 1 ? (
            <span className="text-2xl font-bold text-muted-foreground/40">:</span>
          ) : null}
        </div>
      ))}
    </div>
  );
}
