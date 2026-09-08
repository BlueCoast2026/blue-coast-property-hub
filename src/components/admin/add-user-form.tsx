"use client";

import { useActionState } from "react";
import { LoaderCircle, UserPlus } from "lucide-react";
import { inviteUser } from "@/app/actions/admin-users";

const inputClass = "mt-2 h-11 w-full rounded-xl border border-line bg-white px-3 text-sm outline-none focus:border-coastal";

export function AddUserForm() {
  const [state, action, pending] = useActionState(inviteUser, {});
  return <form action={action} className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
    <label className="text-sm font-medium text-ink">First name<input required name="firstName" autoComplete="given-name" className={inputClass} /></label>
    <label className="text-sm font-medium text-ink">Last name<input required name="lastName" autoComplete="family-name" className={inputClass} /></label>
    <label className="text-sm font-medium text-ink">Email<input required name="email" type="email" autoComplete="email" className={inputClass} /></label>
    <label className="text-sm font-medium text-ink">Phone (optional)<input name="phone" type="tel" autoComplete="tel" className={inputClass} /></label>
    <label className="text-sm font-medium text-ink">User type<select name="userType" defaultValue="Property Owner" className={inputClass}><option>Property Owner</option><option>Investor</option><option>Tenant</option><option>Other</option></select></label>
    <label className="text-sm font-medium text-ink">Role<select name="role" defaultValue="member" className={inputClass}><option value="member">Member</option><option value="property_manager">Property Manager</option><option value="admin">Administrator</option></select></label>
    {state.error && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 sm:col-span-2 lg:col-span-3">{state.error}</p>}
    {state.success && <p role="status" className="rounded-xl bg-sky px-4 py-3 text-sm text-navy sm:col-span-2 lg:col-span-3">{state.success}</p>}
    <button disabled={pending} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-navy px-5 text-sm font-semibold text-white disabled:opacity-50 sm:col-span-2 sm:justify-self-start lg:col-span-3">{pending ? <LoaderCircle className="size-4 animate-spin" /> : <UserPlus className="size-4" />}Invite user</button>
  </form>;
}
