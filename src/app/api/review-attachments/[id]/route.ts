import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/permissions";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return new NextResponse("Not found", { status: 404 });
  const { supabase } = await requireUser();
  const { data: attachment } = await supabase.from("review_attachments").select("storage_path, file_name").eq("id", id).single();
  if (!attachment) return new NextResponse("Not found", { status: 404 });
  const admin = createAdminClient();
  const { data, error } = await admin.storage.from("review-attachments").download(attachment.storage_path);
  if (error || !data) return new NextResponse("File unavailable", { status: 404 });
  const safeName = attachment.file_name.replace(/["\r\n]/g, "_");
  return new NextResponse(await data.arrayBuffer(), { headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="${safeName}"`, "Cache-Control": "private, no-store" } });
}
