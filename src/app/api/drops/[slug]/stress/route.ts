import { NextRequest } from "next/server";
import { storeFor, json } from "../../../_lib";
import { runStressTest, MAX_BUYERS } from "@/lib/stress";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: NextRequest, { params }: { params: { slug: string } }) {
  const { store, backend } = storeFor(req);
  let body: any = {};
  try {
    body = await req.json();
  } catch {
    /* optional */
  }
  const buyers = Math.min(MAX_BUYERS, Math.max(1, Math.floor(Number(body.buyers ?? 2000))));
  try {
    const drop = await store.getDrop(params.slug);
    if (!drop) return json({ error: "Drop not found." }, 404);
    if (Date.parse(drop.goLiveAt) > Date.now()) {
      return json({ error: "Drop is not live yet. Stress test runs against live drops." }, 409);
    }
    const report = await runStressTest(store, params.slug, buyers, backend.backend);
    return json({ report, backend });
  } catch (err) {
    return json({ error: "Stress test failed.", detail: String(err) }, 500);
  }
}
