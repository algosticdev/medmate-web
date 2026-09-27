import { firebaseConfig, isConfigured } from "./firebase-config.js";
let promise;
export function getFirebase() {
  if (!isConfigured())
    throw new Error(
      "Unable to connect. Please try again later.",
    );
  promise ||= Promise.all([
    import("firebase/app"),
    import("firebase/auth"),
    import("firebase/database"),
  ])
    .then(([app, authSDK, dbSDK]) => {
      const firebaseApp = app.initializeApp(firebaseConfig);
      return {
        firebaseApp,
        auth: authSDK.getAuth(firebaseApp),
        db: dbSDK.getDatabase(firebaseApp),
        authSDK,
        dbSDK,
      };
    })
    .catch((error) => {
      promise = undefined;
      throw error;
    });
  return promise;
}
