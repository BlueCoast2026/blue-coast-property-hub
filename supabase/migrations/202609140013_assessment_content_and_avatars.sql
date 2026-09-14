create table if not exists public.assessment_question_content (
  assessment_type text not null check (assessment_type in ('health_check', 'ready_to_rent')),
  question_key text not null,
  category_en text not null,
  category_zh text not null,
  question_en text not null,
  question_zh text not null,
  option_labels_en jsonb not null check (jsonb_typeof(option_labels_en) = 'array' and jsonb_array_length(option_labels_en) = 4),
  option_labels_zh jsonb not null check (jsonb_typeof(option_labels_zh) = 'array' and jsonb_array_length(option_labels_zh) = 4),
  updated_at timestamptz not null default now(),
  primary key (assessment_type, question_key)
);
alter table public.assessment_question_content enable row level security;
drop policy if exists "Authenticated users read assessment content" on public.assessment_question_content;
create policy "Authenticated users read assessment content" on public.assessment_question_content for select to authenticated using (true);
drop policy if exists "Admins manage assessment content" on public.assessment_question_content;
create policy "Admins manage assessment content" on public.assessment_question_content for all to authenticated using (public.is_admin()) with check (public.is_admin());

alter table public.profiles add column if not exists avatar_path text;
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values ('profile-avatars', 'profile-avatars', true, 5242880, array['image/jpeg','image/png','image/webp']) on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;
drop policy if exists "Users upload own avatar" on storage.objects;
create policy "Users upload own avatar" on storage.objects for insert to authenticated with check (bucket_id = 'profile-avatars' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "Users update own avatar" on storage.objects;
create policy "Users update own avatar" on storage.objects for update to authenticated using (bucket_id = 'profile-avatars' and (storage.foldername(name))[1] = auth.uid()::text) with check (bucket_id = 'profile-avatars' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "Users delete own avatar" on storage.objects;
create policy "Users delete own avatar" on storage.objects for delete to authenticated using (bucket_id = 'profile-avatars' and (storage.foldername(name))[1] = auth.uid()::text);
