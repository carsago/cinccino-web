import { useEffect, useState } from "react";
import { TEAMS } from "./types";
import {
  getDateRange,
  getMonthDates,
  getSeasonDates,
  getSeasonStart,
  getSeasonEnd,
  loadDateRange,
  buildPitcherGrid,
  buildReportRows,
} from "./lib/dataLoader";
import type { DayData, PitcherRow, ReportRow } from "./types";
import PitcherGrid from "./components/PitcherGrid";
import ReportTable from "./components/ReportTable";
import "./index.css";

type RangeMode = 10 | "month";
type RoleFilter = "all" | "starter" | "bullpen";
type ViewMode = "grid" | "report";
type ReportPeriod = "month" | "season";
type SeasonType = "regular" | "preseason" | "postseason";
// null = 전체, Set = 선택된 타입들
type SeasonTypeFilter = Set<SeasonType> | null;
type SortKey = "appearances" | "total_outs" | "total_pitches" | "streak2" | "streak3plus";
type SortDir = "desc" | "asc";

const YEAR_OPTIONS = [2026, 2025, 2024, 2023, 2022, 2021] as const;

function getDefaultMonth(year: number): Date {
  const end = getSeasonEnd(year);
  return new Date(end.getFullYear(), end.getMonth(), 1);
}

