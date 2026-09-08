"use client";

import { useActionState } from "react";
import { FileUp, LoaderCircle } from "lucide-react";
import { saveSuburbReport } from "@/app/actions/admin-suburb-reports";

export function SuburbReportForm() {
  const [state, action, pending] = useActionState(saveSuburbReport, {});
  return <form action={action} className="mt-6 grid gap-5 sm:grid-cols-2">
    <label className="text-sm font-medium text-ink">Suburb name<input required name="name" placeholder="Southport" className="mt-2 h-12 w-full rounded-xl border border-line px-4 outline-none focus:border-coastal" /></label>
    <label className="text-sm font-medium text-ink">Postcode<input required name="postcode" inputMode="numeric" pattern="[0-9]{4}" maxLength={4} placeholder="4215" className="mt-2 h-12 w-full rounded-xl border border-line px-4 outline-none focus:border-coastal" /></label>
    <label className="text-sm font-medium text-ink">Gold Coast area<select required name="zone" className="mt-2 h-12 w-full rounded-xl border border-line bg-white px-4 outline-none focus:border-coastal"><option value="Coastal">Coastal</option><option value="Central">Central</option><option value="Northern">Northern</option><option value="Hinterland">Hinterland</option></select></label>
    <label className="text-sm font-medium text-ink">Report date<input name="reportDate" type="date" className="mt-2 h-12 w-full rounded-xl border border-line px-4 outline-none focus:border-coastal" /></label>
    <label className="text-sm font-medium text-ink sm:col-span-2">Short description<textarea name="description" rows={3} maxLength={300} className="mt-2 w-full rounded-xl border border-line px-4 py-3 outline-none focus:border-coastal" /></label>
    <label className="text-sm font-medium text-ink sm:col-span-2">PDF report<input required name="report" type="file" accept="application/pdf,.pdf" className="mt-2 block w-full rounded-xl border border-line bg-mist px-4 py-3 text-sm" /></label>
    <label className="flex items-center gap-3 text-sm font-medium text-ink sm:col-span-2"><input name="published" type="checkbox" className="size-4 accent-[#247fa2]" />Publish immediately</label>
    {state.error && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 sm:col-span-2">{state.error}</p>}
    {state.success && <p role="status" className="rounded-xl bg-sky px-4 py-3 text-sm text-navy sm:col-span-2">{state.success}</p>}
    <button disabled={pending} className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-navy px-5 text-sm font-semibold text-white disabled:opacity-50 sm:col-span-2 sm:justify-self-start">{pending ? <LoaderCircle className="size-4 animate-spin" /> : <FileUp className="size-4" />}Upload report</button>
  </form>;
}
