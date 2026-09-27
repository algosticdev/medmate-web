import { useState } from "react";
import { Check, TriangleAlert } from "lucide-react";
import { Modal, Field } from "./ui.jsx";
import { entries, COMPARTMENTS } from "../services/domain.js";
import { saveMedicine, deleteMedicine } from "../services/medicine-service.js";
import { saveSchedule, deleteSchedule } from "../services/schedule-service.js";
import { updateStock } from "../services/stock-service.js";
import { userMessage } from "../services/errors.js";
export default function Editor({ editor, state, onClose, notify }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const { kind, id, remove } = editor;
  const record =
    kind === "schedule"
      ? state.catalog?.schedules?.[id]
      : state.catalog?.medicines?.[id];
  const title = remove
    ? `Delete ${kind}?`
    : kind === "stock"
      ? "Update stock"
      : `${id ? "Edit" : "Add"} ${kind}`;
  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const data = Object.fromEntries(new FormData(event.currentTarget));
      if (remove)
        await (kind === "medicine" ? deleteMedicine(id) : deleteSchedule(id));
      else if (kind === "medicine") await saveMedicine(data, id);
      else if (kind === "schedule")
        await saveSchedule({ ...data, active: data.active === "on" }, id);
      else await updateStock(id, data.currentStock, data.minimumStock);
      notify(remove ? "Record deleted." : "Changes saved.");
      onClose();
    } catch (err) {
      setError(userMessage(err));
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal title={title} onClose={onClose} busy={busy}>
      <form onSubmit={submit}>
        <fieldset disabled={busy}>
          {remove ? (
            <div className="delete-message">
              <TriangleAlert className="text-red-500" size={30} />
              <p>
                Delete {record?.name || record?.medicineName || "this schedule"}
                ? This cannot be undone. Existing event history will be
                retained.
              </p>
              {kind === "medicine" && (
                <p className="muted">
                  Remove linked schedules before deleting a medicine.
                </p>
              )}
            </div>
          ) : kind === "schedule" ? (
            <>
              <Field label="Medicine">
                <select
                  name="medicineId"
                  required
                  defaultValue={record?.medicineId || ""}
                >
                  <option value="" disabled>
                    Select a medicine
                  </option>
                  {entries(state.catalog?.medicines).map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </Field>
              <div className="form-grid">
                <Field label="Scheduled time">
                  <input
                    name="scheduledTime"
                    type="time"
                    required
                    defaultValue={record?.scheduledTime || ""}
                  />
                </Field>
                <Field label="Compartment">
                  <select
                    name="compartmentId"
                    required
                    defaultValue={record?.compartmentId || ""}
                  >
                    <option value="" disabled>
                      Select compartment
                    </option>
                    {record?.compartmentId &&
                      !COMPARTMENTS.includes(String(record.compartmentId)) && (
                        <option value={record.compartmentId}>
                          Legacy compartment {record.compartmentId} — choose a named slot
                        </option>
                      )}
                    {COMPARTMENTS.map((compartment) => (
                      <option key={compartment} value={compartment}>
                        {compartment}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
              <div className="form-grid">
                <Field label="On-time window (minutes)">
                  <input
                    name="onTimeWindow"
                    type="number"
                    min="0"
                    max="1440"
                    step="1"
                    required
                    defaultValue={record?.onTimeWindow ?? ""}
                  />
                </Field>
                <Field label="Grace period (minutes)">
                  <input
                    name="gracePeriod"
                    type="number"
                    min="0"
                    max="1440"
                    step="1"
                    required
                    defaultValue={record?.gracePeriod ?? ""}
                  />
                </Field>
              </div>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="active"
                  defaultChecked={record?.active ?? true}
                />{" "}
                Schedule active
              </label>
              <p className="muted small">
                Daily recurring. The on-time window starts at the scheduled
                time; the grace period follows it. Short intervals are
                supported.
              </p>
            </>
          ) : (
            <>
              {kind === "medicine" ? (
                <Field label="Medicine name">
                  <input
                    name="name"
                    required
                    maxLength="100"
                    autoFocus
                    defaultValue={record?.name || ""}
                  />
                </Field>
              ) : (
                <p className="stock-edit-name">{record?.name}</p>
              )}
              <div className="form-grid">
                <Field label="Current stock (units)">
                  <input
                    name="currentStock"
                    type="number"
                    min="0"
                    max="1000000"
                    step="1"
                    required
                    defaultValue={record?.currentStock ?? ""}
                  />
                </Field>
                <Field label="Minimum stock (units)">
                  <input
                    name="minimumStock"
                    type="number"
                    min="0"
                    max="1000000"
                    step="1"
                    required
                    defaultValue={record?.minimumStock ?? ""}
                  />
                </Field>
              </div>
              <p className="muted small">
                A stock alert appears at or below the minimum level. Zero stock
                requires a refill.
              </p>
            </>
          )}
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <div className="modal-actions">
            <button className="btn secondary" type="button" onClick={onClose}>
              Cancel
            </button>
            <button
              className={`btn ${remove ? "danger-btn" : "primary"}`}
              type="submit"
            >
              {busy ? (
                "Saving…"
              ) : remove ? (
                "Delete"
              ) : (
                <>
                  Save changes <Check size={16} />
                </>
              )}
            </button>
          </div>
        </fieldset>
      </form>
    </Modal>
  );
}
