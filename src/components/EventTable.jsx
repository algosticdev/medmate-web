import { Badge, Empty, Table, MedicineCell } from "./ui.jsx";
import {
  dateTime,
  clockTime,
  label,
  compartmentName,
  dayKey,
  scheduledEpoch,
} from "../services/domain.js";
const TIMING_TYPES = ["ON_TIME", "LATE", "MISSED", "POST_MISSED"];
const ALERT_TYPES = ["MISSED", "WRONG_COMPARTMENT", "SENSOR_FAULT", "INPUT_FAULT"];
function timingFor(row, state) {
  if (TIMING_TYPES.includes(row.eventType)) return row.eventType;
  const schedule = state.catalog?.schedules?.[row.scheduleId];
  if (!schedule || !row.scheduledTime) return null;
  const eventTime = new Date(row.timestamp).getTime();
  const due = scheduledEpoch(row.scheduledDate || dayKey(row.timestamp), row.scheduledTime);
  const onTimeEnd = due + (schedule.onTimeWindow || 0) * 60000;
  const graceEnd = onTimeEnd + (schedule.gracePeriod || 0) * 60000;
  if (eventTime <= onTimeEnd) return "ON_TIME";
  if (eventTime <= graceEnd) return "LATE";
  return "MISSED";
}
function alertStatus(row) {
  return row.alertStatus || (ALERT_TYPES.includes(row.eventType) ? "ALERT_CREATED" : "NONE");
}
function notificationStatus(row) {
  return (
    row.caregiverNotificationStatus ||
    (ALERT_TYPES.includes(row.eventType) ? "SENT" : "NOT_REQUIRED")
  );
}
export default function EventTable({ rows, state, full = false }) {
  if (!rows.length)
    return (
      <Empty title="No events recorded yet">
        Events will appear here when the organizer reports them.
      </Empty>
    );
  return (
    <Table
      headers={
        full
          ? [
              "Event / timestamp",
              "Medicine / schedule",
              "Compartment",
              "Event type",
              "Access",
              "Alert",
              "Notification",
              "Sync",
            ]
          : ["Medicine", "Event", "Time", "Compartment"]
      }
    >
      {rows.map((row) => {
        const timing = timingFor(row, state);
        return (
        <tr key={row.id}>
          {full ? (
            <>
              <td>
                <strong className="small break-all">{row.id}</strong>
                <small>{dateTime(row.timestamp)}</small>
              </td>
              <td>
                {row.medicineName ||
                  state.catalog?.medicines?.[row.medicineId]?.name ||
                  row.medicineId}
                <small>
                  {row.scheduledDate || "No linked date"} ·{" "}
                  {clockTime(row.scheduledTime)}
                </small>
              </td>
              <td>{row.compartmentId || "—"}</td>
              <td>{timing ? <Badge status={timing} /> : "—"}</td>
              <td>{label(row.accessStatus)}</td>
              <td>{label(alertStatus(row))}</td>
              <td>{label(notificationStatus(row))}</td>
              <td>{label(row.syncStatus)}</td>
            </>
          ) : (
            <>
              <td>
                <MedicineCell
                  name={
                    row.medicineName ||
                    state.catalog?.medicines?.[row.medicineId]?.name ||
                    row.medicineId
                  }
                />
              </td>
              <td>
                <Badge status={row.eventType} />
              </td>
              <td>{dateTime(row.timestamp)}</td>
              <td>{compartmentName(row.compartmentId)}</td>
            </>
          )}
        </tr>
        );
      })}
    </Table>
  );
}
