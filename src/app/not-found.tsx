import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function NotFound() {
  return (
    <div className="container flex flex-col items-center py-28 text-center">
      <p className="text-sm font-semibold uppercase tracking-widest text-primary">404</p>
      <h1 className="mt-3 text-3xl font-bold tracking-tight">This page sold out</h1>
      <p className="mt-2 max-w-md text-muted-foreground">
        The link you followed does not point to a real page. Head back to the drops.
      </p>
      <div className="mt-6 flex gap-3">
        <Link href="/" className={cn(buttonVariants())}>
          Back home
        </Link>
        <Link href="/drops" className={cn(buttonVariants({ variant: "outline" }))}>
          Browse drops
        </Link>
      </div>
    </div>
  );
}