export default function App() {
  const [year, setYear] = useState<2021 | 2022 | 2023 | 2024 | 2025 | 2026>(2026);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [rangeMode, setRangeMode] = useState<RangeMode>(10);
  const [viewMonth, setViewMonth] = useState<Date>(() => getDefaultMonth(2026));
  const [teamFilter, setTeamFilter] = useState<string | null>(null);
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");

  const [rows, setRows] = useState<PitcherRow[]>([]);
  const [dates, setDates] = useState<Date[]>([]);
  const [loading, setLoading] = useState(true);
  const [dayDataList, setDayDataList] = useState<(DayData | null)[]>([]);

  const [reportPeriod, setReportPeriod] = useState<ReportPeriod>("season");
  const [reportViewMonth, setReportViewMonth] = useState<Date>(() => getDefaultMonth(2026));
  const [seasonTypeFilter, setSeasonTypeFilter] = useState<SeasonTypeFilter>(() => new Set<SeasonType>(["regular"]));

  function toggleSeasonType(type: SeasonType) {
    setSeasonTypeFilter((prev) => {
      if (prev === null) return new Set([type]);
      const next = new Set(prev);
      if (next.has(type)) {
        next.delete(type);
        return next.size === 0 ? null : next;
      } else {
        next.add(type);
        return next;
      }
    });
  }
  const [reportRows, setReportRows] = useState<ReportRow[]>([]);
  const [reportLoading, setReportLoading] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey | null>("total_outs");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  useEffect(() => {
    if (viewMode !== "grid") return;
    setLoading(true);
    const newDates = rangeMode === "month"
      ? getMonthDates(viewMonth.getFullYear(), viewMonth.getMonth())
      : getDateRange(rangeMode, year);
    setDates(newDates);
    loadDateRange(newDates).then((data) => { setDayDataList(data); setLoading(false); });
  }, [viewMode, rangeMode, year, viewMonth]);

  useEffect(() => {
    if (dates.length === 0 || dayDataList.length === 0) return;
    setRows(buildPitcherGrid(dates, dayDataList, teamFilter, roleFilter));
  }, [dates, dayDataList, teamFilter, roleFilter]);

  const seasonTypeKey = seasonTypeFilter === null ? "all" : [...seasonTypeFilter].sort().join(",");

  useEffect(() => {
    if (viewMode !== "report") return;
    setReportLoading(true);
    const reportDates = reportPeriod === "season"
      ? getSeasonDates(year)
      : getMonthDates(reportViewMonth.getFullYear(), reportViewMonth.getMonth());
    loadDateRange(reportDates).then((data) => {
      setReportRows(buildReportRows(reportDates, data, teamFilter, roleFilter, seasonTypeFilter));
      setReportLoading(false);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode, reportPeriod, year, reportViewMonth, teamFilter, roleFilter, seasonTypeKey]);

  function handleYearChange(y: 2021 | 2022 | 2023 | 2024 | 2025 | 2026) {
    setYear(y);
    const m = getDefaultMonth(y);
    setViewMonth(m);
    setReportViewMonth(m);
  }

  const seasonStart = getSeasonStart(year);
  const seasonEnd = getSeasonEnd(year);
  const minMonth = new Date(seasonStart.getFullYear(), seasonStart.getMonth(), 1);
  const maxMonth = new Date(seasonEnd.getFullYear(), seasonEnd.getMonth(), 1);

  function prevMonth() { if (viewMonth > minMonth) setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1)); }
  function nextMonth() { if (viewMonth < maxMonth) setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1)); }
  function prevReportMonth() { if (reportViewMonth > minMonth) setReportViewMonth(new Date(reportViewMonth.getFullYear(), reportViewMonth.getMonth() - 1, 1)); }
  function nextReportMonth() { if (reportViewMonth < maxMonth) setReportViewMonth(new Date(reportViewMonth.getFullYear(), reportViewMonth.getMonth() + 1, 1)); }

  return (
    <div className="app">
      {/* 헤더 */}
      <header className="header">
        <h1>KBO 투수 트래커</h1>
      </header>

      {/* 뷰 탭 */}
      <div className="view-tabs">
        <button className={`view-tab${viewMode === "grid" ? " active" : ""}`} onClick={() => setViewMode("grid")}>그리드</button>
        <button className={`view-tab${viewMode === "report" ? " active" : ""}`} onClick={() => setViewMode("report")}>리포트</button>
      </div>

      {/* 공통 필터 */}
      <div className="controls">
        <div className="team-filter-wrap">
          <button className={teamFilter === null ? "active" : ""} onClick={() => setTeamFilter(null)}>전체</button>
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

        <div className="sub-filter">
          <div className="role-filter">
            {(["all", "starter", "bullpen"] as RoleFilter[]).map((r) => (
              <button key={r} className={roleFilter === r ? "active" : ""} onClick={() => setRoleFilter(r)}>
                {r === "all" ? "전체" : r === "starter" ? "선발만" : "불펜만"}
              </button>
            ))}
          </div>

          {/* 그리드 전용 기간 */}
          {viewMode === "grid" && (
            <div className="role-filter">
              {([10, "month"] as RangeMode[]).map((m) => (
                <button key={m} className={rangeMode === m ? "active" : ""} onClick={() => setRangeMode(m)}>
                  {m === "month" ? "월별" : `${m}일`}
                </button>
              ))}
            </div>
          )}

          {/* 리포트 전용 기간 */}
          {viewMode === "report" && (
            <div className="role-filter">
              <button className={reportPeriod === "month" ? "active" : ""} onClick={() => setReportPeriod("month")}>월별</button>
              <button className={reportPeriod === "season" ? "active" : ""} onClick={() => setReportPeriod("season")}>시즌 전체</button>
            </div>
          )}

          {/* 리포트 전용 시즌 구분 */}
          {viewMode === "report" && (
            <div className="role-filter">
              {(["regular", "preseason", "postseason"] as SeasonType[]).map((type) => {
                const label = type === "regular" ? "정규" : type === "preseason" ? "시범" : "포스트";
                const active = seasonTypeFilter !== null && seasonTypeFilter.has(type);
                return <button key={type} className={active ? "active" : ""} onClick={() => toggleSeasonType(type)}>{label}</button>;
              })}
              <button className={seasonTypeFilter === null ? "active" : ""} onClick={() => setSeasonTypeFilter(null)}>전체</button>
            </div>
          )}

          {/* 연도 */}
          <div className="role-filter">
            {YEAR_OPTIONS.map((y) => (
              <button key={y} className={year === y ? "active" : ""} onClick={() => handleYearChange(y)}>{y}</button>
            ))}
          </div>
        </div>
      </div>

      {/* 월 네비게이션 */}
      {viewMode === "grid" && rangeMode === "month" && (
        <div className="month-nav">
          <button className="month-nav-btn" onClick={prevMonth} disabled={viewMonth <= minMonth}>‹</button>
          <span className="month-label">{viewMonth.getFullYear()}년 {viewMonth.getMonth() + 1}월</span>
          <button className="month-nav-btn" onClick={nextMonth} disabled={viewMonth >= maxMonth}>›</button>
        </div>
      )}
      {viewMode === "report" && reportPeriod === "month" && (
        <div className="month-nav">
          <button className="month-nav-btn" onClick={prevReportMonth} disabled={reportViewMonth <= minMonth}>‹</button>
          <span className="month-label">{reportViewMonth.getFullYear()}년 {reportViewMonth.getMonth() + 1}월</span>
          <button className="month-nav-btn" onClick={nextReportMonth} disabled={reportViewMonth >= maxMonth}>›</button>
        </div>
      )}

      {viewMode === "grid" && (
        loading ? <div className="loading">로딩 중...</div> : <PitcherGrid dates={dates} rows={rows} />
      )}
      {viewMode === "report" && (
        reportLoading ? <div className="loading">로딩 중...</div> : (
          <ReportTable
            rows={reportRows}
            sortKey={sortKey}
            sortDir={sortDir}
            onSort={(key) => {
              if (sortKey === key) {
                setSortDir(sortDir === "desc" ? "asc" : "desc");
              } else {
                setSortKey(key);
                setSortDir("desc");
              }
            }}
          />
        )
      )}
    </div>
  );
}
