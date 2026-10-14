import { randomUUID } from "node:crypto";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { isId, MAX_PDF_BYTES, markets, ownedUploadPath, readMetadata, REPORT_BUCKET, ReportError, validatePdf } from "@/lib/suburb-reports/model";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const columns = "id,name,slug,postcode,market,zone,description,storage_path,published,report_date,display_order";

function json(body: unknown, status = 200) { return Response.json(body, { status, headers: { "Cache-Control": "no-store" } }); }
function check(error: { message: string; code?: string } | null, stage: string) {
  if (!error) return;
  console.error(`[suburb-reports] ${stage}`, { code: error.code, message: error.message });
  if (/row.level security|permission denied|unauthorized|not authorized/i.test(error.message)) throw new ReportError("Supabase denied this operation. Check the admin profile role and the suburb_reports / suburb-reports access policies.", 403);
  if (/bucket.*not found/i.test(error.message)) throw new ReportError("The suburb-reports Storage bucket is missing. Apply database migration 008.", 503);
  if (["42703", "42P01", "PGRST204", "PGRST205"].includes(error.code ?? "")) throw new ReportError("The report database setup is incomplete. Check migrations 008, 010 and 016.", 503);
  if (error.code === "23505") throw new ReportError("A report with this reference already exists. Reload the list before retrying.", 409);
  throw new ReportError(`${stage} failed. Please retry; if it continues, check the Supabase service and permissions.`, 502);
}
async function authorize() {
  if (!hasSupabaseEnv()) throw new ReportError("Supabase is not configured on this deployment.", 503);
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new ReportError("Your session has expired. Sign in again to manage reports.", 401);
  const { data: profile, error: profileError } = await supabase.from("profiles").select("role").eq("id", data.user.id).maybeSingle();
  check(profileError, "Read administrator profile");
  if (profile?.role !== "admin") throw new ReportError("Your account does not have administrator access in profiles.role.", 403);
  return { supabase, user: data.user };
}
async function bodyOf(request: Request): Promise<Record<string, unknown>> {
  if (request.headers.get("origin") !== new URL(request.url).origin) throw new ReportError("This request came from a different site. Reload this page and retry.", 403);
  if (!request.headers.get("content-type")?.includes("application/json")) throw new ReportError("Expected a JSON request.");
  const text = await request.text();
  if (text.length > 65536) throw new ReportError("The request is too large.", 413);
  let body: unknown;
  try { body = JSON.parse(text); } catch { throw new ReportError("The request could not be read."); }
  if (!body || typeof body !== "object" || Array.isArray(body)) throw new ReportError("Invalid request.");
  return body as Record<string, unknown>;
}
async function run(operation: () => Promise<Response>) {
  try { return await operation(); } catch (error) {
    if (error instanceof ReportError) return json({ error: error.message }, error.status);
    const reference = randomUUID();
    console.error(`[suburb-reports] ${reference}`, error);
    return json({ error: `The report service could not complete this request. Reference: ${reference}` }, 500);
  }
}
export async function GET() {
  return run(async () => {
    const { supabase } = await authorize();
    const { data, error } = await supabase.from("suburb_reports").select(columns).order("market").order("display_order").order("name");
    check(error, "Load reports");
    const reports = (data ?? []).map((report) => ({ ...report, pdf_url: report.storage_path ? supabase.storage.from(REPORT_BUCKET).getPublicUrl(report.storage_path).data.publicUrl : null }));
    return json({ reports });
  });
}
export async function POST(request: Request) {
  return run(async () => {
    const body = await bodyOf(request);
    const { supabase, user } = await authorize();
    if (body.action === "prepare-upload") {
      if (!markets.some((market) => market.value === body.market)) throw new ReportError("Choose a valid market.");
      if (typeof body.size !== "number" || body.size <= 0 || body.size > MAX_PDF_BYTES) throw new ReportError("Choose a PDF that is 15 MB or smaller.");
      const path = `${body.market}/${user.id}/${randomUUID()}.pdf`;
      const { data, error } = await supabase.storage.from(REPORT_BUCKET).createSignedUploadUrl(path, { upsert: false });
      check(error, "Prepare PDF upload");
      if (!data) throw new ReportError("The upload could not be prepared.", 502);
      return json({ path: data.path, token: data.token });
    }
    if (body.action === "discard-upload") {
      if (!ownedUploadPath(body.path, user.id)) throw new ReportError("Invalid upload reference.");
      const { count, error } = await supabase.from("suburb_reports").select("id", { count: "exact", head: true }).eq("storage_path", body.path);
      check(error, "Check upload usage");
      if (count !== 0) throw new ReportError("This PDF is already attached to a report.", 409);
      const { error: removeError } = await supabase.storage.from(REPORT_BUCKET).remove([body.path]);
      check(removeError, "Discard unfinished upload");
      return json({ success: true });
    }
    if (body.action !== "save") throw new ReportError("Unknown report operation.");
    const metadata = readMetadata(body);
    if (body.id && !isId(body.id)) throw new ReportError("Invalid report reference.");
    let existing: { storage_path: string | null } | null = null;
    if (body.id) {
      const { data, error } = await supabase.from("suburb_reports").select("storage_path").eq("id", body.id).maybeSingle();
      check(error, "Load existing report");
      if (!data) throw new ReportError("This report no longer exists. Reload the list.", 404);
      existing = data;
    }
    const path = body.path;
    if (path) {
      if (!ownedUploadPath(path, user.id) || !path.startsWith(`${metadata.market}/`)) throw new ReportError("Invalid upload reference.");
      const { data: linked, error: linkedError } = await supabase.from("suburb_reports").select("id").eq("storage_path", path).maybeSingle();
      check(linkedError, "Check uploaded PDF reference");
      if (linked && !body.id) return json({ success: true, id: linked.id });
      if (linked && linked.id !== body.id) throw new ReportError("This PDF is already attached to another report.", 409);
      const { data: pdf, error } = await supabase.storage.from(REPORT_BUCKET).download(path);
      check(error, "Verify uploaded PDF");
      if (!pdf) throw new ReportError("The uploaded PDF could not be verified.", 502);
      await validatePdf(pdf);
    } else if (!existing) throw new ReportError("Upload a PDF before creating a report.");
    if (metadata.published && !path && !existing?.storage_path) throw new ReportError("Upload a PDF before publishing this report.");
    const values = { ...metadata, ...(path ? { storage_path: path, uploaded_by: user.id } : {}) };
    const result = body.id
      ? await supabase.from("suburb_reports").update(values).eq("id", body.id).select("id").maybeSingle()
      : await supabase.from("suburb_reports").insert({ ...values, slug: `${metadata.market.replace(/_/g, "-")}-${metadata.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "report"}-${randomUUID().slice(0, 8)}` }).select("id").single();
    check(result.error, "Save report details");
    if (!result.data) throw new ReportError("No report was saved. Check the report update policy.", 403);
    // Replacement uses a fresh object; previous PDFs remain available and intact.
    return json({ success: true, id: result.data.id });
  });
}
export async function PATCH(request: Request) {
  return run(async () => {
    const body = await bodyOf(request);
    const { supabase } = await authorize();
    if (!markets.some((market) => market.value === body.market) || !Array.isArray(body.ids) || !body.ids.length || body.ids.length > 500 || body.ids.some((id) => !isId(id)) || new Set(body.ids).size !== body.ids.length) throw new ReportError("Invalid report order.");
    const { data, error } = await supabase.from("suburb_reports").select("id").eq("market", body.market);
    check(error, "Load report order");
    const ids = body.ids as string[];
    if (data?.length !== ids.length || data.some((report) => !ids.includes(report.id))) throw new ReportError("The list changed. Reload it before saving the order.", 409);
    for (const [display_order, id] of ids.entries()) {
      const result = await supabase.from("suburb_reports").update({ display_order }, { count: "exact" }).eq("id", id).eq("market", body.market);
      check(result.error, "Save report order (some positions may already have been saved)");
      if (result.count !== 1) throw new ReportError("The order was not fully saved. Reload the list and check the update policy.", 409);
    }
    return json({ success: true });
  });
}
export async function DELETE(request: Request) {
  return run(async () => {
    const body = await bodyOf(request);
    const { supabase } = await authorize();
    if (!isId(body.id)) throw new ReportError("Invalid report reference.");
    const { data: report, error } = await supabase.from("suburb_reports").select("storage_path").eq("id", body.id).maybeSingle();
    check(error, "Load report for deletion");
    if (!report) throw new ReportError("This report no longer exists. Reload the list.", 404);
    // Remove the record first: a storage error must never leave a published row pointing to a deleted file.
    const result = await supabase.from("suburb_reports").delete({ count: "exact" }).eq("id", body.id);
    check(result.error, "Delete report");
    if (result.count !== 1) throw new ReportError("No report was deleted. Check the report delete policy.", 403);
    let warning: string | undefined;
    if (report.storage_path) {
      const { count, error: usageError } = await supabase.from("suburb_reports").select("id", { count: "exact", head: true }).eq("storage_path", report.storage_path);
      if (usageError || count === null) warning = "Report deleted. Its PDF was kept because its usage could not be checked.";
      else if (count === 0) {
        const { error: storageError } = await supabase.storage.from(REPORT_BUCKET).remove([report.storage_path]);
        if (storageError) { console.error("[suburb-reports] PDF cleanup", storageError); warning = "Report deleted, but its PDF could not be removed from Storage. Ask an administrator to check the Storage delete policy."; }
      }
    }
    return json({ success: true, warning });
  });
}
