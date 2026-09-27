import { catalogTransaction } from "./store.js";
import { validateSchedule } from "./domain.js";
import { UserFacingError } from "./errors.js";
function revision(catalog, id, value) {
  catalog.scheduleVersions ||= {};
  catalog.scheduleVersions[id] ||= {};
  catalog.scheduleVersions[id][String(value.updatedAt)] = value;
}
export async function saveSchedule(input, id) {
  const key = id || crypto.randomUUID();
  await catalogTransaction((catalog) => {
    const values = validateSchedule(input, catalog, id);
    catalog.schedules ||= {};
    const previous = catalog.schedules[key];
    if (id && !previous)
      throw new UserFacingError("This schedule was deleted in another session.");
    const now = Math.max(Date.now(), (previous?.updatedAt || 0) + 1);
    const value = {
      ...values,
      medicineName: catalog.medicines[values.medicineId].name,
      createdAt: previous?.createdAt || now,
      updatedAt: now,
    };
    catalog.schedules[key] = value;
    revision(catalog, key, value);
    return catalog;
  });
}
export async function deleteSchedule(id) {
  await catalogTransaction((catalog) => {
    const schedule = catalog.schedules?.[id];
    if (!schedule) throw new UserFacingError("Schedule no longer exists.");
    revision(catalog, id, {
      ...schedule,
      active: false,
      updatedAt: Math.max(Date.now(), schedule.updatedAt + 1),
    });
    delete catalog.schedules[id];
    return catalog;
  });
}
