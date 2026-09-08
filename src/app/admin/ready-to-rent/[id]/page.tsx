import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { AdminReviewForm } from "@/components/ready-to-rent/admin-review-form";
import { requireStaff } from "@/lib/auth/permissions";

export const dynamic = "force-dynamic";

export default async function AdminReadyToRentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requireStaff();
  const { data: submission } = await supabase.from("ready_to_rent_submissions").select("id, user_id, property_id, score, result_level, status, submitted_at").eq("id", id).single();
  if (!submission) notFound();
  const [{ data: profile }, { data: property }, { data: answers }] = await Promise.all([
    supabase.from("profiles").select("first_name, last_name, email").eq("id", submission.user_id).single(),
    supabase.from("properties").select("address_line_1, suburb, state, postcode").eq("id", submission.property_id).single(),
    supabase.from("ready_to_rent_answers").select("id, question_text, answer, score").eq("submission_id", id).order("created_at"),
  ]);
  return <main className="min-h-screen bg-mist px-5 py-10 sm:px-8 lg:px-12"><div className="mx-auto max-w-5xl"><Link href="/admin" className="inline-flex items-center gap-2 text-sm font-semibold text-muted hover:text-navy"><ArrowLeft className="size-4" />Admin dashboard</Link><header className="mt-8 rounded-2xl bg-navy p-7 text-white sm:p-9"><p className="text-sm font-semibold uppercase tracking-[0.18em] text-white/55">Ready to Rent</p><div className="mt-4 flex flex-wrap items-end justify-between gap-5"><div><h1 className="font-display text-4xl font-medium">{profile ? `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim() || "Member" : "Member"}</h1><p className="mt-2 text-white/65">{profile?.email} · {property ? `${property.address_line_1}, ${property.suburb}` : "Property unavailable"}</p></div><div className="text-right"><p className="text-4xl font-semibold">{Number(submission.score)}<span className="text-lg text-white/50">/100</span></p><p className="mt-1 text-sm uppercase tracking-wider text-white/65">{submission.result_level} · {submission.status.replaceAll("_", " ")}</p></div></div></header><section className="mt-6 rounded-2xl border border-line bg-white p-6 shadow-card sm:p-8"><div className="flex items-center justify-between"><h2 className="text-xl font-semibold text-navy">Checklist answers</h2><p className="text-sm text-muted">{new Intl.DateTimeFormat("en-AU", { dateStyle: "medium", timeStyle: "short" }).format(new Date(submission.submitted_at))}</p></div><div className="mt-5 divide-y divide-line">{(answers ?? []).map((answer, index) => <div key={answer.id} className="grid gap-2 py-5 sm:grid-cols-[32px_1fr_auto] sm:gap-5"><span className="text-sm font-semibold text-coastal">{index + 1}</span><div><p className="font-medium leading-6 text-ink">{answer.question_text}</p><p className="mt-1 text-sm text-muted">{answer.answer}</p></div><p className="font-semibold text-navy">{Number(answer.score)}/10</p></div>)}</div></section><AdminReviewForm submissionId={submission.id} currentStatus={submission.status} /></div></main>;
}
