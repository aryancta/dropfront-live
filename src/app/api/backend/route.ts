import { NextRequest } from "next/server";
import { storeFor, json } from "../_lib";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { backend } = storeFor(req);
  return json(backend);
}
