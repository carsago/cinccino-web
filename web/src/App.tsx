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

const YEAR_OPTIONS = [2026, 2025] as const;

function getDefaultMonth(year: number): Date {
  const end = getSeasonEnd(year);
  return new Date(end.getFullYear(), end.getMonth(), 1);
}

export default function App() {
  const [year, setYear] = useState<2025 | 2026>(2026);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [rangeMode, setRangeMode] = useState<RangeMode>(10);
  const [viewMonth, setViewMonth] = useState<Date>(() => getDefaultMonth(2026));
  const [teamFilter, setTeamFilter] = useState<string | null>(null);
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");

  // 그리드 상태
  const [rows, setRows] = useState<PitcherRow[]>([]);
  const [dates, setDates] = useState<Date[]>([]);
  const [loading, setLoading] = useState(true);
  const [dayDataList, setDayDataList] = useState<(DayData | null)[]>([]);

  // 리포트 상태
  const [reportPeriod, setReportPeriod] = useState<ReportPeriod>("month");
  const [reportViewMonth, setReportViewMonth] = useState<Date>(() => getDefaultMonth(2026));
  const [reportRows, setReportRows] = useState<ReportRow[]>([]);
  const [reportLoading, setReportLoading] = useState(false);

  // 그리드 데이터 로드
  useEffect(() => {
    if (viewMode !== "grid") return;
    setLoading(true);
    let newDates: Date[];
    if (rangeMode === "month") {
      newDates = getMonthDates(viewMonth.getFullYear(), viewMonth.getMonth());
    } else {
      newDates = getDateRange(rangeMode, year);
    }
    setDates(newDates);
    loadDateRange(newDates).then((data) => {
      setDayDataList(data);
      setLoading(false);
    });
  }, [viewMode, rangeMode, year, viewMonth]);

  useEffect(() => {
    if (dates.length === 0 || dayDataList.length === 0) return;
    setRows(buildPitcherGrid(dates, dayDataList, teamFilter, roleFilter));
  }, [dates, dayDataList, teamFilter, roleFilter]);

  // 리포트 데이터 로드
  useEffect(() => {
    if (viewMode !== "report") return;
    setReportLoading(true);
    const reportDates =
      reportPeriod === "season"
        ? getSeasonDates(year)
        : getMonthDates(reportViewMonth.getFullYear(), reportViewMonth.getMonth());

    loadDateRange(reportDates).then((data) => {
      setReportRows(buildReportRows(reportDates, data, teamFilter, roleFilter));
      setReportLoading(false);
    });
  }, [viewMode, reportPeriod, year, reportViewMonth, teamFilter, roleFilter]);

  function handleYearChange(y: 2025 | 2026) {
    setYear(y);
    const m = getDefaultMonth(y);
    setViewMonth(m);
    setReportViewMonth(m);
  }

  // 그리드 월 네비게이션
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

  // 리포트 월 네비게이션
  function prevReportMonth() {
    const seasonStart = getSeasonStart(reportViewMonth.getFullYear());
    const minMonth = new Date(seasonStart.getFullYear(), seasonStart.getMonth(), 1);
    const prev = new Date(reportViewMonth.getFullYear(), reportViewMonth.getMonth() - 1, 1);
    if (prev >= minMonth) setReportViewMonth(prev);
  }

  function nextReportMonth() {
    const seasonEnd = getSeasonEnd(reportViewMonth.getFullYear());
    const maxMonth = new Date(seasonEnd.getFullYear(), seasonEnd.getMonth(), 1);
    const next = new Date(reportViewMonth.getFullYear(), reportViewMonth.getMonth() + 1, 1);
    if (next <= maxMonth) setReportViewMonth(next);
  }

  const seasonStart = getSeasonStart(year);
  const seasonEnd = getSeasonEnd(year);
  const canPrevMonth = viewMonth > new Date(seasonStart.getFullYear(), seasonStart.getMonth(), 1);
  const canNextMonth = viewMonth < new Date(seasonEnd.getFullYear(), seasonEnd.getMonth(), 1);
  const canPrevReportMonth = reportViewMonth > new Date(seasonStart.getFullYear(), seasonStart.getMonth(), 1);
  const canNextReportMonth = reportViewMonth < new Date(seasonEnd.getFullYear(), seasonEnd.getMonth(), 1);

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
            <button
              className={viewMode === "grid" ? "active" : ""}
              onClick={() => setViewMode("grid")}
            >
              그리드
            </button>
            <button
              className={viewMode === "report" ? "active" : ""}
              onClick={() => setViewMode("report")}
            >
              리포트
            </button>
          </div>
          {viewMode === "grid" && (
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
          )}
        </div>
      </div>

      {/* 그리드 월 네비게이션 */}
      {viewMode === "grid" && rangeMode === "month" && (
        <div className="month-nav">
          <button className={`month-nav-btn${!canPrevMonth ? " disabled" : ""}`} onClick={prevMonth} disabled={!canPrevMonth}>‹</button>
          <span className="month-label">{viewMonth.getFullYear()}년 {viewMonth.getMonth() + 1}월</span>
          <button className={`month-nav-btn${!canNextMonth ? " disabled" : ""}`} onClick={nextMonth} disabled={!canNextMonth}>›</button>
        </div>
      )}

      {/* 리포트 기간 선택 + 월 네비게이션 */}
      {viewMode === "report" && (
        <div className="report-controls">
          <div className="role-filter">
            <button className={reportPeriod === "month" ? "active" : ""} onClick={() => setReportPeriod("month")}>월별</button>
            <button className={reportPeriod === "season" ? "active" : ""} onClick={() => setReportPeriod("season")}>시즌 전체</button>
          </div>
          {reportPeriod === "month" && (
            <div className="month-nav" style={{ marginBottom: 0 }}>
              <button className={`month-nav-btn${!canPrevReportMonth ? " disabled" : ""}`} onClick={prevReportMonth} disabled={!canPrevReportMonth}>‹</button>
              <span className="month-label">{reportViewMonth.getFullYear()}년 {reportViewMonth.getMonth() + 1}월</span>
              <button className={`month-nav-btn${!canNextReportMonth ? " disabled" : ""}`} onClick={nextReportMonth} disabled={!canNextReportMonth}>›</button>
            </div>
          )}
        </div>
      )}

      {viewMode === "grid" && (
        loading ? <div className="loading">로딩 중...</div> : <PitcherGrid dates={dates} rows={rows} />
      )}
      {viewMode === "report" && (
        reportLoading ? <div className="loading">로딩 중...</div> : <ReportTable rows={reportRows} />
      )}
    </div>
  );
}
