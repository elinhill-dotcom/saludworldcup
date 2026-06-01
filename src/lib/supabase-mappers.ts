import type { MatchView } from "@/components/MatchCard";
import { dayLabelFromKickoff } from "@/lib/matches-data";
import type { KnockoutFormState } from "@/lib/knockout-picks";
import { isFeaturedMatch } from "@/lib/teams";
import { toEnglishTeam } from "@/lib/team-names";
import type {
  ChatMessageRow,
  KnockoutAnswerRow,
  KnockoutPickRow,
  MatchRow,
  PlayerRow,
  PredictionRow,
  WallCommentRow,
} from "@/lib/supabase-types";

export function mapPlayer(row: PlayerRow) {
  return {
    id: row.id,
    name: row.name,
    createdAt: row.created_at,
  };
}

function mapKnockoutFormTeams(form: KnockoutFormState): KnockoutFormState {
  return {
    sf1Home: form.sf1Home ? toEnglishTeam(form.sf1Home) : "",
    sf1Away: form.sf1Away ? toEnglishTeam(form.sf1Away) : "",
    sf2Home: form.sf2Home ? toEnglishTeam(form.sf2Home) : "",
    sf2Away: form.sf2Away ? toEnglishTeam(form.sf2Away) : "",
    finalHome: form.finalHome ? toEnglishTeam(form.finalHome) : "",
    finalAway: form.finalAway ? toEnglishTeam(form.finalAway) : "",
    bronzeHome: form.bronzeHome ? toEnglishTeam(form.bronzeHome) : "",
    bronzeAway: form.bronzeAway ? toEnglishTeam(form.bronzeAway) : "",
    champion: form.champion ? toEnglishTeam(form.champion) : "",
  };
}

export function mapMatch(row: MatchRow): MatchView {
  const homeTeam = toEnglishTeam(row.home_team);
  const awayTeam = toEnglishTeam(row.away_team);
  return {
    id: row.id,
    matchNumber: row.match_number,
    dayLabel: dayLabelFromKickoff(row.kickoff_at),
    kickoffAt: row.kickoff_at,
    homeTeam,
    awayTeam,
    groupCode: row.group_code,
    stage: row.stage,
    featured: row.featured || isFeaturedMatch(homeTeam, awayTeam),
    homeScore: row.home_score,
    awayScore: row.away_score,
    finished: row.finished,
  };
}

export function mapPrediction(row: PredictionRow) {
  return {
    id: row.id,
    playerId: row.player_id,
    matchId: row.match_id,
    homeScore: row.home_score,
    awayScore: row.away_score,
  };
}

export function mapKnockoutPick(row: KnockoutPickRow): KnockoutFormState {
  return mapKnockoutFormTeams({
    sf1Home: row.sf1_home ?? "",
    sf1Away: row.sf1_away ?? "",
    sf2Home: row.sf2_home ?? "",
    sf2Away: row.sf2_away ?? "",
    finalHome: row.final_home ?? "",
    finalAway: row.final_away ?? "",
    bronzeHome: row.bronze_home ?? "",
    bronzeAway: row.bronze_away ?? "",
    champion: row.champion ?? "",
  });
}

export function knockoutPickToRow(
  playerId: string,
  form: KnockoutFormState,
): Omit<KnockoutPickRow, "id"> {
  const en = mapKnockoutFormTeams(form);
  return {
    player_id: playerId,
    sf1_home: en.sf1Home || null,
    sf1_away: en.sf1Away || null,
    sf2_home: en.sf2Home || null,
    sf2_away: en.sf2Away || null,
    final_home: en.finalHome || null,
    final_away: en.finalAway || null,
    bronze_home: en.bronzeHome || null,
    bronze_away: en.bronzeAway || null,
    champion: en.champion || null,
  };
}

export function mapKnockoutAnswer(row: KnockoutAnswerRow) {
  const en = mapKnockoutFormTeams({
    sf1Home: row.sf1_home ?? "",
    sf1Away: row.sf1_away ?? "",
    sf2Home: row.sf2_home ?? "",
    sf2Away: row.sf2_away ?? "",
    finalHome: row.final_home ?? "",
    finalAway: row.final_away ?? "",
    bronzeHome: row.bronze_home ?? "",
    bronzeAway: row.bronze_away ?? "",
    champion: row.champion ?? "",
  });
  return {
    id: row.id,
    sf1Home: en.sf1Home || null,
    sf1Away: en.sf1Away || null,
    sf2Home: en.sf2Home || null,
    sf2Away: en.sf2Away || null,
    finalHome: en.finalHome || null,
    finalAway: en.finalAway || null,
    bronzeHome: en.bronzeHome || null,
    bronzeAway: en.bronzeAway || null,
    champion: en.champion || null,
    set: row.set,
  };
}

export function mapChatMessage(row: ChatMessageRow) {
  return {
    id: row.id,
    name: row.name,
    message: row.message,
    createdAt: row.created_at,
  };
}

export function mapWallComment(row: WallCommentRow) {
  return {
    id: row.id,
    name: row.name,
    message: row.message,
    createdAt: row.created_at,
  };
}
