#include <Arduino.h>
#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <Preferences.h>
#include <Wire.h>
#include <RTClib.h>
#include <time.h>
#include <sys/time.h>
#include <map>

#include "secrets.h"

// ESP32 defaults: SDA=GPIO21, SCL=GPIO22. Change these if your board differs.
static constexpr int RTC_SDA_PIN = 21;
static constexpr int RTC_SCL_PIN = 22;
static constexpr uint32_t SCHEDULE_REFRESH_MS = 30UL * 1000UL;

// GTS Root R1 certificate from Google Trust Services. Keep TLS verification on.
// If Firebase changes certificate chains, update the trusted roots from pki.goog.
static const char GOOGLE_ROOT_CA[] PROGMEM = R"CERT(
-----BEGIN CERTIFICATE-----
MIIFVzCCAz+gAwIBAgINAgPlk28xsBNJiGuiFzANBgkqhkiG9w0BAQwFADBHMQsw
CQYDVQQGEwJVUzEiMCAGA1UEChMZR29vZ2xlIFRydXN0IFNlcnZpY2VzIExMQzEU
MBIGA1UEAxMLR1RTIFJvb3QgUjEwHhcNMTYwNjIyMDAwMDAwWhcNMzYwNjIyMDAw
MDAwWjBHMQswCQYDVQQGEwJVUzEiMCAGA1UEChMZR29vZ2xlIFRydXN0IFNlcnZp
Y2VzIExMQzEUMBIGA1UEAxMLR1RTIFJvb3QgUjEwggIiMA0GCSqGSIb3DQEBAQUA
A4ICDwAwggIKAoICAQC2EQKLHuOhd5s73L+UPreVp0A8of2C+X0yBoJx9vaMf/vo
27xqLpeXo4xL+Sv2sfnOhB2x+cWX3u+58qPpvBKJXqeqUqv4IyfLpLGcY9vXmX7w
Cl7raKb0xlpHDU0QM+NOsROjyBhsS+z8CZDfnWQpJSMHobTSPS5g4M/SCYe7zUjw
TcLCeoiKu7rPWRnWr4+wB7CeMfGCwcDfLqZtbBkOtdh+JhpFAz2weaSUKK0Pfybl
qAj+lug8aJRT7oM6iCsVlgmy4HqMLnXWnOunVmSPlk9orj2XwoSPwLxAwAtcvfaH
szVsrBhQf4TgTM2S0yDpM7xSma8ytSmzJSq0SPly4cpk9+aCEI3oncKKiPo4Zor8
Y/kB+Xj9e1x3+naH+uzfsQ55lVe0vSbv1gHR6xYKu44LtcXFilWr06zqkUspzBmk
MiVOKvFlRNACzqrOSbTqn3yDsEB750Orp2yjj32JgfpMpf/VjsPOS+C12LOORc92
wO1AK/1TD7Cn1TsNsYqiA94xrcx36m97PtbfkSIS5r762DL8EGMUUXLeXdYWk70p
aDPvOmbsB4om3xPXV2V4J95eSRQAogB/mqghtqmxlbCluQ0WEdrHbEg8QOB+DVrN
VjzRlwW5y0vtOUucxD/SVRNuJLDWcfr0wbrM7Rv1/oFB2ACYPTrIrnqYNxgFlQID
AQABo0IwQDAOBgNVHQ8BAf8EBAMCAYYwDwYDVR0TAQH/BAUwAwEB/zAdBgNVHQ4E
FgQU5K8rJnEaK0gnhS9SZizv8IkTcT4wDQYJKoZIhvcNAQEMBQADggIBAJ+qQibb
C5u+/x6Wki4+omVKapi6Ist9wTrYggoGxval3sBOh2Z5ofmmWJyq+bXmYOfg6LEe
QkEzCzc9zolwFcq1JKjPa7XSQCGYzyI0zzvFIoTgxQ6KfF2I5DUkzps+GlQebtuy
h6f88/qBVRRiClmpIgUxPoLW7ttXNLwzldMXG+gnoot7TiYaelpkttGsN/H9oPM4
7HLwEXWdyzRSjeZ2axfG34arJ45JK3VmgRAhpuo+9K4l/3wV3s6MJT/KYnAK9y8J
ZgfIPxz88NtFMN9iiMG1D53Dn0reWVlHxYciNuaCp+0KueIHoI17eko8cdLiA6Ef
MgfdG+RCzgwARWGAtQsgWSl4vflVy2PFPEz0tv/bal8xa5meLMFrUKTX5hgUvYU/
Z6tGn6D/Qqc6f1zLXbBwHSs09dR2CQzreExZBfMzQsNhFRAbd03OIozUhfJFfbdT
6u9AWpQKXCBfTkBdYiJ23//OYb2MI3jSNwLgjt7RETeJ9r/tSQdirpLsQBqvFAnZ
0E6yove+7u7Y/9waLd64NnHi/Hm3lCXRSHNboTXns5lndcEZOitHTtNCjv0xyBZm
2tIMPNuzjsmhDYAPexZ3FL//2wmUspO8IFgV6dtxQ/PeEMMA3KgqlbbC1j+Qa3bb
bP6MvPJwNQzcmRk13NfIRmPVNnGuV/u3gm3c
-----END CERTIFICATE-----
)CERT";

