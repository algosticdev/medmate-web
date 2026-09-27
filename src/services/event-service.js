import { entries, dayKey } from "./domain.js";
// Hardware events are immutable from the caregiver application.
export function filterEvents(source, filters = {}) {
  return entries(source)
    .filter(
      (e) =>
        (!filters.date || dayKey(e.timestamp) === filters.date) &&
        (!filters.medicine || e.medicineId === filters.medicine) &&
        (!filters.compartment ||
          String(e.compartmentId) === String(filters.compartment)) &&
        (!filters.type || e.eventType === filters.type),
    )
    .sort((a, b) => b.timestamp - a.timestamp);
}
