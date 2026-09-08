"use client";

import { useActionState } from "react";
import { LoaderCircle, Trash2 } from "lucide-react";
import { deleteUser } from "@/app/actions/admin-users";

export function DeleteUserForm({ profileId, label }: { profileId: string; label: string }) {
  const [state, action, pending] = useActionState(deleteUser, {});
  return <form action={action} onSubmit={(event) => { if (!window.confirm(`Permanently delete ${label} and all linked records?`)) event.preventDefault(); }}>
    <input type="hidden" name="profileId" value={profileId} readOnly />
    <button disabled={pending} className="inline-flex h-10 items-center gap-2 rounded-xl border border-red-200 px-3 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50">{pending ? <LoaderCircle className="size-4 animate-spin" /> : <Trash2 className="size-4" />}Delete</button>
    {state.error && <span role="alert" className="mt-2 block max-w-xs text-xs text-red-700">{state.error}</span>}
    {state.success && <span role="status" className="mt-2 block max-w-xs text-xs text-coastal">{state.success}</span>}
  </form>;
}
