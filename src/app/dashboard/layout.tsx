import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileHeader } from "@/components/layout/mobile-header";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { getLanguage } from "@/lib/i18n-server";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  if (!hasSupabaseEnv()) redirect("/login");
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login");

  const language = await getLanguage();
  return <div className="min-h-screen bg-mist"><Sidebar language={language} /><MobileHeader language={language} /><main className="lg:pl-72">{children}</main></div>;
}
