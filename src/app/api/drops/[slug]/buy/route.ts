import { NextRequest } from "next/server";
import { storeFor, json } from "../../../_lib";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params }: { params: { slug: string } }) {
  const { store, backend } = storeFor(req);
  let body: any = {};
  try {
    body = await req.json();
  } catch {
    /* body is optional for a buy */
  }
  const buyer = String(body.buyer ?? `fan_${Math.random().toString(36).slice(2, 10)}`);
  try {
    const outcome = await store.buy(params.slug, buyer, "fan");
    return json({ outcome, backend });
  } catch (err) {
    return json({ error: "Purchase failed.", detail: String(err) }, 500);
  }
}
