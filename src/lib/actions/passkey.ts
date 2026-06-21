"use server";

import { cookies } from "next/headers";
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from "@simplewebauthn/server";
import type {
  RegistrationResponseJSON,
  AuthenticationResponseJSON,
} from "@simplewebauthn/server";
import { prisma } from "@/lib/db";
import { getRpConfig } from "@/lib/webauthn";
import { createSession, getCurrentUser } from "@/lib/auth";

const REG_CHALLENGE = "akc_reg_challenge";
const AUTH_CHALLENGE = "akc_auth_challenge";

function bufToB64url(buf: Uint8Array): string {
  return Buffer.from(buf).toString("base64url");
}

export async function startPasskeyRegistration() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not authenticated");
  const { rpID, rpName } = await getRpConfig();

  const existing = await prisma.authenticator.findMany({
    where: { userId: user.id },
  });

  const options = await generateRegistrationOptions({
    rpName,
    rpID,
    userID: new TextEncoder().encode(user.id),
    userName: user.email,
    userDisplayName: user.name,
    attestationType: "none",
    excludeCredentials: existing.map((a) => ({ id: a.credentialID })),
    authenticatorSelection: {
      residentKey: "preferred",
      userVerification: "preferred",
    },
  });

  const store = await cookies();
  store.set(REG_CHALLENGE, options.challenge, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 300,
  });

  return options;
}

export async function finishPasskeyRegistration(
  response: RegistrationResponseJSON,
  label: string,
): Promise<{ ok: boolean; error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Not authenticated" };
  const { rpID, origin } = await getRpConfig();
  const store = await cookies();
  const expectedChallenge = store.get(REG_CHALLENGE)?.value;
  if (!expectedChallenge) return { ok: false, error: "Challenge expired. Try again." };

  try {
    const verification = await verifyRegistrationResponse({
      response,
      expectedChallenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
    });
    if (!verification.verified || !verification.registrationInfo) {
      return { ok: false, error: "Could not verify passkey." };
    }
    const { credential } = verification.registrationInfo;
    await prisma.authenticator.create({
      data: {
        userId: user.id,
        credentialID: credential.id,
        publicKey: bufToB64url(credential.publicKey),
        counter: credential.counter,
        transports: credential.transports?.join(",") ?? null,
        name: label?.trim() || "Passkey",
      },
    });
    store.delete(REG_CHALLENGE);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Verification failed." };
  }
}

export async function deletePasskey(id: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not authenticated");
  await prisma.authenticator.deleteMany({ where: { id, userId: user.id } });
}

export async function startPasskeyLogin() {
  const { rpID } = await getRpConfig();
  const options = await generateAuthenticationOptions({
    rpID,
    userVerification: "preferred",
  });
  const store = await cookies();
  store.set(AUTH_CHALLENGE, options.challenge, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 300,
  });
  return options;
}

export async function finishPasskeyLogin(
  response: AuthenticationResponseJSON,
): Promise<{ ok: boolean; error?: string; redirectTo?: string }> {
  const { rpID, origin } = await getRpConfig();
  const store = await cookies();
  const expectedChallenge = store.get(AUTH_CHALLENGE)?.value;
  if (!expectedChallenge) return { ok: false, error: "Challenge expired. Try again." };

  const authenticator = await prisma.authenticator.findUnique({
    where: { credentialID: response.id },
    include: { user: true },
  });
  if (!authenticator) {
    return { ok: false, error: "Unknown passkey. Register it first." };
  }

  try {
    const verification = await verifyAuthenticationResponse({
      response,
      expectedChallenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      credential: {
        id: authenticator.credentialID,
        publicKey: new Uint8Array(Buffer.from(authenticator.publicKey, "base64url")),
        counter: authenticator.counter,
        transports: authenticator.transports
          ? (authenticator.transports.split(",") as never)
          : undefined,
      },
    });
    if (!verification.verified) {
      return { ok: false, error: "Passkey verification failed." };
    }
    await prisma.authenticator.update({
      where: { id: authenticator.id },
      data: { counter: verification.authenticationInfo.newCounter },
    });
    store.delete(AUTH_CHALLENGE);
    // Passkeys are phishing-resistant, so a successful passkey login fully
    // authenticates the session (no additional second factor required).
    await createSession(authenticator.userId, false);
    return { ok: true, redirectTo: authenticator.user.defaultLanding || "/dashboard" };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Verification failed." };
  }
}
