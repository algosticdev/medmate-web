import { Package, TriangleAlert } from "lucide-react";
import { getAlerts } from "../services/alert-service.js";
import { dateTime, label, compartmentName } from "../services/domain.js";
import { Empty } from "./ui.jsx";
export default function AlertsList({
  state,
  limit,
  unreadOnly = false,
  onRead,
}) {
  const alerts = getAlerts(state).filter((a) => !unreadOnly || !a.read);
  if (!alerts.length)
    return <Empty title="No alerts available." />;
  return (
    <div className="alert-list">
      {alerts.slice(0, limit || alerts.length).map((a) => {
        const Icon = a.source === "stock" ? Package : TriangleAlert;
        return (
          <article key={a.id} className={`alert-item ${a.read ? "read" : ""}`}>
            <span
              className={`alert-symbol ${["MISSED", "WRONG_COMPARTMENT"].includes(a.alertType) ? "red" : "amber"}`}
            >
              <Icon size={19} />
            </span>
            <div className="alert-copy">
              <strong>{label(a.alertType)}</strong>
              <p>
                {state.catalog?.medicines?.[a.medicineId]?.name ||
                  a.medicineName ||
                  "Device"}
                {a.compartmentId ? ` · ${compartmentName(a.compartmentId)}` : ""}
              </p>
              <small>{dateTime(a.timestamp)}</small>
            </div>
            {a.read ? (
              <span className="muted small">Read</span>
            ) : onRead ? (
              <button
                className="btn secondary small-btn"
                onClick={() => onRead(a.id)}
              >
                Mark read
              </button>
            ) : (
              <span className="unread-dot" aria-label="Unread" />
            )}
          </article>
        );
      })}
    </div>
  );
}
