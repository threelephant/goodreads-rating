import { describe, it, expect } from "vitest";
import { parseGoodreadsText } from "./parseGoodreads";

describe("parseGoodreadsText", () => {
  it("parses a clean Goodreads header", () => {
    const text = [
      "Project Hail Mary",
      "Andy Weir",
      "4.51",
      "1,682,486 ratings · 237,057 reviews",
      "Goodreads Choice Award Winner for Readers' Favorite Science Fiction",
      "Ryland Grace is the sole survivor on a desperate, last-chance mission",
      "476 pages, Hardcover",
      "First published May 4, 2021",
    ].join("\n");

    expect(parseGoodreadsText(text)).toEqual({
      title: "Project Hail Mary",
      authors: "Andy Weir",
      avg: "4.51",
      count: "1682486",
      year: "2021",
    });
  });

  it("handles a noisy stars line above the average and a multi-line title", () => {
    const text = [
      "The Lord of the Rings",
      "(The Lord of the Rings, #1-3)",
      "J.R.R. Tolkien",
      "kkkkx 4.59", // stars OCR'd as garbage, average still present
      "672,890 ratings · 14,210 reviews",
      "First published October 20, 1955",
    ].join("\n");

    const r = parseGoodreadsText(text);
    expect(r.title).toBe("The Lord of the Rings (The Lord of the Rings, #1-3)");
    expect(r.authors).toBe("J.R.R. Tolkien");
    expect(r.avg).toBe("4.59");
    expect(r.count).toBe("672890");
    expect(r.year).toBe("1955");
  });

  it("falls back to the ratings line when no decimal average is detected", () => {
    const text = ["Some Title", "Some Author", "12,345 ratings"].join("\n");
    const r = parseGoodreadsText(text);
    expect(r.authors).toBe("Some Author");
    expect(r.title).toBe("Some Title");
    expect(r.count).toBe("12345");
    expect(r.avg).toBeUndefined();
  });

  it("returns an empty object for unrecognizable text", () => {
    expect(parseGoodreadsText("just some random words here")).toEqual({});
  });
});
