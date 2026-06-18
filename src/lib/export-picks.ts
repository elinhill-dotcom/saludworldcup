import { fetchGroupMatchIds } from "@/lib/group-match-ids";
import {
  mapKnockoutPick,
  mapMatch,
  mapPlayer,
  mapPrediction,
} from "@/lib/supabase-mappers";
import type {
  KnockoutPickRow,
  MatchRow,
  PlayerRow,
  PredictionRow,
} from "@/lib/supabase-types";
import { fetchAllPaginated, getSupabaseServer, toErrorMessage, type DbResult } from "@/lib/supabase";

export type ExportRow = {
  playerName: string;
  groupPicks: Map<number, { home: number; away: number }>;
  knockout: ReturnType<typeof mapKnockoutPick> | null;
};

export async function fetchExportData(): Promise<
  DbResult<{
    matches: ReturnType<typeof mapMatch>[];
    rows: ExportRow[];
  }>
> {
  try {
    const supabase = getSupabaseServer();
    const groupRes = await fetchGroupMatchIds(supabase);
    if (groupRes.error) return { data: null, error: groupRes.error };

    const [playersRes, predsRes, koRes, matchesRes] = await Promise.all([
      supabase.from("players").select("*").order("name", { ascending: true }),
      fetchAllPaginated<PredictionRow>((from, to) =>
        supabase
          .from("predictions")
          .select("*")
          .in("match_id", groupRes.ids)
          .range(from, to),
      ),
      supabase.from("knockout_picks").select("*"),
      supabase
        .from("matches")
        .select("*")
        .eq("stage", "group")
        .order("kickoff_at", { ascending: true }),
    ]);

    if (playersRes.error) return { data: null, error: playersRes.error.message };
    if (predsRes.error) return { data: null, error: predsRes.error };
    if (koRes.error) return { data: null, error: koRes.error.message };
    if (matchesRes.error) return { data: null, error: matchesRes.error.message };

    const matches = (matchesRes.data as MatchRow[]).map(mapMatch);
    const predsByPlayer = new Map<string, Map<number, { home: number; away: number }>>();
    for (const row of (predsRes.data ?? []) as PredictionRow[]) {
      const p = mapPrediction(row);
      const map = predsByPlayer.get(p.playerId) ?? new Map();
      map.set(p.matchId, { home: p.homeScore, away: p.awayScore });
      predsByPlayer.set(p.playerId, map);
    }

    const koByPlayer = new Map<string, ReturnType<typeof mapKnockoutPick>>();
    for (const row of koRes.data as KnockoutPickRow[]) {
      koByPlayer.set(row.player_id, mapKnockoutPick(row));
    }

    const rows: ExportRow[] = (playersRes.data as PlayerRow[]).map((row) => ({
      playerName: mapPlayer(row).name,
      groupPicks: predsByPlayer.get(row.id) ?? new Map(),
      knockout: koByPlayer.get(row.id) ?? null,
    }));

    return { data: { matches, rows }, error: null };
  } catch (e) {
    return { data: null, error: toErrorMessage(e) };
  }
}

function csvEscape(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function buildPicksCsv(
  matches: ReturnType<typeof mapMatch>[],
  rows: ExportRow[],
): string {
  const headers = [
    "Player",
    ...matches.map(
      (m) => `#${m.id} ${m.homeTeam}–${m.awayTeam}`,
    ),
    "SF1 Home",
    "SF1 Away",
    "SF2 Home",
    "SF2 Away",
    "Final Home",
    "Final Away",
    "Bronze Home",
    "Bronze Away",
    "Champion",
  ];

  const lines = [headers.map(csvEscape).join(",")];

  for (const row of rows) {
    const cells = [row.playerName];
    for (const m of matches) {
      const pick = row.groupPicks.get(m.id);
      cells.push(pick ? `${pick.home}–${pick.away}` : "");
    }
    const ko = row.knockout;
    cells.push(
      ko?.sf1Home ?? "",
      ko?.sf1Away ?? "",
      ko?.sf2Home ?? "",
      ko?.sf2Away ?? "",
      ko?.finalHome ?? "",
      ko?.finalAway ?? "",
      ko?.bronzeHome ?? "",
      ko?.bronzeAway ?? "",
      ko?.champion ?? "",
    );
    lines.push(cells.map(csvEscape).join(","));
  }

  return `\uFEFF${lines.join("\r\n")}`;
}

export function buildPicksPrintHtml(
  matches: ReturnType<typeof mapMatch>[],
  rows: ExportRow[],
): string {
  const matchHeaders = matches
    .map(
      (m) =>
        `<th title="${m.homeTeam} vs ${m.awayTeam}">#${m.id}<br><span class="small">${m.homeTeam.slice(0, 3)}–${m.awayTeam.slice(0, 3)}</span></th>`,
    )
    .join("");

  const bodyRows = rows
    .map((row) => {
      const matchCells = matches
        .map((m) => {
          const pick = row.groupPicks.get(m.id);
          return `<td>${pick ? `${pick.home}–${pick.away}` : "—"}</td>`;
        })
        .join("");
      const ko = row.knockout;
      return `<tr>
        <td class="name">${row.playerName}</td>
        ${matchCells}
        <td>${ko?.sf1Home ?? "—"}</td>
        <td>${ko?.sf1Away ?? "—"}</td>
        <td>${ko?.sf2Home ?? "—"}</td>
        <td>${ko?.sf2Away ?? "—"}</td>
        <td>${ko?.finalHome ?? "—"}</td>
        <td>${ko?.finalAway ?? "—"}</td>
        <td>${ko?.bronzeHome ?? "—"}</td>
        <td>${ko?.bronzeAway ?? "—"}</td>
        <td><strong>${ko?.champion ?? "—"}</strong></td>
      </tr>`;
    })
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>World Cup 2026 — All picks</title>
  <style>
    @page { size: landscape; margin: 12mm; }
    body { font-family: system-ui, sans-serif; font-size: 10px; color: #111; }
    h1 { font-size: 16px; margin: 0 0 4px; }
    p.meta { color: #555; margin: 0 0 12px; }
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 1px solid #ccc; padding: 3px 4px; text-align: center; }
    th { background: #f0f0f0; font-weight: 600; }
    td.name, th:first-child { text-align: left; font-weight: 600; }
    .small { font-weight: 400; font-size: 8px; }
    @media print { button { display: none; } }
  </style>
</head>
<body>
  <h1>World Cup 2026 — All picks</h1>
  <p class="meta">Exported ${new Date().toLocaleString("en-GB")} · ${rows.length} players · ${matches.length} group matches</p>
  <button onclick="window.print()">Print / Save as PDF</button>
  <table>
    <thead>
      <tr>
        <th>Player</th>
        ${matchHeaders}
        <th>SF1 H</th><th>SF1 A</th><th>SF2 H</th><th>SF2 A</th>
        <th>Fin H</th><th>Fin A</th><th>Br H</th><th>Br A</th><th>Champion</th>
      </tr>
    </thead>
    <tbody>${bodyRows}</tbody>
  </table>
</body>
</html>`;
}
