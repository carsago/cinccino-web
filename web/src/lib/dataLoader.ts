import type { DayData, PitcherRow } from "../types";

function formatDate(d: Date): string {
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${mm}${dd}`;
}

const SEASON_START: Record<number, Date> = {
  2025: new Date(2025, 2, 22), // 3/22
  2026: new Date(2026, 2, 28), // 3/28
};

const SEASON_END: Record<number, Date> = {
  2025: new Date(2025, 9, 15), // 10/15
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
