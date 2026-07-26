import { NextResponse } from "next/server";
import {
  DEFAULT_ENGINE,
  ENGINE_API_KEY,
  ENGINE_URL,
  getEngineHealth,
} from "@/lib/engine";
import { BILLING_MODE, stripeConfigured } from "@/lib/billing/config";

export const runtime = "nodejs";

export async function GET() {
  const health = await getEngineHealth();
  return NextResponse.json({
    hushvoice: "ok",
    engine: DEFAULT_ENGINE,
    engineHealth: health,
    engineUrl: ENGINE_URL,
    mode: "self-hosted",
    billingMode: BILLING_MODE,
    stripeConfigured: stripeConfigured() || Boolean(process.env.STRIPE_SECRET_KEY),
    apiKeysRequired: Boolean(ENGINE_API_KEY),
  });
}
