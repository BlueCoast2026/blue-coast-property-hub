alter table public.property_decision_submissions
  add column if not exists cma_requested_at timestamptz,
  add column if not exists cma_email_status text check (cma_email_status is null or cma_email_status in ('sent','failed')),
  add column if not exists cma_email_message_id text;

create index if not exists property_decision_cma_requests_idx
on public.property_decision_submissions(cma_requested_at desc)
where cma_requested_at is not null;

alter table public.review_attachments drop constraint if exists review_attachments_submission_type_check;
alter table public.review_attachments add constraint review_attachments_submission_type_check check (submission_type in ('health_check','ready_to_rent','property_decision'));
create or replace function public.validate_review_attachment_submission() returns trigger language plpgsql set search_path='' as $$ begin
  if new.submission_type='health_check' and not exists(select 1 from public.health_check_submissions where id=new.submission_id) then raise exception 'Submission does not exist'; end if;
  if new.submission_type='ready_to_rent' and not exists(select 1 from public.ready_to_rent_submissions where id=new.submission_id) then raise exception 'Submission does not exist'; end if;
  if new.submission_type='property_decision' and not exists(select 1 from public.property_decision_submissions where id=new.submission_id) then raise exception 'Submission does not exist'; end if;
  return new;
end; $$;
create policy "decision attachments member select" on public.review_attachments for select using (submission_type='property_decision' and exists(select 1 from public.property_decision_submissions s where s.id=submission_id and s.user_id=auth.uid()));
