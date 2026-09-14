import { KeyRound } from "lucide-react";
import { PageContainer } from "@/components/layout/page-container";
import { ReadyToRentFlow } from "@/components/ready-to-rent/ready-to-rent-flow";
import { requireUser } from "@/lib/auth/permissions";
import { getLanguage } from "@/lib/i18n-server";
import { mergeQuestions, type ContentRow } from "@/lib/assessments/content";

export const metadata = { title: "Ready to Rent" };

export default async function ReadyToRentPage({ searchParams }: { searchParams: Promise<{ property?: string }> }) {
  const { property } = await searchParams;
  const { supabase, user } = await requireUser();
  const [{ data: properties }, { data: content }, language] = await Promise.all([
    supabase.from("properties").select("id, address_line_1, suburb, state, postcode").eq("owner_id", user.id).order("created_at"),
    supabase.from("assessment_question_content").select("assessment_type, question_key, category_en, category_zh, question_en, question_zh, option_labels_en, option_labels_zh").eq("assessment_type", "ready_to_rent"),
    getLanguage(),
  ]);
  const questions = mergeQuestions("ready_to_rent", language, (content ?? []) as ContentRow[]);
  return <PageContainer><header className="mb-8 border-b border-line pb-8"><span className="grid size-12 place-items-center rounded-xl bg-sky text-coastal"><KeyRound className="size-5" /></span><p className="mt-6 text-sm font-semibold uppercase tracking-[0.18em] text-coastal">{language === "zh" ? "出租准备检查" : "Ready to Rent"}</p><h1 className="mt-3 font-display text-4xl font-medium text-navy sm:text-5xl">{language === "zh" ? "您的物业准备好进入租赁市场了吗？" : "Is your property ready for the rental market?"}</h1><p className="mt-4 max-w-2xl text-base leading-7 text-muted">{language === "zh" ? "检查十个实用领域，找出新租约开始前可能需要处理的事项。" : "Review ten practical areas to identify items that may need attention before a new tenancy begins."}</p></header><ReadyToRentFlow properties={properties ?? []} initialPropertyId={property} questions={questions} language={language} /></PageContainer>;
}
