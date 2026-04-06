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
  logo: string;
};

const LOGO = (code: string) =>
  `https://6ptotvmi5753.edge.naverncp.com/KBO_IMAGE/emblem/regular/2026/emblem_${code}.png`;

export const TEAMS: TeamInfo[] = [
  { code: "LG", name: "LG", logo: LOGO("LG") },
  { code: "KT", name: "KT", logo: LOGO("KT") },
  { code: "SK", name: "SSG", logo: LOGO("SK") },
  { code: "NC", name: "NC", logo: LOGO("NC") },
  { code: "OB", name: "두산", logo: LOGO("OB") },
  { code: "HT", name: "KIA", logo: LOGO("HT") },
  { code: "LT", name: "롯데", logo: LOGO("LT") },
  { code: "SS", name: "삼성", logo: LOGO("SS") },
  { code: "HH", name: "한화", logo: LOGO("HH") },
  { code: "WO", name: "키움", logo: LOGO("WO") },
];
