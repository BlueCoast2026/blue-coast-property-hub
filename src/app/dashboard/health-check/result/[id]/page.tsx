import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, CheckCircle2, Download, FileText, Info } from "lucide-react";
import { PageContainer } from "@/components/layout/page-container";
import { requireUser } from "@/lib/auth/permissions";
import { resultContent, type ResultLevel } from "@/lib/health-check/questions";

export const dynamic = "force-dynamic";

export default async function HealthCheckResultPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, user } = await requireUser();
  const { data } = await supabase.from("health_check_submissions").select("id, property_id, score, result_level, status, submitted_at").eq("id", id).eq("user_id", user.id).single();
  if (!data || !data.result_level) notFound();
  const [{ data: property }, { data: feedback }, { data: attachments }] = await Promise.all([
    supabase.from("properties").select("address_line_1, address_line_2, suburb, state, postcode").eq("id", data.property_id).single(),
    supabase.from("admin_notes").select("id, note, created_at").eq("submission_type", "health_check").eq("submission_id", id).order("created_at", { ascending: false }),
    supabase.from("review_attachments").select("id, file_name, created_at").eq("submission_type", "health_check").eq("submission_id", id).order("created_at", { ascending: false }),
  ]);
  const address = property ? [property.address_line_1, property.address_line_2, property.suburb, property.state, property.postcode].filter(Boolean).join(", ") : "Property unavailable";
  const result = resultContent[data.result_level as ResultLevel];
  const colour = data.result_level === "green" ? "text-emerald-700 bg-emerald-50" : data.result_level === "orange" ? "text-amber-700 bg-amber-50" : "text-red-700 bg-red-50";

  return <PageContainer><div className="mx-auto max-w-3xl rounded-3xl border border-line bg-white p-7 text-center shadow-card sm:p-12">
    <span className={`mx-auto grid size-14 place-items-center rounded-2xl ${colour}`}><CheckCircle2 className="size-7" /></span>
    <p className="mt-7 text-sm font-semibold uppercase tracking-[0.18em] text-coastal">Assessment received</p>
    <p className="mt-3 text-sm font-medium text-muted">{address}</p>
    <p className="mt-4 font-display text-7xl font-medium tracking-tight text-navy">{Number(data.score)}<span className="text-2xl text-muted">/100</span></p>
    <h1 className="mt-6 font-display text-4xl font-medium text-navy">{result.heading}</h1>
    <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-muted">{result.description}</p>
    <a href={`/api/reports/health-check/${id}`} className="mt-7 inline-flex h-12 items-center gap-2 rounded-xl bg-coastal px-6 text-sm font-semibold text-white"><Download className="size-4" />Download PDF report</a>
    <div className="mt-8 rounded-2xl bg-mist p-6 text-left"><h2 className="font-semibold text-navy">Thank you for completing your Property Health Check.</h2><p className="mt-2 text-base leading-7 text-muted">Your assessment has been received. A Blue Coast Realty professional can review your responses and provide further insights where appropriate.</p></div>
    {feedback?.length ? <section className="mt-6 text-left"><h2 className="font-semibold text-navy">Feedback from Blue Coast Realty</h2><div className="mt-3 space-y-3">{feedback.map((item) => <article key={item.id} className="rounded-xl border border-line p-4"><p className="leading-7 text-ink">{item.note}</p><p className="mt-2 text-xs text-muted">{new Intl.DateTimeFormat("en-AU", { dateStyle: "medium" }).format(new Date(item.created_at))}</p></article>)}</div></section> : null}
    {attachments?.length ? <section className="mt-6 text-left"><h2 className="font-semibold text-navy">Documents from Blue Coast Realty</h2><div className="mt-3 space-y-2">{attachments.map((item) => <a key={item.id} href={`/api/review-attachments/${item.id}`} className="flex items-center gap-3 rounded-xl border border-line p-4 font-medium text-navy hover:bg-mist"><FileText className="size-5 text-coastal" />{item.file_name}<Download className="ml-auto size-4" /></a>)}</div></section> : null}
    <div className="mt-5 flex items-start gap-3 rounded-xl border border-line p-4 text-left text-sm leading-6 text-muted"><Info className="mt-0.5 size-4 shrink-0 text-coastal" />This assessment is an initial indicator only. It is not legal advice or a definitive professional conclusion.</div>
    <Link href="/dashboard" className="mt-8 inline-flex h-12 items-center gap-2 rounded-xl bg-navy px-6 text-sm font-semibold text-white">Back to Property Hub<ArrowRight className="size-4" /></Link>
  </div></PageContainer>;
}
