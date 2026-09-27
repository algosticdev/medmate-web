import { useEffect, useState } from "react";
import { Bell, Check, Cpu, Link2, Unlink } from "lucide-react";
import { Panel, Field, Badge } from "../components/ui.jsx";
import { entries, dateTime, deviceStatus, label } from "../services/domain.js";
import { saveCaregiver } from "../services/caregiver-service.js";
import { userMessage } from "../services/errors.js";
import {
  sendPhoneVerification,
  confirmPhoneVerification,
} from "../services/auth-service.js";
import {
  getPairedDevices,
  pairDevice,
  unpairDevice,
} from "../services/device-service.js";
export function Caregiver({ state, user, notify }) {
  const profile = state.caregiver || {};
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [permission, setPermission] = useState(() =>
    "Notification" in window ? Notification.permission : "unsupported",
  );
  const [phoneNumber, setPhoneNumber] = useState(user.phoneNumber || "");
  const [phoneInput, setPhoneInput] = useState(user.phoneNumber || "");
  const [editingPhone, setEditingPhone] = useState(!user.phoneNumber);
  const [verificationId, setVerificationId] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [phoneBusy, setPhoneBusy] = useState(false);
  const [phoneError, setPhoneError] = useState("");
  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await saveCaregiver(
        Object.fromEntries(new FormData(event.currentTarget)),
        user.email,
        phoneNumber,
      );
      notify("Caregiver settings saved.");
    } catch (err) {
      setError(userMessage(err));
    } finally {
      setBusy(false);
    }
  }
  async function requestPhoneCode() {
    setPhoneBusy(true);
    setPhoneError("");
    try {
      setVerificationId(await sendPhoneVerification(phoneInput, "phone-recaptcha"));
      notify("Verification code sent.");
    } catch (error) {
      setPhoneError(userMessage(error));
    } finally {
      setPhoneBusy(false);
    }
  }
  async function verifyPhoneCode() {
    setPhoneBusy(true);
    setPhoneError("");
    try {
      const verified = await confirmPhoneVerification(verificationId, verificationCode);
      setPhoneNumber(verified);
      setPhoneInput(verified);
      setEditingPhone(false);
      setVerificationId("");
      setVerificationCode("");
      notify("Phone number verified.");
    } catch (error) {
      setPhoneError(userMessage(error));
    } finally {
      setPhoneBusy(false);
    }
  }
  return (
    <div className="settings-grid">
      <Panel title="Caregiver profile" className="settings-panel">
        <form onSubmit={submit}>
          <fieldset disabled={busy}>
            <Field label="Caregiver name">
              <input
                name="name"
                defaultValue={profile.name || user.name || ""}
                maxLength={100}
                autoComplete="name"
                required
              />
            </Field>
            <Field
              label="Verified notification email"
              hint="Notifications use your verified sign-in address."
            >
              <input
                type="email"
                name="email"
                value={user.email || ""}
                maxLength={254}
                autoComplete="email"
                required
                readOnly
              />
            </Field>
            <Field
              label="Verified phone number"
              hint={
                phoneNumber && !editingPhone
                  ? "This number is verified by Firebase."
                  : "Enter the new number with country code, for example +923001234567."
              }
            >
              <div className="phone-verification-row">
                <input
                  type="tel"
                  value={phoneInput}
                  onChange={(event) => setPhoneInput(event.target.value)}
                  readOnly={Boolean(phoneNumber) && !editingPhone}
                  disabled={phoneBusy}
                  autoComplete="tel"
                />
                {phoneNumber && !editingPhone ? (
                  <button
                    className="btn secondary"
                    type="button"
                    onClick={() => {
                      setEditingPhone(true);
                      setPhoneInput("");
                      setVerificationId("");
                      setVerificationCode("");
                      setPhoneError("");
                    }}
                  >
                    Change number
                  </button>
                ) : (
                  <button
                    className="btn secondary"
                    type="button"
                    onClick={requestPhoneCode}
                    disabled={phoneBusy || !phoneInput}
                  >
                    Send OTP
                  </button>
                )}
              </div>
            </Field>
            {editingPhone && phoneNumber && !verificationId && (
              <button
                className="text-link phone-cancel"
                type="button"
                onClick={() => {
                  setEditingPhone(false);
                  setPhoneInput(phoneNumber);
                  setVerificationId("");
                  setVerificationCode("");
                  setPhoneError("");
                }}
              >
                Cancel number change
              </button>
            )}
            {verificationId && editingPhone && (
              <Field label="6-digit verification code">
                <div className="phone-verification-row">
                  <input
                    inputMode="numeric"
                    value={verificationCode}
                    onChange={(event) =>
                      setVerificationCode(
                        event.target.value.replace(/\D/g, "").slice(0, 6),
                      )
                    }
                    maxLength={6}
                    autoComplete="one-time-code"
                  />
                  <button
                    className="btn secondary"
                    type="button"
                    onClick={verifyPhoneCode}
                    disabled={phoneBusy || verificationCode.length !== 6}
                  >
                    Verify
                  </button>
                </div>
              </Field>
            )}
            <div id="phone-recaptcha" />
            {phoneError && (
              <p className="form-error" role="alert">
                {phoneError}
              </p>
            )}
            <input type="hidden" name="notificationPreference" value="in_app" />
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="notificationsEnabled"
                defaultChecked={profile.notificationsEnabled !== false}
              />
              Enable caregiver notifications
            </label>
            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}
            <button className="btn primary" type="submit">
              {busy ? (
                "Saving…"
              ) : (
                <>
                  Save settings <Check size={16} />
                </>
              )}
            </button>
          </fieldset>
        </form>
      </Panel>
      <aside className="panel settings-note">
        <Bell size={28} />
        <h2>Stay in the loop.</h2>
        <p>
          You’ll see missed dose and wrong-compartment alerts here when they are reported.
        </p>
        <p>New alerts appear in this workspace while you are signed in.</p>
        <button
          className="btn secondary"
          type="button"
          onClick={async () => {
            if (!("Notification" in window)) {
              setPermission("unsupported");
              return;
            }
            setPermission(await Notification.requestPermission());
          }}
          disabled={permission === "granted" || permission === "unsupported"}
        >
          {permission === "granted"
            ? "Browser notifications enabled"
            : permission === "unsupported"
              ? "Browser notifications unavailable"
              : "Enable browser notifications"}
        </button>
        <div className="info-line">
          Sign-in account
          <br />
          {user.email}
        </div>
      </aside>
    </div>
  );
}
export function Device({ state, user, notify }) {
  const devices = entries(state.devices);
  const [deviceId, setDeviceId] = useState("");
  const [pairedDevices, setPairedDevices] = useState([]);
  const [pairingBusy, setPairingBusy] = useState(false);
  const [pairingError, setPairingError] = useState("");

  async function refreshPairedDevices() {
    if (user?.role !== "caregiver") return;
    try {
      setPairedDevices(await getPairedDevices(user.uid));
      setPairingError("");
    } catch (error) {
      setPairingError(userMessage(error));
    }
  }

  useEffect(() => {
    refreshPairedDevices();
  }, [user?.uid, user?.role]);

  async function submitPairing(event) {
    event.preventDefault();
    setPairingBusy(true);
    setPairingError("");
    try {
      const result = await pairDevice(deviceId, user.uid);
      setDeviceId("");
      await refreshPairedDevices();
      notify(
        result.alreadyPaired
          ? `${result.deviceId} is already paired with your account.`
          : `${result.deviceId} paired successfully.`,
      );
    } catch (error) {
      setPairingError(userMessage(error));
    } finally {
      setPairingBusy(false);
    }
  }

  async function confirmUnpair(id) {
    if (
      !window.confirm(
        `Unpair ${id} from your account? Your medicines, schedules, events, stock, and alerts will remain in your account.`,
      )
    )
      return;
    setPairingBusy(true);
    setPairingError("");
    try {
      await unpairDevice(id, user.uid);
      await refreshPairedDevices();
      notify(`${id} has been unpaired.`);
    } catch (error) {
      setPairingError(userMessage(error));
    } finally {
      setPairingBusy(false);
    }
  }

  return (
    <>
      {user?.role === "caregiver" && (
        <Panel
          title="Device pairing"
          subtitle="Connect the MedMate box assigned to your account."
          className="device-detail"
        >
          <div className="device-pairing-body">
            <form className="device-pairing-form" onSubmit={submitPairing}>
              <Field
                label="Device ID"
                hint="Enter the ID printed on your MedMate box, for example MEDMATE_BOX_001."
              >
                <input
                  value={deviceId}
                  onChange={(event) => setDeviceId(event.target.value)}
                  placeholder="MEDMATE_BOX_001"
                  autoCapitalize="characters"
                  autoComplete="off"
                  maxLength={64}
                  disabled={pairingBusy}
                />
              </Field>
              <button
                className="btn primary"
                type="submit"
                disabled={pairingBusy || !deviceId.trim()}
              >
                <Link2 size={16} />
                {pairingBusy ? "Please wait…" : "Pair device"}
              </button>
            </form>
            {pairingError && (
              <p className="form-error" role="alert">
                {pairingError}
              </p>
            )}
            {pairedDevices.length > 0 ? (
              <div className="paired-device-list">
                {pairedDevices.map((device) => {
                  const report = devices.find(
                    (item) => item.id === device.id || item.deviceId === device.id,
                  );
                  return (
                    <div className="paired-device" key={device.id}>
                      <div>
                        <strong>{device.id}</strong>
                        <span>Pairing: Paired</span>
                        <span>Paired at: {dateTime(device.pairedAt)}</span>
                        <span>
                          Hardware status:{" "}
                          {report?.connectionStatus
                            ? label(report.connectionStatus)
                            : "Not reported yet"}
                        </span>
                        <span>
                          Last sync:{" "}
                          {report?.lastSync
                            ? dateTime(report.lastSync)
                            : "Not reported yet"}
                        </span>
                      </div>
                      <button
                        className="btn secondary"
                        type="button"
                        onClick={() => confirmUnpair(device.id)}
                        disabled={pairingBusy}
                      >
                        <Unlink size={16} />
                        Unpair device
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="device-pairing-empty">
                No device is paired with this account.
              </p>
            )}
          </div>
        </Panel>
      )}
      <div className="info-line">
        <Cpu size={18} />
        Device details reflect the latest status report.
      </div>
      {devices.length ? (
        devices.map((d) => (
          <Panel
            key={d.id}
            title={d.name || d.id}
            action={<Badge status={deviceStatus(d)} />}
            className="device-detail"
          >
            <div className="device-data">
              {[
                ["Device ID", d.id || "Not connected"],
                ["Device connection", label(deviceStatus(d))],
                ["Last seen", dateTime(d.lastSeen)],
                ["Last sync", dateTime(d.lastSync)],
                [
                  "Device cloud / sync status",
                  d.cloudStatus ? label(d.cloudStatus) : "Unknown",
                ],
                ["Pending offline events", d.pendingOfflineEvents ?? "Not reported"],
                ["RTC status", d.rtcStatus ? label(d.rtcStatus) : "Not reported"],
                [
                  "Sensor / input fault",
                  d.faultStatus ? label(d.faultStatus) : "Not reported",
                ],
              ].map(([name, value]) => (
                <div key={name}>
                  <span>{name}</span>
                  <strong>{value}</strong>
                </div>
              ))}
            </div>
          </Panel>
        ))
      ) : (
        <Panel
          title="Device status"
          action={<Badge status="UNKNOWN" />}
          className="device-detail"
        >
          <p>No device reports yet.</p>
        </Panel>
      )}
    </>
  );
}
