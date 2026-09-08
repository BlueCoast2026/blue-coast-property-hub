"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export function RecoverySession() {
  useEffect(() => {
    const supabase = createClient();
    void supabase.auth.getSession();
  }, []);
  return null;
}
