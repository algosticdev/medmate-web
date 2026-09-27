# MedMate

MedMate is a caregiver/admin web application built with React, Vite, JavaScript/JSX, Tailwind CSS, Firebase Authentication, Firebase Realtime Database, and Recharts. The workspace reads and writes the signed-in account’s real Firebase records. New accounts begin with an empty workspace.

## Run locally

Use Node.js 22.12 or newer with npm.

```sh
npm install
npm run dev
npm test
npm run build
npm run preview
```

The app uses Firebase email/password authentication with verified-email customer registration. Verification is sent once during public registration and remains required for caregiver access. Trusted, manually provisioned administrator accounts do not use the public registration verification gate. New public accounts receive only the `caregiver` role; administrator roles remain trusted provisioning actions. Caregivers can submit feedback, while administrators can review feedback and view the registered-user list. Caregiver settings and account creation controls are excluded from the admin workspace. Firebase Phone Authentication links and verifies an optional caregiver contact number after sign-in. A Firebase web app, Realtime Database, both enabled authentication providers, and the rules in `database.rules.json` are required. Never place service-account keys or private server credentials in browser code. Select the organizer timezone in `appConfig.timeZone` before creating schedules.

Without Firebase configuration, sign-in is unavailable and the app does not switch to local records. Authentication, CRUD, live reads, and security-rule behavior require a configured project to verify.

## Application structure

- `src/App.jsx`: authentication gate, account-scoped realtime listeners, responsive navigation, live in-app alert notices.
- `src/pages/`: dashboard, medicines, schedules, stock, events, alerts, daily summary, caregiver settings, feedback, admin user management, and device status.
- `src/components/`: shared forms, tables, status cards, and event/alert views.
- `src/services/`: Firebase client, account store, validation, and CRUD/read services.
- `database.rules.json`: account isolation and server-side validation. Web clients cannot write device events, alerts, heartbeats, or compartment reports.
- `docs/DATA_MODEL.md`: Firebase paths and record semantics.
- `docs/DEVICE_INTEGRATION.md`: trusted device/bridge contract.
- `docs/SRS_COMPLIANCE.md`: full FR-1 through FR-31 audit and remaining dependencies.
- `docs/IOT_TEST_MATRIX.md`: required physical/integration scenarios and evidence record.

## Data and safety

Medicine, schedule, and stock records are managed in the signed-in account’s Firebase catalog. Stock changes only through manual entry. Alerts and statistics are derived from real catalog, alert, and event records. Event history is read-only in the caregiver app and supports the SRS event types and status fields. Empty Firebase nodes render as empty states; absent device reports render as unknown/offline. The web app does not infer missed doses, record compartment access, or decrement stock.

Compartment access records do not confirm medicine consumption. MedMate is for reminders and record keeping; it does not recommend medicines, prescribe, or change dosage.

## Verification

Run `npm test` for local domain checks and `npm run build` for production compilation. Authentication, account CRUD, Firebase rules, realtime operation, and remote caregiver delivery need a configured Firebase project and notification provider. Hardware behaviors require the physical organizer and trusted device integration. See [verification notes](docs/VERIFICATION.md) and the [SRS audit](docs/SRS_COMPLIANCE.md).

## Initial administrator setup

The first administrator must be bootstrapped through the Firebase Console or a trusted Admin SDK environment. Create the Authentication user, then create `users/{uid}` in Realtime Database with `role: "admin"`, the same email, a name, and a millisecond `createdAt` value. Do not register the administrator through the public Create Account tab because that path deliberately fixes the role to `caregiver`.

Deploy the database rules before using the application:

```sh
firebase deploy --only database
```
