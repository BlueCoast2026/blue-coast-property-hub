create extension if not exists "pgcrypto";

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  first_name text,
  last_name text,
  email text,
  phone text,
  user_type text check (user_type in ('Property Owner', 'Investor', 'Tenant', 'Other')),
  role text not null default 'member' check (role in ('member', 'property_manager', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.properties (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  address_line_1 text not null,
  address_line_2 text,
  suburb text,
  state text default 'QLD',
  postcode text,
  property_type text,
  bedrooms integer check (bedrooms is null or bedrooms >= 0),
  bathrooms integer check (bathrooms is null or bathrooms >= 0),
  car_spaces integer check (car_spaces is null or car_spaces >= 0),
  management_status text default 'unknown',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.health_check_submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  property_id uuid references public.properties(id) on delete set null,
  score numeric(5,2) check (score is null or score between 0 and 100),
  result_level text check (result_level in ('green', 'orange', 'red')),
  status text not null default 'new' check (status in ('new', 'under_review', 'reviewed', 'report_sent', 'closed')),
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references public.profiles(id) on delete set null,
  report_sent_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.health_check_answers (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.health_check_submissions(id) on delete cascade,
  question_key text not null,
  question_text text not null,
  answer text not null,
  score numeric(5,2),
  created_at timestamptz not null default now(),
  unique (submission_id, question_key)
);

create table public.ready_to_rent_submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  property_id uuid references public.properties(id) on delete set null,
  score numeric(5,2) check (score is null or score between 0 and 100),
  result_level text check (result_level in ('green', 'orange', 'red')),
  status text not null default 'new' check (status in ('new', 'under_review', 'reviewed', 'report_sent', 'closed')),
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references public.profiles(id) on delete set null,
  report_sent_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.ready_to_rent_answers (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.ready_to_rent_submissions(id) on delete cascade,
  question_key text not null,
  question_text text not null,
  answer text not null,
  score numeric(5,2),
  created_at timestamptz not null default now(),
  unique (submission_id, question_key)
);

create table public.admin_notes (
  id uuid primary key default gen_random_uuid(),
  submission_type text not null check (submission_type in ('health_check', 'ready_to_rent')),
  submission_id uuid not null,
  author_id uuid not null references public.profiles(id) on delete cascade,
  note text not null check (length(trim(note)) > 0),
  created_at timestamptz not null default now()
);

create index properties_owner_id_idx on public.properties(owner_id);
create index health_submissions_user_id_idx on public.health_check_submissions(user_id);
create index health_submissions_status_idx on public.health_check_submissions(status, submitted_at desc);
create index ready_submissions_user_id_idx on public.ready_to_rent_submissions(user_id);
create index ready_submissions_status_idx on public.ready_to_rent_submissions(status, submitted_at desc);
create index admin_notes_submission_idx on public.admin_notes(submission_type, submission_id);

create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at before update on public.profiles
for each row execute function public.set_updated_at();
create trigger properties_set_updated_at before update on public.properties
for each row execute function public.set_updated_at();

create or replace function public.normalise_user_type(value text)
returns text language sql immutable set search_path = '' as $$
  select case lower(coalesce(value, ''))
    when 'property owner' then 'Property Owner'
    when 'property-owner' then 'Property Owner'
    when 'investor' then 'Investor'
    when 'tenant' then 'Tenant'
    when 'other' then 'Other'
    else 'Other'
  end;
$$;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, first_name, last_name, email, phone, user_type, role)
  values (
    new.id,
    new.raw_user_meta_data ->> 'first_name',
    new.raw_user_meta_data ->> 'last_name',
    new.email,
    new.raw_user_meta_data ->> 'phone',
    public.normalise_user_type(new.raw_user_meta_data ->> 'user_type'),
    'member'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();

insert into public.profiles (id, first_name, last_name, email, phone, user_type, role, created_at)
select id, raw_user_meta_data ->> 'first_name', raw_user_meta_data ->> 'last_name', email,
       raw_user_meta_data ->> 'phone', public.normalise_user_type(raw_user_meta_data ->> 'user_type'),
       'member', created_at
from auth.users
on conflict (id) do nothing;

create or replace function public.is_staff()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role in ('property_manager', 'admin')
  );
$$;

create or replace function public.protect_profile_role()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if old.role is distinct from new.role
     and (select auth.uid()) is not null
     and not public.is_staff() then
    raise exception 'Only authorised staff may change account roles';
  end if;
  return new;
end;
$$;

create trigger profiles_protect_role before update on public.profiles
for each row execute function public.protect_profile_role();

create or replace function public.validate_admin_note_submission()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.submission_type = 'health_check' and not exists (
    select 1 from public.health_check_submissions where id = new.submission_id
  ) then raise exception 'Health check submission does not exist'; end if;
  if new.submission_type = 'ready_to_rent' and not exists (
    select 1 from public.ready_to_rent_submissions where id = new.submission_id
  ) then raise exception 'Ready to rent submission does not exist'; end if;
  return new;
end;
$$;

create trigger admin_notes_validate_submission before insert or update on public.admin_notes
for each row execute function public.validate_admin_note_submission();

alter table public.profiles enable row level security;
alter table public.properties enable row level security;
alter table public.health_check_submissions enable row level security;
alter table public.health_check_answers enable row level security;
alter table public.ready_to_rent_submissions enable row level security;
alter table public.ready_to_rent_answers enable row level security;
alter table public.admin_notes enable row level security;

create policy "profiles_select_own_or_staff" on public.profiles for select
using (id = (select auth.uid()) or public.is_staff());
create policy "profiles_update_own_or_staff" on public.profiles for update
using (id = (select auth.uid()) or public.is_staff())
with check (id = (select auth.uid()) or public.is_staff());

create policy "properties_select_own_or_staff" on public.properties for select
using (owner_id = (select auth.uid()) or public.is_staff());
create policy "properties_insert_own_or_staff" on public.properties for insert
with check (owner_id = (select auth.uid()) or public.is_staff());
create policy "properties_update_own_or_staff" on public.properties for update
using (owner_id = (select auth.uid()) or public.is_staff())
with check (owner_id = (select auth.uid()) or public.is_staff());
create policy "properties_delete_own_or_staff" on public.properties for delete
using (owner_id = (select auth.uid()) or public.is_staff());

create policy "health_submissions_select_own_or_staff" on public.health_check_submissions for select
using (user_id = (select auth.uid()) or public.is_staff());
create policy "health_submissions_insert_own" on public.health_check_submissions for insert
with check (user_id = (select auth.uid()));
create policy "health_submissions_staff_update" on public.health_check_submissions for update
using (public.is_staff()) with check (public.is_staff());
create policy "health_answers_select_own_or_staff" on public.health_check_answers for select
using (public.is_staff() or exists (select 1 from public.health_check_submissions s where s.id = submission_id and s.user_id = (select auth.uid())));
create policy "health_answers_insert_own" on public.health_check_answers for insert
with check (exists (select 1 from public.health_check_submissions s where s.id = submission_id and s.user_id = (select auth.uid())));

create policy "ready_submissions_select_own_or_staff" on public.ready_to_rent_submissions for select
using (user_id = (select auth.uid()) or public.is_staff());
create policy "ready_submissions_insert_own" on public.ready_to_rent_submissions for insert
with check (user_id = (select auth.uid()));
create policy "ready_submissions_staff_update" on public.ready_to_rent_submissions for update
using (public.is_staff()) with check (public.is_staff());
create policy "ready_answers_select_own_or_staff" on public.ready_to_rent_answers for select
using (public.is_staff() or exists (select 1 from public.ready_to_rent_submissions s where s.id = submission_id and s.user_id = (select auth.uid())));
create policy "ready_answers_insert_own" on public.ready_to_rent_answers for insert
with check (exists (select 1 from public.ready_to_rent_submissions s where s.id = submission_id and s.user_id = (select auth.uid())));

create policy "admin_notes_staff_select" on public.admin_notes for select using (public.is_staff());
create policy "admin_notes_staff_insert" on public.admin_notes for insert
with check (public.is_staff() and author_id = (select auth.uid()));
create policy "admin_notes_staff_update" on public.admin_notes for update
using (public.is_staff()) with check (public.is_staff());
create policy "admin_notes_staff_delete" on public.admin_notes for delete using (public.is_staff());

revoke all on function public.is_staff() from public;
grant execute on function public.is_staff() to authenticated;
revoke all on function public.normalise_user_type(text) from public;
