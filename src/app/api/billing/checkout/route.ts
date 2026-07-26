import { NextResponse } from "next/server";
import { canCheckout, createCheckoutSession } from "@/lib/billing/stripe";
import { getOrCreateSessionUser } from "@/lib/billing/session";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    if (!canCheckout()) {
      return NextResponse.json(
        {
          error:
            "Stripe is not configured. Set STRIPE_SECRET_KEY (and optional STRIPE_PRICE_*) to enable checkout.",
          code: "STRIPE_NOT_CONFIGURED",
        },
        { status: 503 }
      );
    }

    const body = (await request.json()) as { product?: string };
    const product = body.product === "pro" ? "pro" : "credits";
    const { user } = await getOrCreateSessionUser();

    const origin =
      request.headers.get("origin") ||
      process.env.NEXT_PUBLIC_APP_URL ||
      "http://localhost:3000";

    const session = await createCheckoutSession({
      userId: user.id,
      email: user.email,
      product,
      customerId: user.stripe_customer_id,
      successUrl: `${origin}/account?checkout=success`,
      cancelUrl: `${origin}/pricing?checkout=cancel`,
    });

    return NextResponse.json({ url: session.url, id: session.id });
  } catch (err) {
    console.error("checkout error", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Checkout failed" },
      { status: 500 }
    );
  }
}
