type Props = {
  jarEur?: number;
  /** Show "Office jar: €X entry." before the split. */
  showEntry?: boolean;
  showTieBreak?: boolean;
  className?: string;
};

/** Office pool prize pot — 60% / 30% / 10% for 1st / 2nd / 3rd. */
export function PrizeSplit({
  jarEur = 10,
  showEntry = true,
  showTieBreak = false,
  className = "text-sm text-[var(--muted)]",
}: Props) {
  return (
    <p className={className}>
      {showEntry && (
        <>
          <strong className="text-white">Office jar:</strong> €{jarEur} entry.{" "}
        </>
      )}
      <strong className="text-white">Prize split:</strong>{" "}
      <strong className="text-white">60%</strong> to 1st place,{" "}
      <strong className="text-white">30%</strong> to 2nd,{" "}
      <strong className="text-white">10%</strong> to 3rd
      {showTieBreak ? " (tie-break: most exact group scores)" : ""}.
    </p>
  );
}
