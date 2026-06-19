import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Supabase client for the shared "user-added books" store.
 *
 * The URL and anon key are public-safe (access is governed by Row-Level Security)
 * and are injected at build time via Vite env vars. When they're absent, the app
 * degrades gracefully: `userBooksEnabled` is false, the "Add book" button is
 * hidden, and only the static dataset is shown.
 */
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const userBooksEnabled = Boolean(url && anonKey);

export const supabase: SupabaseClient | null = userBooksEnabled
  ? createClient(url!, anonKey!)
  : null;
