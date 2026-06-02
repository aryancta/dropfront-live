import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { Drop } from "@/lib/types";
import { ProductArt } from "@/components/product-art";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { formatCurrency, pct } from "@/lib/utils";

function statusFor(drop: Drop): { label: string; variant: "success" | "accent" | "muted" } {
  if (drop.remaining <= 0) return { label: "Sold out", variant: "muted" };
  if (Date.parse(drop.goLiveAt) <= Date.now()) return { label: "Live now", variant: "success" };
  return { label: "Scheduled", variant: "accent" };
}

export function DropCard({ drop }: { drop: Drop }) {
  const status = statusFor(drop);
  const sold = drop.quantity - drop.remaining;
  const sellThrough = pct(sold, drop.quantity);

  return (
    <Link
      href={`/drops/${drop.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all hover:border-primary/50 hover:shadow-[0_20px_60px_-30px_hsl(var(--primary)/0.6)]"
    >
      <div className="relative aspect-[4/3]">
        <ProductArt kind={drop.image} accent={drop.accent} className="h-full w-full" />
        <div className="absolute left-3 top-3">
          <Badge variant={status.variant}>{status.label}</Badge>
        </div>
        <div className="absolute right-3 top-3 rounded-full bg-background/70 px-2.5 py-1 text-xs font-semibold backdrop-blur">
          {formatCurrency(drop.priceCents, drop.currency)}
        </div>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {drop.creator}
        </p>
        <h3 className="mt-1 flex items-center gap-1 text-base font-semibold">
          {drop.title}
          <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary" />
        </h3>
        <p className="mt-2 line-clamp-2 flex-1 text-sm text-muted-foreground">
          {drop.description}
        </p>
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{sold} of {drop.quantity} claimed</span>
            <span className="tabular">{sellThrough}%</span>
          </div>
          <Progress
            value={sellThrough}
            className="mt-1.5"
            indicatorClassName={drop.remaining <= 0 ? "bg-muted-foreground" : "bg-primary"}
          />
        </div>
      </div>
    </Link>
  );
}
