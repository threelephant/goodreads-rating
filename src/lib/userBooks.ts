import { supabase } from "./supabase";
import { starCountsFromAverage } from "./rating";
import type { Book, NewBookInput } from "./types";

const TABLE = "user_books";

/** A row as stored in the Supabase `user_books` table. */
interface UserBookRow {
  id: string;
  title: string;
  authors: string;
  year: number | null;
  avg: number;
  ratings_count: number;
  created_at: string;
}

/** Map a DB row to a `Book`, synthesizing the star distribution from avg + count. */
function rowToBook(row: UserBookRow): Book {
  return {
    id: row.id,
    title: row.title,
    authors: row.authors,
    year: row.year,
    avg: row.avg,
    userAdded: true,
    ...starCountsFromAverage(row.avg, row.ratings_count),
  };
}

/** Fetch all shared, user-added books (newest first). Returns [] when disabled. */
export async function fetchUserBooks(): Promise<Book[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from(TABLE)
    .select("id,title,authors,year,avg,ratings_count,created_at")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data as UserBookRow[]).map(rowToBook);
}

/** Insert one book and return it mapped to a `Book`. Throws if disabled or on error. */
export async function addUserBook(input: NewBookInput): Promise<Book> {
  if (!supabase) throw new Error("Adding books is not configured.");
  const { data, error } = await supabase
    .from(TABLE)
    .insert({
      title: input.title,
      authors: input.authors,
      year: input.year,
      avg: input.avg,
      ratings_count: input.ratingsCount,
    })
    .select("id,title,authors,year,avg,ratings_count,created_at")
    .single();
  if (error) throw error;
  return rowToBook(data as UserBookRow);
}
