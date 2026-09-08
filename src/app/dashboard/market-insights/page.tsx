import { existsSync } from "node:fs";
import path from "node:path";
import Link from "next/link";
import { ArrowUpRight, ChartNoAxesCombined, FileText, MapPin } from "lucide-react";
import { PageContainer } from "@/components/layout/page-container";
import { goldCoastSuburbProfiles, type GoldCoastZone } from "@/lib/market-insights/suburbs";
import { requireUser } from "@/lib/auth/permissions";

export const metadata = { title: "Gold Coast Suburb Profiles" };
export const dynamic = "force-dynamic";

const zoneStyles: Record<GoldCoastZone, string> = {
  Coastal: "bg-sky text-coastal",
  Central: "bg-sand text-amber-800",
  Northern: "bg-emerald-50 text-emerald-700",
  Hinterland: "bg-stone-100 text-stone-700",
};

export default async function MarketInsightsPage() {
  const { supabase } = await requireUser();
  const reportsDirectory = path.join(process.cwd(), "public", "reports", "suburb-profiles");
  const { data: managedReports } = await supabase.from("suburb_reports").select("name, slug, postcode, zone, description, storage_path").eq("published", true);
  const configured = new Map(goldCoastSuburbProfiles.map((profile) => [profile.slug, profile]));
  for (const report of managedReports ?? []) configured.set(report.slug, { name: report.name, slug: report.slug, postcode: report.postcode, zone: report.zone as GoldCoastZone, description: report.description });
  const sortedProfiles = [...configured.values()].sort((a, b) => a.name.localeCompare(b.name, "en-AU"));
  const managedBySlug = new Map((managedReports ?? []).map((report) => [report.slug, report]));

  return <PageContainer>
    <header className="mb-8 border-b border-line pb-8">
      <span className="grid size-12 place-items-center rounded-xl bg-sky text-coastal"><ChartNoAxesCombined className="size-5" /></span>
      <p className="mt-6 text-sm font-semibold uppercase tracking-[0.18em] text-coastal">Gold Coast Insights</p>
      <h1 className="mt-3 max-w-4xl font-display text-4xl font-medium text-navy sm:text-5xl">Suburb Profile Reports</h1>
      <p className="mt-4 max-w-3xl text-base leading-7 text-muted">Explore a curated library of 20 Gold Coast focus areas. Published PDF reports open directly from their suburb card.</p>
    </header>
    <div className="mb-7 flex flex-wrap gap-2" aria-label="Area coverage">{(["Coastal", "Central", "Northern", "Hinterland"] as const).map((zone) => <span key={zone} className={`rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-wider ${zoneStyles[zone]}`}>{zone}</span>)}</div>
    <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3" aria-label="Gold Coast suburb profile reports">
      {sortedProfiles.map((suburb) => {
        const managed = managedBySlug.get(suburb.slug);
        const localReportPath = `/reports/suburb-profiles/${suburb.slug}.pdf`;
        const reportPath = managed?.storage_path ? supabase.storage.from("suburb-reports").getPublicUrl(managed.storage_path).data.publicUrl : localReportPath;
        const isPublished = Boolean(managed?.storage_path) || existsSync(path.join(reportsDirectory, `${suburb.slug}.pdf`));
        return <article key={suburb.slug} className="group flex min-h-72 flex-col rounded-2xl border border-line bg-white p-6 shadow-card transition hover:-translate-y-0.5 hover:shadow-card-hover">
          <div className="flex items-start justify-between gap-4"><span className={`grid size-11 place-items-center rounded-xl ${zoneStyles[suburb.zone]}`}><MapPin className="size-5" /></span><span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider ${isPublished ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-muted"}`}>{isPublished ? "PDF available" : "Coming soon"}</span></div>
          <p className="mt-7 text-xs font-semibold uppercase tracking-[0.16em] text-coastal">{suburb.zone} · {suburb.postcode}</p>
          <h2 className="mt-2 text-2xl font-semibold text-navy">{suburb.name}</h2>
          <p className="mt-3 flex-1 text-sm leading-6 text-muted">{suburb.description}</p>
          {isPublished ? <Link href={reportPath} target="_blank" className="mt-6 inline-flex items-center gap-2 self-start text-sm font-semibold text-navy underline-offset-4 hover:underline"><FileText className="size-4" />View PDF report<ArrowUpRight className="size-4" /></Link> : <p className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-muted"><FileText className="size-4" />Report being prepared</p>}
        </article>;
      })}
    </section>
    <aside className="mt-8 rounded-2xl border border-line bg-white p-6 text-sm leading-6 text-muted"><strong className="text-navy">About these reports:</strong> Suburb profiles are editorial information prepared for Blue Coast Property Hub. They are not property valuations, investment recommendations or legal advice. Check each PDF for its publication date and source notes.</aside>
  </PageContainer>;
}
