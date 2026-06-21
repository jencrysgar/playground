import "server-only";
import { cookies } from "next/headers";
import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import type { Role } from "@/lib/permissions";

const SESSION_COOKIE = "akc_session";
const SESSION_DAYS = 30;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

function newToken(): string {
  return randomBytes(32).toString("hex");
}

/**
 * Create a session for a user. When the user has MFA enabled the session is
 * created in a `mfaPending` state and does not count as authenticated until the
 * second factor is verified.
 */
export async function createSession(userId: string, mfaPending: boolean) {
  const token = newToken();
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await prisma.session.create({
    data: { token, userId, mfaPending, expiresAt },
  });
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
  return token;
}

export async function markSessionVerified() {
  const token = await getSessionToken();
  if (!token) return;
  await prisma.session.updateMany({
    where: { token },
    data: { mfaPending: false },
  });
}

export async function getSessionToken(): Promise<string | null> {
  const store = await cookies();
  return store.get(SESSION_COOKIE)?.value ?? null;
}

async function getSessionWithUser(token: string | null) {
  if (!token) return null;
  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: true },
  });
  if (!session) return null;
  if (session.expiresAt < new Date()) {
    await prisma.session.delete({ where: { id: session.id } }).catch(() => {});
    return null;
  }
  return session;
}

/** The fully-authenticated user (MFA satisfied), or null. */
export async function getCurrentUser() {
  const session = await getSessionWithUser(await getSessionToken());
  if (!session || session.mfaPending) return null;
  return session.user;
}

/** The user mid-login who still needs to pass a second factor, or null. */
export async function getPendingUser() {
  const session = await getSessionWithUser(await getSessionToken());
  if (!session || !session.mfaPending) return null;
  return session.user;
}

export async function logout() {
  const token = await getSessionToken();
  if (token) {
    await prisma.session.deleteMany({ where: { token } });
  }
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export type SessionUser = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;

export function userRole(user: { role: string }): Role {
  return (user.role as Role) ?? "USER";
}
