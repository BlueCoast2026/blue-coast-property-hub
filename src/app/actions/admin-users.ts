"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin, type AppRole } from "@/lib/auth/permissions";
import { createAdminClient } from "@/lib/supabase/admin";

export type UserRoleState = { error?: string; success?: string };
const roles = new Set<AppRole>(["member", "property_manager", "admin"]);
const userTypes = new Set(["Property Owner", "Investor", "Tenant", "Other"]);

export async function inviteUser(_state: UserRoleState, formData: FormData): Promise<UserRoleState> {
  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastName = String(formData.get("lastName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const phone = String(formData.get("phone") ?? "").trim();
  const userType = String(formData.get("userType") ?? "Other");
  const role = String(formData.get("role") ?? "member") as AppRole;
  if (!firstName || !lastName || !/^\S+@\S+\.\S+$/.test(email)) return { error: "Enter a valid name and email address." };
  if (!roles.has(role) || !userTypes.has(userType)) return { error: "Choose a valid user type and role." };

  await requireAdmin();
  let adminClient;
  try {
    adminClient = createAdminClient();
  } catch (error) {
    return { error: error instanceof Error ? error.message : "The admin service is not configured." };
  }

  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
  const { data, error } = await adminClient.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${siteUrl}/reset-password`,
    data: { first_name: firstName, last_name: lastName, phone, user_type: userType },
  });
  if (error || !data.user) return { error: error?.message ?? "The invitation could not be created." };

  const { error: profileError } = await adminClient.from("profiles").update({ role }).eq("id", data.user.id);
  if (profileError) {
    await adminClient.auth.admin.deleteUser(data.user.id);
    return { error: "The invitation was rolled back because its role could not be assigned." };
  }

  revalidatePath("/admin/users");
  revalidatePath("/admin");
  return { success: `Invitation sent to ${email} as ${role.replace("_", " ")}.` };
}

export async function deleteUser(_state: UserRoleState, formData: FormData): Promise<UserRoleState> {
  const profileId = String(formData.get("profileId") ?? "");
  if (!profileId) return { error: "A valid user is required." };

  const { supabase, user } = await requireAdmin();
  if (profileId === user.id) return { error: "You cannot delete your own administrator account." };
  const { data: target } = await supabase.from("profiles").select("role, email").eq("id", profileId).single();
  if (!target) return { error: "User not found." };
  if (target.role === "admin") {
    const { count } = await supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "admin");
    if ((count ?? 0) <= 1) return { error: "The final administrator cannot be deleted." };
  }

  let adminClient;
  try {
    adminClient = createAdminClient();
  } catch (error) {
    return { error: error instanceof Error ? error.message : "The admin service is not configured." };
  }
  const { error } = await adminClient.auth.admin.deleteUser(profileId);
  if (error) return { error: error.message };

  revalidatePath("/admin/users");
  revalidatePath("/admin");
  return { success: `${target.email || "User"} was deleted.` };
}

export async function updateUserRole(_state: UserRoleState, formData: FormData): Promise<UserRoleState> {
  const profileId = String(formData.get("profileId") ?? "");
  const role = String(formData.get("role") ?? "") as AppRole;
  if (!profileId || !roles.has(role)) return { error: "Choose a valid user role." };

  const { supabase, user } = await requireAdmin();
  if (profileId === user.id) return { error: "Your own administrator role cannot be changed here." };

  const { error, count } = await supabase
    .from("profiles")
    .update({ role }, { count: "exact" })
    .eq("id", profileId);
  if (error || count !== 1) return { error: "The user role could not be updated." };

  revalidatePath("/admin/users");
  revalidatePath("/admin");
  return { success: "Role updated." };
}
