import "server-only";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type AppRole = "member" | "property_manager" | "admin";

export async function requireUser() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login");
  return { supabase, user: data.user };
}

export async function requireStaff() {
  const { supabase, user } = await requireUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const role = profile?.role as AppRole | undefined;
  if (role !== "admin" && role !== "property_manager") redirect("/dashboard");
  return { supabase, user, role };
}

export async function requireAdmin() {
  const { supabase, user, role } = await requireStaff();
  if (role !== "admin") redirect("/admin");
  return { supabase, user, role };
}
