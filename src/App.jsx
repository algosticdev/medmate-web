import { useEffect, useRef, useState } from "react";
import {
  LayoutDashboard,
  Pill,
  CalendarDays,
  PanelsTopLeft,
  Package,
  Activity,
  Bell,
  ChartNoAxesCombined,
  UserRound,
  Cpu,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Plus,
  Calendar,
  WifiOff,
  MessageSquareText,
  Users,
} from "lucide-react";
import { Brand, Loading } from "./components/ui.jsx";
import Editor from "./components/Editor.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Login from "./pages/Login.jsx";
import { Medicines, Schedules, Compartments, Stock } from "./pages/Catalog.jsx";
import { Events, Alerts, Summary } from "./pages/Records.jsx";
import { Caregiver, Device } from "./pages/Settings.jsx";
import { Feedback, UserManagement } from "./pages/Administration.jsx";
import { watchAuth, logout } from "./services/auth-service.js";
import { isConfigured, appConfig } from "./services/firebase-config.js";
import { setContext, watchData } from "./services/store.js";
import { getAlerts } from "./services/alert-service.js";
import { userMessage } from "./services/errors.js";
const routes = {
  dashboard: [
    "Dashboard",
    LayoutDashboard,
    "Overview",
    "A clear view of your day, all in one place.",
  ],
  medicines: [
    "Medicines",
    Pill,
    "Medicines",
    "Your medicine list, organized and up to date.",
  ],
  schedules: [
    "Schedules",
    CalendarDays,
    "Schedules",
    "Plan reminders around the prescribed medicine schedule.",
  ],
  compartments: [
    "Compartments",
    PanelsTopLeft,
    "Compartments",
    "Fourteen named compartments, organized by day and side.",
  ],
  stock: [
    "Stock Management",
    Package,
    "Stock management",
    "Keep track of what’s available and what needs a refill.",
  ],
  events: [
    "Event History",
    Activity,
    "Event history",
    "A reliable record of reported compartment activity.",
  ],
  alerts: ["Alerts", Bell, "Alerts", "The updates that need your attention."],
  summary: [
    "Daily Summary",
    ChartNoAxesCombined,
    "Daily summary",
    "Look back at the day’s compartment-access records.",
  ],
  caregiver: [
    "Caregiver Settings",
    UserRound,
    "Caregiver settings",
    "Your contact details and notification preferences.",
  ],
  feedback: [
    "Feedback",
    MessageSquareText,
    "Feedback",
    "Share feedback or review messages from MedMate users.",
  ],
  users: [
    "User Management",
    Users,
    "User management",
    "Review registered MedMate accounts.",
  ],
  device: [
    "Device Status",
    Cpu,
    "Device status",
    "Connection, synchronization, and hardware reports.",
  ],
};
const routeFromHash = () =>
  Object.hasOwn(routes, location.hash.slice(1)) ? location.hash.slice(1) : "dashboard";
