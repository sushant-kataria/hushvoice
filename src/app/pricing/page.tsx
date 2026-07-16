"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Check } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const FREE_FEATURES = [
  "5 speaks per day (no credits)",
  "1 personal voice clone",
  "300 characters per speak",
  "Hosted Studio access",
];

const CREDIT_FEATURES = [
  "400 prepaid speaks",
  "Use anytime — no monthly burn",
  "Margin-safe: you only pay for what you buy",
  "Higher char limit while credits remain",
];

const PRO_FEATURES = [
  "300 credits every month",
  "Up to 10 saved clones",
  "2,000 characters per speak",
  "Top up anytime with credit packs",
];

export default function PricingPage() {
  const [loading, setLoading] = useState<"credits" | "pro" | null>(null);

  async function checkout(product: "credits" | "pro") {
    setLoading(product);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product }),
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        throw new Error(data.error || "Checkout unavailable");
      }
      window.location.href = data.url;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Checkout failed");
      setLoading(null);
    }
  }

  return (
    <div className="min-h-svh bg-background">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 opacity-40"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% -20%, color-mix(in oklab, var(--ocean) 35%, transparent), transparent)",
        }}
      />
      <header className="mx-auto flex h-16 max-w-5xl items-center justify-between px-5">
        <Link
          href="/"
          className="font-[family-name:var(--font-display)] text-xl tracking-tight"
        >
          HushVoice
        </Link>
        <div className="flex gap-2">
          <Link href="/account" className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>
            Account
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

      <main className="mx-auto max-w-5xl px-5 pb-20 pt-10">
        <p className="text-sm font-medium text-ocean">Pricing</p>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-4xl tracking-tight sm:text-5xl">
          Pay for speaks, stay in margin
        </h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Prepaid credits — not unlimited GPU. Free tier is capped. Pro includes
          monthly credits; top up when you need more.
        </p>

        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          <Tier
            name="Free"
            price="$0"
            blurb="Try the Studio with hard daily caps."
            features={FREE_FEATURES}
            cta={
              <Link
                href="/studio"
                className={cn(buttonVariants({ variant: "outline" }), "w-full")}
              >
                Open Studio
              </Link>
            }
          />
          <Tier
            name="Starter credits"
            price="$9.99"
            blurb="400 speaks. Money in first — compute stays covered."
            features={CREDIT_FEATURES}
            highlight
            cta={
              <Button
                className="w-full hv-spectrum border-0 text-white"
                disabled={loading !== null}
                onClick={() => checkout("credits")}
              >
                {loading === "credits" ? "Redirecting…" : "Buy credits"}
              </Button>
            }
          />
          <Tier
            name="Pro"
            price="$9.99"
            suffix="/mo"
            blurb="300 credits each month + higher limits."
            features={PRO_FEATURES}
            cta={
              <Button
                variant="outline"
                className="w-full"
                disabled={loading !== null}
                onClick={() => checkout("pro")}
              >
                {loading === "pro" ? "Redirecting…" : "Upgrade to Pro"}
              </Button>
            }
          />
        </div>
      </main>
    </div>
  );
}

function Tier({
  name,
  price,
  suffix,
  blurb,
  features,
  cta,
  highlight,
}: {
  name: string;
  price: string;
  suffix?: string;
  blurb: string;
  features: string[];
  cta: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        "relative flex flex-col rounded-3xl border bg-card p-6 sm:p-8",
        highlight ? "border-ocean/50 shadow-lg shadow-ocean/10" : "border-border/80"
      )}
    >
      {highlight && (
        <span className="absolute -top-3 left-6 rounded-full hv-spectrum px-3 py-0.5 text-xs font-medium text-white">
          Best for margin
        </span>
      )}
      <h2 className="font-[family-name:var(--font-display)] text-2xl">{name}</h2>
      <p className="mt-3 flex items-baseline gap-1">
        <span className="text-4xl font-semibold tracking-tight">{price}</span>
        {suffix && <span className="text-muted-foreground">{suffix}</span>}
      </p>
      <p className="mt-2 text-sm text-muted-foreground">{blurb}</p>
      <ul className="mt-6 flex-1 space-y-3 text-sm">
        {features.map((f) => (
          <li key={f} className="flex gap-2">
            <Check className="mt-0.5 size-4 shrink-0 text-ocean" />
            <span>{f}</span>
          </li>
        ))}
      </ul>
      <div className="mt-8">{cta}</div>
    </div>
  );
}
