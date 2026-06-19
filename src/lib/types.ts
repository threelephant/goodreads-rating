import type { StarCounts } from "./rating";

/** A trimmed record as shipped in public/books.json (see scripts/build-data.ts). */
export interface Book extends StarCounts {
  id: number;
  title: string;
  authors: string;
  year: number | null;
  avg: number;
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
