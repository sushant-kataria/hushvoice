import { NextResponse } from "next/server";
import { getQuota } from "@/lib/billing/entitlements";
import {
  attachEmailToSession,
  getOrCreateSessionUser,
} from "@/lib/billing/session";

export const runtime = "nodejs";

export async function GET() {
  const { user, isNew } = await getOrCreateSessionUser();
  const quota = await getQuota(user);
  return NextResponse.json({ userId: user.id, isNew, quota });
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { email?: string };
  const email = (body.email || "").trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Valid email required" }, { status: 400 });
  }
  const user = await attachEmailToSession(email);
  const quota = await getQuota(user);
  return NextResponse.json({ userId: user.id, quota });
}
