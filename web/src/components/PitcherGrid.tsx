import type { PitcherRow } from "../types";
import { TEAMS } from "../types";

type Props = {
  dates: Date[];
  rows: PitcherRow[];
};

function formatInnings(ip: string): string {
  return ip.includes(".") ? `${ip} 이닝` : `${ip}.0 이닝`;
}

function formatDateHeader(d: Date): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const mm = d.getMonth() + 1;
  const dd = d.getDate();
  const isToday = d.getTime() === today.getTime();
  return isToday ? `${mm}/${dd}★` : `${mm}/${dd}`;
}

function pitchIntensity(pitchCount: number): string {
  if (pitchCount === 0) return "";
  if (pitchCount >= 100) return "high";
  if (pitchCount >= 60) return "mid";
  return "low";
}

export default function PitcherGrid({ dates, rows }: Props) {
  if (rows.length === 0) {
    return <div className="empty">데이터 없음</div>;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 팀별로 묶기
  const teamOrder = TEAMS.map((t) => t.code);
  const rowsByTeam = new Map<string, PitcherRow[]>();
  for (const row of rows) {
    const list = rowsByTeam.get(row.team_code) ?? [];
    list.push(row);
    rowsByTeam.set(row.team_code, list);
  }

  return (
    <div className="grid-wrap">
      <table className="pitcher-grid">
        <thead>
          <tr>
            <th className="col-team">팀</th>
            <th className="col-name">투수</th>
            {dates.map((d, i) => (
              <th key={i} className={d.getTime() === today.getTime() ? "col-date today" : "col-date"}>
                {formatDateHeader(d)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {teamOrder
            .filter((code) => rowsByTeam.has(code))
            .flatMap((code) => {
              const teamRows = rowsByTeam.get(code)!;
              const teamInfo = TEAMS.find((t) => t.code === code);
              return teamRows.map((row, rowIdx) => (
                <tr key={row.player_id || row.name} className={rowIdx === 0 ? "first-of-team" : ""}>
                  {rowIdx === 0 && (
                    <td className="col-team" rowSpan={teamRows.length}>
                      {teamInfo?.name ?? code}
                    </td>
                  )}
                  <td className="col-name">
                    {row.name}
                    {row.days.some((d) => d?.is_starter) && <span className="tag-starter">선</span>}
                  </td>
                  {row.days.map((app, i) => {
                    const isToday = dates[i].getTime() === today.getTime();
                    if (!app) {
                      return <td key={i} className={isToday ? "cell-empty today" : "cell-empty"}>—</td>;
                    }
                    return (
                      <td
                        key={i}
                        className={[
                          "cell-pitched",
                          pitchIntensity(app.pitch_count),
                          isToday ? "today" : "",
                          app.is_starter ? "starter" : "",
                        ]
                          .filter(Boolean)
                          .join(" ")}
                        title={`${app.name} ${formatInnings(app.innings_pitched)} ${app.pitch_count}구`}
                      >
                        <span className="innings">{formatInnings(app.innings_pitched)}</span>
                        <span className="pitches">{app.pitch_count}구</span>
                      </td>
                    );
                  })}
                </tr>
              ));
            })}
        </tbody>
      </table>
    </div>
  );
}
