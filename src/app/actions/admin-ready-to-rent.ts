"use server";

import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/auth/permissions";

export type ReadyToRentReviewState = { error?: string; success?: string };

const reviewStatuses = new Set(["new", "under_review", "reviewed", "report_sent", "closed"]);

export async function reviewReadyToRent(
  _state: ReadyToRentReviewState,
  formData: FormData,
): Promise<ReadyToRentReviewState> {
  const submissionId = String(formData.get("submissionId") ?? "");
  const status = String(formData.get("status") ?? "");
  const note = String(formData.get("note") ?? "").trim();

  if (!submissionId || !reviewStatuses.has(status)) return { error: "Choose a valid review status." };
  if (note.length > 2000) return { error: "Feedback must be 2,000 characters or fewer." };

  const { supabase } = await requireStaff();
  const { error } = await supabase.rpc("review_ready_to_rent", {
    p_submission_id: submissionId,
    p_status: status,
    p_note: note || null,
  });

  if (error) return { error: "The review could not be saved. Please try again." };
  revalidatePath("/admin");
  revalidatePath(`/admin/ready-to-rent/${submissionId}`);
  revalidatePath(`/dashboard/ready-to-rent/result/${submissionId}`);
  return { success: "Review saved. The member can now see the updated status and feedback." };
}
