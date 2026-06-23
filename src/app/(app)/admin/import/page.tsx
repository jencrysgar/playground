import { redirect } from "next/navigation";
import { UploadCloud } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { canEditContent } from "@/lib/permissions";
import { PageHeader } from "@/components/ui";
import { ImportWizard } from "@/components/admin/import-wizard";

export default async function ImportPage() {
  const user = await getCurrentUser();
  if (!user || !canEditContent(user.role)) redirect("/dashboard");

  return (
    <div>
      <PageHeader
        title="Import course material"
        description="Drag in a saved webpage or document. Load it as-is, or let OpenAI and Claude each propose a structured course so you can compare and choose."
        icon={<UploadCloud className="h-5 w-5" />}
      />
      <ImportWizard />
    </div>
  );
}
