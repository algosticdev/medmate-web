# Realtime Database data model

```text
users/{uid}/
  role: "admin" | "caregiver"     # trusted Console/admin provisioning only
  name, email, createdAt
feedback/{feedbackId}/
  userId, name, email, subject, message, status, createdAt
  reviewedAt, reviewedBy            # added when an admin reviews it
accounts/{uid}/
  catalog/
    medicines/{medicineId}/
      name, currentStock, minimumStock, createdAt, updatedAt
    schedules/{scheduleId}/
      medicineId, medicineName, scheduledTime, compartmentId
      onTimeWindow, gracePeriod, active, createdAt, updatedAt
    scheduleVersions/{scheduleId}/{revisionTimestamp}/
      ...complete schedule snapshot at that revision
  events/{eventId}/
    timestamp, scheduledDate, scheduledTime, scheduleId
    medicineId, medicineName, compartmentId, eventType
    accessStatus, alertStatus, caregiverNotificationStatus, syncStatus, deviceId
  alerts/{alertId}/
    alertType, medicineId, medicineName, compartmentId, timestamp, eventId
  alertReads/{alertId}: true
  caregiver/
    name, verified email, optional verified phoneNumber
    notificationPreference, notificationsEnabled
    eventCategories/{MISSED,WRONG_COMPARTMENT}: true
    updatedAt
  devices/{deviceId}/
    name, connectionStatus, lastSeen, lastSync, cloudStatus
    pendingOfflineEvents, rtcStatus, faultStatus
  compartments/{Mon-A|Mon-B|Tue-A|Tue-B|Wed-A|Wed-B|Thu-A|Thu-B|Fri-A|Fri-B|Sat-A|Sat-B|Sun-A|Sun-B}/
    deviceId, status, reportedAt
```

All timestamps are Unix epoch **milliseconds**. IDs are Firebase-safe keys (no `.`, `#`, `$`, `[`, `]`, or `/`). Schedule/medicine IDs are generated UUIDs. `scheduledTime` is a zero-padded 24-hour `HH:mm` string; `scheduledDate` is `YYYY-MM-DD` in the configured organizer timezone. Compartment IDs are the 14 strings `Mon-A`, `Mon-B`, `Tue-A`, `Tue-B`, `Wed-A`, `Wed-B`, `Thu-A`, `Thu-B`, `Fri-A`, `Fri-B`, `Sat-A`, `Sat-B`, `Sun-A`, and `Sun-B`. Stock and windows are nonnegative integers; stock maximum is 1,000,000 and each timing window maximum is 1,440 minutes.

## Why this shape

- **Account isolation:** no unauthenticated reads, and no access to another UID. Role provisioning is a separate protected path.
- **Admin boundary:** public registration can create only the caller's caregiver profile. Administrators can list users and feedback, but the web application cannot create or modify another user's Authentication account.
- **Feedback integrity:** caregivers can create feedback under their own authenticated identity. Only administrators can read all feedback or mark a record reviewed; review cannot rewrite its original author or message.
- **Catalog transaction boundary:** medicines, schedules and schedule revisions share one small subtree. Transactions retry against concurrent changes so deletion and assignment checks can examine the latest catalog atomically. Device event traffic does not conflict with catalog edits.
- **Single stock source:** stock lives inside the medicine record. No duplicated `stock` tree is maintained. Stock status and low/refill alerts are derived from the Firebase medicine record, including on another open browser. A stock alert uses `stock_{medicineId}_{updatedAt}` as its acknowledgement key. A later inventory edit starts a fresh acknowledgement, and a refill above the threshold removes the current derived alert. These derived alerts are current-state warnings, not an immutable alert archive.
- **No duplicated assignments:** the UI derives compartment assignments from schedules. `/compartments` contains only hardware-reported state. It is deliberately empty until devices report. The UI always renders the fourteen named slots.
- **History snapshots:** schedule revisions preserve the name and configuration effective at an occurrence. Event `medicineName` preserves historical display after rename/deletion. Events are never cascaded away.
- **Separate acknowledgements:** read status is not stored on the original event. Derived and hardware alerts both use `alertReads`; reading cannot change dose history.
- **No fabricated status:** missing heartbeat is UNKNOWN. A stale heartbeat (>120 seconds) or implausibly future timestamp is OFFLINE. A fresh heartbeat is insufficient on its own; a valid reported connection status must also exist. Compartment hardware readings require both a fresh report and a fresh ONLINE device.

## Summary semantics

Scheduled counts reconstruct daily occurrences from revision history. Event totals deduplicate by schedule ID + schedule date + scheduled time within each type. Dose events are attributed to `scheduledDate`, including an after-midnight POST_MISSED. Wrong-compartment attempts use their own event timestamp and event ID. They do not mark the intended dose completed. MISSED and POST_MISSED are deliberately not mutually exclusive; do not add category counts to calculate consumption or a completion percentage.

For imported legacy events without `scheduledDate`, summaries fall back to the timestamp's local date. New integrations must always provide `scheduleId` and `scheduledDate` for dose-linked events. Avoid missing IDs, since fallback deduplication by medicine/time is less precise.

This prototype subscribes to each account's full event history. For a long-running production deployment, introduce indexed bounded queries and historical pagination. Indexes are included in the rules. Do not change lifetime history loading to a silent limit without also adapting summaries and filter behavior.
