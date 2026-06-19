interface Props {
  minRatings: number;
  yearFrom: number | "";
  yearTo: number | "";
  onMinRatings: (v: number) => void;
  onYearFrom: (v: number | "") => void;
  onYearTo: (v: number | "") => void;
}

const num = (s: string): number | "" => (s === "" ? "" : Number(s));

export function Filters({
  minRatings,
  yearFrom,
  yearTo,
  onMinRatings,
  onYearFrom,
  onYearTo,
}: Props) {
  return (
    <div className="filters">
      <label className="filter">
        <span>Min ratings</span>
        <input
          type="number"
          min={0}
          step={1000}
          value={minRatings || ""}
          placeholder="0"
          onChange={(e) => onMinRatings(Number(e.target.value) || 0)}
        />
      </label>
      <label className="filter">
        <span>Year from</span>
        <input
          type="number"
          value={yearFrom}
          placeholder="any"
          onChange={(e) => onYearFrom(num(e.target.value))}
        />
      </label>
      <label className="filter">
        <span>Year to</span>
        <input
          type="number"
          value={yearTo}
          placeholder="any"
          onChange={(e) => onYearTo(num(e.target.value))}
        />
      </label>
    </div>
  );
}
