"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/permissions";
import { getVideoEmbed } from "@/lib/blog/video";

export type BlogState = { error?: string; success?: string };
type ManifestBlock = { id: string; type: "text" | "image" | "video" };
type ContentBlock = { type: "text"; text: string } | { type: "image"; path: string; caption: string } | { type: "video"; url: string };

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function readManifest(formData: FormData): ManifestBlock[] | null {
  try {
    const parsed: unknown = JSON.parse(String(formData.get("contentManifest") ?? "[]"));
    if (!Array.isArray(parsed) || parsed.length < 1 || parsed.length > 30) return null;
    const blocks = parsed as Array<Record<string, unknown>>;
    if (blocks.some((block) => typeof block.id !== "string" || !/^[a-zA-Z0-9-]{1,64}$/.test(block.id) || !["text", "image", "video"].includes(String(block.type)))) return null;
    if (new Set(blocks.map((block) => block.id)).size !== blocks.length) return null;
    return blocks as ManifestBlock[];
  } catch { return null; }
}

export async function createBlogPost(_state: BlogState, formData: FormData): Promise<BlogState> {
  const title = String(formData.get("title") ?? "").trim();
  const excerpt = String(formData.get("excerpt") ?? "").trim();
  const requestedAuthor = String(formData.get("authorName") ?? "").trim();
  const publishDateTime = String(formData.get("publishDateTime") ?? "").trim();
  const published = formData.get("published") === "on";
  const manifest = readManifest(formData);
  const baseSlug = slugify(title);
  const slug = `${baseSlug}-${randomUUID().slice(0, 8)}`;

  if (title.length < 3 || title.length > 160 || !baseSlug) return { error: "Title must be between 3 and 160 characters." };
  if (excerpt.length < 20 || excerpt.length > 1200) return { error: "Introduction must be between 20 and 1,200 characters (about 200 words)." };
  if (requestedAuthor.length > 120) return { error: "Author name must be 120 characters or fewer." };
  if (!manifest) return { error: "Article content blocks are invalid. Please refresh and try again." };

  let scheduledDate: Date | null = null;
  if (publishDateTime) {
    if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(publishDateTime)) return { error: "Choose a valid publication date and time." };
    scheduledDate = new Date(`${publishDateTime}:00+10:00`);
    if (Number.isNaN(scheduledDate.getTime())) return { error: "Choose a valid publication date and time." };
  }

  let totalImageBytes = 0;
  for (const block of manifest) {
    if (block.type === "text" && String(formData.get(`text_${block.id}`) ?? "").trim().length < 1) return { error: "Every text block needs content." };
    if (block.type === "video" && !getVideoEmbed(String(formData.get(`video_${block.id}`) ?? "").trim())) return { error: "Every video block needs a valid YouTube, Vimeo, MP4, WebM or OGG URL." };
    if (block.type === "image") {
      const image = formData.get(`image_${block.id}`);
      if (!(image instanceof File) || image.size === 0) return { error: "Choose an image for every image block." };
      if (!new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]).has(image.type)) return { error: "Images must be JPG, PNG, WebP or GIF." };
      if (image.size > 8 * 1024 * 1024) return { error: "Each image must be 8 MB or smaller." };
      totalImageBytes += image.size;
    }
  }
  if (totalImageBytes > 12 * 1024 * 1024) return { error: "The combined images must be 12 MB or smaller." };

  const { supabase, user } = await requireAdmin();
  const { data: profile } = await supabase.from("profiles").select("first_name, last_name").eq("id", user.id).single();
  const accountName = profile ? `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim() : "";
  const authorName = requestedAuthor || accountName || user.email || "Blue Coast Realty";
  const content: ContentBlock[] = [];
  const uploadedPaths: string[] = [];

  for (const block of manifest) {
    if (block.type === "text") content.push({ type: "text", text: String(formData.get(`text_${block.id}`) ?? "").trim() });
    if (block.type === "video") content.push({ type: "video", url: String(formData.get(`video_${block.id}`) ?? "").trim() });
    if (block.type === "image") {
      const image = formData.get(`image_${block.id}`) as File;
      const extension = image.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
      const storagePath = `${slug}/${randomUUID()}.${extension}`;
      const { error } = await supabase.storage.from("blog-media").upload(storagePath, new Uint8Array(await image.arrayBuffer()), { contentType: image.type, upsert: false });
      if (error) { if (uploadedPaths.length) await supabase.storage.from("blog-media").remove(uploadedPaths); return { error: "An article image could not be uploaded. Confirm migration 012 has been run." }; }
      uploadedPaths.push(storagePath);
      content.push({ type: "image", path: storagePath, caption: String(formData.get(`caption_${block.id}`) ?? "").trim().slice(0, 240) });
    }
  }

  const body = content.filter((block): block is Extract<ContentBlock, { type: "text" }> => block.type === "text").map((block) => block.text).join("\n\n") || "Media article";
  const coverImagePath = content.find((block): block is Extract<ContentBlock, { type: "image" }> => block.type === "image")?.path ?? null;
  const firstVideo = content.find((block): block is Extract<ContentBlock, { type: "video" }> => block.type === "video")?.url ?? null;
  const { error } = await supabase.from("blog_posts").insert({ title, slug, excerpt, body, content, cover_image_path: coverImagePath, video_url: firstVideo, author_id: user.id, author_name: authorName, published, published_at: published ? (scheduledDate ?? new Date()).toISOString() : scheduledDate?.toISOString() ?? null });
  if (error) { if (uploadedPaths.length) await supabase.storage.from("blog-media").remove(uploadedPaths); return { error: "The article could not be saved. Confirm migrations 011 and 012 have been run." }; }
  revalidatePath("/admin/blog"); revalidatePath("/dashboard/blog");
  return { success: `${title} was ${published ? "published" : "saved as a draft"}.` };
}

export async function deleteBlogPost(_state: BlogState, formData: FormData): Promise<BlogState> {
  const id = String(formData.get("id") ?? "");
  if (!/^[0-9a-f-]{36}$/i.test(id)) return { error: "Invalid article." };
  const { supabase } = await requireAdmin();
  const { data: post } = await supabase.from("blog_posts").select("title, slug, cover_image_path, content").eq("id", id).single();
  if (!post) return { error: "Article not found." };
  const content = Array.isArray(post.content) ? post.content as Array<Record<string, unknown>> : [];
  const paths = [...new Set([post.cover_image_path, ...content.filter((block) => block.type === "image").map((block) => typeof block.path === "string" ? block.path : null)].filter((value): value is string => Boolean(value)))];
  if (paths.length) { const { error } = await supabase.storage.from("blog-media").remove(paths); if (error) return { error: "Article images could not be removed, so the article was not deleted." }; }
  const { error } = await supabase.from("blog_posts").delete().eq("id", id);
  if (error) return { error: "The article could not be deleted." };
  revalidatePath("/admin/blog"); revalidatePath("/dashboard/blog"); revalidatePath(`/dashboard/blog/${post.slug}`);
  return { success: `${post.title} was deleted.` };
}
