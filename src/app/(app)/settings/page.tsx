import { Settings as SettingsIcon } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui";
import { TotpSetup, PasskeyManager, SmsSetup } from "@/components/settings/mfa";
import {
  ProfileForm,
  DefaultLandingSelect,
  ThemeSetting,
} from "@/components/settings/preferences";

export default async function SettingsPage() {
  const user = (await getCurrentUser())!;
  const passkeys = await prisma.authenticator.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Settings"
        description="Manage your profile, security, and preferences."
        icon={<SettingsIcon className="h-5 w-5" />}
      />

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">
          Profile & preferences
        </h2>
        <ProfileForm name={user.name} />
        <DefaultLandingSelect current={user.defaultLanding} />
        <ThemeSetting />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">
          Two-factor authentication
        </h2>
        <PasskeyManager
          passkeys={passkeys.map((p) => ({
            id: p.id,
            name: p.name,
            createdAt: p.createdAt.toISOString(),
          }))}
        />
        <TotpSetup enabled={user.totpEnabled} />
        <SmsSetup enabled={user.smsEnabled} phone={user.smsPhone} />
      </section>
    </div>
  );
}
