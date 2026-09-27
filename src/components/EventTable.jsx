import { Badge, Empty, Table, MedicineCell } from "./ui.jsx";
import { dateTime, clockTime, label, compartmentName } from "../services/domain.js";
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
      {rows.map((row) => (
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
              <td>
                <Badge status={row.eventType} />
              </td>
              <td>{label(row.accessStatus)}</td>
              <td>{label(row.alertStatus)}</td>
              <td>{label(row.caregiverNotificationStatus)}</td>
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
      ))}
    </Table>
  );
}
