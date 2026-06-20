import type { RankedBook, SortDir, SortKey } from "../lib/types";

interface Props {
  items: RankedBook[];
  startRank: number; // rank of the first row (1-based) within the current sort
  sortKey: SortKey;
  sortDir: SortDir;
  onSort: (key: SortKey) => void;
  onHide?: (id: RankedBook["id"]) => void;
}

const countFmt = new Intl.NumberFormat("en-US");

/** Color the rating by tier, mirroring SteamDB's intuition. */
function ratingClass(rating: number): string {
  if (rating >= 0.8) return "good";
  if (rating >= 0.6) return "mid";
  return "bad";
}

export function BookTable({ items, startRank, sortKey, sortDir, onSort, onHide }: Props) {
  const SortHeader = ({
    col,
    label,
    numeric,
  }: {
    col: SortKey;
    label: string;
    numeric?: boolean;
  }) => {
    const active = sortKey === col;
    return (
      <th
        className={`${numeric ? "num" : ""} sortable${active ? " active" : ""}`}
        onClick={() => onSort(col)}
        aria-sort={active ? (sortDir === "asc" ? "ascending" : "descending") : "none"}
      >
        {label}
        <span className="arrow">{active ? (sortDir === "asc" ? "▲" : "▼") : ""}</span>
      </th>
    );
  };

  return (
    <table className="books">
      <thead>
        <tr>
          <th className="num rank-col">#</th>
          <SortHeader col="title" label="Title" />
          <th>Author(s)</th>
          <SortHeader col="year" label="Year" numeric />
          <SortHeader col="avg" label="Avg ★" numeric />
          <SortHeader col="total" label="Ratings" numeric />
          <SortHeader col="rating" label="SteamDB rating" numeric />
          {onHide && <th className="hide-col" aria-label="Hide" />}
        </tr>
      </thead>
      <tbody>
        {items.map((b, i) => (
          <tr key={b.id} className={b.userAdded ? "user-added" : undefined}>
            <td className="num rank-col">{startRank + i}</td>
            <td className="title-col">
              {b.title}
              {b.userAdded && <span className="added-badge">added</span>}
            </td>
            <td className="author-col">{b.authors}</td>
            <td className="num">{b.year ?? "—"}</td>
            <td className="num">{b.avg.toFixed(2)}</td>
            <td className="num">{countFmt.format(b.total)}</td>
            <td className={`num rating-cell ${ratingClass(b.rating)}`}>
              {(b.rating * 100).toFixed(2)}%
            </td>
            {onHide && (
              <td className="hide-col">
                <button
                  type="button"
                  className="hide-btn"
                  title="Hide this book"
                  aria-label={`Hide ${b.title}`}
                  onClick={() => onHide(b.id)}
                >
                  Hide
                </button>
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
