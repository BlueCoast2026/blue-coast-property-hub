import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, CheckCircle2, Info } from "lucide-react";
import { PageContainer } from "@/components/layout/page-container";
import { requireUser } from "@/lib/auth/permissions";
import { resultContent, type ResultLevel } from "@/lib/health-check/questions";

export const dynamic = "force-dynamic";

export default async function HealthCheckResultPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, user } = await requireUser();
  const { data } = await supabase.from("health_check_submissions").select("id, score, result_level, submitted_at").eq("id", id).eq("user_id", user.id).single();
  if (!data || !data.result_level) notFound();
  const result = resultContent[data.result_level as ResultLevel];
  const colour = data.result_level === "green" ? "text-emerald-700 bg-emerald-50" : data.result_level === "orange" ? "text-amber-700 bg-amber-50" : "text-red-700 bg-red-50";
  return <PageContainer><div className="mx-auto max-w-3xl rounded-3xl border border-line bg-white p-7 text-center shadow-card sm:p-12"><span className={`mx-auto grid size-14 place-items-center rounded-2xl ${colour}`}><CheckCircle2 className="size-7" /></span><p className="mt-7 text-sm font-semibold uppercase tracking-[0.18em] text-coastal">Assessment received</p><p className="mt-4 font-display text-7xl font-medium tracking-tight text-navy">{Number(data.score)}<span className="text-2xl text-muted">/100</span></p><h1 className="mt-6 font-display text-4xl font-medium text-navy">{result.heading}</h1><p className="mx-auto mt-4 max-w-xl text-base leading-7 text-muted">{result.description}</p><div className="mt-8 rounded-2xl bg-mist p-6 text-left"><h2 className="font-semibold text-navy">Thank you for completing your Property Health Check.</h2><p className="mt-2 text-base leading-7 text-muted">Your assessment has been received. A Blue Coast Realty professional can review your responses and provide further insights where appropriate.</p></div><div className="mt-5 flex items-start gap-3 rounded-xl border border-line p-4 text-left text-sm leading-6 text-muted"><Info className="mt-0.5 size-4 shrink-0 text-coastal" />This assessment is an initial indicator only. It is not legal advice or a definitive professional conclusion.</div><Link href="/dashboard" className="mt-8 inline-flex h-12 items-center gap-2 rounded-xl bg-navy px-6 text-sm font-semibold text-white">Back to Property Hub<ArrowRight className="size-4" /></Link></div></PageContainer>;
}
