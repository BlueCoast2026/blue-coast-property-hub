import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/permissions";
import { createAssessmentReport } from "@/lib/pdf/assessment-report";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ type: string; id: string }> }) {
  const { type, id } = await params;
  const config = type === "health-check"
    ? { submission: "health_check_submissions", answers: "health_check_answers", noteType: "health_check", title: "Property Health Check" }
    : type === "ready-to-rent"
      ? { submission: "ready_to_rent_submissions", answers: "ready_to_rent_answers", noteType: "ready_to_rent", title: "Ready to Rent" }
      : null;
  if (!config || !/^[0-9a-f-]{36}$/i.test(id)) return new NextResponse("Not found", { status: 404 });

  const { supabase } = await requireUser();
  const { data: submission } = await supabase.from(config.submission).select("id, user_id, property_id, score, result_level, submitted_at").eq("id", id).single();
  if (!submission) return new NextResponse("Not found", { status: 404 });

  const [{ data: profile }, { data: property }, { data: answers }, { data: feedback }, logo] = await Promise.all([
    supabase.from("profiles").select("first_name, last_name").eq("id", submission.user_id).single(),
    supabase.from("properties").select("address_line_1, address_line_2, suburb, state, postcode").eq("id", submission.property_id).single(),
    supabase.from(config.answers).select("question_text, answer, score, created_at").eq("submission_id", id).order("created_at"),
    supabase.from("admin_notes").select("note, created_at").eq("submission_type", config.noteType).eq("submission_id", id).order("created_at"),
    readFile(path.join(process.cwd(), "public", "brand", "blue-coast-realty-logo.png")),
  ]);
  const address = property ? [property.address_line_1, property.address_line_2, property.suburb, property.state, property.postcode].filter(Boolean).join(", ") : "Property unavailable";
  const memberName = profile ? `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim() || "Member" : "Member";
  const pdf = await createAssessmentReport({
    title: config.title,
    memberName,
    propertyAddress: address,
    score: Number(submission.score),
    result: String(submission.result_level ?? "Completed"),
    submittedAt: new Intl.DateTimeFormat("en-AU", { dateStyle: "long" }).format(new Date(submission.submitted_at)),
    answers: (answers ?? []).map((answer) => ({ question: answer.question_text, answer: answer.answer, score: Number(answer.score) })),
    feedback: (feedback ?? []).map((item) => ({ note: item.note, createdAt: new Intl.DateTimeFormat("en-AU", { dateStyle: "medium" }).format(new Date(item.created_at)) })),
    logoBytes: new Uint8Array(logo),
  });
  const fileName = `${type}-${address.replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || id}.pdf`;
  return new NextResponse(Buffer.from(pdf), { headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="${fileName}"`, "Cache-Control": "private, no-store" } });
}
