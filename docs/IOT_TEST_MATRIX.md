# MedMate IoT test matrix

Record only observed results from the real Firebase project and physical organizer. `NOT RUN` makes no compliance claim.

| Test ID | Scenario | Input / condition | Expected result | Actual result | Pass / fail | Evidence |
| --- | --- | --- | --- | --- | --- | --- |
| IOT-01 | On-time | Correct compartment opened within on-time window | One immutable `ON_TIME` event with FR-27 fields; reminder ends | NOT RUN | NOT RUN | Pending physical test |
| IOT-02 | Late | Correct compartment opened within grace window | One immutable `LATE` event with FR-27 fields | NOT RUN | NOT RUN | Pending physical test |
| IOT-03 | Missed | Correct compartment remains closed through grace end | `MISSED` event and alert; caregiver delivery attempted | NOT RUN | NOT RUN | Pending physical test |
| IOT-04 | Post-missed | Correct compartment opened after `MISSED` | New `POST_MISSED`; original `MISSED` unchanged | NOT RUN | NOT RUN | Pending physical test |
| IOT-05 | Wrong compartment | Non-assigned compartment opened during active schedule | Warning and event; correct monitoring continues | NOT RUN | NOT RUN | Pending physical test |
| IOT-06 | Reminder silence | Physical acknowledgement button pressed | Sound stops; no access event; grace monitoring continues | NOT RUN | NOT RUN | Pending physical test |
| IOT-07 | Low stock | Real manual count reaches minimum | Low/refill alert without access-based decrement | NOT RUN | NOT RUN | Pending authenticated Firebase test |
| IOT-08 | Offline buffering | Network unavailable during real event | Original event identity/timestamp retained locally | NOT RUN | NOT RUN | Pending firmware test |
| IOT-09 | Reconnection sync | Connectivity restored with buffered events | Each event syncs once and status updates | NOT RUN | NOT RUN | Pending firmware/Firebase test |
| IOT-10 | Sensor/input fault | Detectable invalid sensor/input state | Fault logged; no false access event | NOT RUN | NOT RUN | Pending fault-injection test |
| IOT-11 | Caregiver delivery | Real missed/wrong event for enabled caregiver | Remote delivery arrives without open dashboard; status recorded | NOT RUN | NOT RUN | Provider not implemented |
