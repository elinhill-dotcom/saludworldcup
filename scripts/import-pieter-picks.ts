/**
 * Import Pieter Moll's group-stage picks into Supabase.
 * Run: npm run db:import-pieter
 */
import { createClient } from "@supabase/supabase-js";
import { MATCHES } from "../src/lib/matches-data";
import { pointsForPrediction } from "../src/lib/scoring";
import { mapMatch } from "../src/lib/supabase-mappers";
import type { MatchRow } from "../src/lib/supabase-types";
import { toEnglishTeam } from "../src/lib/team-names";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!url || !key) {
  console.error("Missing env");
  process.exit(1);
}

const supabase = createClient(url, key);

/** Home team (English) → away team → scores */
const PICKS: { home: string; away: string; homeScore: number; awayScore: number }[] = [
  { home: "Mexico", away: "South Africa", homeScore: 2, awayScore: 0 },
  { home: "South Korea", away: "Czech Republic", homeScore: 0, awayScore: 0 },
  { home: "Canada", away: "Bosnia and Herzegovina", homeScore: 1, awayScore: 1 },
  { home: "USA", away: "Paraguay", homeScore: 2, awayScore: 1 },
  { home: "Qatar", away: "Switzerland", homeScore: 0, awayScore: 2 },
  { home: "Brazil", away: "Morocco", homeScore: 2, awayScore: 1 },
  { home: "Haiti", away: "Scotland", homeScore: 0, awayScore: 1 },
  { home: "Australia", away: "Turkey", homeScore: 0, awayScore: 1 },
  { home: "Germany", away: "Curaçao", homeScore: 3, awayScore: 0 },
  { home: "Netherlands", away: "Japan", homeScore: 1, awayScore: 1 },
  { home: "Ivory Coast", away: "Ecuador", homeScore: 0, awayScore: 1 },
  { home: "Sweden", away: "Tunisia", homeScore: 2, awayScore: 0 },
  { home: "Spain", away: "Cape Verde", homeScore: 3, awayScore: 0 },
  { home: "Belgium", away: "Egypt", homeScore: 1, awayScore: 0 },
  { home: "Saudi Arabia", away: "Uruguay", homeScore: 0, awayScore: 1 },
  { home: "Iran", away: "New Zealand", homeScore: 1, awayScore: 1 },
  { home: "France", away: "Senegal", homeScore: 3, awayScore: 1 },
  { home: "Iraq", away: "Norway", homeScore: 0, awayScore: 1 },
  { home: "Argentina", away: "Algeria", homeScore: 3, awayScore: 1 },
  { home: "Austria", away: "Jordan", homeScore: 2, awayScore: 0 },
  { home: "Portugal", away: "DR Congo", homeScore: 2, awayScore: 0 },
  { home: "England", away: "Croatia", homeScore: 1, awayScore: 0 },
  { home: "Ghana", away: "Panama", homeScore: 3, awayScore: 1 },
  { home: "Uzbekistan", away: "Colombia", homeScore: 0, awayScore: 1 },
  { home: "Czech Republic", away: "South Africa", homeScore: 2, awayScore: 0 },
  { home: "Switzerland", away: "Bosnia and Herzegovina", homeScore: 2, awayScore: 1 },
  { home: "Canada", away: "Qatar", homeScore: 2, awayScore: 0 },
  { home: "Mexico", away: "South Korea", homeScore: 2, awayScore: 1 },
  { home: "USA", away: "Australia", homeScore: 1, awayScore: 0 },
  { home: "Scotland", away: "Morocco", homeScore: 0, awayScore: 2 },
  { home: "Brazil", away: "Haiti", homeScore: 3, awayScore: 0 },
  { home: "Turkey", away: "Paraguay", homeScore: 2, awayScore: 1 },
  { home: "Netherlands", away: "Sweden", homeScore: 2, awayScore: 1 },
  { home: "Germany", away: "Ivory Coast", homeScore: 2, awayScore: 1 },
  { home: "Ecuador", away: "Curaçao", homeScore: 1, awayScore: 0 },
  { home: "Tunisia", away: "Japan", homeScore: 0, awayScore: 2 },
  { home: "Spain", away: "Saudi Arabia", homeScore: 4, awayScore: 0 },
  { home: "Belgium", away: "Iran", homeScore: 2, awayScore: 1 },
  { home: "Uruguay", away: "Cape Verde", homeScore: 2, awayScore: 1 },
  { home: "New Zealand", away: "Egypt", homeScore: 1, awayScore: 1 },
  { home: "Argentina", away: "Austria", homeScore: 2, awayScore: 1 },
  { home: "France", away: "Iraq", homeScore: 2, awayScore: 1 },
  { home: "Norway", away: "Senegal", homeScore: 3, awayScore: 2 },
  { home: "Jordan", away: "Algeria", homeScore: 0, awayScore: 1 },
  { home: "Portugal", away: "Uzbekistan", homeScore: 3, awayScore: 1 },
  { home: "England", away: "Ghana", homeScore: 2, awayScore: 1 },
  { home: "Panama", away: "Croatia", homeScore: 0, awayScore: 1 },
  { home: "Colombia", away: "DR Congo", homeScore: 1, awayScore: 0 },
  { home: "Switzerland", away: "Canada", homeScore: 2, awayScore: 1 },
  { home: "Bosnia and Herzegovina", away: "Qatar", homeScore: 2, awayScore: 1 },
  { home: "Scotland", away: "Brazil", homeScore: 0, awayScore: 2 },
  { home: "Morocco", away: "Haiti", homeScore: 2, awayScore: 0 },
  { home: "Czech Republic", away: "Mexico", homeScore: 0, awayScore: 1 },
  { home: "South Africa", away: "South Korea", homeScore: 0, awayScore: 1 },
  { home: "Curaçao", away: "Ivory Coast", homeScore: 0, awayScore: 2 },
  { home: "Ecuador", away: "Germany", homeScore: 0, awayScore: 1 },
  { home: "Japan", away: "Sweden", homeScore: 1, awayScore: 2 },
  { home: "Tunisia", away: "Netherlands", homeScore: 0, awayScore: 2 },
  { home: "Turkey", away: "USA", homeScore: 2, awayScore: 1 },
  { home: "Paraguay", away: "Australia", homeScore: 1, awayScore: 0 },
  { home: "Norway", away: "France", homeScore: 2, awayScore: 1 },
  { home: "Senegal", away: "Iraq", homeScore: 1, awayScore: 0 },
  { home: "Cape Verde", away: "Saudi Arabia", homeScore: 0, awayScore: 0 },
  { home: "Uruguay", away: "Spain", homeScore: 1, awayScore: 2 },
  { home: "Egypt", away: "Iran", homeScore: 1, awayScore: 0 },
  { home: "New Zealand", away: "Belgium", homeScore: 0, awayScore: 1 },
  { home: "Panama", away: "England", homeScore: 0, awayScore: 2 },
  { home: "Croatia", away: "Ghana", homeScore: 1, awayScore: 1 },
  { home: "Colombia", away: "Portugal", homeScore: 1, awayScore: 2 },
  { home: "DR Congo", away: "Uzbekistan", homeScore: 2, awayScore: 1 },
  { home: "Algeria", away: "Austria", homeScore: 0, awayScore: 1 },
  { home: "Jordan", away: "Argentina", homeScore: 1, awayScore: 3 },
];

