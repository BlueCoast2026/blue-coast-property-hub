alter table public.assessment_question_content drop constraint if exists assessment_question_content_assessment_type_check;
alter table public.assessment_question_content add constraint assessment_question_content_assessment_type_check check (assessment_type in ('health_check','ready_to_rent','property_decision'));

create table public.property_decision_submissions (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade,
  property_id uuid references public.properties(id) on delete set null, score numeric(5,2) not null check (score between 0 and 100),
  result_level text not null check (result_level in ('hold','review','explore')), current_thinking text not null check (current_thinking in ('sell_soon','sell_6_12_months','curious_value','compare_hold_sell','exploring_only')),
  status text not null default 'new' check (status in ('new','under_review','reviewed','report_sent','closed')),
  submitted_at timestamptz not null default now(), reviewed_at timestamptz, reviewed_by uuid references public.profiles(id) on delete set null, report_sent_at timestamptz, created_at timestamptz not null default now()
);
create table public.property_decision_answers (
  id uuid primary key default gen_random_uuid(), submission_id uuid not null references public.property_decision_submissions(id) on delete cascade,
  question_key text not null, question_text text not null, answer text not null, score numeric(5,2) not null, created_at timestamptz not null default now(), unique(submission_id, question_key)
);
create index property_decision_user_idx on public.property_decision_submissions(user_id);
create index property_decision_leads_idx on public.property_decision_submissions(current_thinking, score desc, submitted_at desc);
alter table public.property_decision_submissions enable row level security; alter table public.property_decision_answers enable row level security;
create policy "decision submissions select own or staff" on public.property_decision_submissions for select using (user_id = auth.uid() or public.is_staff());
create policy "decision submissions insert own" on public.property_decision_submissions for insert with check (user_id = auth.uid());
create policy "decision submissions staff update" on public.property_decision_submissions for update using (public.is_staff()) with check (public.is_staff());
create policy "decision answers select own or staff" on public.property_decision_answers for select using (public.is_staff() or exists(select 1 from public.property_decision_submissions s where s.id = submission_id and s.user_id = auth.uid()));
create policy "decision answers insert own" on public.property_decision_answers for insert with check (exists(select 1 from public.property_decision_submissions s where s.id = submission_id and s.user_id = auth.uid()));

create or replace function public.submit_property_decision(p_property_id uuid, p_answers jsonb, p_current_thinking text)
returns table (submission_id uuid, score numeric, result_level text) language plpgsql security invoker set search_path = '' as $$
declare v_user_id uuid := auth.uid(); v_submission_id uuid; v_score numeric(5,2); v_level text;
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;
  if not exists(select 1 from public.properties where id=p_property_id and owner_id=v_user_id) then raise exception 'Property not found or access denied'; end if;
  if p_current_thinking not in ('sell_soon','sell_6_12_months','curious_value','compare_hold_sell','exploring_only') then raise exception 'Current thinking is required'; end if;
  if jsonb_typeof(p_answers)<>'array' or jsonb_array_length(p_answers)<>10 or (select count(distinct x->>'question_key') from jsonb_array_elements(p_answers)x)<>10 then raise exception 'Exactly 10 answers are required'; end if;
  if exists(select 1 from jsonb_array_elements(p_answers)x where coalesce(x->>'question_key','') not in ('goal_alignment','market_value_awareness','capital_growth_awareness','investment_performance','upcoming_costs','next_goal','selling_cost_awareness','local_market_awareness','twelve_month_intent','confidential_assessment') or coalesce(x->>'answer_code','') not in ('low','moderate','high','very_high') or length(trim(coalesce(x->>'answer','')))=0) then raise exception 'One or more answers are invalid'; end if;
  select sum(case x->>'answer_code' when 'low' then 2.5 when 'moderate' then 5 when 'high' then 7.5 when 'very_high' then 10 end) into v_score from jsonb_array_elements(p_answers)x;
  v_level := case when v_score>=80 then 'explore' when v_score>=60 then 'review' else 'hold' end;
  insert into public.property_decision_submissions(user_id,property_id,score,result_level,current_thinking) values(v_user_id,p_property_id,v_score,v_level,p_current_thinking) returning id into v_submission_id;
  insert into public.property_decision_answers(submission_id,question_key,question_text,answer,score) select v_submission_id,x->>'question_key',x->>'question_text',x->>'answer',case x->>'answer_code' when 'low' then 2.5 when 'moderate' then 5 when 'high' then 7.5 when 'very_high' then 10 end from jsonb_array_elements(p_answers)x;
  return query select v_submission_id,v_score,v_level;
end; $$;
revoke all on function public.submit_property_decision(uuid,jsonb,text) from public; grant execute on function public.submit_property_decision(uuid,jsonb,text) to authenticated;

alter table public.admin_notes drop constraint if exists admin_notes_submission_type_check;
alter table public.admin_notes add constraint admin_notes_submission_type_check check (submission_type in ('health_check','ready_to_rent','property_decision'));
create or replace function public.validate_admin_note_submission() returns trigger language plpgsql set search_path='' as $$ begin
 if new.submission_type='health_check' and not exists(select 1 from public.health_check_submissions where id=new.submission_id) then raise exception 'Submission does not exist'; end if;
 if new.submission_type='ready_to_rent' and not exists(select 1 from public.ready_to_rent_submissions where id=new.submission_id) then raise exception 'Submission does not exist'; end if;
 if new.submission_type='property_decision' and not exists(select 1 from public.property_decision_submissions where id=new.submission_id) then raise exception 'Submission does not exist'; end if; return new; end; $$;
create policy "members select own decision feedback" on public.admin_notes for select using (submission_type='property_decision' and exists(select 1 from public.property_decision_submissions s where s.id=submission_id and s.user_id=auth.uid()));
