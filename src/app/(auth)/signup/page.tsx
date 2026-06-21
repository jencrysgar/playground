import { SignupForm } from "@/components/auth/auth-forms";

export default function SignupPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">Create your account</h1>
        <p className="text-sm text-muted">
          Start building your AI knowledge library.
        </p>
      </div>
      <SignupForm />
    </div>
  );
}
