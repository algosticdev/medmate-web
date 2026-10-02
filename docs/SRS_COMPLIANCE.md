# MedMate SRS compliance audit — FR-1 through FR-31

Audit date: 25 September 2026. A screen or schema alone is not counted as completed behavior. Firebase email authentication has been verified, but the current test account has no approved database role and the repository rules have not yet been confirmed as published. Live CRUD therefore remains unverified.

## FR-1 — Medicine Schedule Configuration
**Status: PARTIAL**  
**Files:** `src/components/Editor.jsx`, `src/pages/Catalog.jsx`, `src/services/domain.js`, `src/services/medicine-service.js`, `src/services/schedule-service.js`, `src/services/store.js`, `database.rules.json`.  
Medicine, time, compartment, on-time window, grace period, active state, revisions, validation, and Firebase transactions are implemented. Live CRUD awaits published rules and an approved user role.

## FR-2 — Time Monitoring
**Status: HARDWARE REQUIRED**  
**Files:** `src/pages/Settings.jsx`, `docs/DEVICE_INTEGRATION.md`.  
The web app displays real RTC reports. DS3231 timekeeping and offline clock continuity remain ESP32 work.

## FR-3 — Schedule Verification
**Status: HARDWARE REQUIRED**  
**Files:** `src/services/schedule-service.js`, `docs/DEVICE_INTEGRATION.md`.  
Schedules are stored for the device. Continuous clock comparison must run in device/core logic.

## FR-4 — Compartment Identification
**Status: HARDWARE REQUIRED**  
**Files:** `src/components/Editor.jsx`, `src/pages/Catalog.jsx`, `src/services/domain.js`.  
Web assignment is implemented; runtime identification of the active physical compartment remains device/core work.

## FR-5 — LED Reminder
**Status: HARDWARE REQUIRED**  
**Files:** `docs/DEVICE_INTEGRATION.md`.  
ESP32 GPIO control, wiring, and physical LED verification remain.

## FR-6 — Buzzer / Display Reminder
**Status: HARDWARE REQUIRED**  
**Files:** `docs/DEVICE_INTEGRATION.md`.  
Buzzer/LCD activation must be implemented and tested on the organizer.

## FR-7 — Compartment Opening Detection
**Status: HARDWARE REQUIRED**  
**Files:** `docs/DATA_MODEL.md`, `docs/DEVICE_INTEGRATION.md`.  
The web model accepts access reports. Reed-switch reading and debouncing remain firmware work.

## FR-8 — Correct Compartment Verification
**Status: HARDWARE REQUIRED**  
**Files:** `src/services/domain.js`, `docs/DEVICE_INTEGRATION.md`.  
Assignments are available; comparison with the physically opened compartment remains device/core work.

## FR-9 — Wrong-Compartment Warning
**Status: HARDWARE REQUIRED**  
**Files:** `src/services/domain.js`, `src/components/EventTable.jsx`, `src/services/alert-service.js`, `docs/DEVICE_INTEGRATION.md`.  
Real `WRONG_COMPARTMENT` records and alerts are supported. Physical warning, authoritative logging, and continued monitoring remain device/core work.

## FR-10 — On-Time Record
**Status: HARDWARE REQUIRED**  
**Files:** `src/services/domain.js`, `src/components/EventTable.jsx`, `src/pages/Records.jsx`.  
The web app reads and summarizes `ON_TIME`; the device/core must classify and create it.

## FR-11 — Late Record
**Status: HARDWARE REQUIRED**  
**Files:** `src/services/domain.js`, `src/components/EventTable.jsx`, `src/pages/Records.jsx`.  
The web app supports `LATE`; grace-window classification and creation remain device/core work.

## FR-12 — Grace-Period Monitoring
**Status: HARDWARE REQUIRED**  
**Files:** `src/components/Editor.jsx`, `src/services/domain.js`, `docs/DEVICE_INTEGRATION.md`.  
Grace is configurable and stored. Continuous physical monitoring remains firmware work.

## FR-13 — Missed Dose / Post-Missed Access
**Status: HARDWARE REQUIRED**  
**Files:** `src/services/domain.js`, `src/pages/Records.jsx`, `docs/DATA_MODEL.md`, `docs/DEVICE_INTEGRATION.md`.  
`MISSED` and later `POST_MISSED` remain separate in the model and summary. The device/core must create them.

## FR-14 — Missed-Dose Alert
**Status: PARTIAL**  
**Files:** `src/services/alert-service.js`, `src/components/AlertsList.jsx`, `src/App.jsx`.  
A real `MISSED` event becomes a visible alert and can raise an in-app/browser notice. Authoritative event creation and remote delivery remain missing.

## FR-15 — Manual Stock Entry
**Status: PARTIAL**  
**Files:** `src/components/Editor.jsx`, `src/pages/Catalog.jsx`, `src/services/stock-service.js`, `src/services/domain.js`, `database.rules.json`.  
Manual current/minimum stock entry is implemented. Live saving awaits role/rules verification.

## FR-16 — Stock Update
**Status: PARTIAL**  
**Files:** `src/services/stock-service.js`, `src/pages/Catalog.jsx`, `src/services/domain.js`.  
Manual tracking exists and access never decreases stock. Live saving is unverified; calibrated estimates require hardware.

## FR-17 — Refill Reminder
**Status: PARTIAL**  
**Files:** `src/services/domain.js`, `src/services/alert-service.js`, `src/components/AlertsList.jsx`, `src/components/Stats.jsx`.  
Real stock thresholds derive low/refill status, alerts, and counts. Live Firebase behavior remains untested.

