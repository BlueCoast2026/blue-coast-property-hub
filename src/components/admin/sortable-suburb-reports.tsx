"use client";

import { useActionState, useId, useState } from "react";
import { FileText, GripVertical, LoaderCircle, Save } from "lucide-react";
import { reorderSuburbReports } from "@/app/actions/admin-suburb-reports";
import { DeleteSuburbReportForm } from "./delete-suburb-report-form";

type Report = { id: string; name: string; postcode: string; zone: string; published: boolean; report_date: string | null; storage_path: string | null };

export function SortableSuburbReports({ reports }: { reports: Report[] }) {
  const orderFormId = useId();
  const [orderedIds, setOrderedIds] = useState(() => reports.map((report) => report.id));
  const [dragged, setDragged] = useState<string | null>(null);
  const [state, action, pending] = useActionState(reorderSuburbReports, {});
  // Always render current server records, preserving any unsaved drag order.
  const reportMap = new Map(reports.map((report) => [report.id, report]));
  const items = [
    ...orderedIds.flatMap((id) => { const report = reportMap.get(id); return report ? [report] : []; }),
    ...reports.filter((report) => !orderedIds.includes(report.id)),
  ];

  const drop = (target: string) => {
    if (!dragged || dragged === target) return;
    const next = items.map((report) => report.id);
    const from = next.indexOf(dragged), to = next.indexOf(target);
    if (from < 0 || to < 0) return;
    const [id] = next.splice(from, 1);
    next.splice(to, 0, id);
    setOrderedIds(next);
    setDragged(null);
  };

  return <div className="mt-5">
    <div className="divide-y divide-line">{items.map((report) => <article key={report.id} draggable onDragStart={() => setDragged(report.id)} onDragEnd={() => setDragged(null)} onDragOver={(event) => event.preventDefault()} onDrop={() => drop(report.id)} className={`grid cursor-move gap-4 py-5 sm:grid-cols-[24px_1fr_auto_auto] sm:items-center ${dragged === report.id ? "opacity-40" : ""}`}>
      <GripVertical className="size-5 text-muted" />
      <div><div className="flex items-center gap-2"><input key={report.name} form={orderFormId} name={`name_${report.id}`} defaultValue={report.name} aria-label="Report name" className="h-9 min-w-0 flex-1 rounded-lg border border-transparent bg-transparent px-2 font-semibold text-navy outline-none hover:border-line focus:border-coastal" /><span className="text-muted">{report.postcode}</span></div><p className="mt-1 px-2 text-sm text-muted">{report.zone} · {report.report_date || "No report date"}</p></div>
      <span className={`inline-flex items-center gap-2 justify-self-start rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider ${report.published ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-muted"}`}><FileText className="size-3.5" />{report.published ? "Published" : report.storage_path ? "Draft" : "Awaiting PDF"}</span>
      <DeleteSuburbReportForm id={report.id} name={report.name} />
    </article>)}</div>
    <form id={orderFormId} action={action}>
      <input type="hidden" name="orderedIds" value={JSON.stringify(items.map((report) => report.id))} />
      {state.error && <p role="alert" className="mt-4 text-sm text-red-700">{state.error}</p>}
      {state.success && <p role="status" className="mt-4 text-sm text-emerald-700">{state.success}</p>}
      <button type="submit" disabled={pending} className="mt-5 inline-flex h-11 items-center gap-2 rounded-xl bg-navy px-5 text-sm font-semibold text-white">{pending ? <LoaderCircle className="size-4 animate-spin" /> : <Save className="size-4" />}Save names &amp; order</button>
    </form>
  </div>;
}