RTC_DS3231 rtc;
Preferences prefs;
String idToken;
String refreshToken;
String userId;
String scheduleJson = "{}";
uint32_t tokenIssuedAt = 0;
uint32_t tokenLifetimeMs = 0;
uint32_t lastScheduleFetch = 0;
bool tlsTimeReady = false;

const char *const COMPARTMENTS[14] = {
    "Mon-A", "Mon-B", "Tue-A", "Tue-B", "Wed-A", "Wed-B", "Thu-A",
    "Thu-B", "Fri-A", "Fri-B", "Sat-A", "Sat-B", "Sun-A", "Sun-B"};

// Put the GPIO used by each real reed switch in matching order above.
// -1 means not wired. Do not report MISSED as verified until the assigned
// compartment's actual reed switch is connected and tested.
const int REED_PINS[14] = {
    -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1};

struct RuntimeState {
  String occurrence;
  String outcome;
  bool duePrinted = false;
  bool gracePrinted = false;
  bool missedPrinted = false;
};

std::map<String, RuntimeState> runtimeBySchedule;
bool previousDoorOpen[14] = {};
bool rawDoorOpen[14] = {};
bool stableDoorOpen[14] = {};
uint32_t reedChangedAt[14] = {};
uint32_t lastClockPrint = 0;

