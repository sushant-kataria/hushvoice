import { NextResponse } from "next/server";
import { CREDIT_PACK, PRO_SUB, stripeConfigured } from "@/lib/billing/config";
import { getQuota } from "@/lib/billing/entitlements";
import { getOrCreateSessionUser } from "@/lib/billing/session";

export const runtime = "nodejs";

export async function GET() {
  const { user } = await getOrCreateSessionUser();
  const quota = await getQuota(user);
  return NextResponse.json({
    quota,
    products: {
      credits: {
        id: "credits",
        label: CREDIT_PACK.label,
        credits: CREDIT_PACK.credits,
        amountCents: CREDIT_PACK.amountCents,
      },
      pro: {
        id: "pro",
        label: PRO_SUB.label,
        credits: PRO_SUB.monthlyCredits,
        amountCents: PRO_SUB.amountCents,
      },
    },
    stripeReady: stripeConfigured() || Boolean(process.env.STRIPE_SECRET_KEY),
  });
}
