"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { QuotaBar, useQuota } from "@/components/billing/quota-bar";
import { cn } from "@/lib/utils";
import { Suspense } from "react";

function AccountInner() {
  const { quota, refresh } = useQuota();
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const params = useSearchParams();

  useEffect(() => {
    if (params.get("checkout") === "success") {
      toast.success("Payment received — credits will appear shortly.");
      void refresh();
    }
  }, [params, refresh]);

  useEffect(() => {
    if (quota?.email) setEmail(quota.email);
  }, [quota?.email]);

  async function saveEmail(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not save email");
      toast.success("Email saved on this account");
      await refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function openPortal() {
    try {
      const res = await fetch("/api/billing/portal", { method: "POST" });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) throw new Error(data.error || "Portal unavailable");
      window.location.href = data.url;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Portal failed");
    }
  }

  return (
    <div className="min-h-svh bg-background">
      <header className="mx-auto flex h-16 max-w-3xl items-center justify-between px-5">
        <Link
          href="/"
          className="font-[family-name:var(--font-display)] text-xl tracking-tight"
        >
          HushVoice
        </Link>
        <div className="flex gap-2">
          <Link href="/pricing" className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>
            Pricing
          </Link>
          <Link
            href="/studio"
            className={cn(
              buttonVariants({ size: "sm" }),
              "hv-spectrum border-0 text-white"
            )}
          >
            Studio
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-8 px-5 pb-20 pt-10">
        <div>
          <p className="text-sm font-medium text-ocean">Account</p>
          <h1 className="mt-2 font-[family-name:var(--font-display)] text-4xl tracking-tight">
            Plan & credits
          </h1>
          <p className="mt-2 text-muted-foreground">
            Speaks are metered. Free daily allowance first, then prepaid credits.
          </p>
        </div>

        <QuotaBar quota={quota} />

        <form
          onSubmit={saveEmail}
          className="space-y-3 rounded-3xl border border-border/80 bg-card p-6"
        >
          <Label htmlFor="email">Email (links purchases on this device)</Label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </Button>
          </div>
        </form>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/pricing"
            className={cn(buttonVariants(), "hv-spectrum border-0 text-white")}
          >
            Buy credits / Pro
          </Link>
          <Button variant="outline" onClick={openPortal}>
            Stripe customer portal
          </Button>
          <Button variant="ghost" onClick={() => void refresh()}>
            Refresh balance
          </Button>
        </div>
      </main>
    </div>
  );
}

export default function AccountPage() {
  return (
    <Suspense fallback={<div className="p-8 text-muted-foreground">Loading account…</div>}>
      <AccountInner />
    </Suspense>
  );
}
