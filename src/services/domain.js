import { appConfig } from "./firebase-config.js";
import { UserFacingError } from "./errors.js";
export const EVENT_TYPES = [
  "ON_TIME",
  "LATE",
  "MISSED",
  "POST_MISSED",
  "WRONG_COMPARTMENT",
  "SENSOR_FAULT",
  "INPUT_FAULT",
];
export const COMPARTMENTS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].flatMap(
  (day) => [`${day}-A`, `${day}-B`],
);
export const compartmentName = (value) => {
  const id = String(value ?? "");
  return COMPARTMENTS.includes(id) ? id : /^\d+$/.test(id) ? `Compartment ${id}` : "Unknown";
};
export const labels = {
  ON_TIME: "On-time",
  POST_MISSED: "Post-missed",
  WRONG_COMPARTMENT: "Wrong compartment",
  LOW_STOCK: "Low stock",
  REFILL_REQUIRED: "Refill required",
  ACTIVE_REMINDER: "Active medicine reminder",
  MISSED: "Missed",
  LATE: "Late",
  SENSOR_FAULT: "Sensor fault",
  INPUT_FAULT: "Input fault",
  DEVICE_FAULT: "Device fault",
  UPCOMING: "Upcoming",
  AWAITING_EVENT: "Awaiting event",
};
export const label = (value) =>
  labels[value] ||
  String(value || "Unknown")
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/^./, (c) => c.toUpperCase());
export const escapeHtml = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
export function dayKey(timestamp = Date.now()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: appConfig.timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(timestamp));
  return ["year", "month", "day"]
    .map((type) => parts.find((p) => p.type === type).value)
    .join("-");
}
export function scheduledEpoch(date, time) {
  const wall = Date.parse(`${date}T${time}:00Z`);
  let guess = wall;
  for (let i = 0; i < 3; i++) {
    const p = Object.fromEntries(
      new Intl.DateTimeFormat("en-GB", {
        timeZone: appConfig.timeZone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hourCycle: "h23",
      })
        .formatToParts(new Date(guess))
        .map((x) => [x.type, x.value]),
    );
    guess +=
      wall -
      Date.parse(
        `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}:${p.second}Z`,
      );
  }
  return guess;
}
export const dateTime = (timestamp) =>
  timestamp
    ? new Intl.DateTimeFormat("en-GB", {
        timeZone: appConfig.timeZone,
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(timestamp))
    : "Not reported";
export const clockTime = (time) =>
  time
    ? new Date(`2000-01-01T${time}:00`).toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      })
    : "—";
export const entries = (object) =>
  Object.entries(object || {}).map(([id, value]) => ({ ...value, id }));
