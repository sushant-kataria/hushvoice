import Stripe from "stripe";
import { CREDIT_PACK, PRO_SUB, stripeConfigured } from "@/lib/billing/config";

let stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY is not set");
  }
  if (!stripe) {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
  return stripe;
}

export function canCheckout(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

export type CheckoutProduct = "credits" | "pro";

export async function createCheckoutSession(opts: {
  userId: string;
  email?: string | null;
  product: CheckoutProduct;
  successUrl: string;
  cancelUrl: string;
  customerId?: string | null;
}): Promise<Stripe.Checkout.Session> {
  const s = getStripe();
  const priceCredits = process.env.STRIPE_PRICE_CREDITS;
  const pricePro = process.env.STRIPE_PRICE_PRO;

  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];
  let mode: Stripe.Checkout.SessionCreateParams.Mode = "payment";

  if (opts.product === "credits") {
    if (priceCredits) {
      lineItems.push({ price: priceCredits, quantity: 1 });
    } else {
      lineItems.push({
        price_data: {
          currency: "usd",
          unit_amount: CREDIT_PACK.amountCents,
          product_data: {
            name: `${CREDIT_PACK.label} (${CREDIT_PACK.credits} speaks)`,
            description: "Prepaid HushVoice speak credits",
          },
        },
        quantity: 1,
      });
    }
    mode = "payment";
  } else {
    if (pricePro) {
      lineItems.push({ price: pricePro, quantity: 1 });
      mode = "subscription";
    } else {
      // Fallback one-time Pro pack (monthly credits) if no subscription price
      lineItems.push({
        price_data: {
          currency: "usd",
          unit_amount: PRO_SUB.amountCents,
          product_data: {
            name: `${PRO_SUB.label} — ${PRO_SUB.monthlyCredits} credits`,
            description: "HushVoice Pro credit pack (use Stripe Price for true subscription)",
          },
        },
        quantity: 1,
      });
      mode = "payment";
    }
  }

  return s.checkout.sessions.create({
    mode,
    line_items: lineItems,
    success_url: opts.successUrl,
    cancel_url: opts.cancelUrl,
    client_reference_id: opts.userId,
    customer: opts.customerId || undefined,
    customer_email:
      !opts.customerId && opts.email ? opts.email : undefined,
    metadata: {
      hushvoice_user_id: opts.userId,
      product: opts.product,
      credits:
        opts.product === "credits"
          ? String(CREDIT_PACK.credits)
          : String(PRO_SUB.monthlyCredits),
    },
    subscription_data:
      mode === "subscription"
        ? {
            metadata: {
              hushvoice_user_id: opts.userId,
              product: "pro",
            },
          }
        : undefined,
  });
}

export async function createPortalSession(opts: {
  customerId: string;
  returnUrl: string;
}): Promise<Stripe.BillingPortal.Session> {
  return getStripe().billingPortal.sessions.create({
    customer: opts.customerId,
    return_url: opts.returnUrl,
  });
}

export { stripeConfigured };
