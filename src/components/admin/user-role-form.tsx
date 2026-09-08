"use client";

import { useActionState } from "react";
import { LoaderCircle, Save } from "lucide-react";
import { updateUserRole } from "@/app/actions/admin-users";
import type { AppRole } from "@/lib/auth/permissions";

export function UserRoleForm({ profileId, currentRole }: { profileId: string; currentRole: AppRole }) {
  const [state, action, pending] = useActionState(updateUserRole, {});
  return <form action={action} className="flex flex-wrap items-center gap-2">
    <input type="hidden" name="profileId" value={profileId} readOnly />
    <select name="role" defaultValue={currentRole} aria-label="User role" className="h-10 rounded-xl border border-line bg-white px-3 text-sm font-medium outline-none focus:border-coastal">
      <option value="member">Member</option><option value="property_manager">Property Manager</option><option value="admin">Administrator</option>
    </select>
    <button disabled={pending} className="inline-flex h-10 items-center gap-2 rounded-xl bg-navy px-4 text-sm font-semibold text-white disabled:opacity-50">{pending ? <LoaderCircle className="size-4 animate-spin" /> : <Save className="size-4" />}Save</button>
    {state.error && <span role="alert" className="w-full text-xs text-red-700">{state.error}</span>}
    {state.success && <span role="status" className="w-full text-xs text-coastal">{state.success}</span>}
  </form>;
}
