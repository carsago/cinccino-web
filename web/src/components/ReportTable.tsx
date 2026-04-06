import { useState } from "react";
import type { ReportRow } from "../types";
import { TEAMS } from "../types";
import { outsToIp } from "../lib/dataLoader";

type SortKey = "appearances" | "total_outs" | "total_pitches" | "streak2" | "streak3plus";
type SortDir = "desc" | "asc";

type Props = {
  rows: ReportRow[];
};

export default function ReportTable({ rows }: Props) {
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  if (rows.length === 0) {
    return <div className="empty">이 기간에 해당 데이터가 없습니다.</div>;
  }

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      if (sortDir === "desc") setSortDir("asc");
      else { setSortKey(null); setSortDir("desc"); }
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  function sortIcon(key: SortKey) {
    if (sortKey !== key) return <span className="sort-icon">↕</span>;
    return <span className="sort-icon active">{sortDir === "desc" ? "↓" : "↑"}</span>;
  }

  const sorted = sortKey
    ? [...rows].sort((a, b) => {
        const diff = a[sortKey] - b[sortKey];
        return sortDir === "desc" ? -diff : diff;
      })
    : rows;

  const teamOrder = TEAMS.map((t) => t.code);

  // 정렬 없을 때: 팀 그룹핑 (rowSpan)
  // 정렬 있을 때: flat 리스트
  const renderGrouped = () => {
    const rowsByTeam = new Map<string, ReportRow[]>();
    for (const row of sorted) {
      const list = rowsByTeam.get(row.team_code) ?? [];
      list.push(row);
      rowsByTeam.set(row.team_code, list);
    }
    return teamOrder
      .filter((code) => rowsByTeam.has(code))
      .flatMap((code) => {
        const teamRows = rowsByTeam.get(code)!;
        const teamInfo = TEAMS.find((t) => t.code === code);
        return teamRows.map((row, idx) => (
          <tr key={row.player_id || row.name} className={idx === 0 ? "first-of-team" : ""}>
            {idx === 0 && (
              <td className="col-team" rowSpan={teamRows.length}>{teamInfo?.name ?? code}</td>
            )}
            <td className="col-name">{row.name}</td>
            {renderCells(row)}
          </tr>
        ));
      });
  };

  const renderFlat = () =>
    sorted.map((row, idx) => {
      const teamInfo = TEAMS.find((t) => t.code === row.team_code);
      const prev = sorted[idx - 1];
      const isNewTeam = !prev || prev.team_code !== row.team_code;
      return (
        <tr key={row.player_id || row.name} className={isNewTeam ? "first-of-team" : ""}>
          <td className="col-team">{teamInfo?.name ?? row.team_code}</td>
          <td className="col-name">{row.name}</td>
          {renderCells(row)}
        </tr>
      );
    });

  const renderCells = (row: ReportRow) => (
    <>
      <td className="col-stat">{row.appearances}</td>
      <td className="col-stat col-innings">{outsToIp(row.total_outs)}</td>
      <td className="col-stat col-pitches">{row.total_pitches}</td>
      <td className="col-stat col-streak2">
        {row.streak2 > 0 ? `${row.streak2}회` : <span className="stat-zero">0</span>}
      </td>
      <td className="col-stat col-streak3">
        {row.streak3plus > 0 ? `${row.streak3plus}회` : <span className="stat-zero">0</span>}
      </td>
    </>
  );

  return (
    <div className="grid-wrap">
      <table className="pitcher-grid">
        <thead>
          <tr>
            <th className="col-team">팀</th>
            <th className="col-name">투수</th>
            <th className="col-stat sortable" onClick={() => handleSort("appearances")}>
              등판{sortIcon("appearances")}
            </th>
            <th className="col-stat col-innings sortable" onClick={() => handleSort("total_outs")}>
              누적 이닝{sortIcon("total_outs")}
            </th>
            <th className="col-stat col-pitches sortable" onClick={() => handleSort("total_pitches")}>
              누적 투구수{sortIcon("total_pitches")}
            </th>
            <th className="col-stat col-streak2 sortable" onClick={() => handleSort("streak2")}>
              2연투{sortIcon("streak2")}
            </th>
            <th className="col-stat col-streak3 sortable" onClick={() => handleSort("streak3plus")}>
              3연투+{sortIcon("streak3plus")}
            </th>
          </tr>
        </thead>
        <tbody>
          {sortKey ? renderFlat() : renderGrouped()}
        </tbody>
      </table>
    </div>
  );
}
