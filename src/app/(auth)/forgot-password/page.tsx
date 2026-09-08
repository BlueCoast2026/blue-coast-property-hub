import { AuthForm } from "@/components/auth/auth-form";
import { AuthShell } from "@/components/auth/auth-shell";
import { requestPasswordReset } from "@/app/actions/auth";

export const metadata = { title: "Reset password" };

export default async function ForgotPasswordPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const params = await searchParams;
  return <AuthShell><div className="mt-12"><p className="text-sm font-semibold uppercase tracking-[0.18em] text-coastal">Account recovery</p><h1 className="mt-3 font-display text-5xl font-medium tracking-tight text-navy">Reset your password</h1><p className="mt-4 max-w-md text-base leading-7 text-muted">Enter your account email and we&apos;ll send you a secure password reset link.</p>{params.error === "invalid-link" && <p role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">This reset link is invalid, expired, or has already been used. Please request a new email.</p>}</div><AuthForm action={requestPasswordReset} fields={[{ name: "email", label: "Email", type: "email", autoComplete: "email", placeholder: "you@example.com" }]} submitLabel="Send Reset Link" footerText="Remembered your password?" footerLabel="Sign in" footerHref="/login" /></AuthShell>;
}
