import { createClient, type Client } from "@libsql/client";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

export type UserRow = {
  id: string;
  email: string | null;
  plan: "free" | "pro";
  credits: number;
  speaks_today: number;
  speaks_day: string | null;
  clone_count: number;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  created_at: string;
  updated_at: string;
};

let client: Client | null = null;
let ready: Promise<void> | null = null;

function databaseUrl(): string {
  if (process.env.HUSHVOICE_DATABASE_URL) {
    return process.env.HUSHVOICE_DATABASE_URL;
  }
  // Local default — persists under ./data
  const file = resolve(process.cwd(), "data", "hushvoice.db");
  try {
    mkdirSync(dirname(file), { recursive: true });
  } catch {
    // ignore
  }
  return `file:${file}`;
}

export function getDb(): Client {
  if (!client) {
    const url = databaseUrl();
    client = createClient({
      url,
      authToken: process.env.HUSHVOICE_DATABASE_AUTH_TOKEN,
    });
  }
  return client;
}

export async function ensureSchema(): Promise<void> {
  if (!ready) {
    ready = (async () => {
      const db = getDb();
      await db.execute(`
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          email TEXT UNIQUE,
          plan TEXT NOT NULL DEFAULT 'free',
          credits INTEGER NOT NULL DEFAULT 0,
          speaks_today INTEGER NOT NULL DEFAULT 0,
          speaks_day TEXT,
          clone_count INTEGER NOT NULL DEFAULT 0,
          stripe_customer_id TEXT,
          stripe_subscription_id TEXT,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        )
      `);
      await db.execute(
        `CREATE INDEX IF NOT EXISTS idx_users_stripe ON users(stripe_customer_id)`
      );
    })();
  }
  await ready;
}

function mapUser(row: Record<string, unknown>): UserRow {
  return {
    id: String(row.id),
    email: row.email == null ? null : String(row.email),
    plan: row.plan === "pro" ? "pro" : "free",
    credits: Number(row.credits || 0),
    speaks_today: Number(row.speaks_today || 0),
    speaks_day: row.speaks_day == null ? null : String(row.speaks_day),
    clone_count: Number(row.clone_count || 0),
    stripe_customer_id:
      row.stripe_customer_id == null ? null : String(row.stripe_customer_id),
    stripe_subscription_id:
      row.stripe_subscription_id == null
        ? null
        : String(row.stripe_subscription_id),
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

export async function getUser(id: string): Promise<UserRow | null> {
  await ensureSchema();
  const rs = await getDb().execute({
    sql: `SELECT * FROM users WHERE id = ?`,
    args: [id],
  });
  if (!rs.rows[0]) return null;
  return mapUser(rs.rows[0] as Record<string, unknown>);
}

export async function getUserByEmail(email: string): Promise<UserRow | null> {
  await ensureSchema();
  const rs = await getDb().execute({
    sql: `SELECT * FROM users WHERE email = ?`,
    args: [email.toLowerCase()],
  });
  if (!rs.rows[0]) return null;
  return mapUser(rs.rows[0] as Record<string, unknown>);
}

export async function getUserByStripeCustomer(
  customerId: string
): Promise<UserRow | null> {
  await ensureSchema();
  const rs = await getDb().execute({
    sql: `SELECT * FROM users WHERE stripe_customer_id = ?`,
    args: [customerId],
  });
  if (!rs.rows[0]) return null;
  return mapUser(rs.rows[0] as Record<string, unknown>);
}

export async function createUser(id: string, email?: string | null): Promise<UserRow> {
  await ensureSchema();
  const now = new Date().toISOString();
  await getDb().execute({
    sql: `INSERT INTO users (id, email, plan, credits, speaks_today, speaks_day, clone_count, created_at, updated_at)
          VALUES (?, ?, 'free', 0, 0, NULL, 0, ?, ?)`,
    args: [id, email ? email.toLowerCase() : null, now, now],
  });
  const user = await getUser(id);
  if (!user) throw new Error("Failed to create user");
  return user;
}

export async function upsertUserEmail(
  id: string,
  email: string
): Promise<UserRow> {
  await ensureSchema();
  const existing = await getUserByEmail(email);
  if (existing && existing.id !== id) {
    // Prefer the email-linked account
    return existing;
  }
  const now = new Date().toISOString();
  const current = await getUser(id);
  if (!current) {
    return createUser(id, email);
  }
  await getDb().execute({
    sql: `UPDATE users SET email = ?, updated_at = ? WHERE id = ?`,
    args: [email.toLowerCase(), now, id],
  });
  return (await getUser(id))!;
}

export async function updateUser(
  id: string,
  patch: Partial<{
    plan: "free" | "pro";
    credits: number;
    speaks_today: number;
    speaks_day: string | null;
    clone_count: number;
    stripe_customer_id: string | null;
    stripe_subscription_id: string | null;
  }>
): Promise<UserRow> {
  await ensureSchema();
  const current = await getUser(id);
  if (!current) throw new Error("User not found");
  const next = {
    plan: patch.plan ?? current.plan,
    credits: patch.credits ?? current.credits,
    speaks_today: patch.speaks_today ?? current.speaks_today,
    speaks_day:
      patch.speaks_day !== undefined ? patch.speaks_day : current.speaks_day,
    clone_count: patch.clone_count ?? current.clone_count,
    stripe_customer_id:
      patch.stripe_customer_id !== undefined
        ? patch.stripe_customer_id
        : current.stripe_customer_id,
    stripe_subscription_id:
      patch.stripe_subscription_id !== undefined
        ? patch.stripe_subscription_id
        : current.stripe_subscription_id,
  };
  const now = new Date().toISOString();
  await getDb().execute({
    sql: `UPDATE users SET plan = ?, credits = ?, speaks_today = ?, speaks_day = ?,
          clone_count = ?, stripe_customer_id = ?, stripe_subscription_id = ?, updated_at = ?
          WHERE id = ?`,
    args: [
      next.plan,
      next.credits,
      next.speaks_today,
      next.speaks_day,
      next.clone_count,
      next.stripe_customer_id,
      next.stripe_subscription_id,
      now,
      id,
    ],
  });
  return (await getUser(id))!;
}

export async function addCredits(id: string, amount: number): Promise<UserRow> {
  const user = await getUser(id);
  if (!user) throw new Error("User not found");
  return updateUser(id, { credits: user.credits + amount });
}
