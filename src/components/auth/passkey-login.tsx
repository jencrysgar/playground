"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { startAuthentication } from "@simplewebauthn/browser";
import { KeyRound } from "lucide-react";
import { Button } from "@/components/ui";
import { startPasskeyLogin, finishPasskeyLogin } from "@/lib/actions/passkey";

export function PasskeyLoginButton() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleClick() {
    setError(null);
    setBusy(true);
    try {
      const options = await startPasskeyLogin();
      const response = await startAuthentication({ optionsJSON: options });
      const result = await finishPasskeyLogin(response);
      if (result.ok && result.redirectTo) {
        router.push(result.redirectTo);
        router.refresh();
      } else {
        setError(result.error ?? "Passkey sign-in failed.");
      }
    } catch (e) {
      if (e instanceof Error && e.name === "NotAllowedError") {
        setError("Passkey prompt was dismissed.");
      } else {
        setError(e instanceof Error ? e.message : "Passkey sign-in failed.");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <Button type="button" variant="secondary" size="lg" onClick={handleClick} disabled={busy}>
        <KeyRound className="h-4 w-4" />
        {busy ? "Waiting for passkey…" : "Sign in with a passkey"}
      </Button>
      {error && <p className="text-center text-xs text-rose-500">{error}</p>}
    </div>
  );
}
