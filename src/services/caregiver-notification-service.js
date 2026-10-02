import { getFirebase } from "./firebase-client.js";
import { sendCaregiverEmail } from "./brevo-email-service.js";

// FR-26: MedMate reports a compartment-access event; it never claims the
// medicine was or was not consumed.
const NOTIFY_EVENT_TYPES = new Set(["MISSED", "WRONG_COMPARTMENT"]);

function emailContent(event) {
  const lines = (fields) => fields.filter(Boolean).join("\n");
  if (event.eventType === "MISSED") {
    return {
      subject: "MedMate Alert - Missed Dose",
      text: lines([
        "MedMate recorded that a scheduled compartment access was missed.",
        "This reflects compartment activity only and is not proof of medicine consumption.",
        "",
        `Medicine: ${event.medicineName || "Unknown"}`,
        `Scheduled time: ${event.scheduledTime || "Unknown"}`,
        `Compartment: ${event.compartmentId || "Unknown"}`,
        `Event type: ${event.eventType}`,
        `Event timestamp: ${event.timestamp || "Unknown"}`,
        event.deviceId ? `Device: ${event.deviceId}` : null,
      ]),
    };
  }
  return {
    subject: "MedMate Alert - Wrong Compartment Opened",
    text: lines([
      "MedMate detected a wrong-compartment access attempt.",
      "This reflects sensor/event data only and does not claim anything beyond it.",
      "",
      `Medicine: ${event.medicineName || "Unknown"}`,
      `Scheduled time: ${event.scheduledTime || "Unknown"}`,
      `Expected compartment: ${event.compartmentId || "Unknown"}`,
      `Actual compartment opened: ${event.actualCompartment || "Unknown"}`,
      `Event timestamp: ${event.timestamp || "Unknown"}`,
      event.deviceId ? `Device: ${event.deviceId}` : null,
    ]),
  };
}

// Called once per (uid, eventId) for every MISSED/WRONG_COMPARTMENT event the
// live Firebase snapshot shows. Safe to call repeatedly (re-render, listener
// reconnect, remount, refresh, or an offline ESP32 event syncing later):
// the Firebase transaction below is the actual source of truth for
// "already notified", not any in-memory flag, so duplicates cannot occur.
export async function notifyCaregiverForEvent(uid, eventId, event, caregiver) {
  if (!NOTIFY_EVENT_TYPES.has(event.eventType)) return;
  const { db, dbSDK: sdk } = await getFirebase();
  const deliveryRef = sdk.ref(db, `accounts/${uid}/events/${eventId}/notificationDelivery`);

  const claim = await sdk.runTransaction(deliveryRef, (current) =>
    current === null ? { claimedAt: Date.now() } : undefined,
  );
  if (!claim.committed) return;

  const eligible =
    caregiver?.notificationsEnabled !== false &&
    caregiver?.eventCategories?.[event.eventType] === true &&
    caregiver?.emailNotificationsEnabled === true &&
    Boolean(caregiver?.email);

  const result = { email: { attempted: false, sent: false } };
  if (eligible) {
    result.email.attempted = true;
    try {
      await sendCaregiverEmail({ to: caregiver.email, ...emailContent(event) });
      result.email.sent = true;
    } catch (error) {
      result.email.error = String(error?.message || error).slice(0, 300);
    }
  }

  await sdk.update(sdk.ref(db, `accounts/${uid}/events/${eventId}`), {
    notificationDelivery: result,
    caregiverNotification: result.email.sent,
    caregiverNotificationStatus: result.email.sent
      ? "SENT"
      : result.email.attempted
        ? "FAILED"
        : "NOT_REQUIRED",
  });
}
