/**
 * Restore group-stage results (authoritative admin list).
 * Run: npm run db:restore-results
 */
import { createClient } from "@supabase/supabase-js";
import { MATCHES } from "../src/lib/matches-data";
import { toEnglishTeam } from "../src/lib/team-names";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!url || !key) {
  console.error("Missing env");
  process.exit(1);
}

const supabase = createClient(url, key);

const RESULTS: { home: string; away: string; homeScore: number; awayScore: number }[] = [
  { home: "Mexiko", away: "Sydafrika", homeScore: 2, awayScore: 0 },
  { home: "Sydkorea", away: "Tjeckien", homeScore: 2, awayScore: 1 },
  { home: "Kanada", away: "Bosnien och Hercegovina", homeScore: 1, awayScore: 1 },
  { home: "USA", away: "Paraguay", homeScore: 4, awayScore: 1 },
  { home: "Qatar", away: "Schweiz", homeScore: 1, awayScore: 1 },
  { home: "Brasilien", away: "Marocko", homeScore: 1, awayScore: 1 },
  { home: "Haiti", away: "Skottland", homeScore: 0, awayScore: 1 },
  { home: "Australien", away: "Turkiet", homeScore: 2, awayScore: 0 },
  { home: "Tyskland", away: "Curaçao", homeScore: 7, awayScore: 1 },
  { home: "Nederländerna", away: "Japan", homeScore: 2, awayScore: 2 },
  { home: "Elfenbenskusten", away: "Ecuador", homeScore: 1, awayScore: 0 },
  { home: "Sverige", away: "Tunisien", homeScore: 5, awayScore: 1 },
  { home: "Spanien", away: "Kap Verde", homeScore: 0, awayScore: 0 },
  { home: "Belgien", away: "Egypten", homeScore: 1, awayScore: 1 },
  { home: "Saudiarabien", away: "Uruguay", homeScore: 1, awayScore: 1 },
  { home: "Iran", away: "Nya Zeeland", homeScore: 2, awayScore: 2 },
  { home: "Frankrike", away: "Senegal", homeScore: 3, awayScore: 1 },
  { home: "Irak", away: "Norge", homeScore: 1, awayScore: 4 },
  { home: "Argentina", away: "Algeriet", homeScore: 3, awayScore: 0 },
  { home: "Österrike", away: "Jordanien", homeScore: 3, awayScore: 1 },
  { home: "Portugal", away: "DR Kongo", homeScore: 1, awayScore: 1 },
  { home: "England", away: "Kroatien", homeScore: 4, awayScore: 2 },
  { home: "Ghana", away: "Panama", homeScore: 1, awayScore: 0 },
  { home: "Uzbekistan", away: "Colombia", homeScore: 1, awayScore: 3 },
  { home: "Tjeckien", away: "Sydafrika", homeScore: 1, awayScore: 1 },
  { home: "Schweiz", away: "Bosnien och Hercegovina", homeScore: 4, awayScore: 1 },
  { home: "Kanada", away: "Qatar", homeScore: 6, awayScore: 0 },
  { home: "Mexiko", away: "Sydkorea", homeScore: 1, awayScore: 0 },
  { home: "USA", away: "Australien", homeScore: 2, awayScore: 0 },
  { home: "Skottland", away: "Marocko", homeScore: 0, awayScore: 1 },
  { home: "Brasilien", away: "Haiti", homeScore: 3, awayScore: 0 },
  { home: "Turkiet", away: "Paraguay", homeScore: 0, awayScore: 1 },
  { home: "Nederländerna", away: "Sverige", homeScore: 5, awayScore: 1 },
  { home: "Tyskland", away: "Elfenbenskusten", homeScore: 2, awayScore: 1 },
  { home: "Ecuador", away: "Curaçao", homeScore: 0, awayScore: 0 },
  { home: "Tunisien", away: "Japan", homeScore: 0, awayScore: 4 },
  { home: "Spanien", away: "Saudiarabien", homeScore: 4, awayScore: 0 },
  { home: "Belgien", away: "Iran", homeScore: 0, awayScore: 0 },
  { home: "Uruguay", away: "Kap Verde", homeScore: 2, awayScore: 2 },
  { home: "Nya Zeeland", away: "Egypten", homeScore: 1, awayScore: 3 },
  { home: "Argentina", away: "Österrike", homeScore: 2, awayScore: 0 },
  { home: "Frankrike", away: "Irak", homeScore: 3, awayScore: 0 },
  { home: "Norge", away: "Senegal", homeScore: 3, awayScore: 2 },
  { home: "Jordanien", away: "Algeriet", homeScore: 1, awayScore: 2 },
  { home: "Portugal", away: "Uzbekistan", homeScore: 5, awayScore: 0 },
  { home: "England", away: "Ghana", homeScore: 0, awayScore: 0 },
  { home: "Panama", away: "Kroatien", homeScore: 0, awayScore: 1 },
  { home: "Colombia", away: "DR Kongo", homeScore: 1, awayScore: 0 },
  { home: "Schweiz", away: "Kanada", homeScore: 2, awayScore: 1 },
  { home: "Bosnien och Hercegovina", away: "Qatar", homeScore: 3, awayScore: 1 },
  { home: "Skottland", away: "Brasilien", homeScore: 0, awayScore: 3 },
  { home: "Marocko", away: "Haiti", homeScore: 4, awayScore: 2 },
  { home: "Tjeckien", away: "Mexiko", homeScore: 0, awayScore: 3 },
  { home: "Sydafrika", away: "Sydkorea", homeScore: 1, awayScore: 0 },
  { home: "Curaçao", away: "Elfenbenskusten", homeScore: 0, awayScore: 2 },
  { home: "Ecuador", away: "Tyskland", homeScore: 2, awayScore: 1 },
  { home: "Japan", away: "Sverige", homeScore: 1, awayScore: 1 },
  { home: "Tunisien", away: "Nederländerna", homeScore: 1, awayScore: 3 },
  { home: "Turkiet", away: "USA", homeScore: 3, awayScore: 2 },
  { home: "Paraguay", away: "Australien", homeScore: 0, awayScore: 0 },
  { home: "Norge", away: "Frankrike", homeScore: 1, awayScore: 4 },
  { home: "Senegal", away: "Irak", homeScore: 5, awayScore: 0 },
  { home: "Kap Verde", away: "Saudiarabien", homeScore: 0, awayScore: 0 },
  { home: "Uruguay", away: "Spanien", homeScore: 0, awayScore: 1 },
  { home: "Egypten", away: "Iran", homeScore: 1, awayScore: 1 },
  { home: "Nya Zeeland", away: "Belgien", homeScore: 1, awayScore: 5 },
  { home: "Panama", away: "England", homeScore: 0, awayScore: 2 },
  { home: "Kroatien", away: "Ghana", homeScore: 2, awayScore: 1 },
  { home: "Colombia", away: "Portugal", homeScore: 0, awayScore: 0 },
  { home: "DR Kongo", away: "Uzbekistan", homeScore: 3, awayScore: 1 },
  { home: "Algeriet", away: "Österrike", homeScore: 3, awayScore: 3 },
  { home: "Jordanien", away: "Argentina", homeScore: 1, awayScore: 3 },
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
  let ok = 0;
  for (const r of RESULTS) {
    const id = findMatchId(r.home, r.away);
    if (!id) {
      console.error(`No match: ${r.home} – ${r.away}`);
      process.exit(1);
    }
    const { error } = await supabase
      .from("matches")
      .update({
        home_score: r.homeScore,
        away_score: r.awayScore,
        finished: true,
      })
      .eq("id", id);
    if (error) {
      console.error(`Match ${id}:`, error.message);
      process.exit(1);
    }
    ok++;
  }
  console.log(`Updated ${ok} group match results.`);
}

main();
