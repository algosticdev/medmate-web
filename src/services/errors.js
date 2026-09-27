// Only intentionally user-facing validation messages may reach the interface.
export class UserFacingError extends Error {}

export function userMessage(error) {
  if (error instanceof UserFacingError) return error.message;
  if (["auth/invalid-credential", "auth/wrong-password", "auth/user-not-found", "auth/invalid-email"].includes(error?.code))
    return "Unable to sign in. Check your email and password.";
  if (error?.code === "auth/too-many-requests")
    return "Too many attempts. Please try again later.";
  if (error?.code === "auth/user-disabled")
    return "This account is unavailable. Please contact your administrator.";
  if (error?.code === "auth/email-already-in-use")
    return "An account already exists for this email. Sign in or reset your password.";
  if (error?.code === "auth/weak-password")
    return "Use a stronger password with at least 8 characters.";
  if (error?.code === "auth/invalid-phone-number")
    return "Enter a valid phone number with its country code.";
  if (error?.code === "auth/invalid-verification-code")
    return "The verification code is incorrect or expired.";
  if (error?.code === "auth/credential-already-in-use")
    return "This phone number is already connected to another account.";
  if (["PERMISSION_DENIED", "permission-denied"].includes(error?.code))
    return "You don’t have access to these records. Please contact your administrator.";
  return "Unable to connect. Please try again later.";
}
