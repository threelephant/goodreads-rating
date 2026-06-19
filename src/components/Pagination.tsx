interface Props {
  page: number;
  totalPages: number;
  onPage: (page: number) => void;
}

export function Pagination({ page, totalPages, onPage }: Props) {
  if (totalPages <= 1) return null;
  return (
    <div className="pagination">
      <button onClick={() => onPage(1)} disabled={page <= 1} aria-label="First page">
        «
      </button>
      <button onClick={() => onPage(page - 1)} disabled={page <= 1} aria-label="Previous page">
        ‹ Prev
      </button>
      <span className="page-status">
        Page {page} of {totalPages}
      </span>
      <button onClick={() => onPage(page + 1)} disabled={page >= totalPages} aria-label="Next page">
        Next ›
      </button>
      <button onClick={() => onPage(totalPages)} disabled={page >= totalPages} aria-label="Last page">
        »
      </button>
    </div>
  );
}
