"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import * as OTPAuth from "otpauth";
import QRCode from "qrcode";
import { prisma } from "@/lib/db";
import { getCurrentUser, getPendingUser, markSessionVerified } from "@/lib/auth";

const ISSUER = "AI Knowledge Center";
const SMS_COOKIE = "akc_sms_code";

function totpFor(secret: string, label: string) {
  return new OTPAuth.TOTP({
    issuer: ISSUER,
    label,
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret: OTPAuth.Secret.fromBase32(secret),
  });
}

/** Begin TOTP setup: generate a secret + QR for the logged-in user. */
export async function startTotpSetup(): Promise<{
  secret: string;
  qr: string;
  uri: string;
}> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not authenticated");
  const secret = new OTPAuth.Secret({ size: 20 }).base32;
  // Store provisionally; only flip totpEnabled once a code is verified.
  await prisma.user.update({
    where: { id: user.id },
    data: { totpSecret: secret, totpEnabled: false },
  });
  const uri = totpFor(secret, user.email).toString();
  const qr = await QRCode.toDataURL(uri, { margin: 1, width: 220 });
  return { secret, qr, uri };
}

export async function verifyTotpSetup(
  code: string,
): Promise<{ ok: boolean; error?: string }> {
  const user = await getCurrentUser();
  if (!user || !user.totpSecret) return { ok: false, error: "Start setup first." };
  const totp = totpFor(user.totpSecret, user.email);
  const delta = totp.validate({ token: code.replace(/\s/g, ""), window: 1 });
  if (delta === null) return { ok: false, error: "Invalid code. Try again." };
  await prisma.user.update({
    where: { id: user.id },
    data: { totpEnabled: true },
  });
  return { ok: true };
}

export async function disableTotp() {
  const user = await getCurrentUser();
  if (!user) return;
  await prisma.user.update({
    where: { id: user.id },
    data: { totpEnabled: false, totpSecret: null },
  });
}

function generateSmsCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

async function storeSmsCode(code: string) {
  const store = await cookies();
  store.set(SMS_COOKIE, code, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 300,
  });
}

/**
 * Mock SMS sender. In development the code is logged to the server console.
 * Swap this for a real provider (e.g. Twilio) by sending `code` to `phone`.
 */
async function sendSms(phone: string, code: string) {
  console.log(`\n[SMS MOCK] To ${phone}: Your verification code is ${code}\n`);
}

export async function startSmsSetup(
  phone: string,
): Promise<{ ok: boolean; error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Not authenticated" };
  const clean = phone.trim();
  if (clean.length < 7) return { ok: false, error: "Enter a valid phone number." };
  const code = generateSmsCode();
  await prisma.user.update({ where: { id: user.id }, data: { smsPhone: clean } });
  await storeSmsCode(code);
  await sendSms(clean, code);
  return { ok: true };
}

export async function verifySmsSetup(
  code: string,
): Promise<{ ok: boolean; error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Not authenticated" };
  const store = await cookies();
  const expected = store.get(SMS_COOKIE)?.value;
  if (!expected || expected !== code.trim()) {
    return { ok: false, error: "Invalid code." };
  }
  await prisma.user.update({ where: { id: user.id }, data: { smsEnabled: true } });
  store.delete(SMS_COOKIE);
  return { ok: true };
}

export async function disableSms() {
  const user = await getCurrentUser();
  if (!user) return;
  await prisma.user.update({
    where: { id: user.id },
    data: { smsEnabled: false, smsPhone: null },
  });
}

/** During login: send an SMS code to the pending user. */
export async function sendLoginSmsCode(): Promise<{ ok: boolean; error?: string }> {
  const user = await getPendingUser();
  if (!user || !user.smsEnabled || !user.smsPhone) {
    return { ok: false, error: "SMS is not set up." };
  }
  const code = generateSmsCode();
  await storeSmsCode(code);
  await sendSms(user.smsPhone, code);
  return { ok: true };
}

export type MfaLoginState = { error?: string } | undefined;

/** During login: verify the chosen second factor and complete the session. */
export async function verifyLoginMfa(
  _prev: MfaLoginState,
  formData: FormData,
): Promise<MfaLoginState> {
  const user = await getPendingUser();
  if (!user) redirect("/login");
  const method = String(formData.get("method") ?? "totp");
  const code = String(formData.get("code") ?? "").replace(/\s/g, "");

  if (method === "sms") {
    const store = await cookies();
    const expected = store.get(SMS_COOKIE)?.value;
    if (!expected || expected !== code) {
      return { error: "Invalid SMS code." };
    }
    store.delete(SMS_COOKIE);
  } else {
    if (!user.totpSecret) return { error: "Authenticator not configured." };
    const totp = totpFor(user.totpSecret, user.email);
    if (totp.validate({ token: code, window: 1 }) === null) {
      return { error: "Invalid authenticator code." };
    }
  }

  await markSessionVerified();
  redirect(user.defaultLanding || "/dashboard");
}
