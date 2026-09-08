import { ClipboardCheck } from "lucide-react";
import { PageContainer } from "@/components/layout/page-container";
import { HealthCheckFlow } from "@/components/health-check/health-check-flow";
import { requireUser } from "@/lib/auth/permissions";

export const metadata = { title: "Property Health Check" };

export default async function HealthCheckPage({ searchParams }: { searchParams: Promise<{ property?: string }> }) {
  const { property } = await searchParams;
  const { supabase, user } = await requireUser();
  const { data: properties } = await supabase.from("properties").select("id, address_line_1, suburb, state, postcode").eq("owner_id", user.id).order("created_at");
  return <PageContainer><header className="mb-8 border-b border-line pb-8"><span className="grid size-12 place-items-center rounded-xl bg-sky text-coastal"><ClipboardCheck className="size-5" /></span><p className="mt-6 text-sm font-semibold uppercase tracking-[0.18em] text-coastal">Property Health Check</p><h1 className="mt-3 font-display text-4xl font-medium text-navy sm:text-5xl">How is your property management performing?</h1><p className="mt-4 max-w-2xl text-base leading-7 text-muted">Answer ten focused questions to highlight areas that may be worth discussing with a property professional.</p></header><HealthCheckFlow properties={properties ?? []} initialPropertyId={property} /></PageContainer>;
}