String urlEncode(const String &input) {
  String output;
  const char hex[] = "0123456789ABCDEF";
  for (size_t i = 0; i < input.length(); ++i) {
    const uint8_t c = static_cast<uint8_t>(input[i]);
    if ((c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') ||
        (c >= '0' && c <= '9') || c == '-' || c == '_' || c == '.' ||
        c == '~') {
      output += static_cast<char>(c);
    } else {
      output += '%';
      output += hex[c >> 4];
      output += hex[c & 0x0F];
    }
  }
  return output;
}

bool httpsRequest(const String &url, const String &method, const String &body,
                  String &response,
                  const char *contentType = "application/json") {
  WiFiClientSecure client;
  client.setCACert(GOOGLE_ROOT_CA);
  HTTPClient http;
  http.setTimeout(12000);
  if (!http.begin(client, url)) {
    Serial.println("HTTPS setup failed.");
    return false;
  }
  http.addHeader("Content-Type", contentType);
  const int status = method == "POST"
                         ? http.POST(reinterpret_cast<const uint8_t *>(body.c_str()), body.length())
                         : http.GET();
  response = http.getString();
  http.end();
  if (status < 200 || status >= 300) {
    Serial.printf("HTTPS request failed (HTTP %d).\n", status);
    if (response.length()) Serial.println(response);
    return false;
  }
  return true;
}

bool parseAuthResponse(const String &response, bool isRefresh) {
  JsonDocument doc;
  if (deserializeJson(doc, response)) {
    Serial.println("Could not parse Firebase Auth response.");
    return false;
  }
  idToken = doc[isRefresh ? "id_token" : "idToken"].as<String>();
  String nextRefresh = doc[isRefresh ? "refresh_token" : "refreshToken"].as<String>();
  if (nextRefresh.length()) {
    refreshToken = nextRefresh;
    prefs.putString("refresh", refreshToken);
  }
  if (!isRefresh) {
    userId = doc["localId"].as<String>();
    prefs.putString("uid", userId);
  } else {
    userId = doc["user_id"].as<String>();
    if (userId.length()) prefs.putString("uid", userId);
  }
  const uint32_t seconds = doc[isRefresh ? "expires_in" : "expiresIn"] | 3600;
  tokenIssuedAt = millis();
  tokenLifetimeMs = (seconds > 90 ? seconds - 60 : seconds) * 1000UL;
  return idToken.length() > 0 && userId.length() > 0;
}

bool refreshIdToken() {
  if (!refreshToken.length() || !tlsTimeReady) return false;
  const String url = String("https://securetoken.googleapis.com/v1/token?key=") +
                     FIREBASE_API_KEY;
  const String body = String("grant_type=refresh_token&refresh_token=") +
                      urlEncode(refreshToken);
  String response;
  if (!httpsRequest(url, "POST", body, response,
                    "application/x-www-form-urlencoded"))
    return false;
  return parseAuthResponse(response, true);
}

bool signIn() {
  if (!tlsTimeReady) {
    Serial.println("Secure time unavailable; Firebase sign-in paused.");
    return false;
  }
  const String url = String("https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=") +
                     FIREBASE_API_KEY;
  JsonDocument request;
  request["email"] = DEVICE_EMAIL;
  request["password"] = DEVICE_PASSWORD;
  request["returnSecureToken"] = true;
  String body;
  serializeJson(request, body);
  String response;
  if (!httpsRequest(url, "POST", body, response)) return false;
  if (!parseAuthResponse(response, false)) return false;
  Serial.println("Firebase sign-in succeeded.");
  Serial.printf("Signed in UID: %s\n", userId.c_str());
  return true;
}

bool ensureAuth() {
  if (idToken.length() && (millis() - tokenIssuedAt) < tokenLifetimeMs) return true;
  if (refreshIdToken()) return true;
  idToken = "";
  return signIn();
}

bool fetchSchedules() {
  if (WiFi.status() != WL_CONNECTED || !ensureAuth()) return false;
  String databaseUrl = FIREBASE_DATABASE_URL;
  while (databaseUrl.endsWith("/")) databaseUrl.remove(databaseUrl.length() - 1);
  const String url = databaseUrl + "/accounts/" + userId +
                     "/catalog/schedules.json?auth=" + urlEncode(idToken);
  String response;
  if (!httpsRequest(url, "GET", "", response)) return false;
  response.trim();
  JsonDocument check;
  if (deserializeJson(check, response)) {
    Serial.println("Schedule JSON was invalid; keeping last cached schedules.");
    return false;
  }
  if (response == "null") response = "{}";
  scheduleJson = response;
  prefs.putString("schedules", scheduleJson);
  Serial.printf("Schedules synced from Firebase (%u bytes).\n",
                static_cast<unsigned>(scheduleJson.length()));
  return true;
}

void connectWiFi() {
  if (WiFi.status() == WL_CONNECTED) return;
  Serial.printf("Connecting to Wi-Fi: %s\n", WIFI_SSID);
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  const uint32_t started = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - started < 20000) {
    delay(250);
    Serial.print('.');
  }
  Serial.println();
  if (WiFi.status() == WL_CONNECTED) {
    Serial.print("Wi-Fi connected. IP: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("Wi-Fi unavailable; cached schedules will be used.");
  }
}

void syncRtcFromNtp() {
  if (WiFi.status() != WL_CONNECTED) return;
  // Pakistan Standard Time is UTC+5 and does not observe daylight saving time.
  configTzTime("PKT-5", "pool.ntp.org", "time.google.com");
  struct tm localTime;
  if (!getLocalTime(&localTime, 12000) || localTime.tm_year + 1900 < 2024) {
    Serial.println("NTP unavailable; retaining the DS3231 clock.");
    return;
  }
  rtc.adjust(DateTime(localTime.tm_year + 1900, localTime.tm_mon + 1,
                      localTime.tm_mday, localTime.tm_hour, localTime.tm_min,
                      localTime.tm_sec));
  tlsTimeReady = true;
  Serial.println("DS3231 synced to Pakistan local time using NTP.");
}

int compartmentIndex(const String &name) {
  for (int i = 0; i < 14; ++i)
    if (name == COMPARTMENTS[i]) return i;
  return -1;
}

uint32_t shortHash(const String &text) {
  uint32_t hash = 2166136261u;
  for (size_t i = 0; i < text.length(); ++i) {
    hash ^= static_cast<uint8_t>(text[i]);
    hash *= 16777619u;
  }
  return hash;
}

String occurrenceId(const String &scheduleId, uint32_t dueEpoch) {
  return scheduleId + ":" + String(dueEpoch);
}

String outcomeKey(const String &scheduleId) {
  char key[12];
  snprintf(key, sizeof(key), "o%08lx", static_cast<unsigned long>(shortHash(scheduleId)));
  return String(key);
}

String dueKey(const String &scheduleId) {
  char key[12];
  snprintf(key, sizeof(key), "d%08lx", static_cast<unsigned long>(shortHash(scheduleId)));
  return String(key);
}

bool sensorConfigured(int slot) { return slot >= 0 && REED_PINS[slot] >= 0; }

// Wiring assumption: reed switch connects GPIO to GND while the magnet is
// holding the compartment closed. Opening the lid changes the input HIGH.
bool reedReportsOpen(int slot) {
  return sensorConfigured(slot) && digitalRead(REED_PINS[slot]) == HIGH;
}

void recordOutcome(const String &scheduleId, RuntimeState &runtime,
                   const String &outcome) {
  runtime.outcome = outcome;
  prefs.putString(outcomeKey(scheduleId).c_str(), outcome);
  Serial.printf("%s | schedule %s\n", outcome.c_str(), scheduleId.c_str());
}

void printClock(const DateTime &now) {
  Serial.printf("RTC %04d-%02d-%02d %02d:%02d:%02d\n", now.year(), now.month(),
                now.day(), now.hour(), now.minute(), now.second());
}

void monitorSchedules() {
  JsonDocument doc;
  if (deserializeJson(doc, scheduleJson)) {
    Serial.println("Cached schedule data could not be parsed.");
    return;
  }

  const DateTime now = rtc.now();
  const uint32_t nowEpoch = now.unixtime();
  bool openingEdge[14] = {};
  for (int i = 0; i < 14; ++i) {
    if (!sensorConfigured(i)) continue;
    const bool raw = reedReportsOpen(i);
    if (raw != rawDoorOpen[i]) {
      rawDoorOpen[i] = raw;
      reedChangedAt[i] = millis();
    }
    if (rawDoorOpen[i] != stableDoorOpen[i] &&
        millis() - reedChangedAt[i] >= 60) {
      stableDoorOpen[i] = rawDoorOpen[i];
      openingEdge[i] = stableDoorOpen[i] && !previousDoorOpen[i];
      previousDoorOpen[i] = stableDoorOpen[i];
    }
  }

  for (JsonPair item : doc.as<JsonObject>()) {
    const String scheduleId = item.key().c_str();
    JsonObjectConst schedule = item.value().as<JsonObjectConst>();
    if (!(schedule["active"] | false)) continue;
    const String scheduledTime = schedule["scheduledTime"] | "";
    const String compartment = schedule["compartmentId"] | "";
    const int slot = compartmentIndex(compartment);
    const int colon = scheduledTime.indexOf(':');
    if (colon < 1 || slot < 0) continue;
    const int hour = scheduledTime.substring(0, colon).toInt();
    const int minute = scheduledTime.substring(colon + 1).toInt();
    if (hour < 0 || hour > 23 || minute < 0 || minute > 59) continue;

    DateTime due(now.year(), now.month(), now.day(), hour, minute, 0);
    // Use the previous day's occurrence for grace windows that cross midnight.
    if (due.unixtime() > nowEpoch) due = DateTime(due.unixtime() - 86400);
    const uint32_t dueEpoch = due.unixtime();
    const int onTimeMinutes = schedule["onTimeWindow"] | 0;
    const int graceMinutes = schedule["gracePeriod"] | 0;
    if (onTimeMinutes < 0 || graceMinutes < 0) continue;
    const uint32_t onTimeSeconds = static_cast<uint32_t>(onTimeMinutes) * 60UL;
    const uint32_t graceSeconds = static_cast<uint32_t>(graceMinutes) * 60UL;
    const uint32_t elapsed = nowEpoch - dueEpoch;
    const uint32_t totalSeconds = onTimeSeconds + graceSeconds;

    const String occurrence = occurrenceId(scheduleId, dueEpoch);
    RuntimeState &runtime = runtimeBySchedule[scheduleId];
    if (runtime.occurrence != occurrence) {
      runtime = RuntimeState{};
      runtime.occurrence = occurrence;
      const String storedDue = prefs.getString(dueKey(scheduleId).c_str(), "");
      if (storedDue == String(dueEpoch))
        runtime.outcome = prefs.getString(outcomeKey(scheduleId).c_str(), "");
      else {
        prefs.putString(dueKey(scheduleId).c_str(), String(dueEpoch));
        prefs.remove(outcomeKey(scheduleId).c_str());
      }
    }

    if (runtime.outcome == "MISSED" && openingEdge[slot]) {
      openingEdge[slot] = false;
      recordOutcome(scheduleId, runtime, "POST_MISSED (compartment opened after MISSED)");
      continue;
    }
    if (runtime.outcome.length()) continue;

    if (elapsed > totalSeconds) {
      if (!runtime.missedPrinted) {
        if (sensorConfigured(slot)) {
          recordOutcome(scheduleId, runtime,
                       "MISSED (no opening detected before grace ended)");
        } else {
          Serial.printf("MISSED UNVERIFIED | %s | %s | reed switch not configured\n",
                        scheduleId.c_str(), compartment.c_str());
        }
        runtime.missedPrinted = true;
      }
      continue;
    }

    if (openingEdge[slot]) {
      openingEdge[slot] = false;
      if (elapsed <= onTimeSeconds)
        recordOutcome(scheduleId, runtime, "ON_TIME (correct compartment opened)");
      else
        recordOutcome(scheduleId, runtime, "LATE (correct compartment opened in grace period)");
      continue;
    }

    if (elapsed <= onTimeSeconds) {
      if (!runtime.duePrinted) {
        Serial.printf("REMINDER DUE | %s | %s | %s\n", scheduleId.c_str(),
                      compartment.c_str(), scheduledTime.c_str());
        runtime.duePrinted = true;
      }
    } else if (elapsed <= totalSeconds) {
      if (!runtime.gracePrinted) {
        Serial.printf("GRACE PERIOD ACTIVE | %s | %s\n", scheduleId.c_str(),
                      compartment.c_str());
        runtime.gracePrinted = true;
      }
    } else if (!runtime.missedPrinted) {
      if (sensorConfigured(slot)) {
        recordOutcome(scheduleId, runtime, "MISSED (no opening detected before grace ended)");
      } else {
        Serial.printf("MISSED UNVERIFIED | %s | %s | reed switch not configured\n",
                      scheduleId.c_str(), compartment.c_str());
      }
      runtime.missedPrinted = true;
    }
  }

  if (millis() - lastClockPrint >= 1000) {
    lastClockPrint = millis();
    printClock(now);
  }
}

void setup() {
  Serial.begin(115200);
  delay(300);
  Serial.println();
  Serial.println("=== MedMate ESP32 RTC + Firebase schedule monitor ===");

  Wire.begin(RTC_SDA_PIN, RTC_SCL_PIN);
  if (!rtc.begin()) {
    Serial.println("ERROR: DS3231 not detected. Check SDA/SCL/VCC/GND.");
    while (true) delay(1000);
  }
  if (rtc.lostPower()) {
    Serial.println("RTC lost power; setting compile-time fallback until NTP sync.");
    rtc.adjust(DateTime(F(__DATE__), F(__TIME__)));
  }

  for (int i = 0; i < 14; ++i) {
    if (sensorConfigured(i)) {
      pinMode(REED_PINS[i], INPUT_PULLUP);
      // Don't count a lid already open at boot as a new access event.
      previousDoorOpen[i] = reedReportsOpen(i);
      rawDoorOpen[i] = previousDoorOpen[i];
      stableDoorOpen[i] = previousDoorOpen[i];
      reedChangedAt[i] = millis();
    }
  }

  prefs.begin("medmate", false);
  refreshToken = prefs.getString("refresh", "");
  userId = prefs.getString("uid", "");
  scheduleJson = prefs.getString("schedules", "{}");

  connectWiFi();
  syncRtcFromNtp();
  if (!tlsTimeReady) {
    const DateTime now = rtc.now();
    if (now.year() >= 2024) {
      struct timeval tv = {static_cast<time_t>(now.unixtime()), 0};
      settimeofday(&tv, nullptr);
      tlsTimeReady = true;
    }
  }
  if (WiFi.status() == WL_CONNECTED) fetchSchedules();
  if (scheduleJson == "{}") Serial.println("No active web schedules in cached data yet.");
  Serial.println("Monitoring starts. Time windows are interpreted in Pakistan time.");
}

void loop() {
  if (WiFi.status() != WL_CONNECTED) connectWiFi();

  if (WiFi.status() == WL_CONNECTED &&
      (lastScheduleFetch == 0 || millis() - lastScheduleFetch >= SCHEDULE_REFRESH_MS)) {
    lastScheduleFetch = millis();
    fetchSchedules();
  }

  monitorSchedules();
  delay(100);
}
