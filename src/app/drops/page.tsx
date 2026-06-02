"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, AlertCircle } from "lucide-react";
import type { Drop } from "@/lib/types";
import { DropCard } from "@/components/drop-card";
import { BackendBanner } from "@/components/backend-banner";
import { Skeleton } from "@/components/ui/skeleton";
import { buttonVariants } from "@/components/ui/button";
import { apiHeaders } from "@/lib/client-keys";
import { cn } from "@/lib/utils";

export default function DropsPage() {
  const [drops, setDrops] = useState<Drop[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/drops", { headers: apiHeaders() })
      .then((r) => r.json())
      .then((d) => {
        if (!active) return;
        if (d.error) setError(d.error);
        else setDrops(d.drops);
      })
      .catch(() => active && setError("Could not reach the drops service."));
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="container py-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">All drops</h1>
          <p className="mt-1 text-muted-foreground">
            Every drop sells out to the exact unit. Pick one and watch the counter move.
          </p>
        </div>
        <Link href="/dashboard/new" className={cn(buttonVariants())}>
          <Plus className="h-4 w-4" />
          Launch a drop
        </Link>
      </div>

      <BackendBanner className="mt-6" />

      {error ? (
        <div className="mt-10 flex flex-col items-center justify-center rounded-2xl border border-destructive/40 bg-destructive/5 p-12 text-center">
          <AlertCircle className="h-8 w-8 text-destructive" />
          <p className="mt-3 font-semibold">{error}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Refresh the page to try again.
          </p>
        </div>
      ) : null}

      {!error && !drops ? (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="overflow-hidden rounded-2xl border border-border bg-card">
              <Skeleton className="aspect-[4/3] w-full rounded-none" />
              <div className="space-y-3 p-5">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-2.5 w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {!error && drops ? (
        drops.length > 0 ? (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {drops.map((drop) => (
              <DropCard key={drop.id} drop={drop} />
            ))}
          </div>
        ) : (
          <div className="mt-10 rounded-2xl border border-border bg-card p-12 text-center">
            <p className="font-semibold">No drops yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Launch your first limited-stock drop to get started.
            </p>
            <Link href="/dashboard/new" className={cn(buttonVariants(), "mt-4")}>
              <Plus className="h-4 w-4" />
              Launch a drop
            </Link>
          </div>
        )
      ) : null}
    </div>
  );
}
