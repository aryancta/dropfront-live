export type DropStatus = "scheduled" | "live" | "sold_out" | "ended";

export interface Drop {
  id: string;
  slug: string;
  title: string;
  creator: string;
  description: string;
  image: string;
  accent: string;
  priceCents: number;
  currency: string;
  quantity: number;
  remaining: number;
  goLiveAt: string;
  createdAt: string;
  perFanLimit: number;
}

export interface Order {
  id: string;
  dropId: string;
  buyer: string;
  unitPriceCents: number;
  createdAt: string;
  source: "fan" | "stress";
}

export type BuyOutcome =
  | { status: "sold"; orderId: string; remaining: number; attempts: number }
  | { status: "sold_out"; remaining: number; attempts: number }
  | { status: "not_live"; remaining: number }
  | { status: "limit_reached"; remaining: number };

export interface DropStats {
  quantity: number;
  remaining: number;
  sold: number;
  oversold: number;
  revenueCents: number;
  conversionPct: number;
  fanOrders: number;
  stressOrders: number;
}

export interface StressResultTile {
  index: number;
  buyer: string;
  status: "sold" | "sold_out";
  attempts: number;
}

export interface StressReport {
  dropSlug: string;
  buyers: number;
  sold: number;
  rejected: number;
  oversold: number;
  inventory: number;
  durationMs: number;
  maxRetries: number;
  backend: "memory" | "aurora-dsql";
  tiles: StressResultTile[];
}

export interface BackendInfo {
  backend: "memory" | "aurora-dsql";
  connected: boolean;
  detail: string;
}
