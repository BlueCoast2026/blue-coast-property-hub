"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export type AuthState = { error?: string; success?: string };

export async function login(_state: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "Enter your email and password." };
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Unable to sign in." };
  }
  redirect("/dashboard");
}

export async function signup(_state: AuthState, formData: FormData): Promise<AuthState> {
  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastName = String(formData.get("lastName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const userTypeMap: Record<string, string> = {
    "property-owner": "Property Owner", investor: "Investor", tenant: "Tenant", other: "Other",
  };
  const userType = userTypeMap[String(formData.get("userType") ?? "property-owner")] ?? "Other";
  if (!firstName || !lastName || !email || !phone || !password) return { error: "Complete all fields to create your account." };
  if (password.length < 8) return { error: "Password must be at least 8 characters." };
  let hasSession = false;
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { first_name: firstName, last_name: lastName, phone, user_type: userType } } });
    if (error) return { error: error.message };
    hasSession = Boolean(data.session);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Unable to create account." };
  }
  if (!hasSession) redirect("/login?message=check-email");
  redirect("/dashboard");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function requestPasswordReset(_state: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) return { error: "Enter your email address." };

  const requestHeaders = await headers();
  const requestOrigin = requestHeaders.get("origin") ?? `http://${requestHeaders.get("host") ?? "localhost:3000"}`;
  const origin = (process.env.NEXT_PUBLIC_SITE_URL ?? requestOrigin).replace(/\/$/, "");
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${origin}/auth/callback?next=/reset-password`,
    });
    if (error) return { error: error.message };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Unable to send the reset email." };
  }
  return { success: "If an account exists for that email, a password reset link has been sent." };
}

export async function updatePassword(_state: AuthState, formData: FormData): Promise<AuthState> {
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");
  if (password.length < 8) return { error: "Password must be at least 8 characters." };
  if (password !== confirmPassword) return { error: "Passwords do not match." };

  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return { error: "This reset link is invalid or has expired. Request a new link." };
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: error.message };
  await supabase.auth.signOut();
  redirect("/login?message=password-updated");
}
