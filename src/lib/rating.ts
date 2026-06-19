/**
 * The SteamDB rating formula, adapted to Goodreads' 5-star scale.
 *
 * This module is the single source of truth for the ranking. The data file ships
 * raw per-star counts; the rating is derived here at load time (10k rows is
 * instant), so the mapping below can be changed without re-running the ETL.
 *
 * Mapping (weighted): each star contributes a positive fraction —
 *   5★ = 1.0, 4★ = 0.75, 3★ = 0.5, 2★ = 0.25, 1★ = 0.0
 * so Review Score = positive / total = (avgStars - 1) / 4.
 *
 * SteamDB formula:
 *   Total    = positive + negative                      (here: total ratings)
 *   Score    = positive / total
 *   Rating   = Score - (Score - 0.5) * 2^(-log10(Total + 1))
 * The shrink term pulls low-sample scores toward 0.5, so a book needs both a
 * high average and many ratings to rank near the top.
 */

export interface StarCounts {
  r1: number;
  r2: number;
  r3: number;
  r4: number;
  r5: number;
}

/** Total number of ratings (the SteamDB "Total Reviews"). */
export function totalReviews({ r1, r2, r3, r4, r5 }: StarCounts): number {
  return r1 + r2 + r3 + r4 + r5;
}

/** Weighted positive fraction in [0,1]; equals (avgStars - 1) / 4. */
export function reviewScore({ r1, r2, r3, r4, r5 }: StarCounts): number {
  const total = r1 + r2 + r3 + r4 + r5;
  if (total === 0) return 0;
  const positive = r2 * 0.25 + r3 * 0.5 + r4 * 0.75 + r5 * 1;
  return positive / total;
}

/** SteamDB-style rating in [0,1]. Multiply by 100 for the percentage shown in the UI. */
export function steamRating(counts: StarCounts): number {
  const score = reviewScore(counts);
  const total = totalReviews(counts);
  return score - (score - 0.5) * Math.pow(2, -Math.log10(total + 1));
}
