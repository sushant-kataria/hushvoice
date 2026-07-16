import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { CREDIT_PACK, PRO_SUB } from "@/lib/billing/config";
import {
  addCredits,
  getUser,
  getUserByStripeCustomer,
  updateUser,
} from "@/lib/billing/db";
import { getStripe } from "@/lib/billing/stripe";

export const runtime = "nodejs";

async function fulfillCheckout(session: Stripe.Checkout.Session) {
  const userId =
    session.metadata?.hushvoice_user_id ||
    session.client_reference_id ||
    undefined;
  const product = session.metadata?.product || "credits";
  const creditsMeta = Number(session.metadata?.credits || 0);

  let user = userId ? await getUser(userId) : null;
  const customerId =
    typeof session.customer === "string"
      ? session.customer
      : session.customer?.id;

  if (!user && customerId) {
    user = await getUserByStripeCustomer(customerId);
  }
  if (!user) {
    console.error("webhook: no user for session", session.id);
    return;
  }

  if (customerId && user.stripe_customer_id !== customerId) {
    await updateUser(user.id, { stripe_customer_id: customerId });
  }

  if (product === "pro" || session.mode === "subscription") {
    const subId =
      typeof session.subscription === "string"
        ? session.subscription
        : session.subscription?.id || null;
    const credits = creditsMeta || PRO_SUB.monthlyCredits;
    await updateUser(user.id, {
      plan: "pro",
      stripe_subscription_id: subId,
    });
    await addCredits(user.id, credits);
    return;
  }

  const credits = creditsMeta || CREDIT_PACK.credits;
  await addCredits(user.id, credits);
}

async function fulfillInvoice(invoice: Stripe.Invoice) {
  if (invoice.billing_reason !== "subscription_cycle") return;
  const customerId =
    typeof invoice.customer === "string"
      ? invoice.customer
      : invoice.customer?.id;
  if (!customerId) return;
  const user = await getUserByStripeCustomer(customerId);
  if (!user) return;
  await updateUser(user.id, { plan: "pro" });
  await addCredits(user.id, PRO_SUB.monthlyCredits);
}

export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret || !process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json(
      { error: "Webhook not configured" },
      { status: 503 }
    );
  }

  const body = await request.text();
  const sig = request.headers.get("stripe-signature");
  if (!sig) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(body, sig, secret);
  } catch (err) {
    console.error("webhook signature failed", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.payment_status === "paid" || session.mode === "subscription") {
          await fulfillCheckout(session);
        }
        break;
      }
      case "invoice.paid": {
        await fulfillInvoice(event.data.object as Stripe.Invoice);
        break;
      }
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const customerId =
          typeof sub.customer === "string" ? sub.customer : sub.customer.id;
        const user = await getUserByStripeCustomer(customerId);
        if (user) {
          await updateUser(user.id, {
            plan: "free",
            stripe_subscription_id: null,
          });
        }
        break;
      }
      default:
        break;
    }
  } catch (err) {
    console.error("webhook handler error", err);
    return NextResponse.json({ error: "Handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
