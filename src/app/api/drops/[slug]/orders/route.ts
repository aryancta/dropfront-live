import { NextRequest } from "next/server";
import { storeFor, json } from "../../../_lib";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  const { store } = storeFor(req);
  const limit = Number(new URL(req.url).searchParams.get("limit") ?? 50);
  try {
    const orders = await store.getOrders(params.slug, Math.min(500, Math.max(1, limit)));
    return json({ orders });
  } catch (err) {
    return json({ error: "Could not load orders.", detail: String(err) }, 500);
  }
}
