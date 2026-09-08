"use client";

import { useActionState } from "react";
import { LoaderCircle, Plus } from "lucide-react";
import { addBasicProperty } from "@/app/actions/health-check";

export function AddPropertyForm({ compact = false }: { compact?: boolean }) {
  const [state, action, pending] = useActionState(addBasicProperty, {});
  return <section className="rounded-2xl border border-line bg-white p-6 shadow-card sm:p-8">
    {!compact && <span className="grid size-12 place-items-center rounded-xl bg-sky text-coastal"><Plus className="size-5" /></span>}
    <h2 className={compact ? "text-xl font-semibold text-navy" : "mt-6 text-xl font-semibold text-navy"}>Add a property</h2>
    <p className="mt-2 text-base leading-7 text-muted">Add the property address now. Only properties owned by your account will appear in your assessments.</p>
    <form action={action} className="mt-7 grid gap-5 sm:grid-cols-2">
      <label className="text-sm font-medium text-ink sm:col-span-2">Address<input required name="address" autoComplete="street-address" placeholder="88 The Esplanade" className="mt-2 h-12 w-full rounded-xl border border-line px-4 text-base outline-none focus:border-coastal focus:ring-4 focus:ring-coastal/10" /></label>
      <label className="text-sm font-medium text-ink">Suburb<input required name="suburb" placeholder="Burleigh Heads" className="mt-2 h-12 w-full rounded-xl border border-line px-4 text-base outline-none focus:border-coastal focus:ring-4 focus:ring-coastal/10" /></label>
      <div className="grid grid-cols-[1fr_1.2fr] gap-4"><label className="text-sm font-medium text-ink">State<input required name="state" defaultValue="QLD" maxLength={3} className="mt-2 h-12 w-full rounded-xl border border-line px-4 text-base uppercase outline-none focus:border-coastal focus:ring-4 focus:ring-coastal/10" /></label><label className="text-sm font-medium text-ink">Postcode<input required name="postcode" inputMode="numeric" pattern="[0-9]{4}" maxLength={4} placeholder="4220" className="mt-2 h-12 w-full rounded-xl border border-line px-4 text-base outline-none focus:border-coastal focus:ring-4 focus:ring-coastal/10" /></label></div>
      {state.error && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 sm:col-span-2">{state.error}</p>}
      {state.success && <p role="status" className="rounded-xl bg-sky px-4 py-3 text-sm text-navy sm:col-span-2">{state.success}</p>}
      <button disabled={pending} className="flex h-12 items-center justify-center gap-2 rounded-xl bg-navy px-5 text-sm font-semibold text-white sm:col-span-2 sm:justify-self-start">{pending ? <LoaderCircle className="size-4 animate-spin" /> : <Plus className="size-4" />}Add Property</button>
    </form>
  </section>;
}
