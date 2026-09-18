"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/permissions";

export type SuburbReportState = { error?: string; success?: string };
const zones = new Set(["Coastal", "Central", "Northern", "Hinterland", "Brisbane City", "Logan", "Ipswich", "South Brisbane"]);
const markets = new Set(["gold_coast", "brisbane"]);

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export async function saveSuburbReport(_state: SuburbReportState, formData: FormData): Promise<SuburbReportState> {
  const name = String(formData.get("name") ?? "").trim();
  const postcode = String(formData.get("postcode") ?? "").trim();
  const zone = String(formData.get("zone") ?? "");
  const market = String(formData.get("market") ?? "");
  const description = String(formData.get("description") ?? "").trim();
  const reportDate = String(formData.get("reportDate") ?? "");
  const published = formData.get("published") === "on";
  const file = formData.get("report");
  const slug = slugify(name);

  if (!name || !slug || !/^\d{4}$/.test(postcode) || !zones.has(zone) || !markets.has(market)) return { error: "Enter a suburb, four-digit postcode, market and valid area." };
  if (!(file instanceof File) || file.size === 0) return { error: "Choose a PDF report to upload." };
  if (file.size > 15 * 1024 * 1024) return { error: "The PDF must be 15 MB or smaller." };
  const bytes = Buffer.from(await file.arrayBuffer());
  if (bytes.subarray(0, 5).toString("ascii") !== "%PDF-") return { error: "The selected file is not a valid PDF." };

  const { supabase, user } = await requireAdmin();
  const storagePath = `${market}/${slug}.pdf`;
  const { error: uploadError } = await supabase.storage.from("suburb-reports").upload(storagePath, bytes, { contentType: "application/pdf", upsert: true });
  if (uploadError) return { error: "The PDF could not be uploaded." };

  const { error: databaseError } = await supabase.from("suburb_reports").upsert({
    name, slug, postcode, zone, market, description, storage_path: storagePath, published,
    report_date: /^\d{4}-\d{2}-\d{2}$/.test(reportDate) ? reportDate : null,
    uploaded_by: user.id,
  }, { onConflict: "slug" });
  if (databaseError) return { error: "The PDF uploaded, but its report details could not be saved." };

  revalidatePath("/admin/suburb-reports");
  revalidatePath("/dashboard/market-insights");
  return { success: `${name} report saved${published ? " and published" : " as a draft"}.` };
}

export async function renameSuburbReport(_state: SuburbReportState, formData: FormData): Promise<SuburbReportState> {
  const id = String(formData.get("id") ?? ""), name = String(formData.get("name") ?? "").trim();
  if (!/^[0-9a-f-]{36}$/i.test(id) || name.length < 2 || name.length > 100) return { error: "Enter a valid report name." };
  const { supabase } = await requireAdmin(); const { error } = await supabase.from("suburb_reports").update({ name }).eq("id", id);
  if (error) return { error: "The report could not be renamed." };
  revalidatePath("/admin/suburb-reports"); revalidatePath("/dashboard/market-insights"); return { success: "Report renamed." };
}

export async function reorderSuburbReports(_state: SuburbReportState, formData: FormData): Promise<SuburbReportState> {
  let ids: string[] = [];
  try { const value: unknown = JSON.parse(String(formData.get("orderedIds") ?? "[]")); if (!Array.isArray(value)) throw new Error(); ids = value.map(String); } catch { return { error: "The new report order could not be read." }; }
  if (!ids.length || ids.some((id) => !/^[0-9a-f-]{36}$/i.test(id)) || new Set(ids).size !== ids.length) return { error: "The report order is invalid." };
  const { supabase } = await requireAdmin();
  const results = await Promise.all(ids.map((id, display_order) => { const name = String(formData.get(`name_${id}`) ?? "").trim(); return supabase.from("suburb_reports").update({ display_order, ...(name.length >= 2 && name.length <= 100 ? { name } : {}) }).eq("id", id); }));
  if (results.some((result) => result.error)) return { error: "The report order could not be saved. Confirm migration 016 has been run." };
  revalidatePath("/admin/suburb-reports"); revalidatePath("/dashboard/market-insights");
  return { success: "Report order saved." };
}

export async function deleteSuburbReport(_state: SuburbReportState, formData: FormData): Promise<SuburbReportState> {
  const id = String(formData.get("id") ?? "");
  if (!/^[0-9a-f-]{36}$/i.test(id)) return { error: "Invalid report." };
  const { supabase } = await requireAdmin();
  const { data: report } = await supabase.from("suburb_reports").select("name, storage_path").eq("id", id).single();
  if (!report) return { error: "Report not found." };
  if (report.storage_path) {
    const { error: storageError } = await supabase.storage.from("suburb-reports").remove([report.storage_path]);
    if (storageError) return { error: "The PDF could not be removed, so the report was not deleted." };
  }
  const { error } = await supabase.from("suburb_reports").delete().eq("id", id);
  if (error) return { error: "The report could not be deleted." };
  revalidatePath("/admin/suburb-reports");
  revalidatePath("/dashboard/market-insights");
  return { success: `${report.name} was deleted.` };
}
