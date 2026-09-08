import { AuthForm } from "@/components/auth/auth-form";
import { AuthShell } from "@/components/auth/auth-shell";
import { signup } from "@/app/actions/auth";

export const metadata = { title: "Create account" };

export default function SignupPage() {
  return (
    <AuthShell>
      <div className="mt-10">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-coastal">Join your property hub</p>
        <h1 className="mt-3 font-display text-5xl font-medium tracking-tight text-navy">Create your account</h1>
        <p className="mt-4 text-base leading-7 text-muted">Set up secure access to your property information and assessments.</p>
      </div>
      <AuthForm action={signup} fields={[
        { name: "firstName", label: "First Name", autoComplete: "given-name", placeholder: "First name" },
        { name: "lastName", label: "Last Name", autoComplete: "family-name", placeholder: "Last name" },
        { name: "email", label: "Email", type: "email", autoComplete: "email", placeholder: "you@example.com" },
        { name: "phone", label: "Phone", type: "tel", autoComplete: "tel", placeholder: "04xx xxx xxx" },
        { name: "password", label: "Password", type: "password", autoComplete: "new-password", placeholder: "Minimum 8 characters" },
      ]} showUserType submitLabel="Create Account" footerText="Already have an account?" footerLabel="Sign in" footerHref="/login" />
    </AuthShell>
  );
}
