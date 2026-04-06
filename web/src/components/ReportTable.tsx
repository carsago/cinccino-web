import type { ReportRow } from "../types";
import { TEAMS } from "../types";
import { outsToIp } from "../lib/dataLoader";

type SortKey = "appearances" | "total_outs" | "total_pitches" | "streak2" | "streak3plus";
type SortDir = "desc" | "asc";

type Props = {
  rows: ReportRow[];
  sortKey: SortKey | null;
  sortDir: SortDir;
  onSort: (key: SortKey) => void;
};

export default function ReportTable({ rows, sortKey, sortDir, onSort }: Props) {
  if (rows.length === 0) {
    return <div className="empty">이 기간에 해당 데이터가 없습니다.</div>;
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
            <th className="col-stat sortable" onClick={() => onSort("appearances")}>
              등판{sortIcon("appearances")}
            </th>
            <th className="col-stat col-innings sortable" onClick={() => onSort("total_outs")}>
              누적 이닝{sortIcon("total_outs")}
            </th>
            <th className="col-stat col-pitches sortable" onClick={() => onSort("total_pitches")}>
              누적 투구수{sortIcon("total_pitches")}
            </th>
            <th className="col-stat col-streak2 sortable" onClick={() => onSort("streak2")}>
              2연투{sortIcon("streak2")}
            </th>
            <th className="col-stat col-streak3 sortable" onClick={() => onSort("streak3plus")}>
              3연투+{sortIcon("streak3plus")}
            </th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((row) => {
            const teamInfo = TEAMS.find((t) => t.code === row.team_code);
            return (
              <tr key={row.player_id || row.name}>
                <td className="col-team">
                  {teamInfo ? <img src={teamInfo.logo} alt={teamInfo.name} className="team-logo-cell" /> : row.team_code}
                </td>
                <td className="col-name">{row.name}</td>
                {renderCells(row)}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
