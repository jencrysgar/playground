import { redirect } from "next/navigation";
import { getPendingUser } from "@/lib/auth";
import { MfaLoginForm } from "@/components/auth/mfa-login-form";

export default async function MfaPage() {
  const user = await getPendingUser();
  if (!user) redirect("/login");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">Two-factor authentication</h1>
        <p className="text-sm text-muted">
          Enter a code to finish signing in as {user.email}.
        </p>
      </div>
      <MfaLoginForm totpEnabled={user.totpEnabled} smsEnabled={user.smsEnabled} />
    </div>
  );
}
