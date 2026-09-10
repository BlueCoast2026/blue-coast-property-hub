import Link from "next/link";
import Image from "next/image";
import { ArrowRight, CalendarDays, Newspaper, UserRound } from "lucide-react";
import { PageContainer } from "@/components/layout/page-container";
import { requireUser } from "@/lib/auth/permissions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Property Blog" };

export default async function BlogPage() {
  const { supabase } = await requireUser();
  const { data: posts, error } = await supabase.from("blog_posts").select("id, title, slug, excerpt, cover_image_path, author_name, published_at, created_at").eq("published", true).order("published_at", { ascending: false });
  return <PageContainer>
    <header className="mb-8 border-b border-line pb-8"><span className="grid size-12 place-items-center rounded-xl bg-sky text-coastal"><Newspaper className="size-5" /></span><p className="mt-6 text-sm font-semibold uppercase tracking-[0.18em] text-coastal">Blue Coast Realty Blog</p><h1 className="mt-3 font-display text-4xl font-medium text-navy sm:text-5xl">Property knowledge and practical insights</h1><p className="mt-4 max-w-3xl leading-7 text-muted">Articles for property owners, investors and tenants across Brisbane and the Gold Coast.</p></header>
    {error ? <p className="rounded-2xl border border-line bg-white p-7 text-muted">The Blog is being prepared. Please check again after the Blog database setup is complete.</p> : posts?.length ? <section className="space-y-5" aria-label="Blog articles">{posts.map((post) => {
      const imageUrl = post.cover_image_path ? supabase.storage.from("blog-media").getPublicUrl(post.cover_image_path).data.publicUrl : null;
      const date = new Intl.DateTimeFormat("en-AU", { dateStyle: "long" }).format(new Date(post.published_at ?? post.created_at));
      return <article key={post.id} className="group overflow-hidden rounded-2xl border border-line bg-white shadow-card transition hover:-translate-y-0.5 hover:shadow-card-hover md:grid md:grid-cols-[260px_1fr]">
        <div className="relative h-52 bg-navy md:h-full md:min-h-64">{imageUrl ? <Image src={imageUrl} alt="" fill sizes="(min-width: 768px) 260px, 100vw" className="object-cover" /> : <div className="grid size-full place-items-center bg-gradient-to-br from-navy to-coastal"><Newspaper className="size-12 text-white/70" /></div>}</div>
        <div className="flex flex-col p-6 sm:p-8"><div className="flex flex-wrap gap-x-5 gap-y-2 text-xs font-medium uppercase tracking-wider text-muted"><span className="inline-flex items-center gap-1.5"><CalendarDays className="size-3.5" />{date}</span><span className="inline-flex items-center gap-1.5"><UserRound className="size-3.5" />{post.author_name}</span></div><h2 className="mt-4 font-display text-3xl font-medium text-navy">{post.title}</h2><p className="mt-4 flex-1 text-sm leading-7 text-muted">{post.excerpt}</p><Link href={`/dashboard/blog/${post.slug}`} className="mt-6 inline-flex items-center gap-2 self-start text-sm font-semibold text-coastal">Read full article<ArrowRight className="size-4 transition group-hover:translate-x-1" /></Link></div>
      </article>;
    })}</section> : <p className="rounded-2xl border border-line bg-white p-10 text-center text-muted">The first Blue Coast Realty article is being prepared.</p>}
  </PageContainer>;
}
