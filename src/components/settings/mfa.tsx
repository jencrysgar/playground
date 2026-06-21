"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { startRegistration } from "@simplewebauthn/browser";
import { ShieldCheck, KeyRound, Smartphone, Trash2, Check } from "lucide-react";
import { Button, Input, Label } from "@/components/ui";
import {
  startTotpSetup,
  verifyTotpSetup,
  disableTotp,
  startSmsSetup,
  verifySmsSetup,
  disableSms,
} from "@/lib/actions/mfa";
import {
  startPasskeyRegistration,
  finishPasskeyRegistration,
  deletePasskey,
} from "@/lib/actions/passkey";

function SettingCard({
  icon,
  title,
  description,
  enabled,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  enabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="glass glow rounded-2xl p-5">
      <div className="mb-4 flex items-start gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/15 text-primary">
          {icon}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold">{title}</h3>
            {enabled && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-medium text-emerald-500">
                <Check className="h-3 w-3" /> Enabled
              </span>
            )}
          </div>
          <p className="text-sm text-muted">{description}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

export function TotpSetup({ enabled }: { enabled: boolean }) {
  const router = useRouter();
  const [qr, setQr] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  async function begin() {
    setError(null);
    const res = await startTotpSetup();
    setQr(res.qr);
    setSecret(res.secret);
  }

  function verify() {
    startTransition(async () => {
      const res = await verifyTotpSetup(code);
      if (res.ok) {
        setQr(null);
        router.refresh();
      } else {
        setError(res.error ?? "Failed");
      }
    });
  }

  return (
    <SettingCard
      icon={<ShieldCheck className="h-5 w-5" />}
      title="Authenticator app (TOTP)"
      description="Use Google Authenticator, 1Password, Authy, etc."
      enabled={enabled}
    >
      {enabled ? (
        <Button variant="danger" size="sm" onClick={() => startTransition(async () => { await disableTotp(); router.refresh(); })}>
          Disable authenticator
        </Button>
      ) : qr ? (
        <div className="flex flex-col gap-3">
          <div className="flex flex-col items-start gap-3 sm:flex-row">
            <Image src={qr} alt="Scan this QR code" width={160} height={160} className="rounded-xl bg-white p-2" unoptimized />
            <div className="text-sm text-muted">
              <p>Scan the QR code, or enter this secret manually:</p>
              <code className="mt-1 block break-all rounded-lg glass-2 px-2 py-1 font-mono text-xs">{secret}</code>
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="totp-code">Enter the 6-digit code to confirm</Label>
            <div className="flex gap-2">
              <Input id="totp-code" value={code} onChange={(e) => setCode(e.target.value)} inputMode="numeric" placeholder="123456" className="max-w-40" />
              <Button onClick={verify} disabled={pending}>{pending ? "Verifying…" : "Verify"}</Button>
            </div>
          </div>
          {error && <p className="text-sm text-rose-500">{error}</p>}
        </div>
      ) : (
        <Button size="sm" onClick={begin}>Set up authenticator</Button>
      )}
    </SettingCard>
  );
}

export function PasskeyManager({
  passkeys,
}: {
  passkeys: { id: string; name: string; createdAt: string }[];
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function addPasskey() {
    setError(null);
    setBusy(true);
    try {
      const options = await startPasskeyRegistration();
      const response = await startRegistration({ optionsJSON: options });
      const label = `Passkey ${new Date().toLocaleDateString()}`;
      const res = await finishPasskeyRegistration(response, label);
      if (res.ok) router.refresh();
      else setError(res.error ?? "Failed to add passkey.");
    } catch (e) {
      if (e instanceof Error && e.name === "NotAllowedError") setError("Passkey prompt was dismissed.");
      else setError(e instanceof Error ? e.message : "Failed to add passkey.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <SettingCard
      icon={<KeyRound className="h-5 w-5" />}
      title="Passkeys"
      description="Sign in without a password using Face ID, Touch ID, or a security key."
      enabled={passkeys.length > 0}
    >
      <div className="flex flex-col gap-3">
        {passkeys.length > 0 && (
          <ul className="flex flex-col gap-2">
            {passkeys.map((p) => (
              <li key={p.id} className="flex items-center justify-between rounded-xl glass-2 px-3 py-2 text-sm">
                <span>{p.name}</span>
                <button
                  onClick={async () => { await deletePasskey(p.id); router.refresh(); }}
                  className="rounded-lg p-1.5 text-muted hover:bg-rose-500/10 hover:text-rose-500"
                  aria-label="Remove passkey"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
        <div>
          <Button size="sm" onClick={addPasskey} disabled={busy}>
            {busy ? "Waiting…" : "Add a passkey"}
          </Button>
        </div>
        {error && <p className="text-sm text-rose-500">{error}</p>}
      </div>
    </SettingCard>
  );
}

export function SmsSetup({
  enabled,
  phone,
}: {
  enabled: boolean;
  phone: string | null;
}) {
  const router = useRouter();
  const [step, setStep] = useState<"idle" | "code">("idle");
  const [phoneInput, setPhoneInput] = useState(phone ?? "");
  const [code, setCode] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  async function send() {
    setError(null);
    const res = await startSmsSetup(phoneInput);
    if (res.ok) {
      setStep("code");
      setStatus("Code sent (dev: check the server console).");
    } else {
      setError(res.error ?? "Failed");
    }
  }

  function verify() {
    startTransition(async () => {
      const res = await verifySmsSetup(code);
      if (res.ok) { setStep("idle"); router.refresh(); }
      else setError(res.error ?? "Failed");
    });
  }

  return (
    <SettingCard
      icon={<Smartphone className="h-5 w-5" />}
      title="SMS text message"
      description="Receive a one-time code by text. (Dev mode logs the code to the server console.)"
      enabled={enabled}
    >
      {enabled ? (
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted">{phone}</span>
          <Button variant="danger" size="sm" onClick={() => startTransition(async () => { await disableSms(); router.refresh(); })}>
            Disable SMS
          </Button>
        </div>
      ) : step === "idle" ? (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <div className="flex flex-1 flex-col gap-1.5">
            <Label htmlFor="phone">Phone number</Label>
            <Input id="phone" value={phoneInput} onChange={(e) => setPhoneInput(e.target.value)} placeholder="+1 555 123 4567" />
          </div>
          <Button onClick={send}>Send code</Button>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <Input value={code} onChange={(e) => setCode(e.target.value)} inputMode="numeric" placeholder="123456" className="max-w-40" />
            <Button onClick={verify} disabled={pending}>{pending ? "Verifying…" : "Verify"}</Button>
          </div>
          {status && <p className="text-xs text-muted">{status}</p>}
        </div>
      )}
      {error && <p className="mt-2 text-sm text-rose-500">{error}</p>}
    </SettingCard>
  );
}
