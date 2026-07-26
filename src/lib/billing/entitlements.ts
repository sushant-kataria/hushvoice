import {
  FREE,
  PRO,
  isBillingOpen,
} from "@/lib/billing/config";
import {
  getUser,
  updateUser,
  type UserRow,
} from "@/lib/billing/db";

export type QuotaStatus = {
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

function utcDay(d = new Date()): string {
  return d.toISOString().slice(0, 10);
}

async function rollDay(user: UserRow): Promise<UserRow> {
  const today = utcDay();
  if (user.speaks_day === today) return user;
  return updateUser(user.id, { speaks_today: 0, speaks_day: today });
}

export async function getQuota(user: UserRow): Promise<QuotaStatus> {
  if (isBillingOpen()) {
    return {
      plan: user.plan,
      credits: user.credits,
      speaksToday: 0,
      speaksRemainingToday: 999999,
      freeSpeaksPerDay: FREE.speaksPerDay,
      cloneCount: user.clone_count,
      maxClones: 999999,
      maxChars: 5000,
      billingOpen: true,
      canSpeak: true,
      canClone: true,
      email: user.email,
    };
  }

  const rolled = await rollDay(user);
  const maxClones = rolled.plan === "pro" ? PRO.maxClones : FREE.maxClones;
  const maxChars = rolled.plan === "pro" ? PRO.maxChars : FREE.maxChars;
  const freeLeft = Math.max(0, FREE.speaksPerDay - rolled.speaks_today);
  const canSpeak = rolled.credits > 0 || freeLeft > 0;
  const canClone = rolled.clone_count < maxClones;

  return {
    plan: rolled.plan,
    credits: rolled.credits,
    speaksToday: rolled.speaks_today,
    speaksRemainingToday: freeLeft,
    freeSpeaksPerDay: FREE.speaksPerDay,
    cloneCount: rolled.clone_count,
    maxClones,
    maxChars,
    billingOpen: false,
    canSpeak,
    canClone,
    email: rolled.email,
  };
}

export class EntitlementError extends Error {
  status: number;
  code: string;
  upgrade: boolean;

  constructor(message: string, code: string, status = 402) {
    super(message);
    this.name = "EntitlementError";
    this.status = status;
    this.code = code;
    this.upgrade = true;
  }
}

export async function assertCanClone(userId: string): Promise<UserRow> {
  if (isBillingOpen()) {
    const u = await getUser(userId);
    if (!u) throw new EntitlementError("Session missing", "NO_SESSION", 401);
    return u;
  }
  let user = await getUser(userId);
  if (!user) throw new EntitlementError("Session missing", "NO_SESSION", 401);
  user = await rollDay(user);
  const max = user.plan === "pro" ? PRO.maxClones : FREE.maxClones;
  if (user.clone_count >= max) {
    throw new EntitlementError(
      `Clone limit reached (${max}). Buy credits or upgrade to Pro.`,
      "LIMIT_CLONES"
    );
  }
  return user;
}

export async function recordClone(userId: string): Promise<UserRow> {
  if (isBillingOpen()) {
    const u = await getUser(userId);
    if (!u) throw new EntitlementError("Session missing", "NO_SESSION", 401);
    return u;
  }
  const user = await assertCanClone(userId);
  return updateUser(userId, { clone_count: user.clone_count + 1 });
}

export async function assertCanSpeak(
  userId: string,
  textLength: number
): Promise<{ user: UserRow; maxChars: number }> {
  if (isBillingOpen()) {
    const u = await getUser(userId);
    if (!u) throw new EntitlementError("Session missing", "NO_SESSION", 401);
    return { user: u, maxChars: 5000 };
  }

  let user = await getUser(userId);
  if (!user) throw new EntitlementError("Session missing", "NO_SESSION", 401);
  user = await rollDay(user);

  const maxChars = user.plan === "pro" ? PRO.maxChars : FREE.maxChars;
  if (textLength > maxChars) {
    throw new EntitlementError(
      `Text must be under ${maxChars} characters on your plan. Upgrade for longer speaks.`,
      "LIMIT_CHARS",
      400
    );
  }

  const freeLeft = FREE.speaksPerDay - user.speaks_today;
  if (user.credits <= 0 && freeLeft <= 0) {
    throw new EntitlementError(
      "No speaks left today. Buy credits or upgrade to Pro.",
      "LIMIT_SPEAKS"
    );
  }

  return { user, maxChars };
}

/**
 * Consume one speak: prefer prepaid credits, else free daily allowance.
 * Call only after the engine successfully starts a generation.
 */
export async function consumeSpeak(userId: string): Promise<QuotaStatus> {
  if (isBillingOpen()) {
    const u = await getUser(userId);
    if (!u) throw new EntitlementError("Session missing", "NO_SESSION", 401);
    return getQuota(u);
  }

  let user = await getUser(userId);
  if (!user) throw new EntitlementError("Session missing", "NO_SESSION", 401);
  user = await rollDay(user);

  if (user.credits > 0) {
    user = await updateUser(userId, { credits: user.credits - 1 });
  } else {
    user = await updateUser(userId, {
      speaks_today: user.speaks_today + 1,
      speaks_day: utcDay(),
    });
  }

  return getQuota(user);
}

export function entitlementResponse(err: EntitlementError) {
  return {
    error: err.message,
    code: err.code,
    upgrade: err.upgrade,
  };
}