## FR-18 — Reminder Acknowledgement / Silence
**Status: HARDWARE REQUIRED**  
**Files:** `docs/DEVICE_INTEGRATION.md`.  
Alert-read state is separate from events, but physical silence without ending grace monitoring requires the button and firmware.

## FR-19 — Cloud Communication
**Status: PARTIAL**  
**Files:** `src/services/store.js`, `src/services/firebase-client.js`, `docs/DATA_MODEL.md`, `docs/DEVICE_INTEGRATION.md`.  
Realtime paths/listeners exist and Firebase Auth is connected. Device schedule download and trusted telemetry/event upload are not connected.

## FR-20 — Offline Buffering and Synchronization
**Status: HARDWARE REQUIRED**  
**Files:** `src/pages/Settings.jsx`, `docs/DEVICE_INTEGRATION.md`.  
The UI supports sync/pending status and the contract specifies stable IDs. Controller buffering, retry, and duplicate-safe sync remain unimplemented.

## FR-21 — Data Storage
**Status: PARTIAL**  
**Files:** `src/services/store.js`, catalog/caregiver services, `database.rules.json`, `docs/DATA_MODEL.md`.  
Firebase services cover catalog, revisions, stock, caregiver profile, alert reads, and read-only device records. Rules/roles and trusted hardware writers remain incomplete.

## FR-22 — Dashboard
**Status: PARTIAL**  
**Files:** `src/pages/Dashboard.jsx`, `src/components/Stats.jsx`, `src/components/AlertsList.jsx`, `src/components/EventTable.jsx`.  
The responsive dashboard derives all content from its realtime snapshot and empty counters are tested. The live authenticated dashboard cannot yet open without a role.

## FR-23 — Daily Summary
**Status: PARTIAL**  
**Files:** `src/pages/Records.jsx`, `src/components/Stats.jsx`, `src/services/domain.js`, `tests/domain.test.js`.  
All five outcomes are summarized and access is not presented as consumption. Real Firebase event behavior remains untested.

## FR-24 — Continuous Monitoring
**Status: HARDWARE REQUIRED**  
**Files:** `docs/DEVICE_INTEGRATION.md`.  
The device/core must continue after wrong access or silence and process later schedules; the browser does not fabricate this.

## FR-25 — User Notifications
**Status: PARTIAL**  
**Files:** `src/services/alert-service.js`, `src/components/AlertsList.jsx`, `src/App.jsx`, `src/pages/Settings.jsx`.  
Real stock/event conditions create interface alerts and opt-in browser notices while open. Physical reminders, authoritative event alerts, and closed-app delivery remain.

## FR-26 — Caregiver Notification
**Status: PROTOTYPE IMPLEMENTED (frontend-only, not production-safe)**  
**Files:** `src/services/brevo-email-service.js`, `src/services/caregiver-notification-service.js`, `src/App.jsx`, `src/services/caregiver-service.js`, `src/pages/Settings.jsx`, `database.rules.json`, `.env.example`.  
While the MedMate web app is open and signed in, it watches its own live `accounts/{uid}/events` snapshot for new MISSED/WRONG_COMPARTMENT events and calls the Brevo transactional email API directly from the browser. A Firebase transaction claim on `notificationDelivery` prevents duplicate sends across re-renders, remounts, listener reconnects, and offline-synced events. **`VITE_BREVO_API_KEY` is bundled into the client JavaScript and is not a secret in this build** — acceptable for a demo, not for production. A real deployment needs a server (Cloud Function, Vercel/Netlify function, etc.) to keep the key off the client, and notification only fires while a caregiver's browser tab is open (no closed-app delivery).

## FR-27 — Event Logging
**Status: PARTIAL**  
**Files:** `src/services/domain.js`, `src/services/event-service.js`, `src/components/EventTable.jsx`, `src/pages/Records.jsx`, `docs/DATA_MODEL.md`, `database.rules.json`.  
All required fields, five dose/access types, and sensor/input faults are supported read-only. A trusted device/core logger is missing.

## FR-28 — IoT Test Matrix
**Status: PARTIAL**  
**Files:** `docs/IOT_TEST_MATRIX.md`, `docs/VERIFICATION.md`, `tests/domain.test.js`.  
Required scenarios and evidence columns are documented without invented results. Hardware, sync, fault, and remote-delivery tests remain unexecuted.

## FR-29 — Safety Restriction
**Status: COMPLETE**  
**Files:** `src/pages/Records.jsx`, `src/pages/Catalog.jsx`, `src/components/EventTable.jsx`, `src/components/Editor.jsx`, `README.md`.  
There is no recommendation, prescribing, or dosage-change function. Access does not reduce stock or claim consumption.

## FR-30 — Sensor/Input Fault Handling
**Status: HARDWARE REQUIRED**  
**Files:** `src/services/domain.js`, `src/services/alert-service.js`, `src/components/EventTable.jsx`, `src/pages/Settings.jsx`, `docs/DEVICE_INTEGRATION.md`.  
Real fault reports can be displayed and alerted without becoming access records. Detection, safe behavior, and authoritative logging require hardware/core logic.

## FR-31 — Test Mode
**Status: PARTIAL**  
**Files:** `src/components/Editor.jsx`, `src/services/domain.js`, `database.rules.json`.  
Minute-scale real schedules/windows are accepted and no records are generated automatically. Live saving and the physical dummy-pill/bead test remain unverified.

## Current blockers
1. Publish `database.rules.json`. It securely permits public creation of a `caregiver` profile but never an `admin` role.
2. Give the existing manually-created test user a role, or delete it and register again through Create Account after rules are published.
3. Run live authenticated CRUD, empty-state, phone-OTP, and rule-isolation tests.
4. Implement ESP32/core plus the trusted event/device bridge.
5. Configure at least one remote caregiver provider for FR-26 and execute the physical test matrix.
