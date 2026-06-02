import { memoryStore, type Store } from "./store-memory";
import { createPgStore } from "./store-pg";
import type { BackendInfo } from "./types";

export const DSQL_HEADER = "x-dsql-url";

function pickConnectionString(headerValue?: string | null): string | null {
  const fromHeader = headerValue?.trim();
  if (fromHeader && /^postgres/i.test(fromHeader)) return fromHeader;
  const fromEnv = process.env.DATABASE_URL?.trim();
  if (fromEnv && /^postgres/i.test(fromEnv)) return fromEnv;
  return null;
}

// Returns the active store. When a valid Aurora DSQL / PostgreSQL connection
// string is supplied (request header from Settings, or DATABASE_URL env), we
// run against the real database. Otherwise we fall back to the in-memory demo
// backend so the app is fully usable on first run with zero configuration.
export function resolveStore(headerValue?: string | null): {
  store: Store;
  backend: BackendInfo;
} {
  const conn = pickConnectionString(headerValue);
  if (conn) {
    try {
      const store = createPgStore(conn) as unknown as Store;
      return {
        store,
        backend: {
          backend: "aurora-dsql",
          connected: true,
          detail: "Connected to Aurora DSQL over the PostgreSQL wire protocol.",
        },
      };
    } catch {
      // fall through to memory if the driver fails to initialize
    }
  }
  return {
    store: memoryStore,
    backend: {
      backend: "memory",
      connected: false,
      detail:
        "Demo mode: strongly consistent in-memory backend. Add an Aurora DSQL connection in Settings to run against live infrastructure.",
    },
  };
}

export function backendName(headerValue?: string | null): "memory" | "aurora-dsql" {
  return pickConnectionString(headerValue) ? "aurora-dsql" : "memory";
}
