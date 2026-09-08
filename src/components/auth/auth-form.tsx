"use client";

import Link from "next/link";
import { useActionState } from "react";
import { ArrowRight, LoaderCircle } from "lucide-react";
import type { AuthState } from "@/app/actions/auth";

type Field = {
  name: string;
  label: string;
  type?: string;
  autoComplete?: string;
  placeholder?: string;
};

type Props = {
  action: (state: AuthState, payload: FormData) => Promise<AuthState>;
  fields: Field[];
  submitLabel: string;
  footerText: string;
  footerLabel: string;
  footerHref: string;
  showUserType?: boolean;
};

export function AuthForm({ action, fields, submitLabel, footerText, footerLabel, footerHref, showUserType }: Props) {
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form action={formAction} className="mt-8 space-y-5">
      <div className={showUserType ? "grid gap-5 sm:grid-cols-2" : "space-y-5"}>
        {fields.map((field) => (
          <label key={field.name} className="block text-sm font-medium text-ink">
            {field.label}
            <input
              name={field.name}
              type={field.type ?? "text"}
              autoComplete={field.autoComplete}
              placeholder={field.placeholder}
              required
              minLength={field.name.toLowerCase().includes("password") ? 8 : undefined}
              className="mt-2 h-12 w-full rounded-xl border border-line bg-white px-4 text-base text-ink outline-none transition placeholder:text-slate-400 focus:border-coastal focus:ring-4 focus:ring-coastal/10"
            />
          </label>
        ))}
        {showUserType && (
          <label className="block text-sm font-medium text-ink sm:col-span-2">
            User Type
            <select name="userType" defaultValue="property-owner" className="mt-2 h-12 w-full rounded-xl border border-line bg-white px-4 text-base text-ink outline-none transition focus:border-coastal focus:ring-4 focus:ring-coastal/10">
              <option value="property-owner">Property Owner</option>
              <option value="investor">Investor</option>
              <option value="tenant">Tenant</option>
              <option value="other">Other</option>
            </select>
          </label>
        )}
      </div>

      {state.error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{state.error}</p>}
      {state.success && <p role="status" className="rounded-xl border border-coastal/20 bg-sky px-4 py-3 text-sm text-navy">{state.success}</p>}

      <button type="submit" disabled={pending} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-navy px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#142e4b] focus:outline-none focus:ring-4 focus:ring-coastal/20 disabled:cursor-wait disabled:opacity-70">
        {pending ? <LoaderCircle className="size-4 animate-spin" /> : null}
        {pending ? "Please wait…" : submitLabel}
        {!pending && <ArrowRight className="size-4" />}
      </button>

      <p className="text-center text-sm text-muted">
        {footerText} <Link href={footerHref} className="font-semibold text-navy underline-offset-4 hover:underline">{footerLabel}</Link>
      </p>
    </form>
  );
}
