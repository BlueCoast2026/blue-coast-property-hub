import { Home, ClipboardCheck, KeyRound, ChartNoAxesCombined, ShieldCheck } from "lucide-react";
import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { PageContainer } from "@/components/layout/page-container";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const { data: profile } = data.user
    ? await supabase.from("profiles").select("role").eq("id", data.user.id).single()
    : { data: null };
  const isStaff = profile?.role === "admin" || profile?.role === "property_manager";
  const firstName = data.user?.user_metadata?.first_name || "there";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <PageContainer>
      <header className="mb-10 border-b border-line pb-8 sm:mb-12 sm:pb-10">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-coastal">Dashboard</p>
        <h1 className="mt-3 font-display text-4xl font-medium tracking-tight text-navy sm:text-5xl">{greeting}, {firstName}</h1>
        <p className="mt-3 text-base text-muted">Here&apos;s an overview of your property hub.</p>
      </header>
      <section className="grid gap-5 md:grid-cols-2" aria-label="Property hub tools">
        <DashboardCard title="My Property" description="Keep your property details, tenancy information and important records organised in one place." action="View Property" href="/dashboard/property" icon={Home} />
        <DashboardCard title="Property Health Check" description="Review key areas of your current property management service and identify areas worth reviewing." action="Start Health Check" href="/dashboard/health-check" icon={ClipboardCheck} />
        <DashboardCard title="Ready to Rent" description="Check whether your property is ready for the rental market and identify items that may require attention." action="Check My Property" href="/dashboard/ready-to-rent" icon={KeyRound} />
        {isStaff && <DashboardCard title="Admin Dashboard" description="Review member submissions, update their status and provide feedback." action="Open Admin Dashboard" href="/admin" icon={ShieldCheck} />}
        <DashboardCard title="Market Insights" description="Browse PDF profile reports for 20 Gold Coast focus suburbs." action="View Suburb Reports" href="/dashboard/market-insights" icon={ChartNoAxesCombined} />
      </section>
    </PageContainer>
  );
}
