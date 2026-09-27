import { catalogTransaction } from "./store.js";
import { validateMedicine, entries, persistStockAlert } from "./domain.js";
import { UserFacingError } from "./errors.js";
export async function saveMedicine(input, id) {
  const values = validateMedicine(input);
  const key = id || crypto.randomUUID();
  await catalogTransaction((catalog) => {
    catalog.medicines ||= {};
    if (id && !catalog.medicines[id])
      throw new UserFacingError("This medicine was deleted in another session.");
    const existing = catalog.medicines[key];
    catalog.medicines[key] = {
      ...values,
      createdAt: existing?.createdAt || Date.now(),
      updatedAt: Date.now(),
    };
    persistStockAlert(catalog, key, { ...catalog.medicines[key], id: key });
    return catalog;
  });
}
export async function deleteMedicine(id) {
  await catalogTransaction((catalog) => {
    if (entries(catalog.schedules).some((s) => s.medicineId === id))
      throw new UserFacingError(
        "Remove this medicine’s schedules before deleting it. Event history will be retained.",
      );
    if (catalog.medicines) delete catalog.medicines[id];
    if (catalog.stockAlerts) delete catalog.stockAlerts[id];
    return catalog;
  });
}
