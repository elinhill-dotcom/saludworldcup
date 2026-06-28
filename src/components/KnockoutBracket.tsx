"use client";

import { useEffect, useMemo, useState } from "react";
import { formatCestMatchKickoff } from "@/lib/datetime";
import {
  BRACKET_ROUNDS,
  bracketTreeColumnHint,
  bracketTreeColumnLabel,
  formatBracketTeamLine,
  isRoundOf32Stage,
  matchDisplayNumber,
  type ResolvedMatch,
} from "@/lib/knockout-bracket";
import {
  buildConnectorPaths,
  buildConnectorPathsRtl,
  bracketHeightPx,
  cardCenterY,
  CARD_H_KO,
  CENTER_LAYOUT,
  COL_WIDTH_DESKTOP,
  COL_WIDTH_MOBILE,
  CONNECTOR_W,
  LEFT_LAYOUT,
  RIGHT_LAYOUT,
  slotTopPx,
  type BracketSlot,
} from "@/lib/knockout-bracket-layout";

type Props = {
  matches: ResolvedMatch[];
  compact: boolean;
};

function byId(matches: ResolvedMatch[]): Map<number, ResolvedMatch> {
  return new Map(matches.map((m) => [m.id, m]));
}

function TeamRow({
  line,
  score,
  tree,
}: {
  line: ReturnType<typeof formatBracketTeamLine>;
  score: string;
  tree?: boolean;
}) {
  return (
    <div className="min-w-0">
      <div className="flex justify-between gap-2 items-start">
        <span
          className={`font-medium truncate ${
            line.isWinner
              ? "text-[var(--success)]"
              : line.isTbd
                ? "text-[var(--muted)] italic"
                : ""
          }`}
          title={line.hint ? `${line.label} — ${line.hint}` : line.label}
        >
          {line.label}
        </span>
        <span className="tabular-nums text-[var(--muted)] shrink-0">{score}</span>
      </div>
      {line.hint && (
        <p
          className={`text-[10px] leading-tight text-[var(--muted)] mt-0.5 ${
            tree ? "line-clamp-1" : "line-clamp-2"
          }`}
        >
          {line.hint}
        </p>
      )}
    </div>
  );
}

function MatchCard({
  m,
  map,
  compact,
  tree,
}: {
  m: ResolvedMatch;
  map: Map<number, ResolvedMatch>;
  compact: boolean;
  tree?: boolean;
}) {
  const home = formatBracketTeamLine(m.homeTeam, map, m.winner);
  const away = formatBracketTeamLine(m.awayTeam, map, m.winner);
  const scoreHome =
    m.finished && m.homeScore !== null && !home.isTbd ? String(m.homeScore) : "–";
  const scoreAway =
    m.finished && m.awayScore !== null && !away.isTbd ? String(m.awayScore) : "–";
  const isR32 = tree && isRoundOf32Stage(m.stage);
  const kickoff = formatCestMatchKickoff(m.kickoffAt);

  return (
    <article
      className={`rounded-lg border bg-[var(--card)] shadow-sm ${
        m.stage === "final"
          ? "border-[var(--accent)] ring-1 ring-[var(--accent)]/40"
          : m.stage === "bronze"
            ? "border-amber-500/50"
            : "border-[var(--border)]"
      } ${compact ? "p-2 text-xs" : isR32 ? "p-2 text-xs" : "p-2.5 text-sm"}`}
    >
      <p className="text-[10px] uppercase tracking-wide text-[var(--muted)] mb-1 leading-snug">
        Match {matchDisplayNumber(m)}
        {m.stage === "final" && " · Final"}
        {m.stage === "bronze" && " · Bronze"}
        {tree && (
          <span className="normal-case font-normal block mt-0.5">{kickoff}</span>
        )}
      </p>
      <div className={isR32 ? "space-y-0.5" : "space-y-1"}>
        <TeamRow line={home} score={scoreHome} tree={tree && !isR32} />
        <TeamRow line={away} score={scoreAway} tree={tree && !isR32} />
      </div>
      {!compact && !tree && (
        <p className="text-[10px] text-[var(--muted)] mt-1.5">{kickoff}</p>
      )}
    </article>
  );
}