export function numberValue(value, name, max = 1000000) {
  if (
    value === "" ||
    value == null ||
    !Number.isInteger(Number(value)) ||
    Number(value) < 0 ||
    Number(value) > max
  )
    throw new UserFacingError(`${name} must be a whole number between 0 and ${max}.`);
  return Number(value);
}
export function validateMedicine(input) {
  const name = String(input.name || "").trim();
  if (!name || name.length > 100)
    throw new UserFacingError("Medicine name is required (maximum 100 characters).");
  return {
    name,
    currentStock: numberValue(input.currentStock, "Current stock"),
    minimumStock: numberValue(input.minimumStock, "Minimum stock"),
  };
}
export function validateSchedule(input, catalog, ignoreId) {
  const medicineId = String(input.medicineId || "");
  if (!catalog.medicines?.[medicineId])
    throw new UserFacingError("Select an existing medicine.");
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(input.scheduledTime || ""))
    throw new UserFacingError("Enter a valid scheduled time.");
  const compartmentId = String(input.compartmentId || "");
  if (!COMPARTMENTS.includes(compartmentId))
    throw new UserFacingError("Select one of the 14 named compartments.");
  const active =
    input.active === true || input.active === "true" || input.active === "on";
  const conflict = entries(catalog.schedules).find(
    (s) =>
      s.id !== ignoreId &&
      s.compartmentId === compartmentId &&
      s.medicineId !== medicineId,
  );
  if (conflict)
    throw new UserFacingError(
      "This compartment is assigned to a different medicine. Reassign or remove its existing schedules first.",
    );
  if (
    active &&
    entries(catalog.schedules).some(
      (s) =>
        s.id !== ignoreId &&
        s.active &&
        s.compartmentId === compartmentId &&
        s.scheduledTime === input.scheduledTime,
    )
  )
    throw new UserFacingError(
      "An active schedule already uses this compartment at that time.",
    );
  return {
    medicineId,
    scheduledTime: input.scheduledTime,
    compartmentId,
    onTimeWindow: numberValue(input.onTimeWindow, "On-time window", 1440),
    gracePeriod: numberValue(input.gracePeriod, "Grace period", 1440),
    active,
  };
}
export function stockStatus(medicine) {
  return medicine.currentStock === 0
    ? "REFILL_REQUIRED"
    : medicine.currentStock <= medicine.minimumStock
      ? "LOW_STOCK"
      : "NORMAL";
}
export function stockAlerts(medicines, persisted = {}) {
  return entries(medicines)
    .filter((m) => stockStatus(m) !== "NORMAL")
    .map((m) => persisted[m.id] || ({
      id: `stock_${m.id}_${stockStatus(m)}`,
      alertType: stockStatus(m),
      medicineId: m.id,
      medicineName: m.name,
      currentStock: m.currentStock,
      minimumStock: m.minimumStock,
      timestamp: m.updatedAt,
      source: "stock",
    }));
}
export function persistStockAlert(catalog, medicineId, medicine) {
  catalog.stockAlerts ||= {};
  const status = stockStatus(medicine);
  if (status === "NORMAL") {
    delete catalog.stockAlerts[medicineId];
    return;
  }
  catalog.stockAlerts[medicineId] = {
    id: `stock_${medicineId}_${status}`,
    alertType: status,
    medicineId,
    medicineName: medicine.name,
    currentStock: medicine.currentStock,
    minimumStock: medicine.minimumStock,
    timestamp: medicine.updatedAt,
    source: "stock",
  };
}
// Revisions are effective at a scheduled occurrence. Deletion writes an inactive revision.
export function occurrences(catalog, date) {
  const result = [];
  for (const [id, history] of Object.entries(catalog.scheduleVersions || {})) {
    const versions = Object.values(history).sort(
      (a, b) => a.updatedAt - b.updatedAt,
    );
    versions.forEach((s, index) => {
      const timestamp = scheduledEpoch(date, s.scheduledTime);
      if (
        s.active &&
        s.updatedAt <= timestamp &&
        (!versions[index + 1] || versions[index + 1].updatedAt > timestamp)
      )
        result.push({ ...s, id, timestamp, date });
    });
  }
  return result.sort((a, b) => a.timestamp - b.timestamp);
}
export function scheduleStatus(occurrence, events, now = Date.now()) {
  const matching = events.filter(
    (e) =>
      e.scheduleId === occurrence.id &&
      e.scheduledDate === occurrence.date &&
      e.scheduledTime === occurrence.scheduledTime &&
      ["ON_TIME", "LATE", "MISSED", "POST_MISSED"].includes(e.eventType),
  );
  const latest = matching.sort((a, b) => b.timestamp - a.timestamp)[0];
  return (
    latest?.eventType ||
    (occurrence.timestamp >= now ? "UPCOMING" : "AWAITING_EVENT")
  );
}
export function summarize(catalog, events, date) {
  // Count unique dose occurrences, while preserving MISSED alongside POST_MISSED.
  const rows = events.filter((e) =>
    ["WRONG_COMPARTMENT", "SENSOR_FAULT", "INPUT_FAULT"].includes(e.eventType)
      ? dayKey(e.timestamp) === date
      : (e.scheduledDate || dayKey(e.timestamp)) === date,
  );
  const count = (type) =>
    new Set(
      rows
        .filter((e) => e.eventType === type)
        .map((e) =>
          type === "WRONG_COMPARTMENT"
            ? e.id
            : `${e.scheduleId || e.medicineId}_${e.scheduledDate || date}_${e.scheduledTime}`,
        ),
    ).size;
  return {
    total: occurrences(catalog, date).length,
    onTime: count("ON_TIME"),
    late: count("LATE"),
    missed: count("MISSED"),
    postMissed: count("POST_MISSED"),
    wrong: count("WRONG_COMPARTMENT"),
  };
}
export function deviceStatus(device, now = Date.now()) {
  if (!device?.lastSeen) return "UNKNOWN";
  if (
    now - device.lastSeen > appConfig.heartbeatTimeoutMs ||
    device.lastSeen > now + 60000
  )
    return "OFFLINE";
  return ["ONLINE", "OFFLINE", "SYNCING", "ERROR"].includes(
    device.connectionStatus,
  )
    ? device.connectionStatus
    : "UNKNOWN";
}
