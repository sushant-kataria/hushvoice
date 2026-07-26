import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { randomUUID } from "node:crypto";
import {
  createUser,
  getUser,
  upsertUserEmail,
  type UserRow,
} from "@/lib/billing/db";

export const SESSION_COOKIE = "hv_session";

type SessionPayload = {
  uid: string;
};

function secretKey(): Uint8Array {
  const secret =
    process.env.HUSHVOICE_SESSION_SECRET ||
    process.env.SESSION_SECRET ||
    "hushvoice-dev-session-secret-change-me";
  return new TextEncoder().encode(secret);
}

async function signSession(uid: string): Promise<string> {
  return new SignJWT({ uid } satisfies SessionPayload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("365d")
    .sign(secretKey());
}

async function verifySession(token: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey());
    const uid = payload.uid;
    return typeof uid === "string" ? uid : null;
  } catch {
    return null;
  }
}

export async function getOrCreateSessionUser(): Promise<{
  user: UserRow;
  token: string;
  isNew: boolean;
}> {
  const jar = await cookies();
  const existing = jar.get(SESSION_COOKIE)?.value;
  if (existing) {
    const uid = await verifySession(existing);
    if (uid) {
      const user = await getUser(uid);
      if (user) {
        return { user, token: existing, isNew: false };
      }
    }
  }

  const uid = randomUUID();
  const user = await createUser(uid);
  const token = await signSession(uid);
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  return { user, token, isNew: true };
}

export async function attachEmailToSession(email: string): Promise<UserRow> {
  const { user } = await getOrCreateSessionUser();
  const linked = await upsertUserEmail(user.id, email.trim());
  if (linked.id !== user.id) {
    // Switch cookie to the email-linked account
    const jar = await cookies();
    const token = await signSession(linked.id);
    jar.set(SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
  }
  return linked;
}

export async function requireUser(): Promise<UserRow> {
  const { user } = await getOrCreateSessionUser();
  return user;
}
