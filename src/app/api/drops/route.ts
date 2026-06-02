import { NextRequest } from "next/server";
import { storeFor, json } from "../_lib";
import { slugify } from "@/lib/utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { store, backend } = storeFor(req);
  try {
    const drops = await store.listDrops();
    return json({ drops, backend });
  } catch (err) {
    return json({ error: "Could not load drops.", detail: String(err) }, 500);
  }
}

const IMAGES = ["sneaker", "tee", "vinyl", "box"];
const ACCENTS = ["158 84% 45%", "268 84% 62%", "200 90% 50%", "32 95% 55%"];

export async function POST(req: NextRequest) {
  const { store, backend } = storeFor(req);
  let body: any;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON body." }, 400);
  }

  const title = String(body.title ?? "").trim();
  const creator = String(body.creator ?? "").trim();
  const quantity = Math.floor(Number(body.quantity));
  const priceCents = Math.round(Number(body.price) * 100);
  const goLiveAt = String(body.goLiveAt ?? "").trim();

  if (!title) return json({ error: "Title is required." }, 400);
  if (!creator) return json({ error: "Creator name is required." }, 400);
  if (!Number.isFinite(quantity) || quantity < 1 || quantity > 1_000_000) {
    return json({ error: "Quantity must be between 1 and 1,000,000." }, 400);
  }
  if (!Number.isFinite(priceCents) || priceCents < 0) {
    return json({ error: "Price must be a positive number." }, 400);
  }
  const goLiveDate = Date.parse(goLiveAt);
  if (Number.isNaN(goLiveDate)) {
    return json({ error: "A valid go-live time is required." }, 400);
  }

  const image = IMAGES.includes(body.image) ? body.image : "box";
  const accentIndex = Math.max(0, IMAGES.indexOf(image));
  const accent = ACCENTS[accentIndex] ?? ACCENTS[0];

  try {
    const drop = await store.createDrop({
      title,
      creator,
      description: String(body.description ?? "").trim() || `${title} by ${creator}.`,
      image,
      accent,
      priceCents,
      currency: body.currency === "USD" ? "USD" : "INR",
      quantity,
      goLiveAt: new Date(goLiveDate).toISOString(),
      perFanLimit: Math.max(0, Math.floor(Number(body.perFanLimit ?? 1))),
    });
    return json({ drop, slug: slugify(drop.slug), backend }, 201);
  } catch (err) {
    return json({ error: "Could not create drop.", detail: String(err) }, 500);
  }
}
