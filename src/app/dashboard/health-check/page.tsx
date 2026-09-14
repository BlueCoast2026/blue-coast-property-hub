import { ClipboardCheck } from "lucide-react";
import { PageContainer } from "@/components/layout/page-container";
import { HealthCheckFlow } from "@/components/health-check/health-check-flow";
import { requireUser } from "@/lib/auth/permissions";
import { getLanguage } from "@/lib/i18n-server";
import { mergeQuestions, type ContentRow } from "@/lib/assessments/content";

export const metadata = { title: "Property Health Check" };

export default async function HealthCheckPage({ searchParams }: { searchParams: Promise<{ property?: string }> }) {
  const { property } = await searchParams;
  const { supabase, user } = await requireUser();
  const [{ data: properties }, { data: content }, language] = await Promise.all([
    supabase.from("properties").select("id, address_line_1, suburb, state, postcode").eq("owner_id", user.id).order("created_at"),
    supabase.from("assessment_question_content").select("assessment_type, question_key, category_en, category_zh, question_en, question_zh, option_labels_en, option_labels_zh").eq("assessment_type", "health_check"),
    getLanguage(),
  ]);
  const questions = mergeQuestions("health_check", language, (content ?? []) as ContentRow[]);
  return <PageContainer><header className="mb-8 border-b border-line pb-8"><span className="grid size-12 place-items-center rounded-xl bg-sky text-coastal"><ClipboardCheck className="size-5" /></span><p className="mt-6 text-sm font-semibold uppercase tracking-[0.18em] text-coastal">{language === "zh" ? "物业健康检查" : "Property Health Check"}</p><h1 className="mt-3 font-display text-4xl font-medium text-navy sm:text-5xl">{language === "zh" ? "您的物业管理表现如何？" : "How is your property management performing?"}</h1><p className="mt-4 max-w-2xl text-base leading-7 text-muted">{language === "zh" ? "回答十个针对性问题，找出值得与物业专业人士进一步讨论的事项。" : "Answer ten focused questions to highlight areas that may be worth discussing with a property professional."}</p></header><HealthCheckFlow properties={properties ?? []} initialPropertyId={property} questions={questions} language={language} /></PageContainer>;
}