export default function App() {
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(!isConfigured());
  const [authError, setAuthError] = useState("");
  const [dataError, setDataError] = useState("");
  const [state, setState] = useState(null);
  const [connected, setConnected] = useState(false);
  const connectedRef = useRef(false);
  const [route, setRoute] = useState(routeFromHash);
  const [sidebar, setSidebar] = useState(false);
  const [mobile, setMobile] = useState(
    () => window.matchMedia("(max-width: 800px)").matches,
  );
  const sidebarRef = useRef(null);
  const [editor, setEditor] = useState(null);
  const [toast, setToast] = useState(null);
  const [tick, setTick] = useState(0);
  const seenAlerts = useRef(null);
  const notify = (message, error = false) => setToast({ message, error });
  useEffect(() => {
    const query = window.matchMedia("(max-width: 800px)");
    const update = () => {
      setMobile(query.matches);
      if (!query.matches) setSidebar(false);
    };
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  useEffect(() => {
    if (!sidebar || !mobile) return;
    const previous = document.activeElement;
    const links = sidebarRef.current.querySelectorAll("a,button");
    links[0]?.focus();
    const keyboard = (event) => {
      if (event.key === "Escape") setSidebar(false);
      if (event.key === "Tab" && event.shiftKey && document.activeElement === links[0]) {
        event.preventDefault();
        links[links.length - 1]?.focus();
      } else if (
        event.key === "Tab" &&
        !event.shiftKey &&
        document.activeElement === links[links.length - 1]
      ) {
        event.preventDefault();
        links[0]?.focus();
      }
    };
    document.addEventListener("keydown", keyboard);
    return () => {
      document.removeEventListener("keydown", keyboard);
      previous?.focus();
    };
  }, [sidebar, mobile]);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 6000);
    return () => clearTimeout(timer);
  }, [toast]);
  useEffect(() => {
    const listener = () => {
      setRoute(routeFromHash());
      setSidebar(false);
      setEditor(null);
      window.scrollTo(0, 0);
    };
    window.addEventListener("hashchange", listener);
    const interval = setInterval(() => setTick((v) => v + 1), 30000);
    return () => {
      window.removeEventListener("hashchange", listener);
      clearInterval(interval);
    };
  }, []);
  useEffect(() => {
    document.title = user ? `${routes[route][0]} · MedMate` : "Sign in · MedMate";
  }, [route, user]);
  useEffect(() => {
    let disposed = false;
    let stop = () => {};
    if (!isConfigured()) return;
    watchAuth((next, error) => {
      if (disposed) return;
      setUser(next);
      setAuthReady(true);
      setAuthError(error ? userMessage(error) : "");
      if (!next) {
        setState(null);
        setEditor(null);
      }
    })
      .then((unsubscribe) => {
        if (disposed) unsubscribe();
        else stop = unsubscribe;
      })
      .catch((err) => {
        if (!disposed) {
          setAuthReady(true);
          setAuthError(userMessage(err));
        }
      });
    return () => {
      disposed = true;
      stop();
    };

  }, []);
  useEffect(() => {
    if (!user) return;
    let disposed = false;
    let stop = () => {};
    setState(null);
    seenAlerts.current = null;
    setDataError("");
    async function connect() {
      if (disposed) return;
      setContext({
        uid: user.uid,
        role: user.role,
        connected: () => connectedRef.current,
      });
      const unsubscribe = await watchData(
        (data) => {
          if (!disposed) setState(data);
        },
        (err) => {
          if (!disposed) setDataError(userMessage(err));
        },
        (value) => {
          connectedRef.current = value;
          if (!disposed) setConnected(value);
        },
      );
      if (disposed) unsubscribe();
      else stop = unsubscribe;
    }
    connect().catch((err) => {
      if (!disposed) setDataError(userMessage(err));
    });
    return () => {
      disposed = true;
      stop();
      connectedRef.current = false;
    };
  }, [user?.uid, user?.role]);
  useEffect(() => {
    if (
      user &&
      (user.role === "admin"
        ? !["users", "feedback", "device"].includes(route)
        : route === "users")
    ) location.hash = user.role === "admin" ? "users" : "dashboard";
  }, [route, user]);
  useEffect(() => {
    if (!state) return;
    const alerts = getAlerts(state);
    const currentIds = new Set(alerts.map((alert) => alert.id));
    const firstSnapshot = seenAlerts.current === null;
    const newlyReported = firstSnapshot
      ? alerts.filter((alert) => alert.source === "stock")
      : alerts.filter((alert) => !seenAlerts.current.has(alert.id));
    if (newlyReported.length && state.caregiver?.notificationsEnabled !== false) {
      const alert = newlyReported[0];
      const medicine = state.catalog?.medicines?.[alert.medicineId];
      const name = alert.medicineName || medicine?.name;
      const stockMessage = alert.source === "stock"
        ? `${alert.alertType === "REFILL_REQUIRED" ? "Refill required" : "Low stock"}${name ? ` · ${name}` : ""}${Number.isFinite(medicine?.currentStock) ? ` — ${medicine.currentStock} units remaining` : ""}`
        : `${alert.alertType.replaceAll("_", " ")}${name ? ` · ${name}` : ""}`;
      const message = newlyReported.length > 1
        ? `${newlyReported.length} stock or safety alerts need your attention.`
        : stockMessage;
      notify(message);
      if ("Notification" in window && Notification.permission === "granted") {
        const notice = new Notification("MedMate alert", {
          body: message,
          icon: "/favicon.svg",
        });
        notice.onclick = () => {
          window.focus();
          location.hash = "alerts";
          notice.close();
        };
      }
    }
    seenAlerts.current = currentIds;
  }, [state]);
  if (!authReady) return <Loading />;
  if (!user) return <Login authError={authError} />;
  if (!state && !dataError) return <Loading />;
  const data = state || {};
  const unread = getAlerts(data).filter((a) => !a.read).length;
  const profileName = data.caregiver?.name || user.name || "Caregiver";
  const initials = profileName
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const shared = { state: data, edit: setEditor, notify, user };
  const content = {
    dashboard: <Dashboard {...shared} />,
    medicines: <Medicines {...shared} />,
    schedules: <Schedules {...shared} />,
    compartments: <Compartments {...shared} />,
    stock: <Stock {...shared} />,
    events: <Events {...shared} />,
    alerts: <Alerts {...shared} />,
    summary: <Summary {...shared} />,
    caregiver: <Caregiver {...shared} />,
    feedback: <Feedback {...shared} />,
    users: <UserManagement {...shared} />,
    device: <Device {...shared} />,
  }[route];
  return (
    <div className="app-layout" data-clock={tick}>
      <a
        className="skip-link"
        href="#main-content"
        onClick={(event) => {
          event.preventDefault();
          document.getElementById("main-content")?.focus();
        }}
      >
        Skip to content
      </a>
      {sidebar && (
        <button
          className="sidebar-backdrop"
          aria-label="Close menu"
          onClick={() => setSidebar(false)}
        />
      )}
      <aside
        ref={sidebarRef}
        className={`sidebar ${sidebar ? "open" : ""}`}
        inert={mobile && !sidebar ? true : undefined}
        onClick={(event) => {
          if (event.target.closest("a")) setSidebar(false);
        }}
      >
        <div className="sidebar-brand">
          <Brand />
          <button
            className="icon-button mobile-close"
            onClick={() => setSidebar(false)}
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>
        <span className="workspace-label">
          {user.role === "admin" ? "ADMIN WORKSPACE" : "CAREGIVER WORKSPACE"}
        </span>
        <nav aria-label="Main navigation">
          <span className="nav-caption">WORKSPACE</span>
          {Object.entries(routes)
            .filter(
              ([key]) =>
                user.role === "admin"
                  ? ["users", "feedback", "device"].includes(key)
                  : key !== "users",
            )
            .map(([key, [name, Icon]], i) => (
            <div key={key}>
              {i === 8 && <span className="nav-caption system-caption">SYSTEM</span>}
              <a
                href={`#${key}`}
                className={`nav-item ${route === key ? "selected" : ""}`}
                aria-current={route === key ? "page" : undefined}
              >
                <Icon size={19} />
                <span>{key === "feedback" && user.role === "admin" ? "Feedback Review" : key === "feedback" ? "Send Feedback" : name}</span>
                {key === "alerts" && unread > 0 && (
                  <span className="nav-count">{unread}</span>
                )}
                {route === key && key !== "alerts" && (
                  <ChevronRight className="nav-chevron" size={15} />
                )}
              </a>
            </div>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-device">
            <span className="device-mini-icon">
              <Cpu size={20} />
            </span>
            <div>
              <strong>MedMate organizer</strong>
              <span>
                {connected ? "Cloud connected" : "Cloud disconnected"}
              </span>
            </div>
          </div>
          <button
            className="nav-item logout"
            onClick={() => logout().catch((err) => notify(userMessage(err), true))}
          >
            <LogOut size={19} />
          <span>Log out</span>
          </button>
          <span className="sidebar-version">
            MedMate v1.0 <span>CARE, CONNECTED.</span>
          </span>
        </div>
      </aside>
      <div className="main-shell" inert={mobile && sidebar ? true : undefined}>
        <header className="topbar">
          <div className="flex items-center gap-3">
            <button
              className="icon-button mobile-menu"
              onClick={() => setSidebar(true)}
              aria-label="Open navigation"
              aria-expanded={sidebar}
            >
              <Menu size={22} />
            </button>
            <span className="topbar-app-name">MedMate</span>
            <span className="breadcrumb-root">Workspace</span>
            <ChevronRight size={14} className="muted" />
            <strong>{routes[route][0]}</strong>
          </div>
          <div className="topbar-right">
            <span className={`cloud-status ${connected ? "" : "disconnected"}`}>
              <span />
              {connected ? "Cloud connected" : "Offline"}
            </span>
            <a
              className="notification-button"
              href="#alerts"
              aria-label={`${unread} unread alerts`}
            >
              <Bell size={21} />
              {unread > 0 && <span />}
            </a>
            <a
              href={user.role === "admin" ? "#users" : "#caregiver"}
              className="profile-link"
            >
              <span className="avatar">{initials}</span>
              <div>
                <strong>{profileName}</strong>
                <span>{user.role === "admin" ? "Administrator" : "Caregiver"}</span>
              </div>
            </a>
          </div>
        </header>
        {!connected && (
          <div className="offline-banner" role="status">
            <WifiOff size={16} />
            Cloud disconnected. Records may be stale; saving is disabled until
            reconnection.
          </div>
        )}
        <main id="main-content" className="main-content" tabIndex={-1}>
          <div className="page-heading">
            <div>
              <div className="page-eyebrow">
                {route === "dashboard" ? "YOUR DAILY CHECK-IN" : "MEDMATE WORKSPACE"}
              </div>
              <h1>
                {routes[route][2]}
                <span className="heading-dot">.</span>
              </h1>
              <p>{routes[route][3]}</p>
            </div>
            <div className="page-actions">
              {route === "dashboard" && (
                <span className="date-chip">
                  <Calendar size={16} />
                  {new Intl.DateTimeFormat("en-GB", {
                    timeZone: appConfig.timeZone,
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  }).format(Date.now())}
                </span>
              )}
              {["dashboard", "medicines", "schedules"].includes(route) && (
                <button
                  className="btn primary"
                  onClick={() =>
                    setEditor({
                      kind: route === "schedules" ? "schedule" : "medicine",
                    })
                  }
                  disabled={!connected}
                >
                  <Plus size={17} />
                  {route === "schedules" ? "Add schedule" : "Add medicine"}
                </button>
              )}
            </div>
          </div>
          {dataError ? (
            <div className="form-error" role="alert">
              <h2>Unable to load records</h2>
              <p>Unable to load records. Please try again later.</p>
              <button className="btn secondary" onClick={() => location.reload()}>
                Retry connection
              </button>
            </div>
          ) : (
            content
          )}
          <footer className="page-footer">
            <span>Thoughtfully organized. Better connected.</span>
            <span>MedMate · Smart Medicine Organizer</span>
          </footer>
        </main>
      </div>
      {editor && (
        <Editor
          editor={editor}
          state={data}
          onClose={() => setEditor(null)}
          notify={notify}
        />
      )}{" "}
      {toast && (
        <div
          className={`toast ${toast.error ? "error" : ""}`}
          role={toast.error ? "alert" : "status"}
        >
          {toast.message}
          <button aria-label="Dismiss message" onClick={() => setToast(null)}>
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
