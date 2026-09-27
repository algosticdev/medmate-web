import { useState } from "react";
import { Search, Pencil, Trash2, Clock3, Package, Cpu, Pill } from "lucide-react";
import { Panel, Table, MedicineCell, Badge, Empty } from "../components/ui.jsx";
import {
  entries,
  dateTime,
  clockTime,
  stockStatus,
  deviceStatus,
  COMPARTMENTS,
  compartmentName,
} from "../services/domain.js";
import { appConfig } from "../services/firebase-config.js";
import { saveSchedule } from "../services/schedule-service.js";
import { userMessage } from "../services/errors.js";
function Actions({ kind, id, edit }) {
  return (
    <div className="row-actions">
      <button
        className="icon-button"
        aria-label={`Edit ${kind}`}
        onClick={() => edit({ kind, id })}
      >
        <Pencil size={17} />
      </button>
      <button
        className="icon-button danger"
        aria-label={`Delete ${kind}`}
        onClick={() => edit({ kind, id, remove: true })}
      >
        <Trash2 size={17} />
      </button>
    </div>
  );
}
export function Medicines({ state, edit }) {
  const [search, setSearch] = useState("");
  const medicines = entries(state.catalog?.medicines);
  const filtered = medicines.filter((m) =>
    `${m.name} ${m.id}`.toLowerCase().includes(search.toLowerCase()),
  );
  return (
    <Panel>
      <div className="toolbar">
        <label className="search-field">
          <Search size={18} />
          <input
            type="search"
            aria-label="Search medicines"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
        <span className="muted">{medicines.length} medicines</span>
      </div>
      {filtered.length ? (
        <Table
          headers={[
            "Medicine",
            "Stock",
            "Minimum stock",
            "Last updated",
            "Actions",
          ]}
        >
          {filtered.map((m) => (
            <tr key={m.id}>
              <td>
                <MedicineCell name={m.name} sub={m.id} />
                <small>Created {dateTime(m.createdAt)}</small>
              </td>
              <td>
                <strong>{m.currentStock}</strong> units{" "}
                <Badge status={stockStatus(m)} />
              </td>
              <td>{m.minimumStock} units</td>
              <td>{dateTime(m.updatedAt)}</td>
              <td>
                <Actions kind="medicine" id={m.id} edit={edit} />
              </td>
            </tr>
          ))}
        </Table>
      ) : (
      <Empty title={medicines.length ? "No medicines found" : "No medicines added yet."}>
        {medicines.length ? "Try another search." : "Add a medicine to begin."}
      </Empty>
      )}
    </Panel>
  );
}
export function Schedules({ state, edit, notify }) {
  const [busy, setBusy] = useState(null);
  const rows = entries(state.catalog?.schedules).sort((a, b) =>
    a.scheduledTime.localeCompare(b.scheduledTime),
  );
  async function toggle(s) {
    setBusy(s.id);
    try {
      await saveSchedule({ ...s, active: !s.active }, s.id);
      notify(`Schedule ${s.active ? "deactivated" : "activated"}.`);
    } catch (err) {
      notify(userMessage(err), true);
    } finally {
      setBusy(null);
    }
  }
  return (
    <>
      <Panel>
        {rows.length ? (
          <Table
            headers={[
              "Medicine / schedule ID",
              "Time",
              "Compartment",
              "Timing windows",
              "Status",
              "Actions",
            ]}
          >
            {rows.map((s) => (
              <tr key={s.id}>
                <td>
                  <MedicineCell
                    name={
                      state.catalog?.medicines?.[s.medicineId]?.name ||
                      s.medicineName
                    }
                    sub={s.id}
                  />
                  <small>
                    Created {dateTime(s.createdAt)}
                    <br />
                    Updated {dateTime(s.updatedAt)}
                  </small>
                </td>
                <td className="time-cell">{clockTime(s.scheduledTime)}</td>
                <td>
                  <span className="compartment-tag">{compartmentName(s.compartmentId)}</span>
                </td>
                <td>
                  {s.onTimeWindow} min on-time
                  <small>+ {s.gracePeriod} min grace</small>
                </td>
                <td>
                  <button
                    className={`status-toggle ${s.active ? "active" : ""}`}
                    onClick={() => toggle(s)}
                    disabled={busy === s.id}
                    aria-label={`${s.active ? "Deactivate" : "Activate"} ${s.medicineName} at ${s.scheduledTime}`}
                  >
                    <span />
                    {s.active ? "Active" : "Inactive"}
                  </button>
                </td>
                <td>
                  <Actions kind="schedule" id={s.id} edit={edit} />
                </td>
              </tr>
            ))}
          </Table>
        ) : (
          <Empty title="No schedules created yet.">
            Add a medicine, then assign its time and compartment.
          </Empty>
        )}
      </Panel>
    </>
  );
}
export function Compartments({ state }) {
  const schedules = entries(state.catalog?.schedules);
  return (
    <div className="compartment-grid">
      {COMPARTMENTS.map((id) => {
        const assigned = schedules.filter((s) => s.compartmentId === id);
        const report = state.compartments?.[id];
        const device = report?.deviceId && state.devices?.[report.deviceId];
        const live =
          report?.reportedAt &&
          Date.now() - report.reportedAt < appConfig.heartbeatTimeoutMs &&
          deviceStatus(device) === "ONLINE";
        const medicineName = assigned.length
          ? state.catalog?.medicines?.[assigned[0].medicineId]?.name ||
            assigned[0].medicineName
          : null;
        return (
          <Panel key={id} className="compartment-card">
            <div className="compartment-card-top">
              <span
                className={`compartment-slot ${assigned.length ? "filled" : ""}`}
                aria-hidden="true"
              >
                <Pill size={18} />
              </span>
              <Badge status={assigned.length ? "ASSIGNED" : "AVAILABLE"} />
            </div>
            <div className="compartment-id-row">
              <span className="compartment-number">{id}</span>
            </div>
            <p className="compartment-medicine">
              {medicineName || "No medicine assigned"}
            </p>
            <div className="compartment-times">
              {assigned.length ? (
                assigned.map((s) => (
                  <span key={s.id}>
                    <Clock3 size={14} />
                    {clockTime(s.scheduledTime)}
                    {s.active ? "" : " · inactive"}
                  </span>
                ))
              ) : (
                <span>Add a schedule to assign</span>
              )}
            </div>
            <div className="hardware-state">
              <Cpu size={16} />
              Hardware: {live ? report.status : "Unknown / offline"}
            </div>
          </Panel>
        );
      })}
    </div>
  );
}
export function Stock({ state, edit }) {
  const medicines = entries(state.catalog?.medicines);
  return (
    <>
      <div className="info-line">
        <Package size={18} />
        Stock is updated manually. Opening a compartment never reduces the stock
        count.
      </div>
      <Panel>
        {medicines.length ? (
          <Table
            headers={[
              "Medicine",
              "Current stock",
              "Minimum stock",
              "Status",
              "Last updated",
              "",
            ]}
          >
            {medicines.map((m) => (
              <tr key={m.id}>
                <td>
                  <MedicineCell name={m.name} />
                </td>
                <td>
                  <strong>{m.currentStock}</strong> units
                  <div className="stock-track">
                    <span
                      style={{
                        width: `${Math.min(100, (m.currentStock / Math.max(m.minimumStock * 3, 1)) * 100)}%`,
                        background:
                          stockStatus(m) === "NORMAL"
                            ? "var(--teal)"
                            : "var(--amber)",
                      }}
                    />
                  </div>
                </td>
                <td>{m.minimumStock} units</td>
                <td>
                  <Badge status={stockStatus(m)} />
                </td>
                <td>{dateTime(m.updatedAt)}</td>
                <td>
                  <button
                    className="btn secondary small-btn"
                    onClick={() => edit({ kind: "stock", id: m.id })}
                  >
                    Update stock
                  </button>
                </td>
              </tr>
            ))}
          </Table>
        ) : (
          <Empty title="No stock to manage">Add your medicines first.</Empty>
        )}
      </Panel>
    </>
  );
}
