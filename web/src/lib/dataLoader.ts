import type { DayData, PitcherRow, ReportRow } from "../types";

function formatDate(d: Date): string {
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${mm}${dd}`;
}

const SEASON_START: Record<number, Date> = {
  2021: new Date(2021, 3, 3),  // 4/3 개막
  2022: new Date(2022, 3, 2),  // 4/2 개막
  2023: new Date(2023, 3, 1),  // 4/1 개막
  2024: new Date(2024, 2, 23), // 3/23 개막
  2025: new Date(2025, 2, 22), // 3/22 개막
  2026: new Date(2026, 2, 28), // 3/28 개막
};

// 시범경기 시작일 (데이터 첫 날 기준)
const PRESEASON_START: Record<number, Date> = {
  2021: new Date(2021, 2, 21), // 3/21
  2022: new Date(2022, 2, 12), // 3/12
  2023: new Date(2023, 2, 13), // 3/13
  2024: new Date(2024, 2, 9),  // 3/9
  2025: new Date(2025, 2, 8),  // 3/8
  2026: new Date(2026, 2, 12), // 3/12
};

// 정규시즌 종료일 (마지막으로 10개 팀 모두 경기한 날)
const REGULAR_SEASON_END: Record<number, Date> = {
  2021: new Date(2021, 9, 17),  // 10/17
  2022: new Date(2022, 9, 8),   // 10/8
  2023: new Date(2023, 9, 10),  // 10/10
  2024: new Date(2024, 8, 28),  // 9/28
  2025: new Date(2025, 8, 30),  // 9/30
};

// 포스트시즌 포함 전체 시즌 종료일 (데이터 마지막 날 기준)
const SEASON_END: Record<number, Date> = {
  2021: new Date(2021, 10, 18), // 11/18 한국시리즈 종료
  2022: new Date(2022, 10, 8),  // 11/8 한국시리즈 종료
  2023: new Date(2023, 10, 13), // 11/13 한국시리즈 종료
  2024: new Date(2024, 9, 28),  // 10/28 한국시리즈 종료
  2025: new Date(2025, 9, 14),  // 10/14 한국시리즈 종료
};

export function getSeasonEnd(year: number): Date {
  return SEASON_END[year] ?? new Date();
}

export function getSeasonStart(year: number): Date {
  return SEASON_START[year] ?? new Date(year, 2, 1);
}

export function getDateRange(days: number, year?: number): Date[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const base = year && SEASON_END[year] ? SEASON_END[year] : today;

  return Array.from({ length: days }, (_, i) => {
    const d = new Date(base);
    d.setDate(base.getDate() - (days - 1 - i));
    return d;
  });
}

export function getMonthDates(year: number, month: number): Date[] {
  const seasonStart = getSeasonStart(year);
  const seasonEnd = getSeasonEnd(year);

  const firstOfMonth = new Date(year, month, 1);
  const lastOfMonth = new Date(year, month + 1, 0);

  const start = firstOfMonth < seasonStart ? seasonStart : firstOfMonth;
  const end = lastOfMonth > seasonEnd ? seasonEnd : lastOfMonth;

  if (start > end) return [];

  const dates: Date[] = [];
  const d = new Date(start);
  while (d <= end) {
    dates.push(new Date(d));
    d.setDate(d.getDate() + 1);
  }
  return dates;
}

export async function fetchDayData(date: Date): Promise<DayData | null> {
  const mmdd = formatDate(date);
  const year = date.getFullYear();
  try {
    const res = await fetch(`${import.meta.env.BASE_URL}data/${year}/${mmdd}.json`);
    if (!res.ok) return null;
    const ct = res.headers.get("content-type") ?? "";
    if (!ct.includes("json")) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function loadDateRange(dates: Date[]): Promise<(DayData | null)[]> {
  return Promise.all(dates.map(fetchDayData));
}

export function getSeasonDates(year: number): Date[] {
  const start = PRESEASON_START[year] ?? getSeasonStart(year);
  const end = getSeasonEnd(year);
  const dates: Date[] = [];
  const d = new Date(start);
  while (d <= end) {
    dates.push(new Date(d));
    d.setDate(d.getDate() + 1);
  }
  return dates;
}

function ipToOuts(ip: string): number {
  if (ip.includes(".")) {
    const [full, partial] = ip.split(".");
    return parseInt(full) * 3 + parseInt(partial);
  }
  return parseInt(ip) * 3;
}

export function outsToIp(outs: number): string {
  const full = Math.floor(outs / 3);
  const partial = outs % 3;
  return `${full}.${partial}`;
}

function countStreaks(dates: Date[]): { streak2: number; streak3plus: number } {
  if (dates.length === 0) return { streak2: 0, streak3plus: 0 };
  const sorted = [...dates].sort((a, b) => a.getTime() - b.getTime());
  let streak2 = 0;
  let streak3plus = 0;
  let cur = 1;
  for (let i = 1; i < sorted.length; i++) {
    const diff = (sorted[i].getTime() - sorted[i - 1].getTime()) / 86400000;
    if (diff === 1) {
      cur++;
    } else {
      if (cur === 2) streak2++;
      else if (cur >= 3) streak3plus++;
      cur = 1;
    }
  }
  if (cur === 2) streak2++;
  else if (cur >= 3) streak3plus++;
  return { streak2, streak3plus };
}

type SeasonType = "regular" | "preseason" | "postseason";

function getDateSeasonType(date: Date, year: number): SeasonType {
  const start = SEASON_START[year];
  const regularEnd = REGULAR_SEASON_END[year];
  if (start && date < start) return "preseason";
  if (regularEnd && date > regularEnd) return "postseason";
  return "regular";
}

export function buildReportRows(
  dates: Date[],
  dayDataList: (DayData | null)[],
  teamFilter: string | null,
  roleFilter: "all" | "starter" | "bullpen" = "all",
  seasonTypeFilter: Set<SeasonType> | null = null
): ReportRow[] {
  const rowMap = new Map<string, { row: ReportRow; appearDates: Date[] }>();

  dates.forEach((date, idx) => {
    const dayData = dayDataList[idx];
    if (!dayData) return;

    if (seasonTypeFilter !== null) {
      const year = date.getFullYear();
      const st = getDateSeasonType(date, year);
      if (!seasonTypeFilter.has(st)) return;
    }

    for (const app of dayData.appearances) {
      if (teamFilter && app.team_code !== teamFilter) continue;
      if (roleFilter === "starter" && !app.is_starter) continue;
      if (roleFilter === "bullpen" && app.is_starter) continue;

      const key = app.player_id || `${app.name}_${app.team_code}`;
      if (!rowMap.has(key)) {
        rowMap.set(key, {
          row: {
            player_id: app.player_id,
            name: app.name,
            team: app.team,
            team_code: app.team_code,
            appearances: 0,
            total_outs: 0,
            total_pitches: 0,
            streak2: 0,
            streak3plus: 0,
          },
          appearDates: [],
        });
      }
      const entry = rowMap.get(key)!;
      entry.row.appearances++;
      entry.row.total_outs += ipToOuts(app.innings_pitched);
      entry.row.total_pitches += app.pitch_count;
      entry.appearDates.push(date);
    }
  });

  return Array.from(rowMap.values())
    .map(({ row, appearDates }) => {
      const { streak2, streak3plus } = countStreaks(appearDates);
      return { ...row, streak2, streak3plus };
    })
    .sort((a, b) => {
      if (a.team_code !== b.team_code) return a.team_code.localeCompare(b.team_code);
      return a.name.localeCompare(b.name);
    });
}

export function buildPitcherGrid(
  dates: Date[],
  dayDataList: (DayData | null)[],
  teamFilter: string | null,
  roleFilter: "all" | "starter" | "bullpen" = "all"
): PitcherRow[] {
  // player_id → PitcherRow 맵
  const rowMap = new Map<string, PitcherRow>();

  dates.forEach((_date, idx) => {
    const dayData = dayDataList[idx];
    if (!dayData) return;

    for (const app of dayData.appearances) {
      if (teamFilter && app.team_code !== teamFilter) continue;
      if (roleFilter === "starter" && !app.is_starter) continue;
      if (roleFilter === "bullpen" && app.is_starter) continue;

      const key = app.player_id || `${app.name}_${app.team_code}`;

      if (!rowMap.has(key)) {
        rowMap.set(key, {
          player_id: app.player_id,
          name: app.name,
          team: app.team,
          team_code: app.team_code,
          days: Array(dates.length).fill(null),
        });
      }

      rowMap.get(key)!.days[idx] = app;
    }
  });

  // 팀별 정렬 → 이름 정렬
  return Array.from(rowMap.values()).sort((a, b) => {
    if (a.team_code !== b.team_code) return a.team_code.localeCompare(b.team_code);
    return a.name.localeCompare(b.name);
  });
}
