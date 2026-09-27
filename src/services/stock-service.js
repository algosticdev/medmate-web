import { catalogTransaction } from "./store.js";
import { numberValue, persistStockAlert } from "./domain.js";
import { UserFacingError } from "./errors.js";
export async function updateStock(id, currentStock, minimumStock) {
  const values = {
    currentStock: numberValue(currentStock, "Current stock"),
    minimumStock: numberValue(minimumStock, "Minimum stock"),
  };
  await catalogTransaction((catalog) => {
    if (!catalog.medicines?.[id]) throw new UserFacingError("Medicine no longer exists.");
    catalog.medicines[id] = {
      ...catalog.medicines[id],
      ...values,
      updatedAt: Date.now(),
    };
    persistStockAlert(catalog, id, { ...catalog.medicines[id], id });
    return catalog;
  });
}
