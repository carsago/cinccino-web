import { useEffect, useState } from "react";
import { TEAMS } from "./types";
import { getDateRange, loadDateRange, buildPitcherGrid } from "./lib/dataLoader";
import type { DayData, PitcherRow } from "./types";
import PitcherGrid from "./components/PitcherGrid";
import "./index.css";

const RANGE_OPTIONS = [7, 21] as const;
type RoleFilter = "all" | "starter" | "bullpen";

export default function App() {
  const [rangeDays, setRangeDays] = useState<7 | 21>(7);
  const [teamFilter, setTeamFilter] = useState<string | null>(null);
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [rows, setRows] = useState<PitcherRow[]>([]);
  const [dates, setDates] = useState<Date[]>([]);
  const [loading, setLoading] = useState(true);
  const [dayDataList, setDayDataList] = useState<(DayData | null)[]>([]);

  useEffect(() => {
    setLoading(true);
    const newDates = getDateRange(rangeDays);
    setDates(newDates);
    loadDateRange(newDates).then((data) => {
      setDayDataList(data);
      setLoading(false);
    });
  }, [rangeDays]);

  useEffect(() => {
    if (dates.length === 0 || dayDataList.length === 0) return;
    setRows(buildPitcherGrid(dates, dayDataList, teamFilter, roleFilter));
  }, [dates, dayDataList, teamFilter, roleFilter]);

  return (
    <div className="app">
      <header className="header">
        <h1>KBO 투수 트래커</h1>
        <span className="season">2026 시즌</span>
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
          {RANGE_OPTIONS.map((n) => (
            <button
              key={n}
              className={rangeDays === n ? "active" : ""}
              onClick={() => setRangeDays(n)}
            >
              {n}일
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="loading">로딩 중...</div>
      ) : (
        <PitcherGrid dates={dates} rows={rows} />
      )}
    </div>
  );
}
