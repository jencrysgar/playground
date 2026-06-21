import { LoginForm } from "@/components/auth/auth-forms";

export default function LoginPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">Welcome back</h1>
        <p className="text-sm text-muted">Sign in to your knowledge center.</p>
      </div>
      <LoginForm />
    </div>
  );
}
