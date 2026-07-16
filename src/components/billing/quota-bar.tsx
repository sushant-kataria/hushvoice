"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type Quota = {
  plan: "free" | "pro";
  credits: number;
  speaksToday: number;
  speaksRemainingToday: number;
  freeSpeaksPerDay: number;
  cloneCount: number;
  maxClones: number;
  maxChars: number;
  billingOpen: boolean;
  canSpeak: boolean;
  canClone: boolean;
  email: string | null;
};

export function useQuota() {
  const [quota, setQuota] = useState<Quota | null>(null);
  const [stripeReady, setStripeReady] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/billing/status");
      const data = (await res.json()) as {
        quota: Quota;
        stripeReady?: boolean;
      };
      setQuota(data.quota);
      setStripeReady(Boolean(data.stripeReady));
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { quota, stripeReady, refresh, setQuota };
}

export function QuotaBar({
  quota,
  className,
}: {
  quota: Quota | null;
  className?: string;
}) {
  if (!quota) return null;
  if (quota.billingOpen) {
    return (
      <div
        className={cn(
          "flex flex-wrap items-center gap-2 rounded-2xl border border-border/70 bg-card/80 px-3 py-2 text-xs text-muted-foreground",
          className
        )}
      >
        <Badge variant="secondary">Open mode</Badge>
        <span>Billing caps disabled (local / HUSHVOICE_BILLING_MODE=open).</span>
      </div>
    );
  }

  const speaksLeft =
    quota.credits > 0
      ? `${quota.credits} credits`
      : `${quota.speaksRemainingToday}/${quota.freeSpeaksPerDay} free today`;

  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/70 bg-card/80 px-3 py-2.5",
        className
      )}
    >
      <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm">
        <Badge variant={quota.plan === "pro" ? "default" : "secondary"}>
          {quota.plan === "pro" ? "Pro" : "Free"}
        </Badge>
        <span className="text-muted-foreground">
          Speaks: <span className="text-foreground font-medium">{speaksLeft}</span>
        </span>
        <span className="text-muted-foreground">
          Clones:{" "}
          <span className="text-foreground font-medium">
            {quota.cloneCount}/{quota.maxClones}
          </span>
        </span>
        <span className="text-muted-foreground">
          Max chars:{" "}
          <span className="text-foreground font-medium">{quota.maxChars}</span>
        </span>
      </div>
      {(!quota.canSpeak || quota.credits === 0) && (
        <Link
          href="/pricing"
          className={cn(
            buttonVariants({ size: "sm" }),
            "hv-spectrum border-0 text-white"
          )}
        >
          Get credits
        </Link>
      )}
    </div>
  );
}
