import { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Panel, Field, RecordNote } from "../components/ui.jsx";
import Stats from "../components/Stats.jsx";
import EventTable from "../components/EventTable.jsx";
import AlertsList from "../components/AlertsList.jsx";
import {
  entries,
  COMPARTMENTS,
  EVENT_TYPES,
  label,
  dayKey,
  summarize,
} from "../services/domain.js";
import { filterEvents } from "../services/event-service.js";
import { markAlertRead } from "../services/alert-service.js";
import { appConfig } from "../services/firebase-config.js";
import { userMessage } from "../services/errors.js";
export function Events({ state }) {
  const [filters, setFilters] = useState({
    date: "",
    medicine: "",
    compartment: "",
    type: "",
  });
  const options = new Map(
    entries(state.catalog?.medicines).map((m) => [m.id, m.name]),
  );
  entries(state.events).forEach((ev) => {
    if (ev.medicineId && !options.has(ev.medicineId))
      options.set(ev.medicineId, ev.medicineName || ev.medicineId);
  });
  const props = (key) => ({
    value: filters[key],
    onChange: (e) => setFilters({ ...filters, [key]: e.target.value }),
  });
  return (
    <>
      <Panel>
        <div className="filters">
          <Field label="Date">
            <input type="date" {...props("date")} />
          </Field>
          <Field label="Medicine">
            <select {...props("medicine")}>
              <option value="">All medicines</option>
              {[...options].map(([id, name]) => (
                <option key={id} value={id}>
                  {name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Compartment">
            <select {...props("compartment")}>
              <option value="">All compartments</option>
              {COMPARTMENTS.map((compartment) => (
                <option key={compartment} value={compartment}>
                  {compartment}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Event type">
            <select {...props("type")}>
              <option value="">All event types</option>
              {EVENT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {label(type)}
                </option>
              ))}
            </select>
          </Field>
          <button
            className="btn secondary"
            onClick={() =>
              setFilters({ date: "", medicine: "", compartment: "", type: "" })
            }
          >
            Reset
          </button>
        </div>
        <EventTable
          state={state}
          rows={filterEvents(state.events, filters)}
          full
        />
      </Panel>
      <RecordNote>
        Events are read-only. Post-missed access retains the original missed
        record. Date filters use the event timestamp in {appConfig.timeZone}.
      </RecordNote>
    </>
  );
}
export function Alerts({ state, notify }) {
  const [unread, setUnread] = useState(false);
  async function onRead(id) {
    try {
      await markAlertRead(id);
      notify("Alert marked as read.");
    } catch (err) {
      notify(userMessage(err), true);
    }
  }
  return (
    <>
      <Panel
        title="Your alerts"
        action={
          <div className="segmented">
            <button
              className={!unread ? "selected" : ""}
              onClick={() => setUnread(false)}
            >
              All alerts
            </button>
            <button
              className={unread ? "selected" : ""}
              onClick={() => setUnread(true)}
            >
              Unread
            </button>
          </div>
        }
      >
        <AlertsList state={state} unreadOnly={unread} onRead={onRead} />
      </Panel>
      <RecordNote>
        Reading an alert only updates its acknowledgement. Original events
        remain unchanged. Stock alerts reflect the latest stock entry.
      </RecordNote>
    </>
  );
}
export function Summary({ state }) {
  const [date, setDate] = useState(dayKey());
  const s = summarize(state.catalog || {}, entries(state.events), date);
  const data = [
    { name: "On-time", count: s.onTime, color: "#168876" },
    { name: "Late", count: s.late, color: "#da9a34" },
    { name: "Missed", count: s.missed, color: "#dc7270" },
    { name: "Post-missed", count: s.postMissed, color: "#6999d4" },
    { name: "Wrong compartment", count: s.wrong, color: "#a78ac7" },
  ];
  return (
    <>
      <div className="summary-date">
        <Field label="Summary date">
          <input
            type="date"
            value={date}
            max={dayKey()}
            onChange={(e) => {
              if (e.target.value) setDate(e.target.value);
            }}
          />
        </Field>
        <span className="muted">{appConfig.timeZone}</span>
      </div>
      <Stats state={state} date={date} />
      <Panel
        title="Compartment-access records"
        subtitle="Reported outcomes for the selected schedule date"
        className="summary-chart"
      >
        <div
          className="chart-container"
          role="img"
          aria-label={data.map((d) => `${d.name}: ${d.count}`).join(", ")}
        >
          <ResponsiveContainer width="100%" height={280}>
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 12, right: 30, bottom: 8, left: 15 }}
            >
              <XAxis type="number" allowDecimals={false} />
              <YAxis
                type="category"
                dataKey="name"
                width={145}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip cursor={{ fill: "#f4f7f8" }} />
              <Bar
                dataKey="count"
                name="Records"
                radius={[0, 5, 5, 0]}
                maxBarSize={22}
              >
                {data.map((d) => (
                  <Cell key={d.name} fill={d.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className="notice">
          Access does not confirm that medicine was swallowed. A dose can have
          both a missed and a post-missed record, so categories are not mutually
          exclusive. Wrong-compartment attempts are counted separately.
        </p>
        <p className="muted small">
          Scheduled totals use the schedule revision effective at each
          occurrence. No missed events are inferred by this dashboard. Low stock
          shows current inventory, not historical stock.
        </p>
      </Panel>
    </>
  );
}
