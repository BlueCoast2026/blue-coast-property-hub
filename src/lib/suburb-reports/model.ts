export const REPORT_BUCKET = "suburb-reports";
export const MAX_PDF_BYTES = 15 * 1024 * 1024;
export const markets = [{ value: "gold_coast", label: "Gold Coast" }, { value: "brisbane", label: "Brisbane" }] as const;
export const zones = ["Coastal", "Central", "Northern", "Hinterland", "Brisbane City", "Logan", "Ipswich", "South Brisbane"] as const;
export type Report = { id: string; name: string; slug: string; postcode: string; market: string; zone: string; description: string; storage_path: string | null; published: boolean; report_date: string | null; display_order: number; pdf_url: string | null };
export class ReportError extends Error {
  constructor(message: string, public status = 400) { super(message); }
}
export function isId(value: unknown): value is string {
  return typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}
export function readMetadata(body: Record<string, unknown>) {
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const postcode = typeof body.postcode === "string" ? body.postcode : "";
  const market = typeof body.market === "string" ? body.market : "";
  const zone = typeof body.zone === "string" ? body.zone : "";
  const description = typeof body.description === "string" ? body.description.trim() : "";
  const date = typeof body.report_date === "string" ? body.report_date : "";
  if (name.length < 2 || name.length > 100) throw new ReportError("Enter a suburb name between 2 and 100 characters.");
  if (!/^\d{4}$/.test(postcode)) throw new ReportError("Enter a four-digit postcode.");
  if (!markets.some((item) => item.value === market) || !zones.some((item) => item === zone)) throw new ReportError("Choose a valid market and area.");
  if (description.length > 300) throw new ReportError("The description must be 300 characters or fewer.");
  if (date && (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(Date.parse(date)) || new Date(date).toISOString().slice(0, 10) !== date)) throw new ReportError("Choose a valid report date.");
  if (typeof body.published !== "boolean") throw new ReportError("Choose a valid publication status.");
  return { name, postcode, market, zone, description, report_date: date || null, published: body.published };
}
export function ownedUploadPath(path: unknown, userId: string): path is string {
  if (typeof path !== "string") return false;
  const parts = path.split("/");
  return parts.length === 3 && markets.some((market) => market.value === parts[0]) && parts[1] === userId && isId(parts[2].replace(/\.pdf$/, "")) && parts[2].endsWith(".pdf");
}
export async function validatePdf(file: Blob) {
  if (!file.size || file.size > MAX_PDF_BYTES) throw new ReportError("Choose a PDF that is 15 MB or smaller.");
  if (await file.slice(0, 5).text() !== "%PDF-") throw new ReportError("The selected file is not a valid PDF.");
}
