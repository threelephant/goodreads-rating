import { describe, it, expect } from "vitest";
import { reviewScore, totalReviews, steamRating } from "./rating";

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
