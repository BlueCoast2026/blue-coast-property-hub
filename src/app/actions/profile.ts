"use server";
import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/permissions";
export type AvatarState = { error?: string; success?: string };
const allowed = new Map([["image/jpeg", "jpg"], ["image/png", "png"], ["image/webp", "webp"]]);
export async function updateAvatar(_state: AvatarState, formData: FormData): Promise<AvatarState> {
  void _state;
  const image = formData.get("avatar");
  if (!(image instanceof File) || !image.size) return { error: "Choose a profile image." };
  const extension = allowed.get(image.type); if (!extension) return { error: "Use a JPG, PNG or WebP image." }; if (image.size > 5 * 1024 * 1024) return { error: "The image must be 5 MB or smaller." };
  const { supabase, user } = await requireUser(); const { data: profile } = await supabase.from("profiles").select("avatar_path").eq("id", user.id).single(); const path = `${user.id}/${randomUUID()}.${extension}`;
  const { error: uploadError } = await supabase.storage.from("profile-avatars").upload(path, new Uint8Array(await image.arrayBuffer()), { contentType: image.type }); if (uploadError) return { error: "Avatar upload failed. Confirm migration 013 has been run." };
  const { error } = await supabase.from("profiles").update({ avatar_path: path, updated_at: new Date().toISOString() }).eq("id", user.id); if (error) { await supabase.storage.from("profile-avatars").remove([path]); return { error: "The profile could not be updated." }; }
  if (profile?.avatar_path) await supabase.storage.from("profile-avatars").remove([profile.avatar_path]); revalidatePath("/dashboard", "layout"); return { success: "Profile image updated." };
}
export async function removeAvatar(_state: AvatarState): Promise<AvatarState> {
  void _state;
  const { supabase, user } = await requireUser(); const { data: profile } = await supabase.from("profiles").select("avatar_path").eq("id", user.id).single(); if (!profile?.avatar_path) return { success: "No profile image to remove." };
  const { error } = await supabase.from("profiles").update({ avatar_path: null, updated_at: new Date().toISOString() }).eq("id", user.id); if (error) return { error: "The profile could not be updated." }; await supabase.storage.from("profile-avatars").remove([profile.avatar_path]); revalidatePath("/dashboard", "layout"); return { success: "Profile image removed." };
}
