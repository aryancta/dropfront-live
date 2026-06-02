"use client";

import { useEffect, useState } from "react";
import {
  Database,
  KeyRound,
  Save,
  Trash2,
  Plug,
  Loader2,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";
import type { BackendInfo } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { readKeys, writeKeys, clearKeys, type ApiKeys } from "@/lib/client-keys";

export default function SettingsPage() {
  const { toast } = useToast();
  const [keys, setKeys] = useState<ApiKeys>({ dsqlUrl: "", clerkKey: "" });
  const [loaded, setLoaded] = useState(false);
  const [testing, setTesting] = useState(false);
  const [status, setStatus] = useState<BackendInfo | null>(null);

  useEffect(() => {
    setKeys(readKeys());
    setLoaded(true);
  }, []);

  const save = () => {
    writeKeys(keys);
    toast({ title: "Saved", description: "Keys stored in your browser only.", tone: "success" });
  };

  const wipe = () => {
    clearKeys();
    setKeys({ dsqlUrl: "", clerkKey: "" });
    setStatus(null);
    toast({ title: "Cleared", description: "Back to demo mode.", tone: "info" });
  };

  const test = async () => {
    setTesting(true);
    setStatus(null);
    try {
      const headers: Record<string, string> = { "content-type": "application/json" };
      if (keys.dsqlUrl.trim()) headers["x-dsql-url"] = keys.dsqlUrl.trim();
      const res = await fetch("/api/backend", { headers });
      const data: BackendInfo = await res.json();
      setStatus(data);
      toast({
        title: data.backend === "aurora-dsql" ? "Connected" : "Demo mode",
        description: data.detail,
        tone: data.backend === "aurora-dsql" ? "success" : "info",
      });
    } catch {
      toast({ title: "Test failed", description: "Could not reach the backend.", tone: "error" });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="container max-w-3xl py-12">
      <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
      <p className="mt-1 text-muted-foreground">
        Connect your own Amazon Aurora DSQL database to run Dropfront Live on live
        infrastructure. Everything here is stored in your browser only and sent
        per request. We never log or persist it server-side.
      </p>

      <div className="mt-6 flex items-start gap-3 rounded-xl border border-primary/30 bg-primary/10 p-4 text-sm">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
        <p>
          No keys needed for the demo. Without a connection string the app runs on a
          strongly consistent in-memory backend, so the never-oversell guarantee still
          holds and every page stays populated with seed data.
        </p>
      </div>

      <div className="mt-6 space-y-6">
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5 text-primary" />
            <h2 className="font-semibold">Amazon Aurora DSQL</h2>
            <Badge variant="default">Sponsored by the hackathon</Badge>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Paste a PostgreSQL connection string for your Aurora DSQL cluster. For DSQL,
            use your cluster endpoint with an IAM auth token as the password. Leave blank
            for demo mode.
          </p>
          <div className="mt-4">
            <Label htmlFor="dsqlUrl">Connection string</Label>
            <Input
              id="dsqlUrl"
              type="password"
              autoComplete="off"
              value={keys.dsqlUrl}
              onChange={(e) => setKeys((k) => ({ ...k, dsqlUrl: e.target.value }))}
              placeholder="postgres://admin:TOKEN@your-cluster.dsql.ap-south-1.on.aws:5432/postgres?sslmode=require"
              className="mt-1.5 font-mono text-xs"
              disabled={!loaded}
            />
          </div>
          <a
            href="https://vercel.com/marketplace/aws/aws-dsql"
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-flex items-center gap-1 text-sm text-primary hover:underline"
          >
            Provision Aurora DSQL on the Vercel AWS Marketplace
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="outline" onClick={test} disabled={testing}>
              {testing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Testing
                </>
              ) : (
                <>
                  <Plug className="h-4 w-4" /> Test connection
                </>
              )}
            </Button>
          </div>
          {status ? (
            <div className="mt-3 rounded-lg border border-border bg-background/50 p-3 text-sm">
              <span className="font-semibold">
                {status.backend === "aurora-dsql" ? "Aurora DSQL active" : "Demo backend active"}
              </span>{" "}
              <span className="text-muted-foreground">- {status.detail}</span>
            </div>
          ) : null}
        </div>

        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-accent" />
            <h2 className="font-semibold">Fan login (optional)</h2>
            <Badge variant="muted">Stretch feature</Badge>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            A Clerk publishable key enables verified one-per-fan enforcement. Optional;
            the demo enforces a per-fan limit by browser identity without it.
          </p>
          <div className="mt-4">
            <Label htmlFor="clerkKey">Clerk publishable key</Label>
            <Input
              id="clerkKey"
              type="password"
              autoComplete="off"
              value={keys.clerkKey}
              onChange={(e) => setKeys((k) => ({ ...k, clerkKey: e.target.value }))}
              placeholder="pk_test_..."
              className="mt-1.5 font-mono text-xs"
              disabled={!loaded}
            />
          </div>
          <a
            href="https://clerk.com"
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-flex items-center gap-1 text-sm text-accent hover:underline"
          >
            Get a free key at clerk.com
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button onClick={save} disabled={!loaded}>
            <Save className="h-4 w-4" /> Save keys
          </Button>
          <Button variant="outline" onClick={wipe} disabled={!loaded}>
            <Trash2 className="h-4 w-4" /> Clear keys
          </Button>
        </div>
      </div>
    </div>
  );
}
