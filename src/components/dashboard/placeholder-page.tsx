import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowLeft } from "lucide-react";
import { PageContainer } from "@/components/layout/page-container";

export function PlaceholderPage({ title, description, icon: Icon }: { title: string; description: string; icon: LucideIcon }) {
  return <PageContainer><Link href="/dashboard" className="inline-flex items-center gap-2 text-sm font-semibold text-muted hover:text-navy"><ArrowLeft className="size-4" />Back to dashboard</Link><div className="mt-10 max-w-2xl rounded-2xl border border-line bg-white p-8 shadow-card sm:p-10"><span className="grid size-12 place-items-center rounded-xl bg-sky text-coastal"><Icon className="size-5" /></span><p className="mt-8 text-sm font-semibold uppercase tracking-[0.18em] text-coastal">Phase 1 placeholder</p><h1 className="mt-3 font-display text-4xl font-medium text-navy">{title}</h1><p className="mt-4 text-base leading-7 text-muted">{description}</p></div></PageContainer>;
}
