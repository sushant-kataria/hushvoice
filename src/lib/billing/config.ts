/**
 * Margin-safe billing defaults.
 * Price packs so revenue ≥ ~4× measured GPU cost per speak.
 */

export const BILLING_MODE = (
  process.env.HUSHVOICE_BILLING_MODE || "metered"
).toLowerCase() as "metered" | "open";

/** Free tier hard caps */
export const FREE = {
  speaksPerDay: Number(process.env.HUSHVOICE_FREE_SPEAKS_PER_DAY || 5),
  maxClones: Number(process.env.HUSHVOICE_FREE_MAX_CLONES || 1),
  maxChars: Number(process.env.HUSHVOICE_FREE_MAX_CHARS || 300),
} as const;

/** Pro / paid limits (still metered via credits) */
export const PRO = {
  maxClones: Number(process.env.HUSHVOICE_PRO_MAX_CLONES || 10),
  maxChars: Number(process.env.HUSHVOICE_PRO_MAX_CHARS || 2000),
  monthlyCredits: Number(process.env.HUSHVOICE_PRO_MONTHLY_CREDITS || 300),
} as const;

export const CREDIT_PACK = {
  credits: Number(process.env.HUSHVOICE_CREDIT_PACK_CREDITS || 400),
  /** Display price in USD cents */
  amountCents: Number(process.env.HUSHVOICE_CREDIT_PACK_CENTS || 999),
  label: "Starter credits",
} as const;

export const PRO_SUB = {
  amountCents: Number(process.env.HUSHVOICE_PRO_CENTS || 999),
  label: "Pro",
  monthlyCredits: PRO.monthlyCredits,
} as const;

export function isBillingOpen(): boolean {
  return BILLING_MODE === "open";
}

export function stripeConfigured(): boolean {
  return Boolean(
    process.env.STRIPE_SECRET_KEY &&
      (process.env.STRIPE_PRICE_CREDITS ||
        process.env.STRIPE_PRICE_PRO ||
        process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  );
}
