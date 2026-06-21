"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/db";
import {
  createSession,
  hashPassword,
  verifyPassword,
  logout as destroySession,
} from "@/lib/auth";

export type AuthState = { error?: string } | undefined;

const signupSchema = z.object({
  name: z.string().min(1, "Please enter your name.").max(80),
  email: z.string().email("Enter a valid email address."),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters.")
    .max(200),
});

export async function signupAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = signupSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  const email = parsed.data.email.toLowerCase().trim();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "An account with that email already exists." };
  }
  const userCount = await prisma.user.count();
  const user = await prisma.user.create({
    data: {
      email,
      name: parsed.data.name.trim(),
      passwordHash: await hashPassword(parsed.data.password),
      // First user to ever sign up becomes an admin to bootstrap the system.
      role: userCount === 0 ? "ADMIN" : "USER",
    },
  });
  await createSession(user.id, false);
  redirect(user.defaultLanding || "/dashboard");
}

const loginSchema = z.object({
  email: z.string().email("Enter a valid email address."),
  password: z.string().min(1, "Enter your password."),
});

export async function loginAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  const email = parsed.data.email.toLowerCase().trim();
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await verifyPassword(parsed.data.password, user.passwordHash))) {
    return { error: "Incorrect email or password." };
  }

  const needsSecondFactor = user.totpEnabled || user.smsEnabled;
  await createSession(user.id, needsSecondFactor);
  if (needsSecondFactor) {
    redirect("/login/mfa");
  }
  redirect(user.defaultLanding || "/dashboard");
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}