function ConnectorSvg({
  paths,
  width,
  height,
}: {
  paths: { key: string; d: string }[];
  width: number;
  height: number;
}) {
  if (!paths.length) return null;
  return (
    <svg
      className="absolute top-0 left-0 pointer-events-none z-20 text-[var(--muted)]"
      width={width}
      height={height}
      overflow="visible"
      aria-hidden
    >
      {paths.map((p) => (
        <path
          key={p.key}
          d={p.d}
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
    </svg>
  );
}

function BracketHalf({
  layout,
  map,
  direction,
  colCount,
  colWidth,
  compact,
}: {
  layout: Map<number, BracketSlot>;
  map: Map<number, ResolvedMatch>;
  direction: "ltr" | "rtl";
  colCount: number;
  colWidth: number;
  compact: boolean;
}) {
  const width = colCount * colWidth + (colCount - 1) * CONNECTOR_W;
  const height = bracketHeightPx();
  const paths =
    direction === "ltr"
      ? buildConnectorPaths(layout, colWidth, CONNECTOR_W, colCount)
      : buildConnectorPathsRtl(layout, colWidth, CONNECTOR_W, colCount);

  function slotLeft(col: number): number {
    const x = col * (colWidth + CONNECTOR_W);
    if (direction === "rtl") return width - x - colWidth;
    return x;
  }

  return (
    <div className="relative shrink-0" style={{ width, height }}>
      {Array.from({ length: colCount }, (_, col) => (
        <div
          key={col}
          className="absolute text-center z-30"
          style={{
            left: slotLeft(col),
            width: colWidth,
            top: -28,
          }}
        >
          <p className="text-[10px] font-semibold text-[var(--accent)] uppercase tracking-wide leading-tight">
            {bracketTreeColumnLabel(col)}
          </p>
          <p className="text-[9px] text-[var(--muted)] normal-case mt-0.5">
            {bracketTreeColumnHint(col)}
          </p>
        </div>
      ))}
      {[...layout.values()].map((slot) => {
        const m = map.get(slot.matchId);
        if (!m) return null;
        return (
          <div
            key={slot.matchId}
            className="absolute z-10"
            style={{
              left: slotLeft(slot.col),
              top: slotTopPx(slot.row),
              width: colWidth,
            }}
          >
            <MatchCard m={m} map={map} compact={compact} tree />
          </div>
        );
      })}
      <ConnectorSvg paths={paths} width={width} height={height} />
    </div>
  );
}

function CenterFinals({
  map,
  gap,
  colWidth,
  compact,
}: {
  map: Map<number, ResolvedMatch>;
  gap: number;
  colWidth: number;
  compact: boolean;
}) {
  const height = bracketHeightPx();
  const sfLeft = LEFT_LAYOUT.get(101);
  const sfRight = RIGHT_LAYOUT.get(102);
  const fin = CENTER_LAYOUT.find((s) => s.matchId === 104);
  const bronze = CENTER_LAYOUT.find((s) => s.matchId === 103);
  const cy = (row: number, col: number) => cardCenterY(row, col);
  const slotY = (row: number, fraction: number) =>
    slotTopPx(row) + CARD_H_KO * fraction;

  const paths: { key: string; d: string }[] = [];
  const totalW = colWidth + gap;
  const cardLeft = gap / 2;
  const cardRight = cardLeft + colWidth;
  const laneOffset = 16;

  if (sfLeft && fin) {
    const ySf = cy(sfLeft.row, sfLeft.col);
    const yHome = slotY(fin.row, 0.38);
    paths.push({
      key: "sf-left-to-final",
      d: `M 0 ${ySf} H ${cardLeft} V ${yHome}`,
    });
  }

  if (sfRight && fin) {
    const ySf = cy(sfRight.row, sfRight.col);
    const yAway = slotY(fin.row, 0.62);
    paths.push({
      key: "sf-right-to-final",
      d: `M ${totalW} ${ySf} H ${cardRight} V ${yAway}`,
    });
  }

  if (sfLeft && bronze) {
    const ySf = cy(sfLeft.row, sfLeft.col);
    const yHome = slotY(bronze.row, 0.38);
    const fork = cardLeft - laneOffset;
    paths.push({
      key: "sf-left-to-bronze",
      d: `M 0 ${ySf} H ${fork} V ${yHome} H ${cardLeft}`,
    });
  }

  if (sfRight && bronze) {
    const ySf = cy(sfRight.row, sfRight.col);
    const yAway = slotY(bronze.row, 0.62);
    const fork = cardRight + laneOffset;
    paths.push({
      key: "sf-right-to-bronze",
      d: `M ${totalW} ${ySf} H ${fork} V ${yAway} H ${cardRight}`,
    });
  }

  return (
    <div className="relative shrink-0" style={{ width: colWidth + gap, height }}>
      <p
        className="absolute text-[10px] font-semibold text-[var(--accent)] text-center uppercase tracking-wide z-30"
        style={{ left: gap / 2, width: colWidth, top: -20 }}
      >
        Final & Bronze
      </p>
      {CENTER_LAYOUT.map((slot) => {
        const m = map.get(slot.matchId);
        if (!m) return null;
        return (
          <div
            key={slot.matchId}
            className="absolute z-10"
            style={{
              left: gap / 2,
              top: slotTopPx(slot.row),
              width: colWidth,
            }}
          >
            <MatchCard m={m} map={map} compact={compact} tree />
          </div>
        );
      })}
      <svg
        className="absolute top-0 left-0 pointer-events-none z-20 text-[var(--muted)]"
        width={colWidth + gap}
        height={height}
        overflow="visible"
        aria-hidden
      >
        {paths.map((p) => (
          <path
            key={p.key}
            d={p.d}
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}
      </svg>
    </div>
  );
}

function ListByRound({
  map,
  compact,
}: {
  map: Map<number, ResolvedMatch>;
  compact: boolean;
}) {
  return (
    <div className="space-y-6">
      {BRACKET_ROUNDS.map((round) => (
        <section key={round.stage}>
          <h3 className="text-sm font-semibold text-[var(--accent)] mb-3">
            {round.label}
          </h3>
          <div className="grid gap-2 sm:grid-cols-2">
            {round.ids.map((id) => {
              const m = map.get(id);
              if (!m) return null;
              return <MatchCard key={id} m={m} map={map} compact={compact} />;
            })}
          </div>
        </section>
      ))}
    </div>
  );
}

export function KnockoutBracket({ matches, compact }: Props) {
  const map = byId(matches);
  const [desktop, setDesktop] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const update = () => setDesktop(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const colWidth = desktop ? COL_WIDTH_DESKTOP : COL_WIDTH_MOBILE;
  /** Horizontal runway between each semi and the centre cards */
  const centerGap = desktop ? 80 : 56;

  const treeWidth = useMemo(() => {
    const halfCols = 4;
    const halfW = halfCols * colWidth + (halfCols - 1) * CONNECTOR_W;
    return halfW * 2 + colWidth + centerGap;
  }, [colWidth, centerGap]);

  if (compact) {
    return <ListByRound map={map} compact={compact} />;
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-[var(--muted)]">
        32-team knockout bracket:{" "}
        <strong className="text-white/90">16 Round-of-32 matches</strong> split
        across left and right (8 per side), converging in the centre for the
        final.
      </p>
      <p className="text-xs text-[var(--muted)] md:hidden">
        Swipe sideways to follow the bracket →
      </p>
      <div className="overflow-x-auto pb-2 -mx-4 px-4 touch-pan-x">
        <div
          className="relative pt-8 mx-auto"
          style={{ minWidth: treeWidth, height: bracketHeightPx() + 32 }}
        >
          <div className="flex items-start justify-center">
            <BracketHalf
              layout={LEFT_LAYOUT}
              map={map}
              direction="ltr"
              colCount={4}
              colWidth={colWidth}
              compact={compact}
            />
            <CenterFinals
              map={map}
              gap={centerGap}
              colWidth={colWidth}
              compact={compact}
            />
            <BracketHalf
              layout={RIGHT_LAYOUT}
              map={map}
              direction="rtl"
              colCount={4}
              colWidth={colWidth}
              compact={compact}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
