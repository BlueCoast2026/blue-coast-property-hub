"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/permissions";
import { healthCheckQuestions, type HealthAnswerValue } from "@/lib/health-check/questions";

export type PropertyState = { error?: string; success?: string };
export type HealthCheckState = { error?: string };

export async function addBasicProperty(_state: PropertyState, formData: FormData): Promise<PropertyState> {
  const address = String(formData.get("address") ?? "").trim();
  const suburb = String(formData.get("suburb") ?? "").trim();
  const state = String(formData.get("state") ?? "QLD").trim().toUpperCase();
  const postcode = String(formData.get("postcode") ?? "").trim();
  if (!address || !suburb || !state || !/^\d{4}$/.test(postcode)) {
    return { error: "Enter an address, suburb, state and a valid 4-digit postcode." };
  }

  const { supabase, user } = await requireUser();
  const { error } = await supabase.from("properties").insert({
    owner_id: user.id,
    address_line_1: address,
    suburb,
    state,
    postcode,
    management_status: "unknown",
  });
  if (error) return { error: "We could not add this property. Please try again." };
  revalidatePath("/dashboard/health-check");
  revalidatePath("/dashboard/ready-to-rent");
  revalidatePath("/dashboard/property");
  return { success: "Property added. You can now begin the assessment." };
}

export async function deleteProperty(_state: PropertyState, formData: FormData): Promise<PropertyState> {
  const propertyId = String(formData.get("propertyId") ?? "");
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(propertyId)) {
    return { error: "A valid property is required." };
  }

  const { supabase, user } = await requireUser();
  const { data, error } = await supabase
    .from("properties")
    .delete()
    .eq("id", propertyId)
    .eq("owner_id", user.id)
    .select("id")
    .maybeSingle();
  if (error || !data) return { error: "The property could not be deleted or does not belong to your account." };

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/health-check");
  revalidatePath("/dashboard/ready-to-rent");
  revalidatePath("/dashboard/property");
  return { success: "Property deleted." };
}

export async function submitHealthCheck(_state: HealthCheckState, formData: FormData): Promise<HealthCheckState> {
  const propertyId = String(formData.get("propertyId") ?? "");
  const submittedAnswers = Object.fromEntries(healthCheckQuestions.map((question) => [question.key, String(formData.get(`answer_${question.key}`) ?? "")])) as Record<string, HealthAnswerValue>;
  if (!propertyId || healthCheckQuestions.some((question) => !question.options.some((option) => option.value === submittedAnswers[question.key]))) {
    return { error: "Please answer all 10 questions before submitting." };
  }

  const payload = healthCheckQuestions.map((question) => ({
    question_key: question.key,
    question_text: question.text,
    answer_code: submittedAnswers[question.key],
    answer: question.options.find((option) => option.value === submittedAnswers[question.key])!.label,
  }));
  const { supabase } = await requireUser();
  const { data, error } = await supabase.rpc("submit_health_check", {
    p_property_id: propertyId,
    p_answers: payload,
  });
  if (error || !data?.[0]?.submission_id) {
    return { error: "Your assessment was not submitted. No partial result was saved—please try again." };
  }
  redirect(`/dashboard/health-check/result/${data[0].submission_id}`);
}
