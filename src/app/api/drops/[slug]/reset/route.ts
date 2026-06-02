import { NextRequest } from "next/server";
import { storeFor, json } from "../../../_lib";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params }: { params: { slug: string } }) {
  const { store, backend } = storeFor(req);
  try {
    const drop = await store.resetDrop(params.slug);
    if (!drop) return json({ error: "Drop not found." }, 404);
    return json({ drop, backend });
  } catch (err) {
    return json({ error: "Could not reset drop.", detail: String(err) }, 500);
  }
}
