alter table public.suburb_reports
add column if not exists market text not null default 'gold_coast';

alter table public.suburb_reports drop constraint if exists suburb_reports_market_check;
alter table public.suburb_reports add constraint suburb_reports_market_check
check (market in ('gold_coast', 'brisbane'));

alter table public.suburb_reports drop constraint if exists suburb_reports_zone_check;
alter table public.suburb_reports add constraint suburb_reports_zone_check
check (zone in ('Coastal', 'Central', 'Northern', 'Hinterland', 'Brisbane City', 'Logan', 'Ipswich', 'South Brisbane'));

update public.suburb_reports set market = 'gold_coast' where market is null or market <> 'brisbane';
create index if not exists suburb_reports_market_name_idx on public.suburb_reports(market, name);

drop policy if exists "suburb_reports_read_published_or_staff" on public.suburb_reports;
create policy "suburb_reports_authenticated_read" on public.suburb_reports for select
to authenticated using (true);

insert into public.suburb_reports (name, slug, postcode, zone, market, description, published)
values
  ('Brisbane City', 'brisbane-city', '4000', 'Brisbane City', 'brisbane', 'Queensland''s capital-city centre with apartments, employment, education and major transport connections.', false),
  ('Logan', 'logan', '4114', 'Logan', 'brisbane', 'A major growth corridor between Brisbane and the Gold Coast with diverse housing and expanding infrastructure.', false),
  ('Ipswich', 'ipswich', '4305', 'Ipswich', 'brisbane', 'A historic regional centre west of Brisbane supported by transport, employment and new residential growth.', false),
  ('Park Ridge', 'park-ridge', '4125', 'Logan', 'brisbane', 'A developing residential area in the Logan growth corridor with expanding community infrastructure.', false),
  ('Sunnybank', 'sunnybank', '4109', 'South Brisbane', 'brisbane', 'An established southside suburb known for retail, dining, schools and access to major transport routes.', false),
  ('Sunnybank Hills', 'sunnybank-hills', '4109', 'South Brisbane', 'brisbane', 'An established family suburb with schools, shopping and convenient connections across Brisbane''s southside.', false)
on conflict (slug) do update set market = excluded.market, zone = excluded.zone;
