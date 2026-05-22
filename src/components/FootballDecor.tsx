/** Subtle football / pitch decorations for the page shell. */
export function FootballDecor() {
  return (
    <div className="football-decor" aria-hidden>
      <svg
        className="football-decor__ball football-decor__ball--tl"
        viewBox="0 0 64 64"
        fill="none"
      >
        <circle cx="32" cy="32" r="30" stroke="currentColor" strokeWidth="1.5" />
        <path
          d="M32 8 L38 22 L52 24 L42 34 L44 48 L32 40 L20 48 L22 34 L12 24 L26 22 Z"
          stroke="currentColor"
          strokeWidth="1"
          fill="currentColor"
          fillOpacity="0.06"
        />
      </svg>
      <svg
        className="football-decor__ball football-decor__ball--br"
        viewBox="0 0 64 64"
        fill="none"
      >
        <circle cx="32" cy="32" r="30" stroke="currentColor" strokeWidth="1.5" />
        <path
          d="M32 8 L38 22 L52 24 L42 34 L44 48 L32 40 L20 48 L22 34 L12 24 L26 22 Z"
          stroke="currentColor"
          strokeWidth="1"
          fill="currentColor"
          fillOpacity="0.06"
        />
      </svg>
      <div className="football-decor__center-circle" />
    </div>
  );
}
