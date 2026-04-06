import type { DayData, PitcherRow } from "../types";

function formatDate(d: Date): string {
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${mm}${dd}`;
}

export function getDateRange(days: number): Date[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Array.from({ length: days }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (days - 1 - i));
    return d;
  });
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
