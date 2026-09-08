import Link from "next/link";
import { AuthForm } from "@/components/auth/auth-form";
import { AuthShell } from "@/components/auth/auth-shell";
import { login } from "@/app/actions/auth";
import { GoogleAuthButton } from "@/components/auth/google-auth-button";

export const metadata = { title: "Property Hub Login" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ message?: string; error?: string }> }) {
  const params = await searchParams;
  return (
    <AuthShell>
      <div className="mt-12">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-coastal">Owner & investor portal</p>
        <h1 className="mt-3 font-display text-5xl font-medium tracking-tight text-navy">Blue Coast Property Hub Login</h1>
        <p className="mt-4 max-w-md text-base leading-7 text-muted">Access your properties, assessments and property insights in one place.</p>
        {params.message === "check-email" && <p className="mt-6 rounded-xl border border-coastal/20 bg-sky px-4 py-3 text-sm text-navy">Check your email to confirm your account, then sign in.</p>}
        {params.message === "password-updated" && <p className="mt-6 rounded-xl border border-coastal/20 bg-sky px-4 py-3 text-sm text-navy">Your password has been updated. Sign in with your new password.</p>}
        {params.error && <p role="alert" className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{params.error}</p>}
      </div>
      <AuthForm action={login} fields={[
        { name: "email", label: "Email", type: "email", autoComplete: "email", placeholder: "you@example.com" },
        { name: "password", label: "Password", type: "password", autoComplete: "current-password", placeholder: "Enter your password" },
      ]} submitLabel="Sign In" footerText="Don't have an account?" footerLabel="Create account" footerHref="/signup" />
      <GoogleAuthButton label="Continue with Google" />
      <p className="mt-4 text-center text-sm"><Link href="/forgot-password" className="font-semibold text-coastal underline-offset-4 hover:underline">Forgot your password?</Link></p>
    </AuthShell>
  );
}
