"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Database, Sparkles } from "lucide-react";
import type { BackendInfo } from "@/lib/types";
import { apiHeaders } from "@/lib/client-keys";
import { cn } from "@/lib/utils";

export function useBackend() {
  const [backend, setBackend] = useState<BackendInfo | null>(null);
  useEffect(() => {
    let active = true;
    fetch("/api/backend", { headers: apiHeaders() })
      .then((r) => r.json())
      .then((d: BackendInfo) => {
        if (active) setBackend(d);
      })
      .catch(() => {
        if (active)
          setBackend({
            backend: "memory",
            connected: false,
            detail: "Demo mode backend.",
          });
      });
    return () => {
      active = false;
    };
  }, []);
  return backend;
}

export function BackendBanner({ className }: { className?: string }) {
  const backend = useBackend();
  if (!backend) return null;

  if (backend.backend === "aurora-dsql") {
    return (
      <div
        className={cn(
          "flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-4 py-2.5 text-sm",
          className
        )}
      >
        <Database className="h-4 w-4 shrink-0 text-primary" />
        <span className="text-primary">
          Connected to Aurora DSQL. Every purchase runs as a strongly consistent transaction on live infrastructure.
        </span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2 rounded-xl border border-accent/30 bg-accent/10 px-4 py-2.5 text-sm",
        className
      )}
    >
      <Sparkles className="h-4 w-4 shrink-0 text-accent" />
      <span className="text-foreground/90">
        Running in demo mode with a strongly consistent in-memory backend. The never-oversell guarantee is real either way.
      </span>
      <Link href="/settings" className="font-semibold text-accent underline-offset-2 hover:underline">
        Connect Aurora DSQL
      </Link>
    </div>
  );
}
