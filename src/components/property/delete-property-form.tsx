"use client";

import { useActionState } from "react";
import { LoaderCircle, Trash2 } from "lucide-react";
import { deleteProperty } from "@/app/actions/health-check";

export function DeletePropertyForm({ propertyId, address }: { propertyId: string; address: string }) {
  const [state, action, pending] = useActionState(deleteProperty, {});
  return <form action={action} onSubmit={(event) => { if (!window.confirm(`Delete ${address} from Your Property? Existing assessment reports will be retained without this address.`)) event.preventDefault(); }}>
    <input type="hidden" name="propertyId" value={propertyId} readOnly />
    <button disabled={pending} className="inline-flex h-11 items-center gap-2 rounded-xl border border-red-200 px-4 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50">{pending ? <LoaderCircle className="size-4 animate-spin" /> : <Trash2 className="size-4" />}Delete</button>
    {state.error && <p role="alert" className="mt-2 max-w-sm text-xs text-red-700">{state.error}</p>}
  </form>;
}
