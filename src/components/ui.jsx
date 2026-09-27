import { useEffect, useRef } from "react";
import { ArrowRight, Pill, LayoutGrid, X, Activity } from "lucide-react";
import { label } from "../services/domain.js";
export function BrandMark({ size = 34 }) {
  return (
    <svg
      className="brand-mark"
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      aria-hidden="true"
    >
      <g transform="rotate(-45 20 20)">
        <rect x="6" y="14" width="28" height="12" rx="6" className="brand-mark-cap-dark" />
        <path d="M20 14h8a6 6 0 0 1 0 12h-8z" className="brand-mark-cap-light" />
      </g>
      <circle cx="27" cy="27" r="9" className="brand-mark-disc" />
      <path
        d="M27 23v8M23 27h8"
        className="brand-mark-cross"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
    </svg>
  );
}
export function Brand() {
  return (
    <a className="brand" href="#dashboard">
      <BrandMark />
      MedMate<span className="brand-dot">.</span>
    </a>
  );
}
export function Badge({ status }) {
  return (
    <span className={`badge badge-${String(status).toLowerCase()}`}>
      {label(status)}
    </span>
  );
}
export function Empty({
  title = "Nothing here yet",
  children = "New records will appear here automatically.",
}) {
  return (
    <div className="empty">
      <LayoutGrid size={30} />
      <h3>{title}</h3>
      <p>{children}</p>
    </div>
  );
}
export function Panel({ title, subtitle, action, children, className = "" }) {
  return (
    <section className={`panel ${className}`}>
      {title && (
        <div className="panel-heading">
          <div>
            <h2>{title}</h2>
            {subtitle && <p>{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}
export function Table({ headers, children }) {
  return (
    <div className="table-scroll" tabIndex="0">
      <table>
        <thead>
          <tr>
            {headers.map((h, i) => (
              <th key={i}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}
export function MedicineCell({ name, sub }) {
  return (
    <div className="medicine-cell">
      <span className="medicine-symbol">
        <Pill size={18} />
      </span>
      <div>
        <strong>{name}</strong>
        {sub && <small>{sub}</small>}
      </div>
    </div>
  );
}
export function LinkTo({ route, children = "View all" }) {
  return (
    <a className="text-link" href={`#${route}`}>
      {children}
      <ArrowRight size={15} />
    </a>
  );
}
export function RecordNote({ children }) {
  return (
    <p className="record-note">
      <Activity size={16} />
      {children ||
        "These are compartment-access records. Access does not confirm medicine consumption."}
    </p>
  );
}
export function Modal({ title, children, onClose, busy }) {
  const ref = useRef(null);
  useEffect(() => {
    const dialog = ref.current;
    const prior = document.activeElement;
    dialog.showModal();
    return () => {
      dialog.close();
      prior?.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) onClose();
      }}
      aria-labelledby="modal-title"
    >
      <div className="modal-heading">
        <h2 id="modal-title">{title}</h2>
        <button
          type="button"
          className="icon-button"
          onClick={onClose}
          disabled={busy}
          aria-label="Close dialog"
        >
          <X size={20} />
        </button>
      </div>
      {children}
    </dialog>
  );
}
export function Field({ label, children, hint }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
      {hint && <small>{hint}</small>}
    </label>
  );
}
export function Loading() {
  return (
    <div className="loading-state" role="status">
      <div className="spinner" />
      <h2>Opening your workspace</h2>
      <p>Connecting to your MedMate records…</p>
    </div>
  );
}
