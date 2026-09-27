import { getFirebase } from "./firebase-client.js";
import { UserFacingError } from "./errors.js";
let context;
export function setContext(value) {
  context = value;
}
export function currentContext() {
  if (!context) throw new UserFacingError("Please sign in again to continue.");
  return context;
}
export async function watchData(onData, onError, onConnection) {
  const ctx = currentContext();
  const { db, dbSDK: sdk } = await getFirebase();
  const state = {};
  const keys = [
    "catalog",
    "events",
    "alerts",
    "alertReads",
    "caregiver",
    "devices",
    "compartments",
  ];
  if (ctx.role === "admin") keys.push("adminUsers", "feedback");
  const loaded = new Set();
  const stops = keys.map((key) =>
    sdk.onValue(
      sdk.ref(
        db,
        key === "adminUsers"
          ? "users"
          : key === "feedback"
            ? "feedback"
            : `accounts/${ctx.uid}/${key}`,
      ),
      (snap) => {
        state[key] = snap.val() || {};
        loaded.add(key);
        if (loaded.size === keys.length) onData({ ...state });
      },
      onError,
    ),
  );
  stops.push(
    sdk.onValue(
      sdk.ref(db, ".info/connected"),
      (snap) => onConnection(snap.val() === true),
      onError,
    ),
  );
  return () => stops.forEach((stop) => stop());
}
export async function catalogTransaction(transform) {
  const ctx = currentContext();
  const { db, dbSDK: sdk } = await getFirebase();
  if (!ctx.connected())
    throw new UserFacingError("Unable to save while offline. Please reconnect and try again.");
  let validationError;
  // Populate the local cache before a transaction which validates existing records.
  await sdk.get(sdk.ref(db, `accounts/${ctx.uid}/catalog`));
  const result = await sdk.runTransaction(
    sdk.ref(db, `accounts/${ctx.uid}/catalog`),
    (current) => {
      try {
        validationError = undefined;
        return transform(current || {});
      } catch (error) {
        validationError = error;
        return undefined;
      }
    },
    { applyLocally: false },
  );
  if (!result.committed)
    throw (
      validationError ||
      new UserFacingError("The save was interrupted. Please try again.")
    );
}
export async function writeRecord(path, value) {
  const ctx = currentContext();
  if (!ctx.connected())
    throw new UserFacingError("Unable to save while offline. Please reconnect and try again.");
  const { db, dbSDK: sdk } = await getFirebase();
  await sdk.set(sdk.ref(db, `accounts/${ctx.uid}/${path}`), value);
}
