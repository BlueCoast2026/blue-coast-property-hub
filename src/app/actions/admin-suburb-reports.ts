"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/permissions";

export type SuburbReportState = { error?: string; success?: string };
const zones = new Set(["Coastal", "Central", "Northern", "Hinterland"]);

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export async function saveSuburbReport(_state: SuburbReportState, formData: FormData): Promise<SuburbReportState> {
  const name = String(formData.get("name") ?? "").trim();
  const postcode = String(formData.get("postcode") ?? "").trim();
  const zone = String(formData.get("zone") ?? "");
  const description = String(formData.get("description") ?? "").trim();
  const reportDate = String(formData.get("reportDate") ?? "");
  const published = formData.get("published") === "on";
  const file = formData.get("report");
  const slug = slugify(name);

  if (!name || !slug || !/^\d{4}$/.test(postcode) || !zones.has(zone)) return { error: "Enter a suburb, four-digit postcode and valid area." };
  if (!(file instanceof File) || file.size === 0) return { error: "Choose a PDF report to upload." };
  if (file.size > 15 * 1024 * 1024) return { error: "The PDF must be 15 MB or smaller." };
  const bytes = Buffer.from(await file.arrayBuffer());
  if (bytes.subarray(0, 5).toString("ascii") !== "%PDF-") return { error: "The selected file is not a valid PDF." };

  const { supabase, user } = await requireAdmin();
  const storagePath = `${slug}.pdf`;
  const { error: uploadError } = await supabase.storage.from("suburb-reports").upload(storagePath, bytes, { contentType: "application/pdf", upsert: true });
  if (uploadError) return { error: "The PDF could not be uploaded." };

  const { error: databaseError } = await supabase.from("suburb_reports").upsert({
    name, slug, postcode, zone, description, storage_path: storagePath, published,
    report_date: /^\d{4}-\d{2}-\d{2}$/.test(reportDate) ? reportDate : null,
    uploaded_by: user.id,
  }, { onConflict: "slug" });
  if (databaseError) return { error: "The PDF uploaded, but its report details could not be saved." };

  revalidatePath("/admin/suburb-reports");
  revalidatePath("/dashboard/market-insights");
  return { success: `${name} report saved${published ? " and published" : " as a draft"}.` };
}
