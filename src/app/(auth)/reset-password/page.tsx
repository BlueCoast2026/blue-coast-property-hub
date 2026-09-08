import { AuthForm } from "@/components/auth/auth-form";
import { AuthShell } from "@/components/auth/auth-shell";
import { updatePassword } from "@/app/actions/auth";
import { RecoverySession } from "@/components/auth/recovery-session";

export const metadata = { title: "Choose a new password" };

export default function ResetPasswordPage() {
  return <AuthShell><RecoverySession /><div className="mt-12"><p className="text-sm font-semibold uppercase tracking-[0.18em] text-coastal">Account invitation & recovery</p><h1 className="mt-3 font-display text-5xl font-medium tracking-tight text-navy">Choose a new password</h1><p className="mt-4 max-w-md text-base leading-7 text-muted">Use at least eight characters and enter the same password twice.</p></div><AuthForm action={updatePassword} fields={[{ name: "password", label: "New password", type: "password", autoComplete: "new-password", placeholder: "Minimum 8 characters" }, { name: "confirmPassword", label: "Confirm new password", type: "password", autoComplete: "new-password", placeholder: "Enter it again" }]} submitLabel="Update Password" footerText="Need a new link?" footerLabel="Request reset" footerHref="/forgot-password" /></AuthShell>;
}
