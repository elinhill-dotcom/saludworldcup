import {
  BRACKET_LEFT_R32,
  BRACKET_RIGHT_R32,
  KO_FEEDERS,
} from "@/lib/knockout-bracket";

export type BracketSlot = { matchId: number; row: number; col: number };

const ROW_STEP = 2;

function layoutHalf(
  leaves: readonly number[],
  columns: readonly (readonly number[])[],
): Map<number, BracketSlot> {
  const slots = new Map<number, BracketSlot>();

  leaves.forEach((id, index) => {
    slots.set(id, { matchId: id, row: index * ROW_STEP, col: 0 });
  });

  columns.forEach((roundIds, colIndex) => {
    for (const id of roundIds) {
      const feeders = KO_FEEDERS[id];
      if (!feeders) continue;
      const a = slots.get(feeders[0]);
      const b = slots.get(feeders[1]);
      if (!a || !b) continue;
      slots.set(id, {
        matchId: id,
        row: (a.row + b.row) / 2,
        col: colIndex + 1,
      });
    }
  });

  return slots;
}

export const LEFT_COLUMNS = [
  [90, 89, 93, 94],
  [97, 98],
  [101],
] as const;

export const RIGHT_COLUMNS = [
  [91, 92, 95, 96],
  [99, 100],
  [102],
] as const;

export const LEFT_LAYOUT = layoutHalf(BRACKET_LEFT_R32, LEFT_COLUMNS);
export const RIGHT_LAYOUT = layoutHalf(BRACKET_RIGHT_R32, RIGHT_COLUMNS);

export const CENTER_LAYOUT: BracketSlot[] = [
  { matchId: 104, row: 7, col: 0 },
  { matchId: 103, row: 11, col: 0 },
];

/** Vertical spacing unit — two units = gap between adjacent R32 slots. */
export const ROW_UNIT_PX = 68;

/** R32 cards: known teams + kickoff time. */
export const CARD_H_R32 = 88;
/** Later rounds: TBD hints + kickoff time. */
export const CARD_H_KO = 128;

/** @deprecated use cardHeightForCol */
export const MATCH_CARD_H = CARD_H_KO;

export function cardHeightForCol(col: number): number {
  return col === 0 ? CARD_H_R32 : CARD_H_KO;
}

export function cardCenterY(row: number, col: number): number {
  return slotTopPx(row) + cardHeightForCol(col) / 2;
}
export const COL_WIDTH_MOBILE = 152;
export const COL_WIDTH_DESKTOP = 172;
export const CONNECTOR_W = 28;

export function bracketHeightPx(): number {
  const maxRow = Math.max(
    ...[...LEFT_LAYOUT.values(), ...RIGHT_LAYOUT.values()].map((s) => s.row),
    ...CENTER_LAYOUT.map((s) => s.row),
  );
  return maxRow * ROW_UNIT_PX + CARD_H_KO + 24;
}

export function slotTopPx(row: number): number {
  return row * ROW_UNIT_PX;
}

export type ConnectorPath = {
  key: string;
  d: string;
};

export function buildConnectorPaths(
  layout: Map<number, BracketSlot>,
  colWidth: number,
  connectorW: number,
  colCount = 4,
): ConnectorPath[] {
  const paths: ConnectorPath[] = [];
  const cy = (row: number, col: number) => cardCenterY(row, col);
  const totalW = colCount * colWidth + (colCount - 1) * connectorW;

  for (const [parentId, feeders] of Object.entries(KO_FEEDERS)) {
    const pid = Number(parentId);
    const parent = layout.get(pid);
    if (!parent) continue;
    const children = feeders as readonly [number, number];
    const c1 = layout.get(children[0]);
    const c2 = layout.get(children[1]);
    if (!c1 || !c2 || c1.col !== c2.col || c1.col !== parent.col - 1) continue;

    const x1 = c1.col * (colWidth + connectorW) + colWidth;
    const x2 = parent.col * (colWidth + connectorW);
    const fork = x1 + connectorW / 2;
    const y1 = cy(c1.row, c1.col);
    const y2 = cy(c2.row, c2.col);
    const yp = cy(parent.row, parent.col);

    paths.push({
      key: `ltr-${children[0]}-${children[1]}-${pid}`,
      d: `M ${x1} ${y1} H ${fork} M ${x1} ${y2} H ${fork} M ${fork} ${y1} V ${y2} M ${fork} ${yp} H ${x2}`,
    });
  }

  // Semi at inner edge (col 3): stub toward center finals
  const semi = [...layout.values()].find((s) => s.col === colCount - 1);
  if (semi) {
    const y = cy(semi.row, semi.col);
    const xStart = semi.col * (colWidth + connectorW) + colWidth;
    paths.push({
      key: `ltr-semi-exit-${semi.matchId}`,
      d: `M ${xStart} ${y} H ${totalW}`,
    });
  }

  return paths;
}

export function buildConnectorPathsRtl(
  layout: Map<number, BracketSlot>,
  colWidth: number,
  connectorW: number,
  colCount: number,
): ConnectorPath[] {
  const paths: ConnectorPath[] = [];
  const cy = (row: number, col: number) => cardCenterY(row, col);
  const totalW = colCount * colWidth + (colCount - 1) * connectorW;

  const slotLeft = (col: number) => totalW - col * (colWidth + connectorW) - colWidth;
  const slotRight = (col: number) => slotLeft(col) + colWidth;

  for (const [parentId, feeders] of Object.entries(KO_FEEDERS)) {
    const pid = Number(parentId);
    const parent = layout.get(pid);
    if (!parent) continue;
    const children = feeders as readonly [number, number];
    const c1 = layout.get(children[0]);
    const c2 = layout.get(children[1]);
    // Same col logic as LTR: children sit one col closer to leaves (lower col index)
    if (!c1 || !c2 || c1.col !== c2.col || c1.col !== parent.col - 1) continue;

    const xChildInner = slotLeft(c1.col);
    const xParentInner = slotRight(parent.col);
    const fork = xChildInner - connectorW / 2;
    const y1 = cy(c1.row, c1.col);
    const y2 = cy(c2.row, c2.col);
    const yp = cy(parent.row, parent.col);

    paths.push({
      key: `rtl-${children[0]}-${children[1]}-${pid}`,
      d: `M ${xChildInner} ${y1} H ${fork} M ${xChildInner} ${y2} H ${fork} M ${fork} ${y1} V ${y2} M ${fork} ${yp} H ${xParentInner}`,
    });
  }

  // Semi at inner visual edge (highest col): stub toward center finals
  const semi = [...layout.values()].find((s) => s.col === colCount - 1);
  if (semi) {
    const y = cy(semi.row, semi.col);
    const xInner = slotLeft(semi.col);
    if (xInner > 0) {
      paths.push({
        key: `rtl-semi-exit-${semi.matchId}`,
        d: `M ${xInner} ${y} H 0`,
      });
    }
  }

  return paths;
}
