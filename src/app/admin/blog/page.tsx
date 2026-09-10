import Link from "next/link";
import { ArrowLeft, Newspaper } from "lucide-react";
import { BlogPostForm } from "@/components/admin/blog-post-form";
import { DeleteBlogPostForm } from "@/components/admin/delete-blog-post-form";
import { requireAdmin } from "@/lib/auth/permissions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Blog CMS" };

export default async function AdminBlogPage() {
  const { supabase } = await requireAdmin();
  const { data: posts } = await supabase.from("blog_posts").select("id, title, slug, author_name, published, published_at, created_at").order("created_at", { ascending: false });
  return <main className="min-h-screen bg-mist px-5 py-10 sm:px-8 lg:px-12"><div className="mx-auto max-w-6xl">
    <Link href="/admin" className="inline-flex items-center gap-2 text-sm font-semibold text-muted hover:text-navy"><ArrowLeft className="size-4" />Admin dashboard</Link>
    <header className="mt-8 border-b border-line pb-8"><p className="text-sm font-semibold uppercase tracking-[0.18em] text-coastal">Administrator only</p><h1 className="mt-3 font-display text-4xl font-medium text-navy sm:text-5xl">Blog CMS</h1><p className="mt-3 max-w-2xl text-muted">Create property articles with text, a cover image and an optional video.</p></header>
    <section className="mt-8 rounded-2xl border border-line bg-white p-6 shadow-card sm:p-8"><h2 className="text-xl font-semibold text-navy">Add article</h2><BlogPostForm /></section>
    <section className="mt-8 rounded-2xl border border-line bg-white p-6 shadow-card sm:p-8"><div className="flex items-center justify-between gap-4"><h2 className="text-xl font-semibold text-navy">Article library</h2><span className="rounded-full bg-mist px-3 py-1 text-xs font-semibold text-muted">{posts?.length ?? 0} articles</span></div>{posts?.length ? <div className="mt-5 divide-y divide-line">{posts.map((post) => <article key={post.id} className="grid gap-4 py-5 sm:grid-cols-[1fr_auto_auto] sm:items-center"><div><h3 className="font-semibold text-navy">{post.title}</h3><p className="mt-1 text-sm text-muted">{post.author_name} · {new Intl.DateTimeFormat("en-AU", { dateStyle: "medium" }).format(new Date(post.published_at ?? post.created_at))}</p></div><span className={`inline-flex items-center gap-2 justify-self-start rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider ${post.published ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-muted"}`}><Newspaper className="size-3.5" />{post.published ? "Published" : "Draft"}</span><DeleteBlogPostForm id={post.id} title={post.title} /></article>)}</div> : <p className="mt-5 rounded-xl bg-mist p-5 text-sm text-muted">No articles have been added yet.</p>}</section>
  </div></main>;
}
