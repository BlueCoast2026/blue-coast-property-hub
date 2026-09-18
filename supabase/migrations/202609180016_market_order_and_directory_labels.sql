alter table public.suburb_reports add column if not exists display_order integer not null default 0;
with ranked as (select id,row_number() over(partition by market order by name)-1 as position from public.suburb_reports)
update public.suburb_reports r set display_order=ranked.position from ranked where r.id=ranked.id and r.display_order=0;
create index if not exists suburb_reports_market_order_idx on public.suburb_reports(market,display_order,name);
