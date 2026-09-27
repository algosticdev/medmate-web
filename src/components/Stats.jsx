import {
  CalendarDays,
  Check,
  Clock3,
  X,
  Activity,
  TriangleAlert,
  Package,
} from "lucide-react";
import { entries, stockStatus, summarize, dayKey } from "../services/domain.js";
export default function Stats({ state, date = dayKey() }) {
  const s = summarize(state.catalog || {}, entries(state.events), date);
  const cards = [
    [
      date === dayKey() ? "Today’s doses" : "Scheduled doses",
      s.total,
      CalendarDays,
      "neutral",
    ],
    ["On-time", s.onTime, Check, "green"],
    ["Late", s.late, Clock3, "amber"],
    ["Missed", s.missed, X, "red"],
    ["Post-missed", s.postMissed, Activity, "blue"],
    ["Wrong compartment", s.wrong, TriangleAlert, "purple"],
    [
      "Low stock",
      entries(state.catalog?.medicines).filter(
        (m) => stockStatus(m) !== "NORMAL",
      ).length,
      Package,
      "amber",
    ],
  ];
  return (
    <div className="stats">
      {cards.map(([name, count, Icon, color], i) => (
        <article className="stat" key={name}>
          <span className={`stat-icon ${color}`}>
            <Icon size={18} />
          </span>
          <span className="stat-label">{name}</span>
          <strong>{count}</strong>
          <small>
            {i === 0
              ? "Scheduled occurrences"
              : i === 6
                ? "Including empty stock"
                : "Reported records"}
          </small>
        </article>
      ))}
    </div>
  );
}
