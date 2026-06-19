/**
 * One-time ETL: download the goodbooks-10k `books.csv` (the 10,000 most-rated
 * Goodreads books), trim it to the fields the app needs, and write
 * `public/books.json`.
 *
 * The SteamDB rating is NOT computed here — it lives in `src/lib/rating.ts` and
 * is derived at load time from the raw per-star counts shipped in this JSON.
 *
 * Run with:  npm run build:data   (alias for `tsx scripts/build-data.ts`)
 */
import { parse } from "csv-parse/sync";
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

const SOURCE_URL =
  "https://raw.githubusercontent.com/zygmuntz/goodbooks-10k/master/books.csv";
const OUT_PATH = resolve(import.meta.dirname, "..", "public", "books.json");

/** Shape of one trimmed record written to books.json. Keep in sync with src/lib/types.ts. */
interface BookRecord {
  id: number;
  title: string;
  authors: string;
  year: number | null;
  avg: number;
  r1: number;
  r2: number;
  r3: number;
  r4: number;
  r5: number;
}

/** goodbooks-10k stores years as floats ("2008.0") and some are empty / BC (negative). */
function parseYear(raw: string): number | null {
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? Math.trunc(n) : null;
}

function num(raw: string): number {
  const n = Number(raw);
  return Number.isFinite(n) ? n : 0;
}

async function main(): Promise<void> {
  console.log(`Downloading ${SOURCE_URL} ...`);
  const res = await fetch(SOURCE_URL);
  if (!res.ok) {
    throw new Error(`Failed to download books.csv: ${res.status} ${res.statusText}`);
  }
  const csv = await res.text();

  const rows = parse(csv, {
    columns: true,
    skip_empty_lines: true,
  }) as Record<string, string>[];

  console.log(`Parsed ${rows.length} rows. Reshaping...`);

  const books: BookRecord[] = [];
  for (const row of rows) {
    const r1 = num(row.ratings_1);
    const r2 = num(row.ratings_2);
    const r3 = num(row.ratings_3);
    const r4 = num(row.ratings_4);
    const r5 = num(row.ratings_5);

    // Drop rows with no per-star data (the rating is undefined for them).
    if (r1 + r2 + r3 + r4 + r5 === 0) continue;

    books.push({
      id: num(row.book_id),
      title: row.title?.trim() ?? "",
      authors: row.authors?.trim() ?? "",
      year: parseYear(row.original_publication_year),
      avg: num(row.average_rating),
      r1,
      r2,
      r3,
      r4,
      r5,
    });
  }

  writeFileSync(OUT_PATH, JSON.stringify(books));
  console.log(`Wrote ${books.length} books to ${OUT_PATH}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
