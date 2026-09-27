import { writeRecord } from "./store.js";
import { entries, stockAlerts, dayKey } from "./domain.js";
export function getAlerts(state) {
  const stored = entries(state.alerts);
  const storedEventIds = new Set(stored.map((alert) => alert.eventId).filter(Boolean));
  const eventAlerts = entries(state.events)
    .filter((event) =>
      ["MISSED", "WRONG_COMPARTMENT", "SENSOR_FAULT", "INPUT_FAULT"].includes(
        event.eventType,
      ),
    )
    .filter((event) => !storedEventIds.has(event.id))
    .map((event) => ({
      id: `event_${event.id}`,
      eventId: event.id,
      alertType: event.eventType,
      medicineId: event.medicineId,
      medicineName: event.medicineName,
      compartmentId: event.compartmentId,
      timestamp: event.timestamp,
      scheduledDate: event.scheduledDate || dayKey(event.timestamp),
      source: "event",
    }));
  return [
    ...stored,
    ...eventAlerts,
    ...stockAlerts(state.catalog?.medicines, state.catalog?.stockAlerts),
  ]
    .map((alert) => ({ ...alert, read: state.alertReads?.[alert.id] === true }))
    .sort((a, b) => b.timestamp - a.timestamp);
}
export const markAlertRead = (id) => writeRecord(`alertReads/${id}`, true);
