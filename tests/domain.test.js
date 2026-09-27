import test from "node:test";
import assert from "node:assert/strict";
import { EVENT_TYPES, persistStockAlert, stockAlerts, summarize, validateMedicine, validateSchedule } from "../src/services/domain.js";
import { getAlerts } from "../src/services/alert-service.js";

test("an empty Firebase snapshot has no records or alerts", () => {
  assert.deepEqual(getAlerts({}), []);
  assert.deepEqual(stockAlerts(undefined), []);
  assert.deepEqual(summarize({}, [], "2026-01-01"), {
    total: 0,
    onTime: 0,
    late: 0,
    missed: 0,
    postMissed: 0,
    wrong: 0,
  });
});

test("the event reader supports each SRS event type and input faults", () => {
  assert.deepEqual(EVENT_TYPES, [
    "ON_TIME",
    "LATE",
    "MISSED",
    "POST_MISSED",
    "WRONG_COMPARTMENT",
    "SENSOR_FAULT",
    "INPUT_FAULT",
  ]);
});

test("medicine and schedule forms reject invalid empty input", () => {
  assert.throws(() => validateMedicine({ name: "", currentStock: 0, minimumStock: 0 }));
  assert.throws(() => validateSchedule({}, { medicines: {}, schedules: {} }));
});

test("stock refill alerts persist with the catalog and clear when stock recovers", () => {
  const catalog = { medicines: {} };
  const medicine = {
    id: "med-1",
    name: "Actual medicine",
    currentStock: 0,
    minimumStock: 5,
    updatedAt: 123,
  };
  catalog.medicines[medicine.id] = medicine;
  persistStockAlert(catalog, medicine.id, medicine);

  assert.equal(catalog.stockAlerts[medicine.id].alertType, "REFILL_REQUIRED");
  assert.equal(stockAlerts(catalog.medicines, catalog.stockAlerts)[0].timestamp, 123);

  const recovered = { ...medicine, currentStock: 6, updatedAt: 456 };
  catalog.medicines[medicine.id] = recovered;
  persistStockAlert(catalog, medicine.id, recovered);
  assert.deepEqual(catalog.stockAlerts, {});
  assert.deepEqual(stockAlerts(catalog.medicines, catalog.stockAlerts), []);
});
