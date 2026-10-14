import fs from "node:fs";
import vm from "node:vm";
import assert from "node:assert/strict";
import ts from "typescript";
import { createRequire } from "node:module";
const runtimeRequire = createRequire(import.meta.url);
function load(file, overrides = {}) {
  const loadedModule = { exports: {} };
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText, {
    module: loadedModule, exports: loadedModule.exports, require: (name) => overrides[name] || runtimeRequire(name),
    Response, Request, URL, Blob, console: { error() {} },
  });
  return loadedModule.exports;
}
const model = load("src/lib/suburb-reports/model.ts");
const userId = "11111111-1111-4111-8111-111111111111";
const reportId = "22222222-2222-4222-8222-222222222222";
const uploadId = "33333333-3333-4333-8333-333333333333";
const path = `gold_coast/${userId}/${uploadId}.pdf`;
let state;
function reset(database = []) { state = { user: { id: userId }, db: [{ data: { role: "admin" }, error: null }, ...database], calls: [], storage: [], upload: { data: { path, token: "test-token" }, error: null }, pdf: { data: new Blob(["%PDF-1.7\nTest"]), error: null } }; }
const supabase = {
  auth: { getUser: async () => ({ data: { user: state.user }, error: null }) },
  from(table) {
    const call = { table, operation: "select", filters: [] }; state.calls.push(call);
    const builder = {};
    for (const operation of ["select", "update", "insert", "delete"]) builder[operation] = (values) => { if (operation !== "select") { call.operation = operation; call.values = values; } return builder; };
    for (const filter of ["eq", "order"]) builder[filter] = (...args) => { call.filters.push([filter, ...args]); return builder; };
    const result = () => { assert(state.db.length, `Unexpected database call: ${JSON.stringify(call)}`); return state.db.shift(); };
    builder.single = builder.maybeSingle = async () => result();
    builder.then = (resolve, reject) => Promise.resolve(result()).then(resolve, reject);
    return builder;
  },
  storage: { from(bucket) { assert.equal(bucket, "suburb-reports"); return {
    getPublicUrl: (value) => ({ data: { publicUrl: `https://storage.example/${value}` } }),
    createSignedUploadUrl: async (value, options) => { state.storage.push(["sign", value, options]); return state.upload; },
    download: async (value) => { state.storage.push(["download", value]); return state.pdf; },
    remove: async (values) => { state.storage.push(["remove", values]); return state.remove || { error: null }; },
  }; } },
};
const api = load("src/app/api/admin/suburb-reports/route.ts", {
  "@/lib/supabase/server": { createClient: async () => supabase },
  "@/lib/supabase/env": { hasSupabaseEnv: () => true },
  "@/lib/suburb-reports/model": model,
});
const origin = "https://portal.blue-coast-realty.com.au";
const request = (method, body, source = origin) => new Request(`${origin}/api/admin/suburb-reports`, { method, headers: { Origin: source, "Content-Type": "application/json" }, body: JSON.stringify(body) });
const metadata = { action: "save", name: "Southport", postcode: "4215", market: "gold_coast", zone: "Central", description: "Report", report_date: "2026-10-14", published: true };
(async () => {
  await model.validatePdf(new Blob(["%PDF-1.7\nTest"]));
  await assert.rejects(() => model.validatePdf(new Blob(["not a pdf"])), /valid PDF/);
  await assert.rejects(() => model.validatePdf(new Blob([new Uint8Array(model.MAX_PDF_BYTES + 1)])), /15 MB/);
  assert.throws(() => model.readMetadata({ ...metadata, report_date: "2026-02-30" }), /valid report date/);
  assert(!model.ownedUploadPath(`gold_coast/another-user/${uploadId}.pdf`, userId));
  assert(!model.ownedUploadPath(`gold_coast/${userId}/../report.pdf`, userId));
  for (const method of ["GET", "POST", "PATCH", "DELETE"]) {
    reset(); state.user = null;
    const response = method === "GET" ? await api.GET() : await api[method](request(method, { action: "prepare-upload", market: "gold_coast", size: 10 }));
    assert.equal(response.status, 401, method); assert.equal(state.storage.length, 0); assert.equal(state.calls.length, 0);
  }
  reset(); state.db[0] = { data: { role: "member" }, error: null };
  assert.equal((await api.GET()).status, 403); assert.equal(state.calls.length, 1);
  reset(); assert.equal((await api.DELETE(request("DELETE", { id: reportId }, "https://other.example"))).status, 403); assert.equal(state.calls.length, 0);
  reset([{ data: [{ ...metadata, id: reportId, storage_path: "legacy/southport.pdf" }], error: null }]);
  const list = await (await api.GET()).json(); assert.equal(list.reports[0].pdf_url, "https://storage.example/legacy/southport.pdf");
  reset([{ data: null, error: { code: "42703", message: "Missing display_order" } }]);
  assert.equal((await api.GET()).status, 503);
  reset(); assert.equal((await api.POST(request("POST", { action: "prepare-upload", market: "gold_coast", size: 15 * 1024 * 1024 }))).status, 200);
  assert(model.ownedUploadPath(state.storage[0][1], userId)); assert.equal(state.storage[0][2].upsert, false);
  reset(); state.upload = { data: null, error: { message: "new row violates row-level security policy" } };
  assert.equal((await api.POST(request("POST", { action: "prepare-upload", market: "gold_coast", size: 10 }))).status, 403);
  reset([{ data: null, error: null }, { data: { id: reportId }, error: null }]);
  assert.equal((await api.POST(request("POST", { ...metadata, path }))).status, 200);
  assert.equal(state.calls.at(-1).operation, "insert"); assert.equal(state.calls.at(-1).values.storage_path, path);
  assert.equal(state.storage.filter((call) => call[0] === "remove").length, 0);
  reset([{ data: { storage_path: "legacy/southport.pdf" }, error: null }, { data: null, error: null }, { data: { id: reportId }, error: null }]);
  assert.equal((await api.POST(request("POST", { ...metadata, id: reportId, path }))).status, 200);
  assert.equal(state.calls.at(-1).operation, "update"); assert.equal(state.calls.at(-1).values.slug, undefined);
  assert.equal(state.storage.filter((call) => call[0] === "remove").length, 0, "Old PDF must remain intact");
  reset([{ data: { id: reportId }, error: null }]);
  assert.equal((await api.POST(request("POST", { ...metadata, path }))).status, 200); assert.equal(state.calls.length, 2, "Retry must not insert another record");
  reset([{ data: null, error: null }]); state.pdf = { data: new Blob(["not PDF"]), error: null };
  assert.equal((await api.POST(request("POST", { ...metadata, path }))).status, 400); assert(!state.calls.some((call) => call.operation === "insert"));
  reset([{ data: { storage_path: "legacy/southport.pdf" }, error: null }, { count: 0, error: null }]);
  assert.equal((await api.DELETE(request("DELETE", { id: reportId }))).status, 403); assert.equal(state.storage.length, 0, "Denied record deletion must not remove PDF");
  reset([{ data: { storage_path: "legacy/southport.pdf" }, error: null }, { count: 1, error: null }, { count: 1, error: null }]);
  assert.equal((await api.DELETE(request("DELETE", { id: reportId }))).status, 200); assert.equal(state.storage.length, 0, "Shared PDF must be preserved");
  reset([{ data: { storage_path: "legacy/southport.pdf" }, error: null }, { count: 1, error: null }, { count: 0, error: null }]); state.remove = { error: { message: "Storage denied deletion" } };
  const deleted = await api.DELETE(request("DELETE", { id: reportId })); assert.equal(deleted.status, 200); assert((await deleted.json()).warning);
  reset([{ data: [{ id: reportId }], error: null }]);
  assert.equal((await api.PATCH(request("PATCH", { market: "gold_coast", ids: [uploadId] }))).status, 409); assert(!state.calls.some((call) => call.operation === "update"));
  console.log("PASS: PDF validation, session/admin/CSRF checks, schema/policy errors, direct upload, replacement preservation, retry deduplication, deletion safety and stale ordering.");
})().catch((error) => { console.error(error); process.exitCode = 1; });
