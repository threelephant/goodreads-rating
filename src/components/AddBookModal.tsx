import { useEffect, useRef, useState } from "react";
import type { Book, NewBookInput } from "../lib/types";
import { addUserBook } from "../lib/userBooks";

interface Props {
  open: boolean;
  onClose: () => void;
  onAdded: (book: Book) => void;
}

const EMPTY = { title: "", authors: "", year: "", avg: "", count: "" };

export function AddBookModal({ open, onClose, onAdded }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [form, setForm] = useState(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync the native <dialog> with the `open` prop (gives us focus-trap, Esc, backdrop).
  useEffect(() => {
    const dlg = dialogRef.current;
    if (!dlg) return;
    if (open && !dlg.open) {
      setForm(EMPTY);
      setError(null);
      dlg.showModal();
    } else if (!open && dlg.open) {
      dlg.close();
    }
  }, [open]);

  const set = (key: keyof typeof EMPTY, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const validate = (): NewBookInput | string => {
    const title = form.title.trim();
    if (!title) return "Title is required.";

    const avg = Number(form.avg);
    if (!form.avg || Number.isNaN(avg) || avg < 1 || avg > 5)
      return "Average must be a number between 1 and 5.";

    const ratingsCount = Number(form.count);
    if (!form.count || !Number.isInteger(ratingsCount) || ratingsCount < 1)
      return "Ratings count must be a whole number of at least 1.";

    let year: number | null = null;
    if (form.year.trim()) {
      const y = Number(form.year);
      if (!Number.isInteger(y)) return "Year must be a whole number.";
      year = y;
    }

    return { title, authors: form.authors.trim(), year, avg, ratingsCount };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = validate();
    if (typeof result === "string") {
      setError(result);
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const book = await addUserBook(result);
      onAdded(book);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add the book.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <dialog
      ref={dialogRef}
      className="modal"
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === dialogRef.current) onClose(); // backdrop click
      }}
    >
      <form className="modal-body" onSubmit={handleSubmit}>
        <h2>Add a book</h2>
        <p className="modal-note">
          Shared with everyone. The SteamDB rating is computed from the average and
          the number of ratings.
        </p>

        <label className="field">
          <span>Title *</span>
          <input
            autoFocus
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
            maxLength={300}
          />
        </label>

        <label className="field">
          <span>Author(s)</span>
          <input
            value={form.authors}
            onChange={(e) => set("authors", e.target.value)}
            maxLength={300}
          />
        </label>

        <div className="field-row">
          <label className="field">
            <span>Average ★ (1–5) *</span>
            <input
              type="number"
              min={1}
              max={5}
              step={0.01}
              value={form.avg}
              onChange={(e) => set("avg", e.target.value)}
            />
          </label>
          <label className="field">
            <span>Ratings count *</span>
            <input
              type="number"
              min={1}
              step={1}
              value={form.count}
              onChange={(e) => set("count", e.target.value)}
            />
          </label>
          <label className="field">
            <span>Year</span>
            <input
              type="number"
              value={form.year}
              onChange={(e) => set("year", e.target.value)}
            />
          </label>
        </div>

        {error && <div className="modal-error">{error}</div>}

        <div className="modal-actions">
          <button type="button" className="btn-secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? "Adding…" : "Add book"}
          </button>
        </div>
      </form>
    </dialog>
  );
}
