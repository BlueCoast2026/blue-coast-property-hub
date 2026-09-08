import Link from "next/link";
import { ArrowLeft, UsersRound } from "lucide-react";
import { UserRoleForm } from "@/components/admin/user-role-form";
import { AddUserForm } from "@/components/admin/add-user-form";
import { DeleteUserForm } from "@/components/admin/delete-user-form";
import { requireAdmin, type AppRole } from "@/lib/auth/permissions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Role Management" };

const roleLabels: Record<AppRole, string> = { member: "Member", property_manager: "Property Manager", admin: "Administrator" };

export default async function AdminUsersPage() {
  const { supabase, user } = await requireAdmin();
  const { data: profiles } = await supabase.from("profiles").select("id, first_name, last_name, email, user_type, role, created_at").order("created_at", { ascending: false });

  return <main className="min-h-screen bg-mist px-5 py-10 sm:px-8 lg:px-12"><div className="mx-auto max-w-6xl">
    <Link href="/admin" className="inline-flex items-center gap-2 text-sm font-semibold text-muted hover:text-navy"><ArrowLeft className="size-4" />Admin dashboard</Link>
    <header className="mt-8 border-b border-line pb-8"><span className="grid size-12 place-items-center rounded-xl bg-sky text-coastal"><UsersRound className="size-5" /></span><p className="mt-6 text-sm font-semibold uppercase tracking-[0.18em] text-coastal">Administrator only</p><h1 className="mt-3 font-display text-4xl font-medium text-navy sm:text-5xl">Role Management</h1><p className="mt-3 max-w-2xl text-muted">Assign access for administrators, property managers and members. New accounts begin as members.</p></header>
    <section className="mt-8 rounded-2xl border border-line bg-white p-6 shadow-card"><h2 className="font-display text-2xl font-medium text-navy">Add user</h2><p className="mt-2 text-sm text-muted">Send an account invitation and assign access before the user signs in.</p><AddUserForm /></section>
    <section className="mt-8 overflow-hidden rounded-2xl border border-line bg-white shadow-card"><div className="divide-y divide-line">{(profiles ?? []).map((profile) => { const role = profile.role as AppRole; const name = `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim() || "Unnamed user"; return <article key={profile.id} className="grid gap-5 p-6 md:grid-cols-[minmax(0,1fr)_auto] md:items-center"><div><div className="flex flex-wrap items-center gap-2"><h2 className="font-semibold text-navy">{name}</h2>{profile.id === user.id && <span className="rounded-full bg-sky px-2.5 py-1 text-xs font-semibold text-coastal">You</span>}</div><p className="mt-1 text-sm text-muted">{profile.email || "No email"} · {profile.user_type || "No user type"}</p><p className="mt-2 text-xs font-semibold uppercase tracking-wider text-coastal">{roleLabels[role]}</p></div>{profile.id === user.id ? <p className="text-sm text-muted">Current administrator</p> : <div className="flex flex-wrap items-start gap-3"><UserRoleForm profileId={profile.id} currentRole={role} /><DeleteUserForm profileId={profile.id} label={name} /></div>}</article>; })}</div></section>
  </div></main>;
}
