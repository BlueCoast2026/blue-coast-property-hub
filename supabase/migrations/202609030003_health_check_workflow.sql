create or replace function public.submit_health_check(
  p_property_id uuid,
  p_answers jsonb
)
returns table (submission_id uuid, score numeric, result_level text)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_submission_id uuid;
  v_score numeric(5,2);
  v_result_level text;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  if not exists (
    select 1 from public.properties
    where id = p_property_id and owner_id = v_user_id
  ) then
    raise exception 'Property not found or access denied';
  end if;

  if jsonb_typeof(p_answers) <> 'array' or jsonb_array_length(p_answers) <> 10 then
    raise exception 'Exactly 10 answers are required';
  end if;

  if (
    select count(distinct answer ->> 'question_key')
    from jsonb_array_elements(p_answers) answer
  ) <> 10 then
    raise exception 'Each assessment question must be answered once';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(p_answers) answer
    where answer ->> 'question_key' not in (
      'communication', 'routine_inspections', 'rent_arrears_management',
      'maintenance_handling', 'lease_renewals', 'compliance_management',
      'owner_reporting', 'market_rent_reviews', 'fee_transparency',
      'overall_management_confidence'
    )
    or answer ->> 'answer' not in ('Excellent', 'Good', 'Fair', 'Needs Improvement')
  ) then
    raise exception 'One or more answers are invalid';
  end if;

  select sum(
    case answer ->> 'answer'
      when 'Excellent' then 10
      when 'Good' then 7.5
      when 'Fair' then 5
      when 'Needs Improvement' then 2.5
    end
  ) into v_score
  from jsonb_array_elements(p_answers) answer;

  v_result_level := case
    when v_score >= 80 then 'green'
    when v_score >= 60 then 'orange'
    else 'red'
  end;

  insert into public.health_check_submissions (
    user_id, property_id, score, result_level, status, submitted_at
  ) values (
    v_user_id, p_property_id, v_score, v_result_level, 'new', now()
  ) returning id into v_submission_id;

  insert into public.health_check_answers (
    submission_id, question_key, question_text, answer, score
  )
  select
    v_submission_id,
    answer ->> 'question_key',
    answer ->> 'question_text',
    answer ->> 'answer',
    case answer ->> 'answer'
      when 'Excellent' then 10
      when 'Good' then 7.5
      when 'Fair' then 5
      when 'Needs Improvement' then 2.5
    end
  from jsonb_array_elements(p_answers) answer;

  return query select v_submission_id, v_score, v_result_level;
end;
$$;

revoke all on function public.submit_health_check(uuid, jsonb) from public;
grant execute on function public.submit_health_check(uuid, jsonb) to authenticated;

