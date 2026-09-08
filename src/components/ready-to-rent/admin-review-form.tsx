"use client";

import { useActionState } from "react";
import { LoaderCircle, Send } from "lucide-react";
import { reviewReadyToRent } from "@/app/actions/admin-ready-to-rent";

export function AdminReviewForm({ submissionId, currentStatus }: { submissionId: string; currentStatus: string }) {
  const [state, action, pending] = useActionState(reviewReadyToRent, {});

  return <section className="mt-6 rounded-2xl border border-line bg-white p-6 shadow-card sm:p-8">
    <h2 className="text-xl font-semibold text-navy">Review and member feedback</h2>
    <p className="mt-2 text-sm leading-6 text-muted">Changing the status or adding feedback updates the member&apos;s result page.</p>
    <form action={action} className="mt-6 grid gap-5">
      <input type="hidden" name="submissionId" value={submissionId} readOnly />
      <label className="text-sm font-medium text-ink">Review status
        <select name="status" defaultValue={currentStatus} className="mt-2 h-12 w-full rounded-xl border border-line bg-white px-4 outline-none focus:border-coastal sm:max-w-sm">
          <option value="new">New</option><option value="under_review">Under review</option><option value="reviewed">Reviewed</option><option value="report_sent">Report sent</option><option value="closed">Closed</option>
        </select>
      </label>
      <label className="text-sm font-medium text-ink">Feedback for member
        <textarea name="note" maxLength={2000} rows={5} placeholder="Add practical next steps or comments for the member…" className="mt-2 w-full rounded-xl border border-line px-4 py-3 leading-6 outline-none focus:border-coastal" />
      </label>
      {state.error && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{state.error}</p>}
      {state.success && <p role="status" className="rounded-xl bg-sky px-4 py-3 text-sm text-navy">{state.success}</p>}
      <button disabled={pending} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-navy px-5 text-sm font-semibold text-white disabled:opacity-50 sm:justify-self-start">{pending ? <LoaderCircle className="size-4 animate-spin" /> : <Send className="size-4" />}Save review</button>
    </form>
  </section>;
}
