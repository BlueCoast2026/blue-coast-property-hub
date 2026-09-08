import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { PageContainer } from "@/components/layout/page-container";
import { requireUser } from "@/lib/auth/permissions";
import { readinessResultContent, type ReadinessLevel } from "@/lib/ready-to-rent/questions";

export const dynamic = "force-dynamic";

export default async function ReadyToRentResultPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, user } = await requireUser();
  const { data: submission } = await supabase.from("ready_to_rent_submissions").select("id, score, result_level, status").eq("id", id).eq("user_id", user.id).single();
  if (!submission || !submission.result_level) notFound();
  const { data: feedback } = await supabase.from("admin_notes").select("id, note, created_at").eq("submission_type", "ready_to_rent").eq("submission_id", id).order("created_at", { ascending: false });
  const content = readinessResultContent[submission.result_level as ReadinessLevel];
  return <PageContainer><div className="mx-auto max-w-3xl"><section className="overflow-hidden rounded-2xl border border-line bg-white shadow-card"><div className="bg-navy px-7 py-9 text-white sm:px-10"><div className="flex flex-wrap items-center justify-between gap-3"><p className="text-sm font-semibold uppercase tracking-[0.18em] text-white/60">Checklist received</p><span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider">{submission.status.replaceAll("_", " ")}</span></div><div className="mt-5 flex items-end gap-3"><span className="font-display text-7xl font-medium">{Number(submission.score)}</span><span className="pb-2 text-xl text-white/50">/100</span></div></div><div className="p-7 sm:p-10"><CheckCircle2 className="size-9 text-coastal" /><h1 className="mt-5 font-display text-4xl font-medium text-navy">{content.heading}</h1><p className="mt-4 text-lg leading-8 text-muted">{content.description}</p><div className="mt-8 rounded-2xl bg-mist p-6"><h2 className="font-semibold text-navy">Thank you for completing your Ready to Rent checklist.</h2><p className="mt-2 leading-7 text-muted">Your checklist has been received. A Blue Coast Realty professional can review your responses and discuss practical next steps where appropriate.</p><p className="mt-3 text-sm leading-6 text-muted">This checklist is a general readiness indicator only. It is not legal, safety or compliance advice, and it is not a substitute for professional inspections.</p></div>{feedback?.length ? <section className="mt-8"><h2 className="text-xl font-semibold text-navy">Feedback from Blue Coast</h2><div className="mt-4 space-y-3">{feedback.map((item) => <article key={item.id} className="rounded-xl border border-line p-5"><p className="leading-7 text-ink">{item.note}</p><p className="mt-3 text-xs text-muted">{new Intl.DateTimeFormat("en-AU", { dateStyle: "medium", timeStyle: "short" }).format(new Date(item.created_at))}</p></article>)}</div></section> : null}<Link href="/dashboard" className="mt-8 inline-flex h-11 items-center gap-2 rounded-xl bg-navy px-5 text-sm font-semibold text-white"><ArrowLeft className="size-4" />Back to Property Hub</Link></div></section></div></PageContainer>;
}
