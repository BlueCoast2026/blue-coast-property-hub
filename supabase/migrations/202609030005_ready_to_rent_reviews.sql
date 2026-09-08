create policy "admin_notes_members_select_own_ready_feedback"
on public.admin_notes for select
using (
  submission_type = 'ready_to_rent'
  and exists (
    select 1 from public.ready_to_rent_submissions submission
    where submission.id = submission_id
      and submission.user_id = (select auth.uid())
  )
);

create or replace function public.review_ready_to_rent(
  p_submission_id uuid,
  p_status text,
  p_note text default null
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
begin
  if not public.is_staff() then raise exception 'Staff access required'; end if;
  if p_status not in ('new', 'under_review', 'reviewed', 'report_sent', 'closed') then
    raise exception 'Invalid review status';
  end if;
  if length(coalesce(p_note, '')) > 2000 then raise exception 'Feedback is too long'; end if;

  update public.ready_to_rent_submissions
  set status = p_status,
      reviewed_at = case when p_status in ('reviewed', 'report_sent', 'closed') then now() else reviewed_at end,
      reviewed_by = v_user_id,
      report_sent_at = case when p_status = 'report_sent' then now() else report_sent_at end
  where id = p_submission_id;

  if not found then raise exception 'Submission not found'; end if;

  if length(trim(coalesce(p_note, ''))) > 0 then
    insert into public.admin_notes (submission_type, submission_id, author_id, note)
    values ('ready_to_rent', p_submission_id, v_user_id, trim(p_note));
  end if;
end;
$$;

revoke all on function public.review_ready_to_rent(uuid, text, text) from public;
grant execute on function public.review_ready_to_rent(uuid, text, text) to authenticated;
