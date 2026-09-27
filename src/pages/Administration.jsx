import { useMemo, useState } from "react";
import { Check, MessageSquareText, Users } from "lucide-react";
import { Empty, Field, Panel, Table } from "../components/ui.jsx";
import { markFeedbackReviewed, submitFeedback } from "../services/feedback-service.js";
import { userMessage } from "../services/errors.js";

const entries = (value) =>
  Object.entries(value || {}).map(([id, record]) => ({ id, ...record }));
const dateTime = (value) =>
  value
    ? new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" }).format(value)
    : "Unknown";

export function Feedback({ state, user, notify }) {
  const [busy, setBusy] = useState(false);
  const feedback = useMemo(
    () => entries(state.feedback).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)),
    [state.feedback],
  );
  if (user.role === "admin") {
    return (
      <Panel title="Customer feedback" subtitle="Review feedback submitted by registered MedMate users.">
        {feedback.length ? (
          <Table headers={["User", "Feedback", "Received", "Status", "Action"]}>
            {feedback.map((item) => (
              <tr key={item.id}>
                <td><strong>{item.name}</strong><small>{item.email}</small></td>
                <td className="feedback-copy"><strong>{item.subject}</strong><small>{item.message}</small></td>
                <td>{dateTime(item.createdAt)}</td>
                <td><span className={`badge badge-${item.status.toLowerCase()}`}>{item.status === "NEW" ? "New" : "Reviewed"}</span></td>
                <td>
                  {item.status === "NEW" ? (
                    <button className="btn secondary small-btn" disabled={busy} onClick={async () => {
                      setBusy(true);
                      try {
                        await markFeedbackReviewed(item.id);
                        notify("Feedback marked as reviewed.");
                      } catch (error) { notify(userMessage(error), true); }
                      finally { setBusy(false); }
                    }}><Check size={15} /> Mark reviewed</button>
                  ) : "—"}
                </td>
              </tr>
            ))}
          </Table>
        ) : <Empty title="No feedback received yet">Submitted feedback will appear here.</Empty>}
      </Panel>
    );
  }
  return (
    <div className="settings-grid">
      <Panel title="Send feedback" subtitle="Share your experience with the MedMate administrator.">
        <form className="settings-form" onSubmit={async (event) => {
          event.preventDefault();
          const form = event.currentTarget;
          const data = new FormData(form);
          setBusy(true);
          try {
            await submitFeedback({ subject: data.get("subject"), message: data.get("message") }, user);
            form.reset();
            notify("Your feedback has been submitted.");
          } catch (error) { notify(userMessage(error), true); }
          finally { setBusy(false); }
        }}>
          <fieldset disabled={busy}>
            <Field label="Subject"><input name="subject" maxLength={120} required /></Field>
            <Field label="Feedback"><textarea name="message" rows="7" maxLength={2000} required /></Field>
            <button className="btn primary" type="submit"><MessageSquareText size={16} />{busy ? "Submitting…" : "Submit feedback"}</button>
          </fieldset>
        </form>
      </Panel>
      <aside className="panel settings-note"><MessageSquareText size={28} /><h2>We value your feedback.</h2><p>Your comments are sent securely to the MedMate administrator for review.</p></aside>
    </div>
  );
}

export function UserManagement({ state, user, notify }) {
  if (user.role !== "admin") return null;
  const users = entries(state.adminUsers).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  return (
    <Panel title="Registered users" subtitle={`${users.length} account${users.length === 1 ? "" : "s"}`} action={<Users size={19} className="muted" />}>
        {users.length ? <Table headers={["Name", "Email", "Role", "Created"]}>{users.map((item) => <tr key={item.id}><td><strong>{item.name}</strong></td><td>{item.email}</td><td><span className="badge">{item.role}</span></td><td>{dateTime(item.createdAt)}</td></tr>)}</Table> : <Empty title="No users found">Registered user accounts will appear here.</Empty>}
    </Panel>
  );
}
