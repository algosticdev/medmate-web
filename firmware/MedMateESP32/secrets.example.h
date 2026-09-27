#pragma once

// Copy this file to secrets.h and put local test values there.
// Keep secrets.h private; it is ignored by the repository's .gitignore.
#define WIFI_SSID "YOUR_WIFI_NAME"
#define WIFI_PASSWORD "YOUR_WIFI_PASSWORD"

// Firebase Console -> Project settings -> Your apps -> Web app config.
#define FIREBASE_API_KEY "YOUR_FIREBASE_WEB_API_KEY"
#define FIREBASE_DATABASE_URL "https://YOUR_PROJECT-default-rtdb.firebaseio.com"

// Must be the same caregiver account that owns the schedules in the web app.
// Do not use an admin account for the device.
#define DEVICE_EMAIL "CAREGIVER_EMAIL"
#define DEVICE_PASSWORD "CAREGIVER_PASSWORD"
