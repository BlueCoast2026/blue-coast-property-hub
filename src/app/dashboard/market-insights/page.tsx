import { existsSync } from "node:fs";
import path from "node:path";
import Link from "next/link";
import { ArrowUpRight, Building2, ChartNoAxesCombined, FileText, MapPin, Waves } from "lucide-react";
import { PageContainer } from "@/components/layout/page-container";
import { brisbaneSuburbProfiles, goldCoastSuburbProfiles, type SuburbProfile } from "@/lib/market-insights/suburbs";
import { requireUser } from "@/lib/auth/permissions";

export const metadata = { title: "Market Insights" };
export const dynamic = "force-dynamic";

const zoneStyles: Record<string, string> = {
  Coastal: "bg-sky text-coastal", Central: "bg-sand text-amber-800", Northern: "bg-emerald-50 text-emerald-700", Hinterland: "bg-stone-100 text-stone-700",
  "Brisbane City": "bg-violet-50 text-violet-700", Logan: "bg-emerald-50 text-emerald-700", Ipswich: "bg-amber-50 text-amber-800", "South Brisbane": "bg-sky text-coastal",
};

export default async function MarketInsightsPage({ searchParams }: { searchParams: Promise<{ market?: string }> }) {
  const selected = (await searchParams).market === "brisbane" ? "brisbane" : "gold_coast";
  const { supabase } = await requireUser();
  const reportsDirectory = path.join(process.cwd(), "public", "reports", "suburb-profiles");
  const { data: managedReports, error } = await supabase.from("suburb_reports").select("name, slug, postcode, zone, market, description, storage_path, published").eq("market", selected);
  const fallback = selected === "brisbane" ? brisbaneSuburbProfiles : goldCoastSuburbProfiles;
  const reports = !error ? (managedReports ?? []) : fallback;
  const sortedProfiles = [...reports].sort((a, b) => a.name.localeCompare(b.name, "en-AU")) as SuburbProfile[];
  const managedBySlug = new Map((managedReports ?? []).map((report) => [report.slug, report]));
  const isGoldCoast = selected === "gold_coast";

  return <PageContainer>
    <header className="mb-8 border-b border-line pb-8">
      <span className="grid size-12 place-items-center rounded-xl bg-sky text-coastal"><ChartNoAxesCombined className="size-5" /></span>
      <p className="mt-6 text-sm font-semibold uppercase tracking-[0.18em] text-coastal">Market Insights</p><h1 className="mt-3 max-w-4xl font-display text-4xl font-medium text-navy sm:text-5xl">Suburb Profile Reports</h1><p className="mt-4 max-w-3xl text-base leading-7 text-muted">Choose a market to explore its suburb and regional PDF report library.</p>
      <nav className="mt-7 flex flex-wrap gap-3" aria-label="Select market"><Link href="/dashboard/market-insights?market=gold_coast" className={`inline-flex h-11 items-center gap-2 rounded-xl px-5 text-sm font-semibold ${isGoldCoast ? "bg-navy text-white" : "border border-line bg-white text-navy"}`}><Waves className="size-4" />Gold Coast Market Insights</Link><Link href="/dashboard/market-insights?market=brisbane" className={`inline-flex h-11 items-center gap-2 rounded-xl px-5 text-sm font-semibold ${!isGoldCoast ? "bg-navy text-white" : "border border-line bg-white text-navy"}`}><Building2 className="size-4" />Brisbane Market Insights</Link></nav>
    </header>
    <div className="mb-7"><h2 className="font-display text-3xl font-medium text-navy">{isGoldCoast ? "Gold Coast" : "Brisbane"} reports</h2><p className="mt-2 text-sm text-muted">{isGoldCoast ? "Gold Coast suburb profiles and uploaded reports." : "Initial Brisbane coverage. Additional areas can be added through the Suburb Report CMS."}</p></div>
    <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3" aria-label={`${isGoldCoast ? "Gold Coast" : "Brisbane"} profile reports`}>
      {sortedProfiles.map((suburb) => {
        const managed = managedBySlug.get(suburb.slug);
        const localReportPath = `/reports/suburb-profiles/${suburb.slug}.pdf`;
        const reportPath = managed?.storage_path ? supabase.storage.from("suburb-reports").getPublicUrl(managed.storage_path).data.publicUrl : localReportPath;
        const isPublished = managed ? Boolean(managed.published && managed.storage_path) : existsSync(path.join(reportsDirectory, `${suburb.slug}.pdf`));
        const style = zoneStyles[suburb.zone] ?? "bg-slate-100 text-muted";
        return <article key={suburb.slug} className="group flex min-h-72 flex-col rounded-2xl border border-line bg-white p-6 shadow-card transition hover:-translate-y-0.5 hover:shadow-card-hover"><div className="flex items-start justify-between gap-4"><span className={`grid size-11 place-items-center rounded-xl ${style}`}><MapPin className="size-5" /></span><span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider ${isPublished ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-muted"}`}>{isPublished ? "PDF available" : "Coming soon"}</span></div><p className="mt-7 text-xs font-semibold uppercase tracking-[0.16em] text-coastal">{suburb.zone} · {suburb.postcode}</p><h3 className="mt-2 text-2xl font-semibold text-navy">{suburb.name}</h3><p className="mt-3 flex-1 text-sm leading-6 text-muted">{suburb.description}</p>{isPublished ? <Link href={reportPath} target="_blank" className="mt-6 inline-flex items-center gap-2 self-start text-sm font-semibold text-navy underline-offset-4 hover:underline"><FileText className="size-4" />View PDF report<ArrowUpRight className="size-4" /></Link> : <p className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-muted"><FileText className="size-4" />Report being prepared</p>}</article>;
      })}
    </section>
    <aside className="mt-8 rounded-2xl border border-line bg-white p-6 text-sm leading-6 text-muted"><strong className="text-navy">About these reports:</strong> Suburb profiles are editorial information prepared for Blue Coast Property Hub. They are not property valuations, investment recommendations or legal advice. Check each PDF for its publication date and source notes.</aside>
  </PageContainer>;
}
