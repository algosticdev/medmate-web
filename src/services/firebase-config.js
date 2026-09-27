// Firebase web configuration is public identification, NOT a server secret.
// Copy your web app's configuration from Firebase Console → Project settings.
export const firebaseConfig = {
  apiKey: "AIzaSyBJynT5oaPF-VhUJ2PhccxJr40MeMwyoko",
  authDomain: "mademate-7269b.firebaseapp.com",
  databaseURL: "https://mademate-7269b-default-rtdb.firebaseio.com/",
  projectId: "mademate-7269b",
  storageBucket: "mademate-7269b.firebasestorage.app",
  messagingSenderId: "378374004505",
  appId: "1:378374004505:web:504e959da01cded54eef88",
};

// All schedule dates and daily reports use this timezone, including other browsers.
// Choose before entering schedules. Changing it later changes their interpretation.
export const appConfig = {
  timeZone: "Asia/Karachi",
  heartbeatTimeoutMs: 120000,
};
export const isConfigured = () => Object.values(firebaseConfig).every(Boolean);
