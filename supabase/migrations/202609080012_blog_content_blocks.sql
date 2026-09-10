alter table public.blog_posts
add column if not exists content jsonb not null default '[]'::jsonb;

alter table public.blog_posts drop constraint if exists blog_posts_content_check;
alter table public.blog_posts add constraint blog_posts_content_check
check (jsonb_typeof(content) = 'array' and jsonb_array_length(content) <= 30);

update public.blog_posts
set content =
  case when cover_image_path is not null then jsonb_build_array(jsonb_build_object('type', 'image', 'path', cover_image_path, 'caption', '')) else '[]'::jsonb end
  || jsonb_build_array(jsonb_build_object('type', 'text', 'text', body))
  || case when video_url is not null then jsonb_build_array(jsonb_build_object('type', 'video', 'url', video_url)) else '[]'::jsonb end
where content = '[]'::jsonb;
