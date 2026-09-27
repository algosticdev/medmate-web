# MedMate ESP32 schedule monitor

This sketch reads active schedules from the MedMate Firebase Realtime Database,
caches the last schedule snapshot in ESP32 Preferences (internal flash/NVS),
uses the DS3231 for Pakistan local time, and prints due/grace/access outcomes to
Serial Monitor. It does not write events to Firebase; the project's rules
intentionally require a trusted device bridge for event writes.

## Arduino IDE setup

Install these libraries from Library Manager:

- RTClib by Adafruit
- ArduinoJson 7

Select an ESP32 board, copy `secrets.example.h` to `secrets.h`, then enter your
Wi-Fi and Firebase values in `secrets.h`. Use the same caregiver account that
owns the schedules in the web dashboard, because schedules are stored under
that account's UID. Do not use an admin account. Never upload `secrets.h` to a
public repository. A production product should use a trusted bridge/custom-token
provisioning instead of storing a caregiver password on the device.

The sketch's I2C defaults are SDA GPIO21 and SCL GPIO22. Connect the DS3231,
then compile and upload. Open Serial Monitor at **115200 baud**. The sketch
syncs time using NTP when Wi-Fi is available and writes the local time to the
RTC. If the network is unavailable, it uses the DS3231 and last cached schedule.

## Reed switches and truthful MISSED status

The `REED_PINS` array in the sketch is intentionally set to `-1` for all slots.
Set each entry to the GPIO for that real slot's reed switch, in this order:

`Mon-A, Mon-B, Tue-A, Tue-B, Wed-A, Wed-B, Thu-A, Thu-B, Fri-A, Fri-B, Sat-A, Sat-B, Sun-A, Sun-B`.

The example logic assumes a reed switch wired between GPIO and GND, with the
magnet holding it closed while the compartment is shut. Opening changes the
input to HIGH. Verify your sensor type and wiring before changing a pin entry.
GPIO34/35 require external pull-up resistors because they do not have internal
pull-ups. Keep I2C pins 21/22 out of the reed pin list.

Until a slot's reed switch is configured, the serial output says
`MISSED UNVERIFIED`; it will not falsely claim the compartment was never
opened. With a configured sensor, the sketch prints `MISSED` after the on-time
window and grace period expire without an opening signal. A real opening during
the on-time window prints `ON_TIME`; during grace it prints `LATE`; after a
recorded MISSED it prints `POST_MISSED`.

The on-time window starts at the scheduled time, and the grace period follows
it. For example, a 10-minute on-time window plus a 20-minute grace period ends
30 minutes after the scheduled time. The serial output is an integration test;
it does not prove that medicine was consumed. Keep the user's prescribed dose
unchanged.

## Firebase data

The sketch reads:

`accounts/<authenticated UID>/catalog/schedules`

It expects the web app's `active`, `scheduledTime`, `compartmentId`,
`onTimeWindow`, and `gracePeriod` fields. Email/password sign-in and RTDB reads
use Firebase's HTTPS REST APIs and the project's normal Realtime Database
rules. The Firebase API key is project identification, not a server secret.
