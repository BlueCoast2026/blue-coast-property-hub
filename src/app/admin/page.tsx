import Link from "next/link";
import { ClipboardCheck, Clock3, Send, ArrowLeft, ArrowRight, UsersRound, FileUp, Newspaper } from "lucide-react";
import { requireStaff } from "@/lib/auth/permissions";

export const dynamic = "force-dynamic";

type RecentItem = {
  id: string;
  user_id: string;
  property_id: string | null;
  score: number | null;
  result_level: string | null;
  status: string;
  submitted_at: string;
  type: "Property Health Check" | "Ready to Rent";
};

export default async function AdminPage() {
  const { supabase, role } = await requireStaff();
  const [healthNew, readyNew, healthReview, readyReview, healthSent, readySent, healthRecent, readyRecent] = await Promise.all([
    supabase.from("health_check_submissions").select("id", { count: "exact", head: true }).eq("status", "new"),
    supabase.from("ready_to_rent_submissions").select("id", { count: "exact", head: true }).eq("status", "new"),
    supabase.from("health_check_submissions").select("id", { count: "exact", head: true }).eq("status", "under_review"),
    supabase.from("ready_to_rent_submissions").select("id", { count: "exact", head: true }).eq("status", "under_review"),
    supabase.from("health_check_submissions").select("id", { count: "exact", head: true }).eq("status", "report_sent"),
    supabase.from("ready_to_rent_submissions").select("id", { count: "exact", head: true }).eq("status", "report_sent"),
    supabase.from("health_check_submissions").select("id, user_id, property_id, score, result_level, status, submitted_at").order("submitted_at", { ascending: false }).limit(8),
    supabase.from("ready_to_rent_submissions").select("id, user_id, property_id, score, result_level, status, submitted_at").order("submitted_at", { ascending: false }).limit(8),
  ]);

  const recent: RecentItem[] = [
    ...(healthRecent.data ?? []).map((item) => ({ ...item, type: "Property Health Check" as const })),
    ...(readyRecent.data ?? []).map((item) => ({ ...item, type: "Ready to Rent" as const })),
  ].sort((a, b) => Date.parse(b.submitted_at) - Date.parse(a.submitted_at)).slice(0, 8);
  const userIds = [...new Set(recent.map((item) => item.user_id))];
  const propertyIds = [...new Set(recent.map((item) => item.property_id).filter((id): id is string => Boolean(id)))];
  const [{ data: profiles }, { data: properties }] = await Promise.all([
    userIds.length ? supabase.from("profiles").select("id, first_name, last_name, email").in("id", userIds) : Promise.resolve({ data: [] }),
    propertyIds.length ? supabase.from("properties").select("id, address_line_1, suburb").in("id", propertyIds) : Promise.resolve({ data: [] }),
  ]);
  const profileMap = new Map((profiles ?? []).map((profile) => [profile.id, profile]));
  const propertyMap = new Map((properties ?? []).map((property) => [property.id, property]));
  const stats = [
    { label: "New Assessments", value: (healthNew.count ?? 0) + (readyNew.count ?? 0), icon: ClipboardCheck },
    { label: "Under Review", value: (healthReview.count ?? 0) + (readyReview.count ?? 0), icon: Clock3 },
    { label: "Reports Sent", value: (healthSent.count ?? 0) + (readySent.count ?? 0), icon: Send },
  ];

  return <main className="min-h-screen bg-mist px-5 py-10 sm:px-8 lg:px-12"><div className="mx-auto max-w-7xl">
    <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm font-semibold text-muted hover:text-navy"><ArrowLeft className="size-4" />Member dashboard</Link>
    <header className="mt-8 flex flex-wrap items-end justify-between gap-6 border-b border-line pb-8"><div><p className="text-sm font-semibold uppercase tracking-[0.18em] text-coastal">{role.replace("_", " ")}</p><h1 className="mt-3 font-display text-4xl font-medium text-navy sm:text-5xl">Admin Dashboard</h1><p className="mt-3 text-muted">Assessment activity requiring your team&apos;s attention.</p></div>{role === "admin" && <div className="flex flex-wrap gap-3"><Link href="/admin/blog" className="inline-flex h-11 items-center gap-2 rounded-xl border border-line bg-white px-5 text-sm font-semibold text-navy"><Newspaper className="size-4" />Blog CMS</Link><Link href="/admin/suburb-reports" className="inline-flex h-11 items-center gap-2 rounded-xl border border-line bg-white px-5 text-sm font-semibold text-navy"><FileUp className="size-4" />Suburb reports</Link><Link href="/admin/users" className="inline-flex h-11 items-center gap-2 rounded-xl bg-navy px-5 text-sm font-semibold text-white"><UsersRound className="size-4" />Manage roles</Link></div>}</header>
    <section className="mt-8 grid gap-5 sm:grid-cols-3">{stats.map(({ label, value, icon: Icon }) => <article key={label} className="rounded-2xl border border-line bg-white p-6 shadow-card"><Icon className="size-5 text-coastal" /><p className="mt-6 text-3xl font-semibold text-navy">{value}</p><p className="mt-1 text-sm text-muted">{label}</p></article>)}</section>
    <section className="mt-8 rounded-2xl border border-line bg-white p-6 shadow-card sm:p-8"><h2 className="text-xl font-semibold text-navy">Recent Submissions</h2>{recent.length === 0 ? <p className="mt-6 rounded-xl bg-mist px-5 py-8 text-center text-muted">No assessments have been submitted yet.</p> : <div className="mt-5 divide-y divide-line">{recent.map((item) => { const profile = profileMap.get(item.user_id); const property = item.property_id ? propertyMap.get(item.property_id) : null; const content = <><div><p className="font-semibold text-ink">{profile ? `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim() || "Member" : "Member"}</p><p className="mt-1 text-sm text-muted">{profile?.email} · {item.type}</p><p className="mt-1 text-sm text-muted">{property ? `${property.address_line_1}, ${property.suburb}` : "Property unavailable"}</p></div><p className="text-sm font-semibold text-navy">{item.score == null ? "Not scored" : `${item.score} / 100`}</p><span className="justify-self-start rounded-full bg-sky px-3 py-1 text-xs font-semibold uppercase tracking-wider text-coastal sm:justify-self-end">{item.status.replace("_", " ")}</span><ArrowRight className="hidden size-4 text-muted sm:block" /></>; const href = item.type === "Property Health Check" ? `/admin/health-check/${item.id}` : `/admin/ready-to-rent/${item.id}`; return <Link key={`${item.type}-${item.id}`} href={href} className="grid gap-2 py-5 transition hover:bg-mist/60 sm:grid-cols-[1fr_auto_auto_auto] sm:items-center sm:gap-6 sm:px-3">{content}</Link>; })}</div>}</section>
  </div></main>;
}
