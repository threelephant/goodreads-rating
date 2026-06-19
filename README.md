# Goodreads, ranked by the SteamDB formula

A small static web app that lists the **10,000 most-rated Goodreads books**,
ranked not by raw average stars but by [SteamDB's rating
formula](https://steamdb.info/blog/steamdb-rating/). The formula pulls
low-sample scores toward 0.5, so a book needs **both** a high average **and**
many ratings to rise to the top — avoiding the "5.0 average from 7 ratings beats
a beloved 4.4 with a million ratings" problem.

It's a client-only SPA (Vite + React + TypeScript): a one-time ETL script
produces `public/books.json`, and the UI computes the rating, sorts, searches,
and filters entirely in the browser. No backend, no database.

## The formula

```
Total  = total ratings
Score  = positive / Total
Rating = Score − (Score − 0.5) · 2^(−log₁₀(Total + 1))
```

Goodreads uses 1–5 stars, while SteamDB is binary (positive/negative). We map
stars to a **weighted positive fraction**: 5★ = 1.0, 4★ = 0.75, 3★ = 0.5,
2★ = 0.25, 1★ = 0.0. So `Score = (avgStars − 1) / 4`, and the full ratings count
drives the confidence shrink. The rating is shown in the UI as a percentage.

The formula is the single source of truth in
[`src/lib/rating.ts`](src/lib/rating.ts) and is covered by unit tests in
[`src/lib/rating.test.ts`](src/lib/rating.test.ts). To try a different mapping
(e.g. binary 4–5★ positive / 1–2★ negative), edit `reviewScore` and update the
tests — no need to re-run the ETL.

## Data source

[goodbooks-10k](https://github.com/zygmuntz/goodbooks-10k) `books.csv` — the
10,000 most-rated books with per-star counts and metadata. `public/books.json`
is committed, so the app runs without re-running the ETL.

## Getting started

```bash
npm install
npm run build:data   # one-time: download goodbooks-10k → public/books.json (already committed)
npm run dev          # start the dev server
```

Other scripts:

```bash
npm test             # run the rating unit tests (Vitest)
npm run build        # type-check + production build into dist/
npm run preview      # serve the production build
```

## Features

- Ranked table, **sortable** by SteamDB rating (default), raw average, ratings
  count, year, and title.
- **Search** by title or author (debounced).
- **Filters**: minimum ratings count and publication-year range.
- Client-side pagination (50 per page).
- Light/dark theme via `prefers-color-scheme`.

## Project structure

```
scripts/build-data.ts   # ETL: download + reshape books.csv → public/books.json
public/books.json       # generated dataset (committed)
src/lib/rating.ts       # the SteamDB formula (single source of truth)
src/lib/rating.test.ts  # formula unit tests
src/lib/types.ts        # shared types
src/App.tsx             # data load + filter/sort/paginate state
src/components/         # BookTable, SearchBar, Filters, Pagination
```
