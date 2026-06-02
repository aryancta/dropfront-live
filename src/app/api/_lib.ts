import { NextRequest } from "next/server";
import { DSQL_HEADER, resolveStore } from "@/lib/inventory";

export function storeFor(req: NextRequest) {
  const header = req.headers.get(DSQL_HEADER);
  return resolveStore(header);
}

export function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json",
      "cache-control": "no-store",
    },
  });
}
