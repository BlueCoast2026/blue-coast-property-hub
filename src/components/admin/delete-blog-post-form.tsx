"use client";

import { useActionState } from "react";
import { LoaderCircle, Trash2 } from "lucide-react";
import { deleteBlogPost } from "@/app/actions/admin-blog";

export function DeleteBlogPostForm({ id, title }: { id: string; title: string }) {
  const [state, action, pending] = useActionState(deleteBlogPost, {});
  return <form action={action} className="flex flex-col items-start gap-2 sm:items-end"><input type="hidden" name="id" value={id} /><button type="submit" disabled={pending} onClick={(event) => { if (!window.confirm(`Delete “${title}”?`)) event.preventDefault(); }} className="inline-flex h-9 items-center gap-2 rounded-lg border border-red-200 px-3 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50">{pending ? <LoaderCircle className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}Delete</button>{state.error && <p className="max-w-xs text-xs text-red-700">{state.error}</p>}{state.success && <p className="max-w-xs text-xs text-emerald-700">{state.success}</p>}</form>;
}
