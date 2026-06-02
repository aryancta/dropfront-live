import { NextRequest } from "next/server";
import { storeFor, json } from "../../../_lib";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  const { store, backend } = storeFor(req);
  try {
    const drop = await store.getDrop(params.slug);
    if (!drop) return json({ error: "Drop not found." }, 404);
    const stats = await store.getStats(params.slug);
    return json({ stats, remaining: drop.remaining, backend });
  } catch (err) {
    return json({ error: "Could not load stats.", detail: String(err) }, 500);
  }
}
