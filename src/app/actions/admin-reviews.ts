"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/auth/permissions";
import { createAdminClient } from "@/lib/supabase/admin";

export type ReviewState = { error?: string; success?: string };
export type SubmissionType = "health_check" | "ready_to_rent" | "property_decision";

const reviewStatuses = new Set(["new", "under_review", "reviewed", "report_sent", "closed"]);
const tableByType = {
  health_check: "health_check_submissions",
  ready_to_rent: "ready_to_rent_submissions",
  property_decision: "property_decision_submissions",
} as const;
const titleByType: Record<SubmissionType, string> = {
  health_check: "Property Health Check",
  ready_to_rent: "Ready to Rent",
  property_decision: "Property Decision Check",
};

export async function saveAssessmentReview(_state: ReviewState, formData: FormData): Promise<ReviewState> {
  const submissionId = String(formData.get("submissionId") ?? "");
  const submissionType = String(formData.get("submissionType") ?? "") as SubmissionType;
  const status = String(formData.get("status") ?? "");
  const note = String(formData.get("note") ?? "").trim();
  const attachment = formData.get("attachment");

  if (!/^[0-9a-f-]{36}$/i.test(submissionId) || !(submissionType in tableByType) || !reviewStatuses.has(status)) {
    return { error: "Choose a valid submission and review status." };
  }
  if (note.length > 2000) return { error: "Feedback must be 2,000 characters or fewer." };
  if (attachment instanceof File && attachment.size > 0) {
    if (attachment.type !== "application/pdf" && !attachment.name.toLowerCase().endsWith(".pdf")) return { error: "The attachment must be a PDF." };
    if (attachment.size > 10 * 1024 * 1024) return { error: "The PDF must be 10 MB or smaller." };
  }

  const { supabase, user } = await requireStaff();
  const table = tableByType[submissionType];
  const { data: existing } = await supabase.from(table).select("id, user_id, property_id").eq("id", submissionId).single();
  if (!existing) return { error: "Submission not found or access denied." };

  const reviewed = ["reviewed", "report_sent", "closed"].includes(status);
  const { error: statusError } = await supabase.from(table).update({
    status,
    reviewed_by: user.id,
    ...(reviewed ? { reviewed_at: new Date().toISOString() } : {}),
    ...(status === "report_sent" ? { report_sent_at: new Date().toISOString() } : {}),
  }).eq("id", submissionId);
  if (statusError) return { error: "The review status could not be saved." };

  if (note) {
    const { error } = await supabase.from("admin_notes").insert({ submission_type: submissionType, submission_id: submissionId, author_id: user.id, note });
    if (error) return { error: "The status was saved, but the feedback could not be added." };
  }

  if (attachment instanceof File && attachment.size > 0) {
    try {
      const admin = createAdminClient();
      const safeName = attachment.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-120) || "review.pdf";
      const storagePath = `${submissionType}/${submissionId}/${randomUUID()}-${safeName}`;
      const bytes = new Uint8Array(await attachment.arrayBuffer());
      const { error: uploadError } = await admin.storage.from("review-attachments").upload(storagePath, bytes, { contentType: "application/pdf", upsert: false });
      if (uploadError) return { error: "The review was saved, but the PDF could not be uploaded. Confirm migration 009 has been run." };
      const { error: recordError } = await admin.from("review_attachments").insert({ submission_type: submissionType, submission_id: submissionId, storage_path: storagePath, file_name: safeName, uploaded_by: user.id });
      if (recordError) {
        await admin.storage.from("review-attachments").remove([storagePath]);
        return { error: "The review was saved, but the PDF attachment could not be recorded." };
      }
    } catch {
      return { error: "The review was saved, but server PDF storage is not configured." };
    }
  }

  const memberPath = submissionType === "health_check" ? "health-check" : submissionType === "ready_to_rent" ? "ready-to-rent" : "property-decision";
  revalidatePath("/admin");
  revalidatePath(`/admin/${memberPath}/${submissionId}`);
  revalidatePath(`/dashboard/${memberPath}/result/${submissionId}`);

  const token = process.env.POSTMARK_SERVER_TOKEN;
  if (!token) return { success: "Review saved. Email was not sent because Postmark is not configured yet." };
  const [{ data: member }, { data: property }] = await Promise.all([
    supabase.from("profiles").select("first_name, last_name, email").eq("id", existing.user_id).single(),
    supabase.from("properties").select("address_line_1, suburb, state, postcode").eq("id", existing.property_id).single(),
  ]);
  if (!member?.email) return { success: "Review saved. The member does not have an email address for notification." };
  const memberName = `${member.first_name ?? ""} ${member.last_name ?? ""}`.trim() || "Member";
  const address = property ? [property.address_line_1, property.suburb, property.state, property.postcode].filter(Boolean).join(", ") : "your property";
  const resultUrl = `${(process.env.NEXT_PUBLIC_SITE_URL ?? "https://portal.blue-coast-realty.com.au").replace(/\/$/, "")}/dashboard/${memberPath}/result/${submissionId}`;
  try {
    const response = await fetch("https://api.postmarkapp.com/email", {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json", "X-Postmark-Server-Token": token },
      body: JSON.stringify({
        From: process.env.POSTMARK_FROM_EMAIL ?? "Blue Coast Realty <no-reply@blue-coast-realty.com.au>",
        To: member.email,
        ReplyTo: "admin@bluecoastrealty.com.au",
        Subject: `Your ${titleByType[submissionType]} has been reviewed`,
        TextBody: [`Hi ${memberName},`, "", `Blue Coast Realty has updated your ${titleByType[submissionType]} for ${address}.`, `Review status: ${status.replaceAll("_", " ")}.`, note ? `Feedback: ${note}` : "", attachment instanceof File && attachment.size > 0 ? "A PDF document has also been added to your result." : "", "", `View your result: ${resultUrl}`].filter(Boolean).join("\n"),
        MessageStream: "outbound",
      }),
    });
    const body = await response.json() as { ErrorCode?: number };
    if (!response.ok || body.ErrorCode !== 0) return { success: "Review saved, but Postmark did not send the email. You can retry Save review after Postmark is ready." };
  } catch {
    return { success: "Review saved, but the notification email could not be sent. You can retry later." };
  }
  return { success: "Review saved and the member notification email was sent successfully." };
}
