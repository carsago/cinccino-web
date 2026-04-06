export type Appearance = {
  player_id: string;
  name: string;
  team: string;
  team_code: string;
  innings_pitched: string; // "6", "0.2", "1.1"
  pitch_count: number;
  is_starter: boolean;
  game_id: number;
};

export type Game = {
  game_id: number;
  home: string;
  home_name: string;
  away: string;
  away_name: string;
  status: string;
};

export type DayData = {
  date: string; // "2026-04-05"
  games: Game[];
  appearances: Appearance[];
};

// 그리드에서 한 투수의 행 데이터
export type PitcherRow = {
  player_id: string;
  name: string;
  team: string;
  team_code: string;
  // 날짜별 등판 데이터 (없으면 null)
  days: (Appearance | null)[];
};

export type TeamInfo = {
  code: string;
  name: string;
};

export const TEAMS: TeamInfo[] = [
  { code: "LG", name: "LG" },
  { code: "KT", name: "KT" },
  { code: "SK", name: "SSG" },
  { code: "NC", name: "NC" },
  { code: "OB", name: "두산" },
  { code: "HT", name: "KIA" },
  { code: "LT", name: "롯데" },
  { code: "SS", name: "삼성" },
  { code: "HH", name: "한화" },
  { code: "WO", name: "키움" },
];
