import { KeyRound } from "lucide-react";
import { PageContainer } from "@/components/layout/page-container";
import { ReadyToRentFlow } from "@/components/ready-to-rent/ready-to-rent-flow";
import { requireUser } from "@/lib/auth/permissions";

export const metadata = { title: "Ready to Rent" };

export default async function ReadyToRentPage({ searchParams }: { searchParams: Promise<{ property?: string }> }) {
  const { property } = await searchParams;
  const { supabase, user } = await requireUser();
  const { data: properties } = await supabase.from("properties").select("id, address_line_1, suburb, state, postcode").eq("owner_id", user.id).order("created_at");
  return <PageContainer><header className="mb-8 border-b border-line pb-8"><span className="grid size-12 place-items-center rounded-xl bg-sky text-coastal"><KeyRound className="size-5" /></span><p className="mt-6 text-sm font-semibold uppercase tracking-[0.18em] text-coastal">Ready to Rent</p><h1 className="mt-3 font-display text-4xl font-medium text-navy sm:text-5xl">Is your property ready for the rental market?</h1><p className="mt-4 max-w-2xl text-base leading-7 text-muted">Review ten practical areas to identify items that may need attention before a new tenancy begins.</p></header><ReadyToRentFlow properties={properties ?? []} initialPropertyId={property} /></PageContainer>;
}
