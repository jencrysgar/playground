"use client";

import { useActionState, useState } from "react";
import { Smartphone, ShieldCheck } from "lucide-react";
import { Button, Input, Label, cn } from "@/components/ui";
import {
  verifyLoginMfa,
  sendLoginSmsCode,
  type MfaLoginState,
} from "@/lib/actions/mfa";

export function MfaLoginForm({
  totpEnabled,
  smsEnabled,
}: {
  totpEnabled: boolean;
  smsEnabled: boolean;
}) {
  const [method, setMethod] = useState<"totp" | "sms">(
    totpEnabled ? "totp" : "sms",
  );
  const [state, action, pending] = useActionState<MfaLoginState, FormData>(
    verifyLoginMfa,
    undefined,
  );
  const [smsStatus, setSmsStatus] = useState<string | null>(null);

  async function handleSendSms() {
    setSmsStatus("Sending…");
    const res = await sendLoginSmsCode();
    setSmsStatus(res.ok ? "Code sent. Check your phone (dev: server console)." : res.error ?? "Failed to send.");
  }

  return (
    <form action={action} className="flex flex-col gap-4">
      {totpEnabled && smsEnabled && (
        <div className="flex gap-2">
          <MethodTab active={method === "totp"} onClick={() => setMethod("totp")} icon={<ShieldCheck className="h-4 w-4" />} label="Authenticator" />
          <MethodTab active={method === "sms"} onClick={() => setMethod("sms")} icon={<Smartphone className="h-4 w-4" />} label="SMS" />
        </div>
      )}

      <input type="hidden" name="method" value={method} />

      {method === "sms" && (
        <div className="flex flex-col gap-2">
          <Button type="button" variant="secondary" onClick={handleSendSms}>
            Send SMS code
          </Button>
          {smsStatus && <p className="text-xs text-muted">{smsStatus}</p>}
        </div>
      )}

      <div className="flex flex-col gap-2">
        <Label htmlFor="code">
          {method === "totp" ? "Authenticator code" : "SMS code"}
        </Label>
        <Input
          id="code"
          name="code"
          inputMode="numeric"
          autoComplete="one-time-code"
          placeholder="123456"
          required
        />
      </div>

      {state?.error && (
        <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-500" role="alert">
          {state.error}
        </p>
      )}

      <Button type="submit" size="lg" disabled={pending}>
        {pending ? "Verifying…" : "Verify & continue"}
      </Button>
    </form>
  );
}

function MethodTab({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-medium ring-focus transition",
        active ? "bg-primary text-primary-foreground halo-btn" : "glass-2 text-muted hover:text-foreground",
      )}
    >
      {icon}
      {label}
    </button>
  );
}
