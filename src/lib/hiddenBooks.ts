import { supabase } from "./supabase";
import type { Book } from "./types";

const TABLE = "hidden_books";

/** Normalize any book id to the text key stored in `hidden_books.book_id`. */
export const hiddenKey = (id: Book["id"]): string => String(id);

/** Fetch the set of hidden book ids (shared across all visitors). [] when disabled. */
export async function fetchHiddenBooks(): Promise<Set<string>> {
  if (!supabase) return new Set();
  const { data, error } = await supabase.from(TABLE).select("book_id");
  if (error) throw error;
  return new Set((data as { book_id: string }[]).map((r) => r.book_id));
}

/** Hide a book for everyone (idempotent). */
export async function hideBook(id: Book["id"]): Promise<void> {
  if (!supabase) throw new Error("Hiding is not configured.");
  const { error } = await supabase
    .from(TABLE)
    .upsert({ book_id: hiddenKey(id) }, { onConflict: "book_id", ignoreDuplicates: true });
  if (error) throw error;
}

/** Un-hide a single book. */
export async function unhideBook(id: Book["id"]): Promise<void> {
  if (!supabase) throw new Error("Hiding is not configured.");
  const { error } = await supabase.from(TABLE).delete().eq("book_id", hiddenKey(id));
  if (error) throw error;
}

/** Un-hide many books at once. */
export async function unhideAll(ids: string[]): Promise<void> {
  if (!supabase || ids.length === 0) return;
  const { error } = await supabase.from(TABLE).delete().in("book_id", ids);
  if (error) throw error;
}
