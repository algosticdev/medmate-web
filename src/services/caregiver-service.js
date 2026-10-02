import { writeRecord } from "./store.js";
import { UserFacingError } from "./errors.js";
export async function saveCaregiver(input, verifiedEmail, verifiedPhoneNumber) {
  const name = String(input.name || "").trim();
  const email = String(verifiedEmail || "").trim();
  if (!name || name.length > 100)
    throw new UserFacingError("Enter a caregiver name (maximum 100 characters).");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254)
    throw new UserFacingError("Enter a valid contact email.");
  const record = {
    name,
    email,
    notificationPreference: "in_app",
    notificationsEnabled: input.notificationsEnabled === "on",
    emailNotificationsEnabled: input.emailNotificationsEnabled === "on",
    eventCategories: { MISSED: true, WRONG_COMPARTMENT: true },
    updatedAt: Date.now(),
  };
  if (verifiedPhoneNumber) record.phoneNumber = verifiedPhoneNumber;
  return writeRecord("caregiver", record);
}
