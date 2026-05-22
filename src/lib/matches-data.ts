export type MatchSeed = {
  id: number;
  matchNumber?: number;
  dayLabel: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  homeTeam: string;
  awayTeam: string;
  groupCode?: string;
  stage: string;
  broadcaster?: string;
};

import { isFeaturedMatch } from "./teams";

export { isFeaturedMatch };

/** Full schedule (Swedish kickoff times, UTC+2). Group stage = score predictions. */
export const MATCHES: MatchSeed[] = [
  { id: 1, dayLabel: "Torsdag 11 juni", date: "2026-06-11", time: "21:00", homeTeam: "Mexiko", awayTeam: "Sydafrika", groupCode: "A", stage: "group", broadcaster: "TV4" },
  { id: 2, dayLabel: "Fredag 12 juni", date: "2026-06-12", time: "04:00", homeTeam: "Sydkorea", awayTeam: "Tjeckien", groupCode: "A", stage: "group", broadcaster: "TV4" },
  { id: 3, dayLabel: "Fredag 12 juni", date: "2026-06-12", time: "21:00", homeTeam: "Kanada", awayTeam: "Bosnien och Hercegovina", groupCode: "B", stage: "group", broadcaster: "SVT" },
  { id: 4, dayLabel: "Lördag 13 juni", date: "2026-06-13", time: "03:00", homeTeam: "USA", awayTeam: "Paraguay", groupCode: "D", stage: "group", broadcaster: "TV4" },
  { id: 5, dayLabel: "Lördag 13 juni", date: "2026-06-13", time: "21:00", homeTeam: "Qatar", awayTeam: "Schweiz", groupCode: "B", stage: "group", broadcaster: "TV4" },
  { id: 6, dayLabel: "Söndag 14 juni", date: "2026-06-14", time: "00:00", homeTeam: "Brasilien", awayTeam: "Marocko", groupCode: "C", stage: "group", broadcaster: "TV4" },
  { id: 7, dayLabel: "Söndag 14 juni", date: "2026-06-14", time: "03:00", homeTeam: "Haiti", awayTeam: "Skottland", groupCode: "C", stage: "group", broadcaster: "SVT" },
  { id: 8, dayLabel: "Söndag 14 juni", date: "2026-06-14", time: "06:00", homeTeam: "Australien", awayTeam: "Turkiet", groupCode: "D", stage: "group", broadcaster: "TV4" },
  { id: 9, dayLabel: "Söndag 14 juni", date: "2026-06-14", time: "19:00", homeTeam: "Tyskland", awayTeam: "Curaçao", groupCode: "E", stage: "group", broadcaster: "TV4" },
  { id: 10, dayLabel: "Söndag 14 juni", date: "2026-06-14", time: "22:00", homeTeam: "Nederländerna", awayTeam: "Japan", groupCode: "F", stage: "group", broadcaster: "TV4" },
  { id: 11, dayLabel: "Måndag 15 juni", date: "2026-06-15", time: "01:00", homeTeam: "Elfenbenskusten", awayTeam: "Ecuador", groupCode: "E", stage: "group", broadcaster: "TV4" },
  { id: 12, dayLabel: "Måndag 15 juni", date: "2026-06-15", time: "04:00", homeTeam: "Sverige", awayTeam: "Tunisien", groupCode: "F", stage: "group" },
  { id: 13, dayLabel: "Måndag 15 juni", date: "2026-06-15", time: "18:00", homeTeam: "Spanien", awayTeam: "Kap Verde", groupCode: "H", stage: "group", broadcaster: "SVT" },
  { id: 14, dayLabel: "Måndag 15 juni", date: "2026-06-15", time: "21:00", homeTeam: "Belgien", awayTeam: "Egypten", groupCode: "G", stage: "group", broadcaster: "SVT" },
  { id: 15, dayLabel: "Tisdag 16 juni", date: "2026-06-16", time: "00:00", homeTeam: "Saudiarabien", awayTeam: "Uruguay", groupCode: "H", stage: "group", broadcaster: "TV4" },
  { id: 16, dayLabel: "Tisdag 16 juni", date: "2026-06-16", time: "03:00", homeTeam: "Iran", awayTeam: "Nya Zeeland", groupCode: "G", stage: "group", broadcaster: "TV4" },
  { id: 17, dayLabel: "Tisdag 16 juni", date: "2026-06-16", time: "21:00", homeTeam: "Frankrike", awayTeam: "Senegal", groupCode: "I", stage: "group", broadcaster: "SVT" },
  { id: 18, dayLabel: "Onsdag 17 juni", date: "2026-06-17", time: "00:00", homeTeam: "Irak", awayTeam: "Norge", groupCode: "I", stage: "group", broadcaster: "TV4" },
  { id: 19, dayLabel: "Onsdag 17 juni", date: "2026-06-17", time: "03:00", homeTeam: "Argentina", awayTeam: "Algeriet", groupCode: "J", stage: "group", broadcaster: "TV4" },
  { id: 20, dayLabel: "Onsdag 17 juni", date: "2026-06-17", time: "06:00", homeTeam: "Österrike", awayTeam: "Jordanien", groupCode: "J", stage: "group", broadcaster: "TV4" },
  { id: 21, dayLabel: "Onsdag 17 juni", date: "2026-06-17", time: "19:00", homeTeam: "Portugal", awayTeam: "DR Kongo", groupCode: "K", stage: "group", broadcaster: "TV4" },
  { id: 22, dayLabel: "Onsdag 17 juni", date: "2026-06-17", time: "22:00", homeTeam: "England", awayTeam: "Kroatien", groupCode: "L", stage: "group", broadcaster: "TV4" },
  { id: 23, dayLabel: "Torsdag 18 juni", date: "2026-06-18", time: "01:00", homeTeam: "Ghana", awayTeam: "Panama", groupCode: "L", stage: "group", broadcaster: "TV4" },
  { id: 24, dayLabel: "Torsdag 18 juni", date: "2026-06-18", time: "04:00", homeTeam: "Uzbekistan", awayTeam: "Colombia", groupCode: "K", stage: "group", broadcaster: "TV4" },
  { id: 25, dayLabel: "Torsdag 18 juni", date: "2026-06-18", time: "18:00", homeTeam: "Tjeckien", awayTeam: "Sydafrika", groupCode: "A", stage: "group", broadcaster: "TV4" },
  { id: 26, dayLabel: "Torsdag 18 juni", date: "2026-06-18", time: "21:00", homeTeam: "Schweiz", awayTeam: "Bosnien och Hercegovina", groupCode: "B", stage: "group", broadcaster: "TV4" },
  { id: 27, dayLabel: "Fredag 19 juni", date: "2026-06-19", time: "00:00", homeTeam: "Kanada", awayTeam: "Qatar", groupCode: "B", stage: "group", broadcaster: "TV4" },
  { id: 28, dayLabel: "Fredag 19 juni", date: "2026-06-19", time: "03:00", homeTeam: "Mexiko", awayTeam: "Sydkorea", groupCode: "A", stage: "group", broadcaster: "TV4" },
  { id: 29, dayLabel: "Fredag 19 juni", date: "2026-06-19", time: "21:00", homeTeam: "USA", awayTeam: "Australien", groupCode: "D", stage: "group", broadcaster: "SVT" },
  { id: 30, dayLabel: "Lördag 20 juni", date: "2026-06-20", time: "00:00", homeTeam: "Skottland", awayTeam: "Marocko", groupCode: "C", stage: "group", broadcaster: "SVT" },
  { id: 31, dayLabel: "Lördag 20 juni", date: "2026-06-20", time: "03:00", homeTeam: "Brasilien", awayTeam: "Haiti", groupCode: "C", stage: "group", broadcaster: "TV4" },
  { id: 32, dayLabel: "Lördag 20 juni", date: "2026-06-20", time: "06:00", homeTeam: "Turkiet", awayTeam: "Paraguay", groupCode: "D", stage: "group", broadcaster: "TV4" },
  { id: 33, dayLabel: "Lördag 20 juni", date: "2026-06-20", time: "19:00", homeTeam: "Nederländerna", awayTeam: "Sverige", groupCode: "F", stage: "group", broadcaster: "TV4" },
  { id: 34, dayLabel: "Lördag 20 juni", date: "2026-06-20", time: "22:00", homeTeam: "Tyskland", awayTeam: "Elfenbenskusten", groupCode: "E", stage: "group", broadcaster: "TV4" },
  { id: 35, dayLabel: "Söndag 21 juni", date: "2026-06-21", time: "02:00", homeTeam: "Ecuador", awayTeam: "Curaçao", groupCode: "E", stage: "group", broadcaster: "TV4" },
  { id: 36, dayLabel: "Söndag 21 juni", date: "2026-06-21", time: "06:00", homeTeam: "Tunisien", awayTeam: "Japan", groupCode: "F", stage: "group", broadcaster: "SVT" },
  { id: 37, dayLabel: "Söndag 21 juni", date: "2026-06-21", time: "18:00", homeTeam: "Spanien", awayTeam: "Saudiarabien", groupCode: "H", stage: "group", broadcaster: "TV4" },
  { id: 38, dayLabel: "Söndag 21 juni", date: "2026-06-21", time: "21:00", homeTeam: "Belgien", awayTeam: "Iran", groupCode: "G", stage: "group", broadcaster: "TV4" },
  { id: 39, dayLabel: "Måndag 22 juni", date: "2026-06-22", time: "00:00", homeTeam: "Uruguay", awayTeam: "Kap Verde", groupCode: "H", stage: "group", broadcaster: "TV4" },
  { id: 40, dayLabel: "Måndag 22 juni", date: "2026-06-22", time: "03:00", homeTeam: "Nya Zeeland", awayTeam: "Egypten", groupCode: "G", stage: "group", broadcaster: "TV4" },
  { id: 41, dayLabel: "Måndag 22 juni", date: "2026-06-22", time: "19:00", homeTeam: "Argentina", awayTeam: "Österrike", groupCode: "J", stage: "group", broadcaster: "SVT" },
  { id: 42, dayLabel: "Måndag 22 juni", date: "2026-06-22", time: "23:00", homeTeam: "Frankrike", awayTeam: "Irak", groupCode: "I", stage: "group", broadcaster: "SVT" },
  { id: 43, dayLabel: "Tisdag 23 juni", date: "2026-06-23", time: "02:00", homeTeam: "Norge", awayTeam: "Senegal", groupCode: "I", stage: "group", broadcaster: "SVT" },
  { id: 44, dayLabel: "Tisdag 23 juni", date: "2026-06-23", time: "05:00", homeTeam: "Jordanien", awayTeam: "Algeriet", groupCode: "J", stage: "group", broadcaster: "TV4" },
  { id: 45, dayLabel: "Tisdag 23 juni", date: "2026-06-23", time: "19:00", homeTeam: "Portugal", awayTeam: "Uzbekistan", groupCode: "K", stage: "group", broadcaster: "SVT" },
  { id: 46, dayLabel: "Tisdag 23 juni", date: "2026-06-23", time: "22:00", homeTeam: "England", awayTeam: "Ghana", groupCode: "L", stage: "group", broadcaster: "SVT" },
  { id: 47, dayLabel: "Onsdag 24 juni", date: "2026-06-24", time: "01:00", homeTeam: "Panama", awayTeam: "Kroatien", groupCode: "L", stage: "group", broadcaster: "TV4" },
  { id: 48, dayLabel: "Onsdag 24 juni", date: "2026-06-24", time: "04:00", homeTeam: "Colombia", awayTeam: "DR Kongo", groupCode: "K", stage: "group", broadcaster: "SVT" },
  { id: 49, dayLabel: "Onsdag 24 juni", date: "2026-06-24", time: "21:00", homeTeam: "Schweiz", awayTeam: "Kanada", groupCode: "B", stage: "group", broadcaster: "TV4" },
  { id: 50, dayLabel: "Onsdag 24 juni", date: "2026-06-24", time: "21:00", homeTeam: "Bosnien och Hercegovina", awayTeam: "Qatar", groupCode: "B", stage: "group", broadcaster: "TV4" },
  { id: 51, dayLabel: "Torsdag 25 juni", date: "2026-06-25", time: "00:00", homeTeam: "Skottland", awayTeam: "Brasilien", groupCode: "C", stage: "group", broadcaster: "TV4" },
  { id: 52, dayLabel: "Torsdag 25 juni", date: "2026-06-25", time: "00:00", homeTeam: "Marocko", awayTeam: "Haiti", groupCode: "C", stage: "group", broadcaster: "TV4" },
  { id: 53, dayLabel: "Torsdag 25 juni", date: "2026-06-25", time: "03:00", homeTeam: "Tjeckien", awayTeam: "Mexiko", groupCode: "A", stage: "group", broadcaster: "SVT" },
  { id: 54, dayLabel: "Torsdag 25 juni", date: "2026-06-25", time: "03:00", homeTeam: "Sydafrika", awayTeam: "Sydkorea", groupCode: "A", stage: "group", broadcaster: "SVT" },
  { id: 55, dayLabel: "Torsdag 25 juni", date: "2026-06-25", time: "22:00", homeTeam: "Curaçao", awayTeam: "Elfenbenskusten", groupCode: "E", stage: "group", broadcaster: "SVT" },
  { id: 56, dayLabel: "Torsdag 25 juni", date: "2026-06-25", time: "22:00", homeTeam: "Ecuador", awayTeam: "Tyskland", groupCode: "E", stage: "group", broadcaster: "SVT" },
  { id: 57, dayLabel: "Fredag 26 juni", date: "2026-06-26", time: "01:00", homeTeam: "Japan", awayTeam: "Sverige", groupCode: "F", stage: "group", broadcaster: "SVT" },
  { id: 58, dayLabel: "Fredag 26 juni", date: "2026-06-26", time: "01:00", homeTeam: "Tunisien", awayTeam: "Nederländerna", groupCode: "F", stage: "group", broadcaster: "SVT" },
  { id: 59, dayLabel: "Fredag 26 juni", date: "2026-06-26", time: "04:00", homeTeam: "Turkiet", awayTeam: "USA", groupCode: "D", stage: "group", broadcaster: "TV4" },
  { id: 60, dayLabel: "Fredag 26 juni", date: "2026-06-26", time: "04:00", homeTeam: "Paraguay", awayTeam: "Australien", groupCode: "D", stage: "group", broadcaster: "TV4" },
  { id: 61, dayLabel: "Fredag 26 juni", date: "2026-06-26", time: "21:00", homeTeam: "Norge", awayTeam: "Frankrike", groupCode: "I", stage: "group", broadcaster: "TV4" },
  { id: 62, dayLabel: "Fredag 26 juni", date: "2026-06-26", time: "21:00", homeTeam: "Senegal", awayTeam: "Irak", groupCode: "I", stage: "group", broadcaster: "TV4" },
  { id: 63, dayLabel: "Lördag 27 juni", date: "2026-06-27", time: "02:00", homeTeam: "Kap Verde", awayTeam: "Saudiarabien", groupCode: "H", stage: "group", broadcaster: "TV4" },
  { id: 64, dayLabel: "Lördag 27 juni", date: "2026-06-27", time: "02:00", homeTeam: "Uruguay", awayTeam: "Spanien", groupCode: "H", stage: "group", broadcaster: "TV4" },
  { id: 65, dayLabel: "Lördag 27 juni", date: "2026-06-27", time: "05:00", homeTeam: "Egypten", awayTeam: "Iran", groupCode: "G", stage: "group", broadcaster: "TV4" },
  { id: 66, dayLabel: "Lördag 27 juni", date: "2026-06-27", time: "05:00", homeTeam: "Nya Zeeland", awayTeam: "Belgien", groupCode: "G", stage: "group", broadcaster: "TV4" },
  { id: 67, dayLabel: "Lördag 27 juni", date: "2026-06-27", time: "23:00", homeTeam: "Panama", awayTeam: "England", groupCode: "L", stage: "group", broadcaster: "SVT" },
  { id: 68, dayLabel: "Lördag 27 juni", date: "2026-06-27", time: "23:00", homeTeam: "Kroatien", awayTeam: "Ghana", groupCode: "L", stage: "group", broadcaster: "SVT" },
  { id: 69, dayLabel: "Söndag 28 juni", date: "2026-06-28", time: "01:30", homeTeam: "Colombia", awayTeam: "Portugal", groupCode: "K", stage: "group", broadcaster: "TV4" },
  { id: 70, dayLabel: "Söndag 28 juni", date: "2026-06-28", time: "01:30", homeTeam: "DR Kongo", awayTeam: "Uzbekistan", groupCode: "K", stage: "group", broadcaster: "TV4" },
  { id: 71, dayLabel: "Söndag 28 juni", date: "2026-06-28", time: "04:00", homeTeam: "Algeriet", awayTeam: "Österrike", groupCode: "J", stage: "group", broadcaster: "TV4" },
  { id: 72, dayLabel: "Söndag 28 juni", date: "2026-06-28", time: "04:00", homeTeam: "Jordanien", awayTeam: "Argentina", groupCode: "J", stage: "group", broadcaster: "TV4" },
  { id: 73, matchNumber: 65, dayLabel: "Söndag 28 juni", date: "2026-06-28", time: "21:00", homeTeam: "2A", awayTeam: "2B", stage: "r16", broadcaster: "TV4" },
  { id: 74, matchNumber: 66, dayLabel: "Måndag 29 juni", date: "2026-06-29", time: "19:00", homeTeam: "1C", awayTeam: "2F", stage: "r16", broadcaster: "TV4" },
  { id: 75, matchNumber: 67, dayLabel: "Måndag 29 juni", date: "2026-06-29", time: "22:30", homeTeam: "1E", awayTeam: "3A/B/C/D/F", stage: "r16", broadcaster: "SVT" },
  { id: 76, matchNumber: 68, dayLabel: "Tisdag 30 juni", date: "2026-06-30", time: "03:00", homeTeam: "1F", awayTeam: "2C", stage: "r16", broadcaster: "SVT" },
  { id: 77, matchNumber: 69, dayLabel: "Tisdag 30 juni", date: "2026-06-30", time: "19:00", homeTeam: "2E", awayTeam: "2I", stage: "r16", broadcaster: "TV4" },
  { id: 78, matchNumber: 70, dayLabel: "Tisdag 30 juni", date: "2026-06-30", time: "23:00", homeTeam: "1I", awayTeam: "3C/D/F/G/H", stage: "r16", broadcaster: "TV4" },
  { id: 79, matchNumber: 71, dayLabel: "Onsdag 1 juli", date: "2026-07-01", time: "03:00", homeTeam: "1A", awayTeam: "3C/E/F/H/I", stage: "r16", broadcaster: "TV4" },
  { id: 80, matchNumber: 72, dayLabel: "Onsdag 1 juli", date: "2026-07-01", time: "18:00", homeTeam: "1L", awayTeam: "3E/H/I/J/K", stage: "r16", broadcaster: "SVT" },
  { id: 81, matchNumber: 73, dayLabel: "Onsdag 1 juli", date: "2026-07-01", time: "22:00", homeTeam: "1G", awayTeam: "3A/E/H/I/J", stage: "r16", broadcaster: "TV4" },
  { id: 82, matchNumber: 74, dayLabel: "Torsdag 2 juli", date: "2026-07-02", time: "02:00", homeTeam: "1D", awayTeam: "3B/E/F/I/J", stage: "r16", broadcaster: "TV4" },
  { id: 83, matchNumber: 75, dayLabel: "Torsdag 2 juli", date: "2026-07-02", time: "21:00", homeTeam: "1H", awayTeam: "2J", stage: "r16", broadcaster: "SVT" },
  { id: 84, matchNumber: 76, dayLabel: "Fredag 3 juli", date: "2026-07-03", time: "01:00", homeTeam: "2K", awayTeam: "2L", stage: "r16", broadcaster: "TV4" },
  { id: 85, matchNumber: 77, dayLabel: "Fredag 3 juli", date: "2026-07-03", time: "05:00", homeTeam: "1B", awayTeam: "3E/F/G/I/J", stage: "r16", broadcaster: "TV4" },
  { id: 86, matchNumber: 78, dayLabel: "Fredag 3 juli", date: "2026-07-03", time: "20:00", homeTeam: "2D", awayTeam: "2G", stage: "r16", broadcaster: "TV4" },
  { id: 87, matchNumber: 79, dayLabel: "Lördag 4 juli", date: "2026-07-04", time: "00:00", homeTeam: "1J", awayTeam: "2H", stage: "r16", broadcaster: "TV4" },
  { id: 88, matchNumber: 80, dayLabel: "Lördag 4 juli", date: "2026-07-04", time: "03:30", homeTeam: "1K", awayTeam: "3D/E/I/J/L", stage: "r16", broadcaster: "SVT" },
  { id: 89, matchNumber: 81, dayLabel: "Lördag 4 juli", date: "2026-07-04", time: "19:00", homeTeam: "Vinnare M73", awayTeam: "Vinnare M75", stage: "r8", broadcaster: "TV4" },
  { id: 90, matchNumber: 82, dayLabel: "Lördag 4 juli", date: "2026-07-04", time: "23:00", homeTeam: "Vinnare M74", awayTeam: "Vinnare M77", stage: "r8", broadcaster: "SVT" },
  { id: 91, matchNumber: 83, dayLabel: "Söndag 5 juli", date: "2026-07-05", time: "22:00", homeTeam: "Vinnare M76", awayTeam: "Vinnare M78", stage: "r8", broadcaster: "TV4" },
  { id: 92, matchNumber: 84, dayLabel: "Måndag 6 juli", date: "2026-07-06", time: "02:00", homeTeam: "Vinnare M79", awayTeam: "Vinnare M80", stage: "r8", broadcaster: "SVT" },
  { id: 93, matchNumber: 85, dayLabel: "Måndag 6 juli", date: "2026-07-06", time: "21:00", homeTeam: "Vinnare M83", awayTeam: "Vinnare M84", stage: "r8", broadcaster: "TV4" },
  { id: 94, matchNumber: 86, dayLabel: "Tisdag 7 juli", date: "2026-07-07", time: "02:00", homeTeam: "Vinnare M81", awayTeam: "Vinnare M82", stage: "r8", broadcaster: "TV4" },
  { id: 95, matchNumber: 87, dayLabel: "Tisdag 7 juli", date: "2026-07-07", time: "18:00", homeTeam: "Vinnare M86", awayTeam: "Vinnare M88", stage: "r8", broadcaster: "TV4" },
  { id: 96, matchNumber: 88, dayLabel: "Tisdag 7 juli", date: "2026-07-07", time: "22:00", homeTeam: "Vinnare M85", awayTeam: "Vinnare M87", stage: "r8", broadcaster: "SVT" },
  { id: 97, matchNumber: 89, dayLabel: "Torsdag 9 juli", date: "2026-07-09", time: "22:00", homeTeam: "Vinnare M89", awayTeam: "Vinnare M90", stage: "qf", broadcaster: "TV4" },
  { id: 98, matchNumber: 90, dayLabel: "Fredag 10 juli", date: "2026-07-10", time: "21:00", homeTeam: "Vinnare M93", awayTeam: "Vinnare M94", stage: "qf", broadcaster: "SVT" },
  { id: 99, matchNumber: 91, dayLabel: "Lördag 11 juli", date: "2026-07-11", time: "23:00", homeTeam: "Vinnare M91", awayTeam: "Vinnare M92", stage: "qf", broadcaster: "TV4" },
  { id: 100, matchNumber: 92, dayLabel: "Söndag 12 juli", date: "2026-07-12", time: "03:00", homeTeam: "Vinnare M95", awayTeam: "Vinnare M96", stage: "qf", broadcaster: "SVT" },
  { id: 101, matchNumber: 93, dayLabel: "Tisdag 14 juli", date: "2026-07-14", time: "21:00", homeTeam: "Vinnare M97", awayTeam: "Vinnare M98", stage: "sf", broadcaster: "SVT" },
  { id: 102, matchNumber: 94, dayLabel: "Onsdag 15 juli", date: "2026-07-15", time: "21:00", homeTeam: "Vinnare M99", awayTeam: "Vinnare M100", stage: "sf", broadcaster: "TV4" },
  { id: 103, matchNumber: 95, dayLabel: "Lördag 18 juli", date: "2026-07-18", time: "23:00", homeTeam: "Förlorare M93", awayTeam: "Förlorare M94", stage: "bronze", broadcaster: "SVT" },
  { id: 104, matchNumber: 96, dayLabel: "Söndag 19 juli", date: "2026-07-19", time: "21:00", homeTeam: "Vinnare M93", awayTeam: "Vinnare M94", stage: "final", broadcaster: "TV4" },
];

export function kickoffIso(date: string, time: string): string {
  const [h, m] = time.split(":").map(Number);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date}T${pad(h)}:${pad(m)}:00+02:00`;
}

export const JAR_CONTRIBUTION_EUR = 10;

export const GROUP_MATCH_IDS = MATCHES.filter((m) => m.stage === "group").map(
  (m) => m.id,
);
export const POINTS_EXACT = 3;
export const POINTS_OUTCOME = 1;
