create table public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  title text not null check (length(trim(title)) between 3 and 160),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  excerpt text not null check (length(trim(excerpt)) between 20 and 1200),
  body text not null check (length(trim(body)) >= 20),
  cover_image_path text,
  video_url text,
  author_id uuid references public.profiles(id) on delete set null,
  author_name text not null,
  published boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index blog_posts_published_idx on public.blog_posts(published, published_at desc);
create trigger blog_posts_set_updated_at before update on public.blog_posts
for each row execute function public.set_updated_at();
alter table public.blog_posts enable row level security;

create policy "blog_posts_read_published_or_staff" on public.blog_posts for select
using (published or public.is_staff());
create policy "blog_posts_admin_insert" on public.blog_posts for insert
with check (public.is_admin() and author_id = (select auth.uid()));
create policy "blog_posts_admin_update" on public.blog_posts for update
using (public.is_admin()) with check (public.is_admin());
create policy "blog_posts_admin_delete" on public.blog_posts for delete
using (public.is_admin());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('blog-media', 'blog-media', true, 8388608, array['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
on conflict (id) do update set public = true, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create policy "blog_media_public_select" on storage.objects for select
using (bucket_id = 'blog-media');
create policy "blog_media_admin_insert" on storage.objects for insert
with check (bucket_id = 'blog-media' and public.is_admin());
create policy "blog_media_admin_update" on storage.objects for update
using (bucket_id = 'blog-media' and public.is_admin())
with check (bucket_id = 'blog-media' and public.is_admin());
create policy "blog_media_admin_delete" on storage.objects for delete
using (bucket_id = 'blog-media' and public.is_admin());
