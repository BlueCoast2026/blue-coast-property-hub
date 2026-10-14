"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowDown, ArrowUp, FileText, LoaderCircle, Pencil, RefreshCw, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { markets, REPORT_BUCKET, validatePdf, zones, type Report } from "@/lib/suburb-reports/model";

const endpoint = "/api/admin/suburb-reports";
const inputStyle = "mt-2 w-full rounded-xl border border-line bg-white px-4 py-3 text-sm outline-none focus:border-coastal";
type ApiResult = { reports?: Report[]; path?: string; token?: string; warning?: string };
async function request(method: string, body?: unknown): Promise<ApiResult> {
  const response = await fetch(endpoint, { method, credentials: "same-origin", cache: "no-store", headers: body ? { "Content-Type": "application/json" } : undefined, body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(60000) });
  const text = await response.text();
  let result: ApiResult & { error?: string };
  try { result = JSON.parse(text); } catch {
    throw new Error(response.status === 413 ? "The request was too large. PDFs must upload directly to Supabase. Please reload this page." : `The report service returned an unexpected response (HTTP ${response.status}). Please reload and try again.`);
  }
  if (!response.ok) throw new Error(result.error ?? `The request failed (HTTP ${response.status}).`);
  return result;
}
function message(error: unknown) { return error instanceof Error ? error.message : "The request failed. Please try again."; }

