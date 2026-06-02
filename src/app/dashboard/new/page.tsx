"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, Rocket } from "lucide-react";
import { ProductArt } from "@/components/product-art";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { apiHeaders } from "@/lib/client-keys";
import { cn, formatCurrency } from "@/lib/utils";

const IMAGES: { key: string; label: string; accent: string }[] = [
  { key: "sneaker", label: "Sneaker", accent: "158 84% 45%" },
  { key: "tee", label: "Apparel", accent: "268 84% 62%" },
  { key: "vinyl", label: "Vinyl / Disc", accent: "200 90% 50%" },
  { key: "box", label: "Boxed item", accent: "32 95% 55%" },
];

function defaultGoLive(offsetMinutes: number) {
  const d = new Date(Date.now() + offsetMinutes * 60_000);
  d.setSeconds(0, 0);
  // value formatted for datetime-local input in local time
  const tz = d.getTimezoneOffset() * 60_000;
  return new Date(d.getTime() - tz).toISOString().slice(0, 16);
}

export default function NewDropPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [title, setTitle] = useState("");
  const [creator, setCreator] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("4999");
  const [currency, setCurrency] = useState("INR");
  const [quantity, setQuantity] = useState("100");
  const [perFanLimit, setPerFanLimit] = useState("1");
  const [image, setImage] = useState("sneaker");
  const [goLiveAt, setGoLiveAt] = useState(defaultGoLive(5));
  const [submitting, setSubmitting] = useState(false);

  const accent = useMemo(
    () => IMAGES.find((i) => i.key === image)?.accent ?? "158 84% 45%",
    [image]
  );

  const priceCents = Math.round(Number(price) * 100) || 0;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !creator.trim()) {
      toast({ title: "Missing details", description: "Title and creator are required.", tone: "error" });
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/drops", {
        method: "POST",
        headers: apiHeaders(),
        body: JSON.stringify({
          title,
          creator,
          description,
          price: Number(price),
          currency,
          quantity: Number(quantity),
          perFanLimit: Number(perFanLimit),
          image,
          goLiveAt: new Date(goLiveAt).toISOString(),
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        toast({ title: "Could not launch", description: data.error ?? "Check your inputs.", tone: "error" });
        return;
      }
      toast({ title: "Drop launched", description: `${title} is ready.`, tone: "success" });
      router.push(`/drops/${data.drop.slug}`);
    } catch {
      toast({ title: "Something went wrong", description: "Please try again.", tone: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container py-12">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Dashboard
      </Link>

      <h1 className="mt-4 text-3xl font-bold tracking-tight">Launch a drop</h1>
      <p className="mt-1 text-muted-foreground">
        Set the item, the exact quantity, and a go-live time. The countdown does the rest.
      </p>

      <form onSubmit={submit} className="mt-8 grid gap-8 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label htmlFor="title">Item title</Label>
                <Input
                  id="title"
                  name="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Aurora Runner OG"
                  className="mt-1.5"
                  required
                />
              </div>
              <div>
                <Label htmlFor="creator">Creator or brand</Label>
                <Input
                  id="creator"
                  name="creator"
                  value={creator}
                  onChange={(e) => setCreator(e.target.value)}
                  placeholder="Kairo Athletics"
                  className="mt-1.5"
                  required
                />
              </div>
              <div>
                <Label htmlFor="goLiveAt">Go-live time</Label>
                <Input
                  id="goLiveAt"
                  name="goLiveAt"
                  type="datetime-local"
                  value={goLiveAt}
                  onChange={(e) => setGoLiveAt(e.target.value)}
                  className="mt-1.5"
                  required
                />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Limited run, numbered, never restocked."
                  className="mt-1.5"
                  rows={3}
                />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <Label htmlFor="price">Price</Label>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  min="0"
                  step="1"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="currency">Currency</Label>
                <select
                  id="currency"
                  name="currency"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="mt-1.5 flex h-10 w-full rounded-lg border border-input bg-background/60 px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="INR">INR</option>
                  <option value="USD">USD</option>
                </select>
              </div>
              <div>
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  name="quantity"
                  type="number"
                  min="1"
                  max="1000000"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="perFanLimit">Per-fan limit</Label>
                <Input
                  id="perFanLimit"
                  name="perFanLimit"
                  type="number"
                  min="0"
                  max="10"
                  value={perFanLimit}
                  onChange={(e) => setPerFanLimit(e.target.value)}
                  className="mt-1.5"
                />
                <p className="mt-1 text-xs text-muted-foreground">0 means no limit</p>
              </div>
            </div>

            <div className="mt-5">
              <Label>Artwork</Label>
              <div className="mt-1.5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {IMAGES.map((opt) => (
                  <button
                    type="button"
                    key={opt.key}
                    onClick={() => setImage(opt.key)}
                    className={cn(
                      "overflow-hidden rounded-xl border transition-colors",
                      image === opt.key ? "border-primary ring-2 ring-primary/40" : "border-border"
                    )}
                  >
                    <ProductArt kind={opt.key} accent={opt.accent} className="aspect-square w-full" />
                    <span className="block py-1.5 text-xs font-medium">{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="sticky top-24 rounded-2xl border border-border bg-card p-6">
            <p className="text-sm font-medium text-muted-foreground">Preview</p>
            <div className="mt-3 overflow-hidden rounded-xl border border-border">
              <ProductArt kind={image} accent={accent} className="aspect-[4/3] w-full" />
            </div>
            <h3 className="mt-4 text-lg font-semibold">{title || "Your item title"}</h3>
            <p className="text-sm text-muted-foreground">{creator || "Creator name"}</p>
            <div className="mt-3 flex items-center gap-2">
              <span className="text-2xl font-bold">
                {priceCents > 0 ? formatCurrency(priceCents, currency) : formatCurrency(0, currency)}
              </span>
              <Badge variant="muted">{quantity || 0} units</Badge>
            </div>
            <Button type="submit" size="lg" className="mt-5 w-full" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" /> Launching
                </>
              ) : (
                <>
                  <Rocket className="h-5 w-5" /> Launch drop
                </>
              )}
            </Button>
            <p className="mt-3 text-center text-xs text-muted-foreground">
              You can run a stress test on it right after.
            </p>
          </div>
        </div>
      </form>
    </div>
  );
}
