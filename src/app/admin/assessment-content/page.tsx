import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireAdmin } from "@/lib/auth/permissions";
import { fallbackRows, type AssessmentType, type ContentRow } from "@/lib/assessments/content";
import { healthCheckQuestions } from "@/lib/health-check/questions";
import { readyToRentQuestions } from "@/lib/ready-to-rent/questions";
import { propertyDecisionQuestions } from "@/lib/property-decision/questions";
import { AssessmentQuestionEditor } from "@/components/admin/assessment-question-editor";
export const dynamic = "force-dynamic";
export default async function AssessmentContentPage() {
  const { supabase } = await requireAdmin(); const { data } = await supabase.from("assessment_question_content").select("assessment_type, question_key, category_en, category_zh, question_en, question_zh, option_labels_en, option_labels_zh"); const saved = (data ?? []) as ContentRow[];
  const sections = [{ type: "health_check" as AssessmentType, title: "Property Health Check", questions: healthCheckQuestions }, { type: "ready_to_rent" as AssessmentType, title: "Ready to Rent", questions: readyToRentQuestions }, {type:"property_decision" as AssessmentType,title:"Property Decision Check",questions:propertyDecisionQuestions}];
  return <main className="min-h-screen bg-mist px-5 py-10 sm:px-8 lg:px-12"><div className="mx-auto max-w-6xl"><Link href="/admin" className="inline-flex items-center gap-2 text-sm font-semibold text-muted"><ArrowLeft className="size-4" />Admin dashboard</Link><header className="mt-8 border-b border-line pb-8"><p className="text-sm font-semibold uppercase tracking-[0.18em] text-coastal">Assessment Content CMS</p><h1 className="mt-3 font-display text-4xl font-medium text-navy">Questions & answers</h1><p className="mt-3 max-w-3xl text-muted">Edit English and Chinese wording. Answer codes and score values remain locked, so result calculations do not change.</p></header>{sections.map((section) => { const defaults = fallbackRows(section.type); return <section key={section.type} className="mt-10"><h2 className="mb-5 font-display text-3xl text-navy">{section.title}</h2><div className="grid gap-5">{defaults.map((fallback, index) => { const row = saved.find((item) => item.assessment_type === section.type && item.question_key === fallback.question_key) ?? fallback; return <AssessmentQuestionEditor key={row.question_key} row={row} number={index + 1} scores={section.questions[index].options.map((option) => option.score)} />; })}</div></section>; })}</div></main>;
}
