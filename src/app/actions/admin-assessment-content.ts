"use server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/permissions";
import { fallbackRows, type AssessmentType } from "@/lib/assessments/content";
export type AssessmentContentState = { error?: string; success?: string };
export async function updateAssessmentQuestion(_state: AssessmentContentState, formData: FormData): Promise<AssessmentContentState> {
  const assessmentType = String(formData.get("assessmentType")) as AssessmentType;
  const questionKey = String(formData.get("questionKey"));
  if (!fallbackRows(assessmentType).some((row) => row.question_key === questionKey)) return { error: "Invalid assessment question." };
  const field = (name: string, max = 500) => String(formData.get(name) ?? "").trim().slice(0, max);
  const option_labels_en = [0, 1, 2, 3].map((index) => field(`optionEn${index}`, 240));
  const option_labels_zh = [0, 1, 2, 3].map((index) => field(`optionZh${index}`, 240));
  const row = { assessment_type: assessmentType, question_key: questionKey, category_en: field("categoryEn", 120), category_zh: field("categoryZh", 120), question_en: field("questionEn"), question_zh: field("questionZh"), option_labels_en, option_labels_zh };
  if (Object.values(row).some((value) => typeof value === "string" && !value) || [...option_labels_en, ...option_labels_zh].some((value) => !value)) return { error: "Complete every English and Chinese field." };
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("assessment_question_content").upsert(row, { onConflict: "assessment_type,question_key" });
  if (error) return { error: "Could not save the question. Confirm migration 013 has been run." };
  revalidatePath("/admin/assessment-content"); revalidatePath("/dashboard/health-check"); revalidatePath("/dashboard/ready-to-rent");
  return { success: "Question wording updated. Scoring values were not changed." };
}
