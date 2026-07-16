import { NextResponse } from "next/server";
import { canCheckout, createPortalSession } from "@/lib/billing/stripe";
import { getOrCreateSessionUser } from "@/lib/billing/session";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    if (!canCheckout()) {
      return NextResponse.json(
        { error: "Stripe is not configured", code: "STRIPE_NOT_CONFIGURED" },
        { status: 503 }
      );
    }

    const { user } = await getOrCreateSessionUser();
    if (!user.stripe_customer_id) {
      return NextResponse.json(
        { error: "No Stripe customer on this account yet. Buy credits first." },
        { status: 400 }
      );
    }

    const origin =
      request.headers.get("origin") ||
      process.env.NEXT_PUBLIC_APP_URL ||
      "http://localhost:3000";

    const session = await createPortalSession({
      customerId: user.stripe_customer_id,
      returnUrl: `${origin}/account`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("portal error", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Portal failed" },
      { status: 500 }
    );
  }
}
