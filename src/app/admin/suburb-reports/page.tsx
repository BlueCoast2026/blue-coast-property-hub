import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { SuburbReportManager } from "@/components/admin/suburb-report-manager";

export const metadata = { title: "Suburb Reports" };

export default function SuburbReportsPage() {
  return <main className="min-h-screen bg-mist px-5 py-10 sm:px-8 lg:px-12"><div className="mx-auto max-w-6xl">
    <Link href="/admin" className="inline-flex items-center gap-2 text-sm font-semibold text-muted"><ArrowLeft className="size-4" />Admin dashboard</Link>
    <header className="mt-8 border-b border-line pb-8"><p className="text-sm font-semibold uppercase tracking-[.18em] text-coastal">Administrator only</p><h1 className="mt-3 font-display text-4xl text-navy sm:text-5xl">Suburb Reports</h1><p className="mt-3 text-muted">Manage Gold Coast and Brisbane reports. Add PDFs, replace reports, edit details and arrange the library.</p></header>
    <SuburbReportManager />
  </div></main>;
}
