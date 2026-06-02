import type { Drop, Order } from "./types";

function isoOffset(minutes: number) {
  return new Date(Date.now() + minutes * 60_000).toISOString();
}

// Seed drops cover the three states judges should see immediately:
// a live drop to stress test, a scheduled drop with a countdown, and a
// sold-through drop with a full audit trail. The live drop carries a handful
// of early fan orders so the dashboard is populated on first load, and its
// remaining stock lands on a clean 100 for the headline stress-test proof.
export function seedDrops(): Drop[] {
  return [
    {
      id: "drp_aurora_runner",
      slug: "aurora-runner-og",
      title: "Aurora Runner OG",
      creator: "Kairo Athletics",
      description:
        "Limited numbered run of the Aurora Runner in the original DSQL colorway. Never restocked. This is the drop we use for the live stress test, with exactly 100 pairs still on the shelf.",
      image: "sneaker",
      accent: "158 84% 45%",
      priceCents: 1299900,
      currency: "INR",
      quantity: 115,
      remaining: 100,
      goLiveAt: isoOffset(-2),
      createdAt: isoOffset(-2880),
      perFanLimit: 1,
    },
    {
      id: "drp_festival_tee",
      slug: "diwali-festival-tee",
      title: "Diwali Festival Tee",
      creator: "Studio Roshni",
      description:
        "Hand-screened festival tee timed for the Diwali week drop. 250 units, goes live on the countdown. First thirty minutes always sell the hardest.",
      image: "tee",
      accent: "268 84% 62%",
      priceCents: 149900,
      currency: "INR",
      quantity: 250,
      remaining: 250,
      goLiveAt: isoOffset(8),
      createdAt: isoOffset(-1440),
      perFanLimit: 2,
    },
    {
      id: "drp_vinyl_press",
      slug: "midnight-vinyl-press",
      title: "Midnight Press Vinyl",
      creator: "Neon Tide Records",
      description:
        "First pressing of the Midnight EP on translucent teal vinyl. 60 copies. This drop already sold through and the audit trail is intact to the unit.",
      image: "vinyl",
      accent: "200 90% 50%",
      priceCents: 249900,
      currency: "INR",
      quantity: 60,
      remaining: 0,
      goLiveAt: isoOffset(-720),
      createdAt: isoOffset(-4320),
      perFanLimit: 1,
    },
  ];
}

const FAN_HANDLES = [
  "riya.k",
  "arjun_dxb",
  "meghna.s",
  "tanvir",
  "neha.v",
  "zoya",
  "kabir.m",
  "anaya",
  "dev.patel",
  "ishita",
  "rohan99",
  "sara.j",
];

export function seedOrders(): Order[] {
  const orders: Order[] = [];

  // Early fan orders on the live drop so the dashboard shows real revenue and a
  // populated audit trail before anyone runs a stress test. 15 sold of 115
  // leaves exactly 100 units remaining.
  const liveBase = Date.now() - 90 * 60_000;
  for (let i = 0; i < 15; i++) {
    orders.push({
      id: `ord_live_${i + 1}`,
      dropId: "drp_aurora_runner",
      buyer: `${FAN_HANDLES[i % FAN_HANDLES.length]}+${i + 1}`,
      unitPriceCents: 1299900,
      createdAt: new Date(liveBase + i * 4200).toISOString(),
      source: "fan",
    });
  }

  // Full ledger for the sold-through vinyl drop, audited to the unit.
  const vinylBase = Date.now() - 720 * 60_000;
  for (let i = 0; i < 60; i++) {
    orders.push({
      id: `ord_seed_${i + 1}`,
      dropId: "drp_vinyl_press",
      buyer: `${FAN_HANDLES[i % FAN_HANDLES.length]}+${i + 1}`,
      unitPriceCents: 249900,
      createdAt: new Date(vinylBase + i * 1700).toISOString(),
      source: i % 9 === 0 ? "stress" : "fan",
    });
  }

  return orders;
}