function norm(name: string): string {
  return toEnglishTeam(name);
}

function findMatchId(home: string, away: string): number | null {
  const h = norm(home);
  const a = norm(away);
  const m = MATCHES.find(
    (x) =>
      x.stage === "group" &&
      norm(x.homeTeam) === h &&
      norm(x.awayTeam) === a,
  );
  return m?.id ?? null;
}

async function main() {
  const { data: player, error: pErr } = await supabase
    .from("players")
    .select("id, name")
    .eq("name", "Pieter Moll")
    .maybeSingle();

  if (pErr || !player) {
    console.error("Player not found:", pErr?.message ?? "Pieter Moll");
    process.exit(1);
  }

  const rows: {
    player_id: string;
    match_id: number;
    home_score: number;
    away_score: number;
  }[] = [];

  for (const p of PICKS) {
    const id = findMatchId(p.home, p.away);
    if (!id) {
      console.error(`No match for ${p.home} – ${p.away}`);
      process.exit(1);
    }
    rows.push({
      player_id: player.id,
      match_id: id,
      home_score: p.homeScore,
      away_score: p.awayScore,
    });
  }

  const { error } = await supabase
    .from("predictions")
    .upsert(rows, { onConflict: "player_id,match_id" });

  if (error) {
    console.error("Upsert failed:", error.message);
    process.exit(1);
  }

  console.log(`Imported ${rows.length} picks for ${player.name}.`);

  const { data: matchesRaw } = await supabase
    .from("matches")
    .select("*")
    .eq("stage", "group");
  const matchMap = new Map(
    (matchesRaw ?? []).map((r) => [r.id, mapMatch(r as MatchRow)]),
  );

  let pts = 0;
  let exact = 0;
  let outcome = 0;
  for (const r of rows) {
    const m = matchMap.get(r.match_id);
    if (!m?.finished || m.homeScore === null || m.awayScore === null) continue;
    const x = pointsForPrediction(
      r.home_score,
      r.away_score,
      m.homeScore,
      m.awayScore,
    );
    pts += x;
    if (x === 3) exact++;
    else if (x === 1) outcome++;
  }
  console.log(`Points with current results: ${pts} (${exact} exact, ${outcome} outcome)`);
}

main();
