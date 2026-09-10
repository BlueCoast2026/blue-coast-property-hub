import Link from "next/link";
import { ArrowLeft, FileText } from "lucide-react";
import { SuburbReportForm } from "@/components/admin/suburb-report-form";
import { DeleteSuburbReportForm } from "@/components/admin/delete-suburb-report-form";
import { requireAdmin } from "@/lib/auth/permissions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Suburb Report CMS" };

export default async function SuburbReportAdminPage() {
  const { supabase } = await requireAdmin();
  const { data: reports } = await supabase.from("suburb_reports").select("id, name, postcode, zone, market, published, report_date, storage_path, updated_at").order("market").order("name");
  const groups = [{ key: "gold_coast", title: "Gold Coast Market Insights" }, { key: "brisbane", title: "Brisbane Market Insights" }];
  return <main className="min-h-screen bg-mist px-5 py-10 sm:px-8 lg:px-12"><div className="mx-auto max-w-6xl">
    <Link href="/admin" className="inline-flex items-center gap-2 text-sm font-semibold text-muted hover:text-navy"><ArrowLeft className="size-4" />Admin dashboard</Link>
    <header className="mt-8 border-b border-line pb-8"><p className="text-sm font-semibold uppercase tracking-[0.18em] text-coastal">Administrator only</p><h1 className="mt-3 font-display text-4xl font-medium text-navy sm:text-5xl">Suburb Report CMS</h1><p className="mt-3 max-w-2xl text-muted">Manage PDF reports for the Gold Coast and Brisbane market libraries.</p></header>
    <section className="mt-8 rounded-2xl border border-line bg-white p-6 shadow-card sm:p-8"><h2 className="text-xl font-semibold text-navy">Upload or replace report</h2><SuburbReportForm /></section>
    {groups.map((group) => { const groupReports = (reports ?? []).filter((report) => (report.market ?? "gold_coast") === group.key); return <section key={group.key} className="mt-8 rounded-2xl border border-line bg-white p-6 shadow-card sm:p-8"><div className="flex items-center justify-between gap-4"><h2 className="text-xl font-semibold text-navy">{group.title}</h2><span className="rounded-full bg-mist px-3 py-1 text-xs font-semibold text-muted">{groupReports.length} reports</span></div>{groupReports.length ? <div className="mt-5 divide-y divide-line">{groupReports.map((report) => <article key={report.id} className="grid gap-4 py-5 sm:grid-cols-[1fr_auto_auto] sm:items-center"><div><h3 className="font-semibold text-navy">{report.name} <span className="font-normal text-muted">{report.postcode}</span></h3><p className="mt-1 text-sm text-muted">{report.zone} · {report.report_date || "No report date"}</p></div><span className={`inline-flex items-center gap-2 justify-self-start rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider ${report.published ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-muted"}`}><FileText className="size-3.5" />{report.published ? "Published" : report.storage_path ? "Draft" : "Awaiting PDF"}</span><DeleteSuburbReportForm id={report.id} name={report.name} /></article>)}</div> : <p className="mt-5 rounded-xl bg-mist p-5 text-sm text-muted">No reports in this market yet.</p>}</section>; })}
  </div></main>;
}
