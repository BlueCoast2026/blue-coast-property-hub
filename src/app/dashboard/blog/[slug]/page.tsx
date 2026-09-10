import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, UserRound } from "lucide-react";
import { PageContainer } from "@/components/layout/page-container";
import { requireUser } from "@/lib/auth/permissions";
import { getVideoEmbed } from "@/lib/blog/video";

export const dynamic = "force-dynamic";

export default async function BlogArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { supabase } = await requireUser();
  const { data: post } = await supabase.from("blog_posts").select("title, excerpt, body, content, cover_image_path, video_url, author_name, published_at, created_at").eq("slug", slug).eq("published", true).single();
  if (!post) notFound();
  const imageUrl = post.cover_image_path ? supabase.storage.from("blog-media").getPublicUrl(post.cover_image_path).data.publicUrl : null;
  const video = getVideoEmbed(post.video_url);
  const date = new Intl.DateTimeFormat("en-AU", { dateStyle: "long" }).format(new Date(post.published_at ?? post.created_at));
  const paragraphs: string[] = String(post.body).split(/\r?\n\s*\r?\n/).filter(Boolean);
  const blocks = Array.isArray(post.content) ? post.content as Array<Record<string, unknown>> : [];
  return <PageContainer><article className="mx-auto max-w-4xl">
    <Link href="/dashboard/blog" className="inline-flex items-center gap-2 text-sm font-semibold text-muted hover:text-navy"><ArrowLeft className="size-4" />All articles</Link>
    <header className="mt-8 border-b border-line pb-8"><p className="text-sm font-semibold uppercase tracking-[0.18em] text-coastal">Blue Coast Realty Blog</p><h1 className="mt-4 font-display text-4xl font-medium leading-tight text-navy sm:text-6xl">{post.title}</h1><div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted"><span className="inline-flex items-center gap-2"><CalendarDays className="size-4" />{date}</span><span className="inline-flex items-center gap-2"><UserRound className="size-4" />{post.author_name}</span></div><p className="mt-7 text-lg leading-8 text-muted">{post.excerpt}</p></header>
    {blocks.length ? <div className="mt-9 space-y-8">{blocks.map((block, index) => {
      if (block.type === "text" && typeof block.text === "string") return <div key={index} className="space-y-6 text-base leading-8 text-ink">{block.text.split(/\r?\n\s*\r?\n/).filter(Boolean).map((paragraph, paragraphIndex) => <p key={paragraphIndex} className="whitespace-pre-line">{paragraph}</p>)}</div>;
      if (block.type === "image" && typeof block.path === "string") { const blockImageUrl = supabase.storage.from("blog-media").getPublicUrl(block.path).data.publicUrl; return <figure key={index}><div className="relative aspect-[16/9] overflow-hidden rounded-2xl bg-mist"><Image src={blockImageUrl} alt={typeof block.caption === "string" ? block.caption : ""} fill sizes="(min-width: 1024px) 896px, 100vw" className="object-cover" /></div>{typeof block.caption === "string" && block.caption && <figcaption className="mt-3 text-center text-sm text-muted">{block.caption}</figcaption>}</figure>; }
      if (block.type === "video" && typeof block.url === "string") { const blockVideo = getVideoEmbed(block.url); return blockVideo ? <div key={index} className="aspect-video overflow-hidden rounded-2xl bg-black">{blockVideo.type === "iframe" ? <iframe src={blockVideo.src} title={`Video ${index + 1}: ${post.title}`} className="size-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen /> : <video src={blockVideo.src} controls className="size-full" />}</div> : null; }
      return null;
    })}</div> : <><>{imageUrl && <div className="relative mt-8 aspect-[16/9] overflow-hidden rounded-2xl bg-mist"><Image src={imageUrl} alt="" fill sizes="(min-width: 1024px) 896px, 100vw" className="object-cover" /></div>}</><div className="mt-9 space-y-6 text-base leading-8 text-ink">{paragraphs.map((paragraph, index) => <p key={index} className="whitespace-pre-line">{paragraph}</p>)}</div>{video && <section className="mt-10"><h2 className="font-display text-3xl font-medium text-navy">Watch the video</h2><div className="mt-5 aspect-video overflow-hidden rounded-2xl bg-black">{video.type === "iframe" ? <iframe src={video.src} title={`Video: ${post.title}`} className="size-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen /> : <video src={video.src} controls className="size-full" />}</div></section>}</>}
  </article></PageContainer>;
}
