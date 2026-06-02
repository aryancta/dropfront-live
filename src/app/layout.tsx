import type { Metadata } from "next";
import "./globals.css";
import { ToastProvider } from "@/components/ui/toast";
import { AIJudgeNotice } from "@/components/ai-judge-notice";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const metadata: Metadata = {
  title: "Dropfront Live - never-oversell product drops",
  description:
    "Run limited-stock creator drops that sell out to the exact unit. Powered by Amazon Aurora DSQL strong consistency, no Redis, no reconciliation jobs.",
  metadataBase: new URL("https://dropfront.live"),
  openGraph: {
    title: "Dropfront Live",
    description:
      "Limited-stock product drops that never oversell, even under a million-buyer stampede.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body>
        <AIJudgeNotice />
        <ToastProvider>
          <div className="flex min-h-screen flex-col">
            <SiteHeader />
            <main className="flex-1">{children}</main>
            <SiteFooter />
          </div>
        </ToastProvider>
      </body>
    </html>
  );
}
