import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

type SubmissionNotification = {
  assessmentTitle: string;
  adminPath: string;
  submissionId: string;
  userId: string;
  propertyId: string;
  score: number;
  resultLevel: string;
};

export async function sendAdminSubmissionNotification(notification: SubmissionNotification) {
  const token = process.env.POSTMARK_SERVER_TOKEN;
  if (!token) return { status: "not_configured" as const };

  try {
    const admin = createAdminClient();
    const [{ data: profile }, { data: property }] = await Promise.all([
      admin.from("profiles").select("first_name, last_name, email, phone").eq("id", notification.userId).single(),
      admin.from("properties").select("address_line_1, address_line_2, suburb, state, postcode").eq("id", notification.propertyId).single(),
    ]);
    const name = profile ? `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim() || "Member" : "Member";
    const address = property
      ? [property.address_line_1, property.address_line_2, property.suburb, property.state, property.postcode].filter(Boolean).join(", ")
      : "Property unavailable";
    const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://portal.blue-coast-realty.com.au").replace(/\/$/, "");
    const resultUrl = `${siteUrl}${notification.adminPath}/${notification.submissionId}`;
    const response = await fetch("https://api.postmarkapp.com/email", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "X-Postmark-Server-Token": token,
      },
      body: JSON.stringify({
        From: process.env.POSTMARK_FROM_EMAIL ?? "Blue Coast Realty <no-reply@blue-coast-realty.com.au>",
        To: process.env.ADMIN_NOTIFICATION_EMAIL ?? "Wendy51580@gmail.com",
        ReplyTo: profile?.email ?? undefined,
        Subject: `New ${notification.assessmentTitle} submission — ${address}`,
        TextBody: [
          `A member has submitted a ${notification.assessmentTitle}.`,
          "",
          `Member: ${name}`,
          `Email: ${profile?.email ?? "Not provided"}`,
          `Phone: ${profile?.phone ?? "Not provided"}`,
          `Property: ${address}`,
          `Total score: ${Math.round(notification.score)}/100`,
          `Result: ${notification.resultLevel}`,
          "",
          `Review submission: ${resultUrl}`,
        ].join("\n"),
        MessageStream: "outbound",
      }),
    });
    const body = await response.json() as { ErrorCode?: number };
    return response.ok && body.ErrorCode === 0 ? { status: "sent" as const } : { status: "failed" as const };
  } catch {
    return { status: "failed" as const };
  }
}
