import { getSupabase, supabaseConfigured } from "@/lib/supabase/client";
import { LocalAccountService, type AccountService } from "./index";
import { SupabaseAccountService } from "./supabase";

let service: AccountService | null = null;

/** Supabase Auth when configured, otherwise accounts kept in this browser. */
export function getAccountService(): AccountService {
  service ??= supabaseConfigured
    ? new SupabaseAccountService(getSupabase)
    : new LocalAccountService();
  return service;
}

/** Local accounts can be looked up synchronously (used to show the teacher's name). */
export function getLocalAccountService(): LocalAccountService {
  return new LocalAccountService();
}
