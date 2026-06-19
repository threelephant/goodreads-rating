import { describe, it, expect } from "vitest";
import {
  reviewScore,
  totalReviews,
  steamRating,
  starCountsFromAverage,
} from "./rating";

const meanOf = (c: { r1: number; r2: number; r3: number; r4: number; r5: number }) => {
  const total = c.r1 + c.r2 + c.r3 + c.r4 + c.r5;
  return total === 0 ? 0 : (c.r1 + 2 * c.r2 + 3 * c.r3 + 4 * c.r4 + 5 * c.r5) / total;
};

const stars = (r1: number, r2: number, r3: number, r4: number, r5: number) => ({
  r1,
  r2,
  r3,
  r4,
  r5,
});

describe("totalReviews", () => {
  it("sums the per-star counts", () => {
    expect(totalReviews(stars(1, 2, 3, 4, 5))).toBe(15);
  });
  it("is 0 for an empty distribution", () => {
    expect(totalReviews(stars(0, 0, 0, 0, 0))).toBe(0);
  });
});

describe("reviewScore", () => {
  it("equals (avgStars - 1) / 4", () => {
    // 3×5★ + 1×3★ -> avg 4.5 -> (4.5 - 1)/4 = 0.875
    expect(reviewScore(stars(0, 0, 1, 0, 3))).toBeCloseTo(0.875, 10);
  });
  it("is exactly 0.5 for a perfectly balanced distribution", () => {
    expect(reviewScore(stars(100, 100, 100, 100, 100))).toBeCloseTo(0.5, 10);
  });
  it("returns 0 for an empty distribution", () => {
    expect(reviewScore(stars(0, 0, 0, 0, 0))).toBe(0);
  });
});

describe("steamRating", () => {
  it("shrinks a perfect-but-tiny score well below 1.0 toward 0.5", () => {
    // 5×5★: score 1.0, total 5 -> 1 - 0.5 * 2^(-log10(6)) ≈ 0.7084
    const rating = steamRating(stars(0, 0, 0, 0, 5));
    expect(rating).toBeCloseTo(0.7084, 3);
    expect(rating).toBeLessThan(0.9);
  });

  it("approaches the true score for very large samples", () => {
    // 10M ×5★: score 1.0, total 1e7 -> 1 - 0.5 * 2^(-7) ≈ 0.99609
    const rating = steamRating(stars(0, 0, 0, 0, 10_000_000));
    expect(rating).toBeCloseTo(0.99609, 4);
    expect(rating).toBeGreaterThan(0.99);
  });

  it("leaves a balanced distribution at 0.5 regardless of sample size", () => {
    // score is exactly 0.5, so the shrink term is zero
    expect(steamRating(stars(10, 10, 10, 10, 10))).toBeCloseTo(0.5, 10);
    expect(steamRating(stars(1_000_000, 1_000_000, 1_000_000, 1_000_000, 1_000_000))).toBeCloseTo(0.5, 10);
  });

  it("ranks high-average + popular above a tiny perfect score (the whole point)", () => {
    const belovedClassic = steamRating(stars(66715, 127936, 560092, 1481305, 2706317)); // Hunger Games
    const tinyPerfect = steamRating(stars(0, 0, 0, 0, 5));
    expect(belovedClassic).toBeGreaterThan(tinyPerfect);
  });
});

describe("starCountsFromAverage", () => {
  it("preserves the total count exactly", () => {
    for (const avg of [1, 2.3, 3.5, 4.34, 4.99]) {
      expect(totalReviews(starCountsFromAverage(avg, 5000))).toBe(5000);
    }
  });

  it("produces a distribution whose mean is within 1/total of the requested avg", () => {
    for (const avg of [1.2, 2.7, 3.0, 4.34, 4.8]) {
      const c = starCountsFromAverage(avg, 10_000);
      expect(meanOf(c)).toBeCloseTo(avg, 3);
    }
  });

  it("makes reviewScore match (avg - 1) / 4 for the synthesized book", () => {
    const c = starCountsFromAverage(4.2, 50_000);
    expect(reviewScore(c)).toBeCloseTo((4.2 - 1) / 4, 4);
  });

  it("handles integer and boundary averages without overflowing star bins", () => {
    expect(starCountsFromAverage(5, 100)).toEqual({ r1: 0, r2: 0, r3: 0, r4: 0, r5: 100 });
    expect(starCountsFromAverage(1, 100)).toEqual({ r1: 100, r2: 0, r3: 0, r4: 0, r5: 0 });
    expect(starCountsFromAverage(4, 100)).toEqual({ r1: 0, r2: 0, r3: 0, r4: 100, r5: 0 });
  });

  it("clamps out-of-range averages into [1,5]", () => {
    expect(totalReviews(starCountsFromAverage(0, 100))).toBe(100);
    expect(totalReviews(starCountsFromAverage(7, 100))).toBe(100);
  });
});
