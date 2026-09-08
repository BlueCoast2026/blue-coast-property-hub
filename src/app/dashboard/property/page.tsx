import Link from "next/link";
import { ClipboardCheck, Home, KeyRound, MapPin } from "lucide-react";
import { PageContainer } from "@/components/layout/page-container";
import { AddPropertyForm } from "@/components/property/add-property-form";
import { DeletePropertyForm } from "@/components/property/delete-property-form";
import { requireUser } from "@/lib/auth/permissions";

export const metadata = { title: "Your Property" };

export default async function PropertyPage() {
  const { supabase, user } = await requireUser();
  const { data: properties } = await supabase.from("properties").select("id, address_line_1, suburb, state, postcode").eq("owner_id", user.id).order("created_at");

  return <PageContainer>
    <header className="mb-8 border-b border-line pb-8"><span className="grid size-12 place-items-center rounded-xl bg-sky text-coastal"><Home className="size-5" /></span><p className="mt-6 text-sm font-semibold uppercase tracking-[0.18em] text-coastal">Your Property</p><h1 className="mt-3 font-display text-4xl font-medium text-navy sm:text-5xl">Choose a property to assess</h1><p className="mt-4 max-w-2xl leading-7 text-muted">Only properties connected to your owner account are shown here. Select the relevant address before starting an assessment.</p></header>
    {(properties ?? []).length > 0 && <section className="mb-8 grid gap-5 lg:grid-cols-2" aria-label="Your properties">{properties!.map((property) => <article key={property.id} className="rounded-2xl border border-line bg-white p-6 shadow-card"><MapPin className="size-5 text-coastal" /><h2 className="mt-5 text-xl font-semibold text-navy">{property.address_line_1}</h2><p className="mt-2 text-muted">{[property.suburb, property.state, property.postcode].filter(Boolean).join(" ")}</p><div className="mt-6 flex flex-wrap gap-3"><Link href={`/dashboard/health-check?property=${property.id}`} className="inline-flex h-11 items-center gap-2 rounded-xl bg-navy px-4 text-sm font-semibold text-white"><ClipboardCheck className="size-4" />Health Check</Link><Link href={`/dashboard/ready-to-rent?property=${property.id}`} className="inline-flex h-11 items-center gap-2 rounded-xl border border-line px-4 text-sm font-semibold text-navy"><KeyRound className="size-4" />Ready to Rent</Link><DeletePropertyForm propertyId={property.id} address={property.address_line_1} /></div></article>)}</section>}
    <AddPropertyForm compact={(properties ?? []).length > 0} />
  </PageContainer>;
}
