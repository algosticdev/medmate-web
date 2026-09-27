# Verification

## Checks available in this workspace

Run `npm test` for domain validation and pure calculation checks. Run `npm run build` to compile the React application, styles, and production bundle.

The project contains the Firebase web configuration. Live caregiver sign-in, CRUD, deployed-rule behavior, realtime listeners, and the empty-account view still need verification against the configured project after rules deployment. Do not populate a production account for visual testing; use the owner’s isolated test account if one is provisioned.

## Firebase checks after configuration

1. An unauthenticated browser cannot read or write an account.
2. A signed-in account without an approved role cannot open its workspace.
3. An approved caregiver can manage only their own records.
4. A browser cannot write roles, events, device status, or compartment telemetry.
5. Invalid stock values, compartment assignments, and schedule times are rejected.
6. Concurrent catalog edits preserve schedule and compartment constraints.
7. Trusted event and alert reports appear in the event history, alert list, dashboard, and daily summary.
8. Alert acknowledgement changes its separate read marker without changing the original event.
9. Disconnecting and restoring the browser network updates connection state; saves remain disabled while disconnected.
10. Removing a user role ends access to the workspace; logout returns to sign-in.
11. A caregiver can submit feedback but cannot read the feedback collection or list users.
12. An administrator can review feedback and view registered users, but does not see caregiver settings or account-creation controls.
13. Public registration cannot create an administrator role.

The web build does not validate RTC accuracy, sensors, reminder hardware, local device buffering, firmware classification, or physical notification delivery. Remote caregiver notification delivery also requires an external provider and credentials.
