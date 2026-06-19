import { useEffect, useState } from "react";

interface Props {
  onChange: (value: string) => void;
}

/** Controlled text input that debounces (~200ms) before notifying the parent. */
export function SearchBar({ onChange }: Props) {
  const [value, setValue] = useState("");

  useEffect(() => {
    const id = setTimeout(() => onChange(value), 200);
    return () => clearTimeout(id);
  }, [value, onChange]);

  return (
    <input
      className="search"
      type="search"
      placeholder="Search title or author…"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      aria-label="Search title or author"
    />
  );
}
