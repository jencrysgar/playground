import "server-only";
import { headers } from "next/headers";

/**
 * Resolve the WebAuthn Relying Party settings from the incoming request so the
 * same code works on localhost during development and on a real domain in
 * production (no env vars required for local dev).
 */
export async function getRpConfig() {
  const h = await headers();
  const host = h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const rpID = host.split(":")[0];
  const origin = `${proto}://${host}`;
  return { rpID, origin, rpName: "AI Knowledge Center" };
}
