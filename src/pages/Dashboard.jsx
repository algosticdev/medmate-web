import { Cpu, ArrowRight } from "lucide-react";
import {
  Panel,
  Table,
  MedicineCell,
  Badge,
  LinkTo,
  Empty,
  RecordNote,
} from "../components/ui.jsx";
import Stats from "../components/Stats.jsx";
import AlertsList from "../components/AlertsList.jsx";
import EventTable from "../components/EventTable.jsx";
import {
  occurrences,
  dayKey,
  entries,
  clockTime,
  compartmentName,
  scheduleStatus,
  deviceStatus,
} from "../services/domain.js";
import { getAlerts } from "../services/alert-service.js";
import { filterEvents } from "../services/event-service.js";
import { appConfig } from "../services/firebase-config.js";
export default function Dashboard({ state }) {
  const rows = occurrences(state.catalog || {}, dayKey());
  const devices = entries(state.devices);
  return (
    <>
      <Stats state={state} />
      <div className="dashboard-grid">
        <Panel
          title="Today’s schedule"
          subtitle={`${rows.length} scheduled doses · ${appConfig.timeZone}`}
          action={<LinkTo route="schedules">Manage schedules</LinkTo>}
        >
          {rows.length ? (
            <Table
              headers={["Medicine", "Scheduled time", "Compartment", "Status"]}
            >
              {rows.map((s) => (
                <tr key={`${s.id}_${s.timestamp}`}>
                  <td>
                    <MedicineCell
                      name={
                        state.catalog?.medicines?.[s.medicineId]?.name ||
                        s.medicineName
                      }
                    />
                  </td>
                  <td className="time-cell">{clockTime(s.scheduledTime)}</td>
                  <td>
                    <span className="compartment-tag">
                      {compartmentName(s.compartmentId)}
                    </span>
                  </td>
                  <td>
                    <Badge status={scheduleStatus(s, entries(state.events))} />
                  </td>
                </tr>
              ))}
            </Table>
          ) : (
            <Empty
              title={
                Object.keys(state.catalog?.schedules || {}).length
                  ? "No doses scheduled today"
                  : "No schedules created yet."
              }
            >
              Add a medicine and create its first schedule.
            </Empty>
          )}
        </Panel>
        <Panel
          title="Recent alerts"
          action={
            <span className="count-pill">
              {getAlerts(state).filter((a) => !a.read).length} unread
            </span>
          }
        >
          <AlertsList state={state} limit={4} />
          <div className="panel-footer">
            <LinkTo route="alerts">View all alerts</LinkTo>
          </div>
        </Panel>
      </div>
      <div className="dashboard-bottom">
        <Panel
          title="Recent activity"
          action={<LinkTo route="events">Event history</LinkTo>}
        >
          <EventTable
            state={state}
            rows={filterEvents(state.events).slice(0, 4)}
          />
        </Panel>
        <section className="device-card">
          <span className="device-card-icon">
            <Cpu size={30} />
          </span>
          <span className="eyebrow">YOUR MEDMATE DEVICE</span>
          <h2>
            {devices.length
              ? "Your organizer, at a glance."
              : "No device data yet."}
          </h2>
          <p>
            {devices.length
              ? "View the latest device reports and synchronization details."
              : "Connection and synchronization status will appear here when reported."}
          </p>
          <Badge status={deviceStatus(devices[0])} />
          <a className="btn secondary" href="#device">
            Device details <ArrowRight size={16} />
          </a>
        </section>
      </div>
      <RecordNote />
    </>
  );
}
