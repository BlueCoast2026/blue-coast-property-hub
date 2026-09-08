"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/permissions";
import { readyToRentQuestions, type ReadinessValue } from "@/lib/ready-to-rent/questions";

export type ReadyToRentState = { error?: string };

export async function submitReadyToRent(_state: ReadyToRentState, formData: FormData): Promise<ReadyToRentState> {
  const propertyId = String(formData.get("propertyId") ?? "");
  if (!propertyId) return { error: "Please select a property before submitting." };
  let submittedAnswers: Record<string, ReadinessValue> = {};
  try {
    const parsed: unknown = JSON.parse(String(formData.get("answers") ?? "{}"));
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("Invalid answers");
    submittedAnswers = parsed as Record<string, ReadinessValue>;
  } catch { return { error: "The answers could not be read. Please refresh and try again." }; }
  const missing = readyToRentQuestions.filter((question) => !question.options.some((option) => option.value === submittedAnswers[question.key]));
  if (missing.length) return { error: `Please answer all 10 questions before submitting. Missing: ${missing.map((question) => question.category).join(", ")}.` };

  const payload = readyToRentQuestions.map((question) => ({
    question_key: question.key,
    question_text: question.text,
    answer_code: submittedAnswers[question.key],
    answer: question.options.find((option) => option.value === submittedAnswers[question.key])!.label,
  }));
  const { supabase } = await requireUser();
  const { data, error } = await supabase.rpc("submit_ready_to_rent", {
    p_property_id: propertyId,
    p_answers: payload,
  });
  if (error || !data?.[0]?.submission_id) {
    return { error: "Your checklist was not submitted. No partial result was saved—please try again." };
  }
  redirect(`/dashboard/ready-to-rent/result/${data[0].submission_id}`);
}
