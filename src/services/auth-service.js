import { getFirebase } from "./firebase-client.js";
import { UserFacingError } from "./errors.js";
let phoneVerifier;
let registrationInProgress = false;
export async function register(name, email, password) {
  const displayName = String(name || "").trim();
  const address = String(email || "").trim();
  if (!displayName || displayName.length > 100)
    throw new UserFacingError("Enter your name (maximum 100 characters).");
  if (String(password || "").length < 8)
    throw new UserFacingError("Use a password with at least 8 characters.");
  const { auth, authSDK, db, dbSDK } = await getFirebase();
  let credential;
  registrationInProgress = true;
  try {
    credential = await authSDK.createUserWithEmailAndPassword(
      auth,
      address,
      password,
    );
    await authSDK.updateProfile(credential.user, { displayName });
    await authSDK.sendEmailVerification(credential.user);
    await dbSDK.set(dbSDK.ref(db, `users/${credential.user.uid}`), {
      role: "caregiver",
      name: displayName,
      email: credential.user.email,
      createdAt: Date.now(),
    });
    await authSDK.signOut(auth);
  } catch (error) {
    if (credential?.user) {
      try {
        await authSDK.deleteUser(credential.user);
      } catch {
        // The original registration error is the useful result for the user.
      }
    }
    throw error;
  } finally {
    registrationInProgress = false;
  }
}
export async function login(email, password) {
  const { auth, authSDK } = await getFirebase();
  await authSDK.setPersistence(auth, authSDK.browserSessionPersistence);
  await authSDK.signInWithEmailAndPassword(
    auth,
    email.trim(),
    password,
  );
}
export async function resetPassword(email) {
  const address = String(email || "").trim();
  if (!address)
    throw new UserFacingError("Enter your email address first.");
  const { auth, authSDK } = await getFirebase();
  await authSDK.sendPasswordResetEmail(auth, address);
}
export async function sendPhoneVerification(phoneNumber, containerId) {
  const number = String(phoneNumber || "").replaceAll(" ", "").trim();
  if (!/^\+[1-9]\d{7,14}$/.test(number))
    throw new UserFacingError(
      "Enter a valid phone number with country code, for example +923001234567.",
    );
  const { auth, authSDK } = await getFirebase();
  if (!auth.currentUser)
    throw new UserFacingError("Please sign in again to verify your phone number.");
  phoneVerifier?.clear();
  phoneVerifier = new authSDK.RecaptchaVerifier(auth, containerId, {
    size: "invisible",
  });
  try {
    const provider = new authSDK.PhoneAuthProvider(auth);
    return await provider.verifyPhoneNumber(number, phoneVerifier);
  } catch (error) {
    phoneVerifier.clear();
    phoneVerifier = undefined;
    throw error;
  }
}
export async function confirmPhoneVerification(verificationId, code) {
  const value = String(code || "").trim();
  if (!/^\d{6}$/.test(value))
    throw new UserFacingError("Enter the 6-digit verification code.");
  const { auth, authSDK } = await getFirebase();
  if (!auth.currentUser)
    throw new UserFacingError("Please sign in again to verify your phone number.");
  const credential = authSDK.PhoneAuthProvider.credential(
    verificationId,
    value,
  );
  const user = auth.currentUser;
  if (user.phoneNumber) {
    await authSDK.updatePhoneNumber(user, credential);
  } else {
    await authSDK.linkWithCredential(user, credential);
  }
  await user.getIdToken(true);
  phoneVerifier?.clear();
  phoneVerifier = undefined;
  return user.phoneNumber;
}
export async function watchAuth(callback) {
  const { auth, authSDK, db, dbSDK } = await getFirebase();
  let stopRole = () => {};
  const stopAuth = authSDK.onAuthStateChanged(auth, (user) => {
    stopRole();
    if (!user) return callback(null);
    if (registrationInProgress) return callback(null);
    stopRole = dbSDK.onValue(
      dbSDK.ref(db, `users/${user.uid}`),
      (snapshot) => {
        const profile = snapshot.val();
        if (!profile || !["caregiver", "admin"].includes(profile.role)) {
          authSDK.signOut(auth);
          return callback(
            null,
            new UserFacingError(
              "This account does not have access. Please contact your administrator.",
            ),
          );
        }
        if (profile.role === "caregiver" && !user.emailVerified) {
          authSDK.signOut(auth);
          return callback(
            null,
            new UserFacingError(
              "Verify your email address using the link sent during registration, then sign in again.",
            ),
          );
        }
        callback({
          ...profile,
          uid: user.uid,
          email: user.email,
          phoneNumber: user.phoneNumber || "",
        });
      },
      (error) => callback(null, error),
    );
  });
  return () => {
    stopRole();
    stopAuth();
  };
}
export async function logout() {
  const { auth, authSDK } = await getFirebase();
  await authSDK.signOut(auth);
  location.href = "/";
}
