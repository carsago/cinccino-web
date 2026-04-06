import { useEffect, useState } from "react";
import { TEAMS } from "./types";
import {
  getDateRange,
  getMonthDates,
  getSeasonStart,
  getSeasonEnd,
  loadDateRange,
  buildPitcherGrid,
} from "./lib/dataLoader";
import type { DayData, PitcherRow } from "./types";
import PitcherGrid from "./components/PitcherGrid";
import "./index.css";

type RangeMode = 10 | "month";
type RoleFilter = "all" | "starter" | "bullpen";
const YEAR_OPTIONS = [2026, 2025] as const;

function getDefaultMonth(year: number): Date {
  const end = getSeasonEnd(year);
  return new Date(end.getFullYear(), end.getMonth(), 1);
}

export default function App() {
  const [year, setYear] = useState<2025 | 2026>(2026);
  const [rangeMode, setRangeMode] = useState<RangeMode>(10);
  const [viewMonth, setViewMonth] = useState<Date>(() => getDefaultMonth(2026));
  const [teamFilter, setTeamFilter] = useState<string | null>(null);
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [rows, setRows] = useState<PitcherRow[]>([]);
  const [dates, setDates] = useState<Date[]>([]);
  const [loading, setLoading] = useState(true);
  const [dayDataList, setDayDataList] = useState<(DayData | null)[]>([]);

  useEffect(() => {
    setLoading(true);
    let newDates: Date[];
    if (rangeMode === "month") {
      newDates = getMonthDates(viewMonth.getFullYear(), viewMonth.getMonth());
    } else {
      newDates = getDateRange(rangeMode as number, year);
    }
    setDates(newDates);
    loadDateRange(newDates).then((data) => {
      setDayDataList(data);
      setLoading(false);
    });
  }, [rangeMode, year, viewMonth]);

  useEffect(() => {
    if (dates.length === 0 || dayDataList.length === 0) return;
    setRows(buildPitcherGrid(dates, dayDataList, teamFilter, roleFilter));
  }, [dates, dayDataList, teamFilter, roleFilter]);

  function handleYearChange(y: 2025 | 2026) {
    setYear(y);
    setViewMonth(getDefaultMonth(y));
  }

  function prevMonth() {
    const seasonStart = getSeasonStart(viewMonth.getFullYear());
    const minMonth = new Date(seasonStart.getFullYear(), seasonStart.getMonth(), 1);
    const prev = new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1);
    if (prev >= minMonth) setViewMonth(prev);
  }

  function nextMonth() {
    const seasonEnd = getSeasonEnd(viewMonth.getFullYear());
    const maxMonth = new Date(seasonEnd.getFullYear(), seasonEnd.getMonth(), 1);
    const next = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1);
    if (next <= maxMonth) setViewMonth(next);
  }

  const seasonStart = getSeasonStart(viewMonth.getFullYear());
  const seasonEnd = getSeasonEnd(viewMonth.getFullYear());
  const canPrevMonth = viewMonth > new Date(seasonStart.getFullYear(), seasonStart.getMonth(), 1);
  const canNextMonth = viewMonth < new Date(seasonEnd.getFullYear(), seasonEnd.getMonth(), 1);

  return (
    <div className="app">
      <header className="header">
        <h1>KBO 투수 트래커</h1>
        <div className="year-filter">
          {YEAR_OPTIONS.map((y) => (
            <button
              key={y}
              className={year === y ? "active" : ""}
              onClick={() => handleYearChange(y)}
            >
              {y}
            </button>
          ))}
        </div>
      </header>

      <div className="controls">
        <div className="team-filter">
          <button
            className={teamFilter === null ? "active" : ""}
            onClick={() => setTeamFilter(null)}
          >
            전체
          </button>
          {TEAMS.map((t) => (
            <button
              key={t.code}
              className={`team-logo-btn${teamFilter === t.code ? " active" : ""}`}
              onClick={() => setTeamFilter(t.code)}
              title={t.name}
            >
              <img src={t.logo} alt={t.name} />
            </button>
          ))}
        </div>

        <div className="range-filter">
          <div className="role-filter">
            {(["all", "starter", "bullpen"] as RoleFilter[]).map((r) => (
              <button
                key={r}
                className={roleFilter === r ? "active" : ""}
                onClick={() => setRoleFilter(r)}
              >
                {r === "all" ? "전체" : r === "starter" ? "선발만" : "불펜만"}
              </button>
            ))}
          </div>
          <div className="role-filter">
            {([10, "month"] as RangeMode[]).map((m) => (
              <button
                key={m}
                className={rangeMode === m ? "active" : ""}
                onClick={() => setRangeMode(m)}
              >
                {m === "month" ? "월별" : `${m}일`}
              </button>
            ))}
          </div>
        </div>
      </div>

      {rangeMode === "month" && (
        <div className="month-nav">
          <button
            className={`month-nav-btn${!canPrevMonth ? " disabled" : ""}`}
            onClick={prevMonth}
            disabled={!canPrevMonth}
          >
            ‹
          </button>
          <span className="month-label">
            {viewMonth.getFullYear()}년 {viewMonth.getMonth() + 1}월
          </span>
          <button
            className={`month-nav-btn${!canNextMonth ? " disabled" : ""}`}
            onClick={nextMonth}
            disabled={!canNextMonth}
          >
            ›
          </button>
        </div>
      )}

      {loading ? (
        <div className="loading">로딩 중...</div>
      ) : (
        <PitcherGrid dates={dates} rows={rows} />
      )}
    </div>
  );
}
