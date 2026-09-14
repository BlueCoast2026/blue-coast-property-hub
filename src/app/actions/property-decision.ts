"use server";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/permissions";
import { propertyDecisionQuestions, type DecisionAnswerValue } from "@/lib/property-decision/questions";
export type DecisionState = { error?: string };
const thoughts = new Set(["sell_soon","sell_6_12_months","curious_value","compare_hold_sell","exploring_only"]);
export async function submitPropertyDecision(_state: DecisionState, formData: FormData): Promise<DecisionState> {
  const propertyId=String(formData.get("propertyId")??""); const currentThinking=String(formData.get("currentThinking")??""); let answers:Record<string,DecisionAnswerValue>={};
  try { const parsed:unknown=JSON.parse(String(formData.get("answers")??"{}")); if(!parsed||typeof parsed!=="object"||Array.isArray(parsed)) throw new Error(); answers=parsed as Record<string,DecisionAnswerValue>; } catch { return {error:"Your answers could not be read. Please refresh and try grading again."}; }
  if(!propertyId) return {error:"Please select a property."}; if(!thoughts.has(currentThinking)) return {error:"Please tell us what best describes your current thinking."};
  if(propertyDecisionQuestions.some(q=>!q.options.some(o=>o.value===answers[q.key]))) return {error:"Please answer all 10 questions before continuing."};
  const payload=propertyDecisionQuestions.map(q=>({question_key:q.key,question_text:q.text,answer_code:answers[q.key],answer:q.options.find(o=>o.value===answers[q.key])!.label}));
  const {supabase}=await requireUser(); const {data,error}=await supabase.rpc("submit_property_decision",{p_property_id:propertyId,p_answers:payload,p_current_thinking:currentThinking});
  if(error||!data?.[0]?.submission_id) return {error:"Your Property Decision Check could not be submitted. Confirm migration 014 has been run."};
  redirect(`/dashboard/property-decision/result/${data[0].submission_id}`);
}
