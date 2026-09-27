import { getFirebase } from "./firebase-client.js";
import { currentContext } from "./store.js";
import { UserFacingError } from "./errors.js";

export async function submitFeedback({ subject, message }, user) {
  const ctx = currentContext();
  const cleanSubject = String(subject || "").trim();
  const cleanMessage = String(message || "").trim();
  if (!cleanSubject || cleanSubject.length > 120)
    throw new UserFacingError("Enter a subject of up to 120 characters.");
  if (!cleanMessage || cleanMessage.length > 2000)
    throw new UserFacingError("Enter feedback of up to 2,000 characters.");
  if (!ctx.connected())
    throw new UserFacingError("Unable to save while offline. Please reconnect and try again.");
  const { db, dbSDK: sdk } = await getFirebase();
  const id = crypto.randomUUID();
  await sdk.set(sdk.ref(db, `feedback/${id}`), {
    userId: ctx.uid,
    name: String(user.name || "Caregiver").slice(0, 100),
    email: user.email,
    subject: cleanSubject,
    message: cleanMessage,
    status: "NEW",
    createdAt: Date.now(),
  });
}

export async function markFeedbackReviewed(id) {
  const ctx = currentContext();
  if (ctx.role !== "admin")
    throw new UserFacingError("Administrator access is required.");
  if (!ctx.connected())
    throw new UserFacingError("Unable to save while offline. Please reconnect and try again.");
  const { db, dbSDK: sdk } = await getFirebase();
  await sdk.update(sdk.ref(db, `feedback/${id}`), {
    status: "REVIEWED",
    reviewedAt: Date.now(),
    reviewedBy: ctx.uid,
  });
}
