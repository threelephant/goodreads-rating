import { useCallback, useEffect, useMemo, useState } from "react";
import "./App.css";
import type { Book, RankedBook, SortDir, SortKey } from "./lib/types";
import { reviewScore, steamRating, totalReviews } from "./lib/rating";
import { userBooksEnabled } from "./lib/supabase";
import { fetchUserBooks } from "./lib/userBooks";
import { SearchBar } from "./components/SearchBar";
import { Filters } from "./components/Filters";
import { BookTable } from "./components/BookTable";
import { Pagination } from "./components/Pagination";
import { AddBookModal } from "./components/AddBookModal";

const PAGE_SIZE = 50;
const countFmt = new Intl.NumberFormat("en-US");

const enrich = (b: Book): RankedBook => ({
  ...b,
  total: totalReviews(b),
  score: reviewScore(b),
  rating: steamRating(b),
});

export default function App() {
  const [books, setBooks] = useState<RankedBook[] | null>(null);
  const [userBooks, setUserBooks] = useState<RankedBook[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [minRatings, setMinRatings] = useState(0);
  const [yearFrom, setYearFrom] = useState<number | "">("");
  const [yearTo, setYearTo] = useState<number | "">("");

  const [sortKey, setSortKey] = useState<SortKey>("rating");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(1);

  const [modalOpen, setModalOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  // Load the static dataset once, enriching each book with the derived fields.
  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}books.json`)
      .then((r) => {
        if (!r.ok) throw new Error(`Failed to load books.json (HTTP ${r.status})`);
        return r.json() as Promise<Book[]>;
      })
      .then((data) => setBooks(data.map(enrich)))
      .catch((e) => setError(String(e)));
  }, []);

  // Load shared user-added books (non-blocking; failure is non-fatal).
  useEffect(() => {
    if (!userBooksEnabled) return;
    fetchUserBooks()
      .then((data) => setUserBooks(data.map(enrich)))
      .catch((e) => console.error("Failed to load user-added books:", e));
  }, []);

  const allBooks = useMemo(
    () => (books ? [...books, ...userBooks] : []),
    [books, userBooks],
  );

  // Filter -> sort. Pagination is applied afterwards.
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return allBooks.filter((b) => {
      if (q && !b.title.toLowerCase().includes(q) && !b.authors.toLowerCase().includes(q))
        return false;
      if (minRatings && b.total < minRatings) return false;
      if (yearFrom !== "" && (b.year === null || b.year < yearFrom)) return false;
      if (yearTo !== "" && (b.year === null || b.year > yearTo)) return false;
      return true;
    });
  }, [allBooks, search, minRatings, yearFrom, yearTo]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    const dir = sortDir === "asc" ? 1 : -1;
    arr.sort((a, b) => {
      let cmp: number;
      if (sortKey === "title") {
        cmp = a.title.localeCompare(b.title);
      } else {
        const av = a[sortKey] ?? -Infinity;
        const bv = b[sortKey] ?? -Infinity;
        cmp = (av as number) - (bv as number);
      }
      return cmp * dir;
    });
    return arr;
  }, [filtered, sortKey, sortDir]);

  // Reset to page 1 whenever the result set or ordering changes.
  useEffect(() => {
    setPage(1);
  }, [search, minRatings, yearFrom, yearTo, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageItems = sorted.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const handleSort = useCallback((key: SortKey) => {
    setSortKey((prevKey) => {
      if (prevKey === key) {
        setSortDir((d) => (d === "asc" ? "desc" : "asc"));
        return prevKey;
      }
      // New column: text ascending, numbers descending (highest first).
      setSortDir(key === "title" ? "asc" : "desc");
      return key;
    });
  }, []);

  const handleAdded = useCallback(
    (book: Book) => {
      const ranked = enrich(book);
      setUserBooks((prev) => [ranked, ...prev]);
      // Overall rank by SteamDB rating across every book.
      const better = allBooks.filter((b) => b.rating > ranked.rating).length;
      setNotice(`Added “${ranked.title}” — ranked #${better + 1} by SteamDB rating.`);
    },
    [allBooks],
  );

  return (
    <div className="app">
      <header className="app-header">
        <h1>Goodreads, ranked by the SteamDB formula</h1>
        <p className="subtitle">
          The 10,000 most-rated books, scored so a book needs both a high average{" "}
          <em>and</em> many ratings to rise. Rating ={" "}
          <code>score − (score − 0.5) · 2^(−log₁₀(n + 1))</code>, with stars mapped
          to a positive fraction (5★=100% … 1★=0%).
        </p>
      </header>

      {error && <div className="status error">{error}</div>}
      {!books && !error && <div className="status">Loading 10,000 books…</div>}

      {books && (
        <>
          <div className="controls">
            <SearchBar onChange={setSearch} />
            <Filters
              minRatings={minRatings}
              yearFrom={yearFrom}
              yearTo={yearTo}
              onMinRatings={setMinRatings}
              onYearFrom={setYearFrom}
              onYearTo={setYearTo}
            />
            {userBooksEnabled && (
              <button className="btn-primary add-book-btn" onClick={() => setModalOpen(true)}>
                + Add book
              </button>
            )}
          </div>

          {notice && (
            <div className="notice" role="status">
              {notice}
              <button className="notice-close" onClick={() => setNotice(null)} aria-label="Dismiss">
                ×
              </button>
            </div>
          )}

          <div className="result-meta">
            {countFmt.format(sorted.length)} {sorted.length === 1 ? "book" : "books"} match
          </div>

          {sorted.length === 0 ? (
            <div className="status">No books match these filters.</div>
          ) : (
            <>
              <BookTable
                items={pageItems}
                startRank={(safePage - 1) * PAGE_SIZE + 1}
                sortKey={sortKey}
                sortDir={sortDir}
                onSort={handleSort}
              />
              <Pagination page={safePage} totalPages={totalPages} onPage={setPage} />
            </>
          )}
        </>
      )}

      {userBooksEnabled && (
        <AddBookModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          onAdded={handleAdded}
        />
      )}
    </div>
  );
}
