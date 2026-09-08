create table public.suburb_reports (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  postcode text not null check (postcode ~ '^\d{4}$'),
  zone text not null check (zone in ('Coastal', 'Central', 'Northern', 'Hinterland')),
  description text not null default '',
  storage_path text,
  published boolean not null default false,
  report_date date,
  uploaded_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger suburb_reports_set_updated_at before update on public.suburb_reports
for each row execute function public.set_updated_at();
alter table public.suburb_reports enable row level security;

create policy "suburb_reports_read_published_or_staff" on public.suburb_reports for select
using (published or public.is_staff());
create policy "suburb_reports_admin_insert" on public.suburb_reports for insert
with check (public.is_admin() and uploaded_by = (select auth.uid()));
create policy "suburb_reports_admin_update" on public.suburb_reports for update
using (public.is_admin()) with check (public.is_admin());
create policy "suburb_reports_admin_delete" on public.suburb_reports for delete
using (public.is_admin());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('suburb-reports', 'suburb-reports', true, 15728640, array['application/pdf'])
on conflict (id) do update set public = true, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create policy "suburb_report_files_admin_insert" on storage.objects for insert
with check (bucket_id = 'suburb-reports' and public.is_admin());
create policy "suburb_report_files_public_select" on storage.objects for select
using (bucket_id = 'suburb-reports');
create policy "suburb_report_files_admin_update" on storage.objects for update
using (bucket_id = 'suburb-reports' and public.is_admin())
with check (bucket_id = 'suburb-reports' and public.is_admin());
create policy "suburb_report_files_admin_delete" on storage.objects for delete
using (bucket_id = 'suburb-reports' and public.is_admin());

insert into public.suburb_reports (name, slug, postcode, zone, description, published, report_date, uploaded_by)
select seed.name, seed.slug, seed.postcode, seed.zone, seed.description,
       seed.slug in ('southport', 'surfers-paradise'),
       case when seed.slug in ('southport', 'surfers-paradise') then date '2026-09-07' else null end,
       null
from (values
  ('Surfers Paradise','surfers-paradise','4217','Coastal','High-rise beachfront living and the Gold Coast''s best-known tourism precinct.'),
  ('Broadbeach','broadbeach','4218','Coastal','Beachside apartments, dining, retail and major entertainment amenities.'),
  ('Broadbeach Waters','broadbeach-waters','4218','Central','Canal-front homes with convenient access to Broadbeach and major retail.'),
  ('Mermaid Beach','mermaid-beach','4218','Coastal','Established beachside housing close to employment, dining and transport.'),
  ('Mermaid Waters','mermaid-waters','4218','Central','Residential waterfront neighbourhoods near the central coastal corridor.'),
  ('Burleigh Heads','burleigh-heads','4220','Coastal','A prominent beach, dining and lifestyle precinct with varied housing.'),
  ('Miami','miami','4220','Coastal','A compact coastal suburb between Burleigh Heads and Mermaid Beach.'),
  ('Palm Beach','palm-beach','4221','Coastal','Southern coastal living around beaches, creeks and local retail centres.'),
  ('Currumbin','currumbin','4223','Coastal','Beach, creek and valley neighbourhoods with strong natural amenity.'),
  ('Coolangatta','coolangatta','4225','Coastal','The southern beachfront centre near the airport and New South Wales border.'),
  ('Southport','southport','4215','Central','A major business, health and education centre with diverse housing.'),
  ('Labrador','labrador','4215','Central','Broadwater-side housing immediately north of the Southport centre.'),
  ('Biggera Waters','biggera-waters','4216','Northern','Broadwater apartments and homes close to Harbour Town and transport.'),
  ('Runaway Bay','runaway-bay','4216','Northern','Waterfront residential areas supported by established shopping and recreation.'),
  ('Hope Island','hope-island','4212','Northern','Master-planned waterfront and golf communities in the northern corridor.'),
  ('Helensvale','helensvale','4212','Northern','Established family housing with major rail, light rail and motorway connections.'),
  ('Coomera','coomera','4209','Northern','A fast-growing northern centre with new housing, retail and transport links.'),
  ('Robina','robina','4226','Central','A master-planned centre anchored by employment, education and major retail.'),
  ('Varsity Lakes','varsity-lakes','4227','Central','Planned residential communities close to education and the rail network.'),
  ('Mudgeeraba','mudgeeraba','4213','Hinterland','Established village and family neighbourhoods at the edge of the hinterland.')
) as seed(name, slug, postcode, zone, description)
on conflict (slug) do nothing;