export function SuburbReportManager() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [editing, setEditing] = useState<Report | null>(null);
  const [market, setMarket] = useState("gold_coast");
  const formRef = useRef<HTMLFormElement>(null);
  const locked = useRef(false);
  const reload = useCallback(async () => {
    const result = await request("GET");
    if (!Array.isArray(result.reports)) throw new Error("The report list could not be read.");
    setReports(result.reports);
    setLoaded(true);
  }, []);
  useEffect(() => {
    let active = true;
    request("GET").then((result) => {
      if (!Array.isArray(result.reports)) throw new Error("The report list could not be read.");
      if (active) { setReports(result.reports); setLoaded(true); }
    }).catch((reason) => { if (active) setError(message(reason)); });
    return () => { active = false; };
  }, []);

  async function perform(label: string, operation: () => Promise<void>) {
    if (locked.current) return;
    locked.current = true;
    setBusy(label); setError(""); setNotice("");
    try { await operation(); } catch (reason) { setError(message(reason)); }
    finally { locked.current = false; setBusy(null); }
  }
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const file = data.get("pdf");
    const selectedId = editing?.id;
    await perform("Preparing report…", async () => {
      let uploadedPath: string | undefined;
      let committed = false;
      let saveStarted = false;
      try {
        if (file instanceof File && file.size > 0) {
          await validatePdf(file);
          const prepared = await request("POST", { action: "prepare-upload", market: data.get("market"), size: file.size });
          if (!prepared.path || !prepared.token) throw new Error("The upload reference could not be read.");
          uploadedPath = prepared.path;
          setBusy("Uploading PDF to Supabase…");
          const { error: uploadError } = await createClient().storage.from(REPORT_BUCKET).uploadToSignedUrl(prepared.path, prepared.token, file, { contentType: "application/pdf" });
          if (uploadError) throw new Error(`PDF upload failed: ${uploadError.message}`);
        } else if (!selectedId) throw new Error("Choose a PDF to upload.");
        setBusy("Saving report details…");
        saveStarted = true;
        await request("POST", { action: "save", id: selectedId, path: uploadedPath, name: data.get("name"), postcode: data.get("postcode"), market: data.get("market"), zone: data.get("zone"), description: data.get("description"), report_date: data.get("report_date"), published: data.get("published") === "on" });
        committed = true;
        setEditing(null); form.reset(); setMarket("gold_coast");
        setNotice(selectedId ? "Report updated." : "Report uploaded and saved.");
        try { await reload(); } catch { throw new Error("The report was saved, but the list could not refresh. Select Reload reports; do not upload it again."); }
      } catch (reason) {
        if (uploadedPath && !committed && !saveStarted) {
          // After saving begins, keep the PDF if the response is lost or times out.
          try { await request("POST", { action: "discard-upload", path: uploadedPath }); } catch { /* Preserve the original error. */ }
        }
        throw reason;
      }
    });
  }
  function edit(report: Report) {
    setEditing(report); setMarket(report.market); setError(""); setNotice("");
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  async function remove(report: Report) {
    if (!window.confirm(`Delete ${report.name} and its current PDF? This cannot be undone.`)) return;
    await perform(`Deleting ${report.name}…`, async () => {
      const result = await request("DELETE", { id: report.id });
      setReports((current) => current.filter((item) => item.id !== report.id));
      if (editing?.id === report.id) { setEditing(null); setMarket("gold_coast"); }
      setNotice(result.warning ?? `${report.name} deleted.`);
    });
  }
  function move(id: string, direction: number) {
    const group = reports.filter((report) => report.market === market);
    const from = group.findIndex((report) => report.id === id), to = from + direction;
    if (from < 0 || to < 0 || to >= group.length) return;
    [group[from], group[to]] = [group[to], group[from]];
    setReports((current) => [...current.filter((report) => report.market !== market), ...group]);
    setNotice("Order changed. Select Save order to keep it.");
  }
  const filtered = reports.filter((report) => report.market === market);
  return <div className="mt-8 space-y-6">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex gap-2">{markets.map((item) => <button key={item.value} type="button" disabled={!!busy || !!editing} onClick={() => setMarket(item.value)} className={`rounded-xl px-4 py-3 text-sm font-semibold ${market === item.value ? "bg-navy text-white" : "border border-line bg-white text-navy"}`}>{item.label}</button>)}</div>
      <button type="button" disabled={!!busy} onClick={() => perform("Loading reports…", reload)} className="inline-flex items-center gap-2 rounded-xl border border-line bg-white px-4 py-3 text-sm font-semibold text-navy"><RefreshCw className="size-4" />Reload reports</button>
    </div>
    {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"><p>{error}</p><p className="mt-2">You can retry above, or <Link href="/login" className="font-semibold underline">return to sign in</Link>.</p></div>}
    {notice && <p role="status" className="rounded-xl bg-sky p-4 text-sm text-navy">{notice}</p>}
    {busy && <p role="status" className="flex items-center gap-2 text-sm text-navy"><LoaderCircle className="size-4 animate-spin" />{busy}</p>}
    {!loaded && !error && <p className="text-sm text-muted">Loading reports…</p>}
    <section className="rounded-2xl border border-line bg-white p-6 shadow-card sm:p-8">
      <h2 className="font-display text-2xl text-navy">{editing ? `Edit ${editing.name}` : "Add a suburb report"}</h2>
      <p className="mt-2 text-sm text-muted">{editing ? "Update details or choose a new PDF to replace the current report." : "Add report details and a PDF up to 15 MB."}</p>
      <form key={editing?.id ?? "new"} ref={formRef} onSubmit={save} className="mt-6">
        <fieldset disabled={!!busy || !loaded} className="grid gap-5 sm:grid-cols-2 disabled:opacity-60">
          <label className="text-sm font-medium text-ink">Suburb name<input className={inputStyle} name="name" required minLength={2} maxLength={100} defaultValue={editing?.name} /></label>
          <label className="text-sm font-medium text-ink">Postcode<input className={inputStyle} name="postcode" required inputMode="numeric" pattern="[0-9]{4}" maxLength={4} defaultValue={editing?.postcode} /></label>
          <label className="text-sm font-medium text-ink">Market<select className={inputStyle} name="market" value={market} onChange={(event) => setMarket(event.target.value)}>{markets.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
          <label className="text-sm font-medium text-ink">Area<select className={inputStyle} name="zone" defaultValue={editing?.zone ?? "Coastal"}>{zones.map((zone) => <option key={zone}>{zone}</option>)}</select></label>
          <label className="text-sm font-medium text-ink">Report date<input className={inputStyle} type="date" name="report_date" defaultValue={editing?.report_date ?? ""} /></label>
          <label className="text-sm font-medium text-ink">PDF {editing && "(optional replacement)"}<input className={inputStyle} type="file" name="pdf" accept="application/pdf,.pdf" required={!editing} /></label>
          <label className="text-sm font-medium text-ink sm:col-span-2">Description<textarea className={inputStyle} name="description" rows={3} maxLength={300} defaultValue={editing?.description ?? ""} /></label>
          <label className="flex items-center gap-3 text-sm font-medium text-ink sm:col-span-2"><input type="checkbox" name="published" defaultChecked={editing?.published ?? false} />Publish report</label>
          <div className="flex gap-3 sm:col-span-2"><button type="submit" className="rounded-xl bg-navy px-5 py-3 text-sm font-semibold text-white">{editing ? "Save changes" : "Upload report"}</button>{editing && <button type="button" onClick={() => { setEditing(null); setMarket("gold_coast"); }} className="rounded-xl border border-line px-5 py-3 text-sm font-semibold text-navy">Cancel edit</button>}</div>
        </fieldset>
      </form>
    </section>
    <section className="rounded-2xl border border-line bg-white p-6 shadow-card sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-4"><h2 className="font-display text-2xl text-navy">{markets.find((item) => item.value === market)?.label} reports ({filtered.length})</h2><button type="button" disabled={!!busy || !loaded || !filtered.length} onClick={() => perform("Saving order…", async () => { await request("PATCH", { market, ids: filtered.map((report) => report.id) }); setNotice("Report order saved."); })} className="rounded-xl border border-line px-4 py-2 text-sm font-semibold text-navy disabled:opacity-50">Save order</button></div>
      {loaded && !filtered.length && <p className="mt-5 text-sm text-muted">No reports in this market. Add one above.</p>}
      <div className="mt-5 divide-y divide-line">{filtered.map((report, index) => <article key={report.id} className="flex flex-wrap items-center justify-between gap-4 py-5">
        <div><h3 className="font-semibold text-navy">{report.name} <span className="font-normal text-muted">{report.postcode}</span></h3><p className="mt-1 text-sm text-muted">{report.zone} · {report.report_date || "No date"} · {report.published ? "Published" : "Draft"}{!report.storage_path && " · Awaiting PDF"}</p></div>
        <div className="flex flex-wrap items-center gap-2">
          {report.pdf_url && <a href={report.pdf_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-lg border border-line px-3 py-2 text-xs font-semibold text-navy"><FileText className="size-4" />PDF</a>}
          <button type="button" disabled={!!busy} onClick={() => edit(report)} className="inline-flex items-center gap-1 rounded-lg border border-line px-3 py-2 text-xs font-semibold text-navy"><Pencil className="size-4" />Edit / replace</button>
          <button type="button" disabled={!!busy || index === 0} onClick={() => move(report.id, -1)} aria-label={`Move ${report.name} up`} className="rounded-lg border border-line p-2 disabled:opacity-30"><ArrowUp className="size-4" /></button>
          <button type="button" disabled={!!busy || index === filtered.length - 1} onClick={() => move(report.id, 1)} aria-label={`Move ${report.name} down`} className="rounded-lg border border-line p-2 disabled:opacity-30"><ArrowDown className="size-4" /></button>
          <button type="button" disabled={!!busy} onClick={() => remove(report)} className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-700"><Trash2 className="size-4" />Delete</button>
        </div>
      </article>)}</div>
    </section>
  </div>;
}
