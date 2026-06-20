import { useEffect, useRef } from "react";
import type { RankedBook } from "../lib/types";

interface Props {
  open: boolean;
  books: RankedBook[]; // the currently-hidden books, enriched
  onClose: () => void;
  onUnhide: (id: RankedBook["id"]) => void;
  onUnhideAll: () => void;
}

export function HiddenBooksModal({ open, books, onClose, onUnhide, onUnhideAll }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dlg = dialogRef.current;
    if (!dlg) return;
    if (open && !dlg.open) dlg.showModal();
    else if (!open && dlg.open) dlg.close();
  }, [open]);

  // Close automatically once the last hidden book is restored.
  useEffect(() => {
    if (open && books.length === 0) onClose();
  }, [open, books.length, onClose]);

  return (
    <dialog
      ref={dialogRef}
      className="modal"
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === dialogRef.current) onClose();
      }}
    >
      <div className="modal-body">
        <div className="hidden-head">
          <h2>Hidden books</h2>
          {books.length > 0 && (
            <button type="button" className="btn-secondary" onClick={onUnhideAll}>
              Unhide all
            </button>
          )}
        </div>
        <p className="modal-note">
          Hidden books are removed from everyone's list. Unhiding brings them back.
        </p>

        {books.length === 0 ? (
          <div className="status">Nothing is hidden.</div>
        ) : (
          <ul className="hidden-list">
            {books.map((b) => (
              <li key={b.id} className="hidden-row">
                <div className="hidden-info">
                  <span className="hidden-title">{b.title}</span>
                  <span className="hidden-meta">
                    {b.authors || "—"} · {(b.rating * 100).toFixed(1)}%
                  </span>
                </div>
                <button type="button" className="btn-secondary" onClick={() => onUnhide(b.id)}>
                  Unhide
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="modal-actions">
          <button type="button" className="btn-primary" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </dialog>
  );
}
