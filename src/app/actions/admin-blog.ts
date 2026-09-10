"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/permissions";
import { getVideoEmbed } from "@/lib/blog/video";

export type BlogState = { error?: string; success?: string };

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export async function createBlogPost(_state: BlogState, formData: FormData): Promise<BlogState> {
  const title = String(formData.get("title") ?? "").trim();
  const excerpt = String(formData.get("excerpt") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const videoUrl = String(formData.get("videoUrl") ?? "").trim();
  const published = formData.get("published") === "on";
  const image = formData.get("coverImage");
  const baseSlug = slugify(title);
  const slug = `${baseSlug}-${randomUUID().slice(0, 8)}`;

  if (title.length < 3 || title.length > 160 || !baseSlug) return { error: "Title must be between 3 and 160 characters." };
  if (excerpt.length < 20 || excerpt.length > 1200) return { error: "Introduction must be between 20 and 1,200 characters (about 200 words)." };
  if (body.length < 20) return { error: "Article content must be at least 20 characters." };
  if (videoUrl && !getVideoEmbed(videoUrl)) return { error: "Use a valid YouTube, Vimeo, MP4, WebM or OGG video URL." };
  if (image instanceof File && image.size > 0) {
    if (!image.type.startsWith("image/")) return { error: "Cover media must be an image." };
    if (image.size > 8 * 1024 * 1024) return { error: "Cover image must be 8 MB or smaller." };
  }

  const { supabase, user } = await requireAdmin();
  const { data: profile } = await supabase.from("profiles").select("first_name, last_name").eq("id", user.id).single();
  const authorName = profile ? `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim() || user.email || "Blue Coast Realty" : user.email || "Blue Coast Realty";
  let coverImagePath: string | null = null;
  if (image instanceof File && image.size > 0) {
    const extension = image.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
    coverImagePath = `${slug}/${randomUUID()}.${extension}`;
    const { error } = await supabase.storage.from("blog-media").upload(coverImagePath, new Uint8Array(await image.arrayBuffer()), { contentType: image.type, upsert: false });
    if (error) return { error: "The cover image could not be uploaded. Confirm migration 011 has been run." };
  }

  const { error } = await supabase.from("blog_posts").insert({ title, slug, excerpt, body, cover_image_path: coverImagePath, video_url: videoUrl || null, author_id: user.id, author_name: authorName, published, published_at: published ? new Date().toISOString() : null });
  if (error) {
    if (coverImagePath) await supabase.storage.from("blog-media").remove([coverImagePath]);
    return { error: "The article could not be saved. Confirm migration 011 has been run." };
  }
  revalidatePath("/admin/blog");
  revalidatePath("/dashboard/blog");
  return { success: `${title} was ${published ? "published" : "saved as a draft"}.` };
}

export async function deleteBlogPost(_state: BlogState, formData: FormData): Promise<BlogState> {
  const id = String(formData.get("id") ?? "");
  if (!/^[0-9a-f-]{36}$/i.test(id)) return { error: "Invalid article." };
  const { supabase } = await requireAdmin();
  const { data: post } = await supabase.from("blog_posts").select("title, slug, cover_image_path").eq("id", id).single();
  if (!post) return { error: "Article not found." };
  if (post.cover_image_path) {
    const { error } = await supabase.storage.from("blog-media").remove([post.cover_image_path]);
    if (error) return { error: "The cover image could not be removed, so the article was not deleted." };
  }
  const { error } = await supabase.from("blog_posts").delete().eq("id", id);
  if (error) return { error: "The article could not be deleted." };
  revalidatePath("/admin/blog");
  revalidatePath("/dashboard/blog");
  revalidatePath(`/dashboard/blog/${post.slug}`);
  return { success: `${post.title} was deleted.` };
}
