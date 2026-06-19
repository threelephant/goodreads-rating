import type { StarCounts } from "./rating";

/**
 * A book record. Dataset books (public/books.json) use a numeric `id`; user-added
 * books (from Supabase) use a uuid string. `id` is only used as a React key —
 * sorting and filtering never touch it — so widening it is safe.
 */
export interface Book extends StarCounts {
  id: number | string;
  title: string;
  authors: string;
  year: number | null;
  avg: number;
  userAdded?: boolean;
}

/** The fields collected by the "Add book" modal. */
export interface NewBookInput {
  title: string;
  authors: string;
  year: number | null;
  avg: number; // 1..5
  ratingsCount: number; // >= 1
}

/** A book enriched with the derived ranking fields. */
export interface RankedBook extends Book {
  total: number; // total ratings
  score: number; // review score in [0,1]
  rating: number; // SteamDB rating in [0,1]
}

/** Columns the table can be sorted by. */
export type SortKey = "rating" | "avg" | "total" | "year" | "title";
export type SortDir = "asc" | "desc";
