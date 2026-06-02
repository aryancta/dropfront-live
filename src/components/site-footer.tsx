import Link from "next/link";
import { Zap } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="border-t border-border/70 bg-card/30">
      <div className="container grid gap-8 py-12 md:grid-cols-4">
        <div className="md:col-span-1">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Zap className="h-4 w-4" />
            </span>
            <span className="font-bold">Dropfront Live</span>
          </div>
          <p className="mt-3 max-w-xs text-sm text-muted-foreground">
            Limited-stock product drops that sell out to the exact unit. Strong
            consistency does the counting, so nothing oversells.
          </p>
        </div>

        <div>
          <h4 className="text-sm font-semibold">Product</h4>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li><Link href="/drops" className="hover:text-foreground">Browse drops</Link></li>
            <li><Link href="/dashboard" className="hover:text-foreground">Seller dashboard</Link></li>
            <li><Link href="/dashboard/new" className="hover:text-foreground">Launch a drop</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold">Learn</h4>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li><Link href="/how-it-works" className="hover:text-foreground">How it works</Link></li>
            <li><Link href="/settings" className="hover:text-foreground">Connect a database</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold">Built on</h4>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>
              <a
                href="https://aws.amazon.com/rds/aurora/dsql/"
                target="_blank"
                rel="noreferrer"
                className="hover:text-foreground"
              >
                Amazon Aurora DSQL
              </a>
            </li>
            <li>
              <a
                href="https://vercel.com/marketplace/aws/aws-dsql"
                target="_blank"
                rel="noreferrer"
                className="hover:text-foreground"
              >
                Vercel AWS Marketplace
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border/70">
        <div className="container flex flex-col items-center justify-between gap-2 py-5 text-sm text-muted-foreground md:flex-row">
          <p>Built for H0: Hack the Zero Stack with Vercel v0 and AWS Databases.</p>
          <p>Made by Aryan Choudhary.</p>
        </div>
      </div>
    </footer>
  );
}
