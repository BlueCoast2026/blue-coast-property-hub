import { ShieldCheck, UserRound } from "lucide-react";
import { PageContainer } from "@/components/layout/page-container";
import { requireUser, type AppRole } from "@/lib/auth/permissions";

export const metadata = { title: "Account" };

const roleLabels: Record<AppRole, string> = {
  member: "Member",
  property_manager: "Property Manager",
  admin: "Administrator",
};

export default async function AccountPage() {
  const { supabase, user } = await requireUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("first_name, last_name, email, phone, user_type, role")
    .eq("id", user.id)
    .single();
  const role = (profile?.role ?? "member") as AppRole;
  const fullName = `${profile?.first_name ?? ""} ${profile?.last_name ?? ""}`.trim() || "Member";

  return <PageContainer>
    <header className="mb-8 border-b border-line pb-8">
      <span className="grid size-12 place-items-center rounded-xl bg-sky text-coastal"><UserRound className="size-5" /></span>
      <p className="mt-6 text-sm font-semibold uppercase tracking-[0.18em] text-coastal">Account</p>
      <h1 className="mt-3 font-display text-4xl font-medium text-navy sm:text-5xl">{fullName}</h1>
      <p className="mt-3 text-muted">Your Blue Coast Property Hub profile and access level.</p>
    </header>
    <section className="rounded-2xl border border-line bg-white p-6 shadow-card sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div><h2 className="text-xl font-semibold text-navy">Profile details</h2><p className="mt-1 text-sm text-muted">Registration information stored with your account.</p></div>
        <span className="inline-flex items-center gap-2 rounded-full bg-sky px-4 py-2 text-sm font-semibold text-coastal"><ShieldCheck className="size-4" />{roleLabels[role]}</span>
      </div>
      <dl className="mt-7 grid gap-5 border-t border-line pt-6 sm:grid-cols-2">
        <div><dt className="text-xs font-semibold uppercase tracking-wider text-muted">Email</dt><dd className="mt-2 text-ink">{profile?.email ?? user.email ?? "Not provided"}</dd></div>
        <div><dt className="text-xs font-semibold uppercase tracking-wider text-muted">Phone</dt><dd className="mt-2 text-ink">{profile?.phone || "Not provided"}</dd></div>
        <div><dt className="text-xs font-semibold uppercase tracking-wider text-muted">User type</dt><dd className="mt-2 text-ink">{profile?.user_type || "Not provided"}</dd></div>
        <div><dt className="text-xs font-semibold uppercase tracking-wider text-muted">Access role</dt><dd className="mt-2 text-ink">{roleLabels[role]}</dd></div>
      </dl>
    </section>
  </PageContainer>;
}
