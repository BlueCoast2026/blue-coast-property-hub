"use client";

import { useActionState } from "react";
import { FilePlus2, LoaderCircle } from "lucide-react";
import { createBlogPost } from "@/app/actions/admin-blog";

export function BlogPostForm() {
  const [state, action, pending] = useActionState(createBlogPost, {});
  return <form action={action} className="mt-6 grid gap-5">
    <label className="text-sm font-medium text-ink">Title<input required name="title" maxLength={160} placeholder="Article title" className="mt-2 h-12 w-full rounded-xl border border-line px-4 outline-none focus:border-coastal" /></label>
    <label className="text-sm font-medium text-ink">Introduction / summary<textarea required name="excerpt" minLength={20} maxLength={1200} rows={5} placeholder="Approximately 200 words introducing the article…" className="mt-2 w-full rounded-xl border border-line px-4 py-3 leading-6 outline-none focus:border-coastal" /><span className="mt-1 block text-xs font-normal text-muted">Shown in the horizontal Blog directory card.</span></label>
    <label className="text-sm font-medium text-ink">Article content<textarea required name="body" minLength={20} rows={14} placeholder="Write the full article. Add a blank line between paragraphs…" className="mt-2 w-full rounded-xl border border-line px-4 py-3 leading-7 outline-none focus:border-coastal" /></label>
    <div className="grid gap-5 sm:grid-cols-2"><label className="text-sm font-medium text-ink">Cover image (optional)<input name="coverImage" type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="mt-2 block w-full rounded-xl border border-line bg-mist px-4 py-3 text-sm" /><span className="mt-1 block text-xs font-normal text-muted">JPG, PNG, WebP or GIF; maximum 8 MB.</span></label><label className="text-sm font-medium text-ink">Video URL (optional)<input name="videoUrl" type="url" placeholder="YouTube, Vimeo or direct MP4 URL" className="mt-2 h-12 w-full rounded-xl border border-line px-4 outline-none focus:border-coastal" /></label></div>
    <label className="flex items-center gap-3 text-sm font-medium text-ink"><input name="published" type="checkbox" className="size-4 accent-[#247fa2]" />Publish immediately</label>
    {state.error && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{state.error}</p>}{state.success && <p role="status" className="rounded-xl bg-sky px-4 py-3 text-sm text-navy">{state.success}</p>}
    <button disabled={pending} className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-navy px-5 text-sm font-semibold text-white disabled:opacity-50 sm:justify-self-start">{pending ? <LoaderCircle className="size-4 animate-spin" /> : <FilePlus2 className="size-4" />}Add article</button>
  </form>;
}
