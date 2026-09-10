create table public.review_attachments (
  id uuid primary key default gen_random_uuid(),
  submission_type text not null check (submission_type in ('health_check', 'ready_to_rent')),
  submission_id uuid not null,
  storage_path text not null unique,
  file_name text not null,
  uploaded_by uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);

create index review_attachments_submission_idx
on public.review_attachments(submission_type, submission_id, created_at desc);

create or replace function public.validate_review_attachment_submission()
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

create trigger review_attachments_validate_submission
before insert or update on public.review_attachments
for each row execute function public.validate_review_attachment_submission();

alter table public.review_attachments enable row level security;

create policy "review_attachments_staff_all" on public.review_attachments for all
using (public.is_staff()) with check (public.is_staff());

create policy "review_attachments_members_select_own" on public.review_attachments for select
using (
  (submission_type = 'health_check' and exists (
    select 1 from public.health_check_submissions submission
    where submission.id = submission_id and submission.user_id = (select auth.uid())
  ))
  or
  (submission_type = 'ready_to_rent' and exists (
    select 1 from public.ready_to_rent_submissions submission
    where submission.id = submission_id and submission.user_id = (select auth.uid())
  ))
);

create policy "admin_notes_members_select_own_health_feedback"
on public.admin_notes for select
using (
  submission_type = 'health_check'
  and exists (
    select 1 from public.health_check_submissions submission
    where submission.id = submission_id
      and submission.user_id = (select auth.uid())
  )
);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('review-attachments', 'review-attachments', false, 10485760, array['application/pdf'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
