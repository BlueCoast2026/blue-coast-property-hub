alter table public.property_decision_submissions
  add column if not exists cma_requested_at timestamptz,
  add column if not exists cma_email_status text check (cma_email_status is null or cma_email_status in ('sent','failed')),
  add column if not exists cma_email_message_id text;

create index if not exists property_decision_cma_requests_idx
on public.property_decision_submissions(cma_requested_at desc)
where cma_requested_at is not null;
