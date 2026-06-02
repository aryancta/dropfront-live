"use client";

export const KEYS_STORAGE = "dropfront_api_keys";

export interface ApiKeys {
  dsqlUrl: string;
  clerkKey: string;
}

const EMPTY: ApiKeys = { dsqlUrl: "", clerkKey: "" };

export function readKeys(): ApiKeys {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = window.localStorage.getItem(KEYS_STORAGE);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw);
    return { ...EMPTY, ...parsed };
  } catch {
    return EMPTY;
  }
}

export function writeKeys(keys: ApiKeys) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEYS_STORAGE, JSON.stringify(keys));
}

export function clearKeys() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KEYS_STORAGE);
}

// Attaches the user-supplied Aurora DSQL connection string as a request header
// so server route handlers can run against live infrastructure. Keys live only
// in localStorage and are never persisted server-side.
export function apiHeaders(extra?: Record<string, string>): Record<string, string> {
  const keys = readKeys();
  const headers: Record<string, string> = { "content-type": "application/json", ...extra };
  if (keys.dsqlUrl.trim()) headers["x-dsql-url"] = keys.dsqlUrl.trim();
  return headers;
}
