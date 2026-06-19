/**
 * Best-effort parser that turns OCR text from a Goodreads book-page screenshot
 * into form fields. Goodreads' header layout is, top to bottom:
 *
 *   <title>            (may wrap to multiple lines)
 *   <author(s)>
 *   ★★★★½  4.51        (stars + average)
 *   1,682,486 ratings · 237,057 reviews
 *   ...
 *   First published May 4, 2021
 *
 * OCR is noisy, so the result is only pre-fill — the user reviews/edits before
 * saving. Returns string fields ready to drop straight into the modal's form
 * state; omits any field it can't find.
 */
export interface ParsedBook {
  title?: string;
  authors?: string;
  avg?: string;
  year?: string;
  count?: string;
}

export function parseGoodreadsText(raw: string): ParsedBook {
  const lines = raw
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  const text = lines.join("\n");
  const out: ParsedBook = {};

  // Ratings count: "1,682,486 ratings" (avoid grabbing the reviews number).
  const count = text.match(/([\d.,]+)\s*ratings\b/i);
  if (count) {
    const n = parseInt(count[1].replace(/[.,]/g, ""), 10);
    if (Number.isFinite(n) && n > 0) out.count = String(n);
  }

  // Average rating: a 0–5 number with a decimal, e.g. "4.51". First match wins
  // (the average sits near the top of the page).
  const avg = text.match(/\b([0-5](?:\.\d{1,2}))\b/);
  if (avg) out.avg = avg[1];

  // Year: prefer "First published … 2021", else the first 19xx/20xx in the text.
  const year =
    text.match(/published[^\d]*(\d{4})/i) ?? text.match(/\b(19\d{2}|20\d{2})\b/);
  if (year) out.year = year[1];

  // Title & author: anchor on the average line (first line containing "X.Y").
  // Author is the line directly above it; title is everything above the author.
  let anchor = lines.findIndex((l) => /[0-5]\.\d/.test(l));
  if (anchor < 1) anchor = lines.findIndex((l) => /\bratings\b/i.test(l)); // fallback
  if (anchor >= 1) {
    out.authors = lines[anchor - 1];
    if (anchor >= 2) out.title = lines.slice(0, anchor - 1).join(" ");
  }

  return out;
}
