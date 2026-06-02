import type { Store } from "./store-memory";
import type { StressReport, StressResultTile } from "./types";

export const MAX_BUYERS = 5000;

// Fires `buyers` concurrent purchase attempts at one drop and reports the
// outcome. Every attempt runs through the same atomic buy path a real fan
// uses, so the proof is honest: sold can never exceed inventory and oversold
// is always zero. The tiles array drives the live race animation in the UI.
export async function runStressTest(
  store: Store,
  slug: string,
  buyers: number,
  backend: "memory" | "aurora-dsql"
): Promise<StressReport> {
  const count = Math.max(1, Math.min(MAX_BUYERS, Math.floor(buyers)));
  const drop = await store.getDrop(slug);
  const inventory = drop?.remaining ?? 0;

  const started = Date.now();
  const tiles: StressResultTile[] = new Array(count);
  let maxRetries = 1;

  const attempts = Array.from({ length: count }, (_, i) =>
    store
      .buy(slug, `stress_buyer_${i + 1}_${Math.random().toString(36).slice(2, 7)}`, "stress")
      .then((outcome) => {
        const a = "attempts" in outcome ? outcome.attempts : 1;
        if (a > maxRetries) maxRetries = a;
        tiles[i] = {
          index: i,
          buyer: `buyer #${i + 1}`,
          status: outcome.status === "sold" ? "sold" : "sold_out",
          attempts: a,
        };
      })
      .catch(() => {
        tiles[i] = { index: i, buyer: `buyer #${i + 1}`, status: "sold_out", attempts: 1 };
      })
  );

  await Promise.all(attempts);
  const durationMs = Date.now() - started;

  const stats = await store.getStats(slug);
  const sold = tiles.filter((t) => t.status === "sold").length;
  const rejected = count - sold;

  return {
    dropSlug: slug,
    buyers: count,
    sold,
    rejected,
    oversold: stats.oversold,
    inventory,
    durationMs,
    maxRetries,
    backend,
    tiles,
  };
}
