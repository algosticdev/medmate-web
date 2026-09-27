import {
  CalendarClock,
  MapPinCheck,
  PackageSearch,
  ClipboardList,
  Users,
  ShieldCheck,
  ArrowRight,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";

function BrandMark({ size = 34 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <defs>
        <clipPath id="lp-fav-left">
          <rect x="2" y="12" width="16" height="16" />
        </clipPath>
      </defs>
      <g transform="rotate(-45 18 20)">
        <rect
          x="2"
          y="12"
          width="32"
          height="16"
          rx="8"
          fill="#22b58a"
          stroke="rgba(255,255,255,0.25)"
          strokeWidth="0.75"
        />
        <rect
          x="2"
          y="12"
          width="32"
          height="16"
          rx="8"
          clipPath="url(#lp-fav-left)"
          fill="#0d6a4f"
          stroke="rgba(255,255,255,0.25)"
          strokeWidth="0.75"
        />
        <rect x="17" y="12" width="2" height="16" fill="rgba(255,255,255,0.35)" />
      </g>
      <circle cx="28" cy="28" r="9" fill="#fff" stroke="#0d6a4f" strokeWidth="1.6" />
      <path d="M28 24v8M24 28h8" stroke="#0d6a4f" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}

const FEATURES = [
  {
    icon: CalendarClock,
    title: "Scheduled reminders",
    body: "Every dose is scheduled once and reminded automatically — no more relying on memory or handwritten notes.",
  },
  {
    icon: MapPinCheck,
    title: "Correct compartment guidance",
    body: "The organizer identifies and guides the caregiver or patient to the exact compartment for that dose, every time.",
  },
  {
    icon: ClipboardList,
    title: "Compartment access tracking",
    body: "Every time a compartment is opened, MedMate records it — building an accurate, tamper-evident activity log.",
  },
  {
    icon: PackageSearch,
    title: "Stock monitoring",
    body: "Keep track of how much medicine is left in each compartment, and get ahead of refills before they run out.",
  },
  {
    icon: ShieldCheck,
    title: "Event history",
    body: "On-time, late, missed and wrong-compartment attempts are all recorded, giving a clear picture of adherence over time.",
  },
  {
    icon: Users,
    title: "Caregiver visibility",
    body: "Caregivers can check in on schedules, stock and recent activity remotely, without being in the same room.",
  },
];

const STEPS = [
  {
    n: "01",
    title: "Set up the schedule",
    body: "Add each medicine and assign its dose times to a labelled compartment in the MedMate app.",
  },
  {
    n: "02",
    title: "The organizer reminds & guides",
    body: "At the scheduled time, the physical device reminds the patient and identifies the correct compartment to open.",
  },
  {
    n: "03",
    title: "Every access is recorded",
    body: "MedMate logs the event — on-time, late, missed or wrong-compartment — and updates stock and alerts automatically.",
  },
];

function OrganizerVisual() {
  const cells = Array.from({ length: 14 });
  return (
    <div className="organizer-stage" aria-hidden="true">
      <div className="organizer-glow" />
      <div className="organizer-float">
        <div className="organizer-3d">
          <div className="box-body" />
          <div className="box-lid">
            <div className="cube-lid-grid">
              {cells.map((_, i) => (
                <div
                  key={i}
                  className={`cube-cell ${[2, 5, 9].includes(i) ? "filled" : ""} ${
                    i === 5 ? "active" : ""
                  }`}
                />
              ))}
            </div>
          </div>
          <div className="box-emblem">
            <BrandMark size={30} />
          </div>
          <span className="box-led" />
        </div>
      </div>
      <div className="hero-chip chip-reminder">
        <span className="hero-chip-dot" />
        Reminder sent · Tue&nbsp;·&nbsp;08:00 AM
      </div>
      <div className="hero-chip chip-stock">
        <PackageSearch size={14} />
        Stock healthy · 12 doses left
      </div>
    </div>
  );
}

export default function Landing() {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <>
      <header className="lp-nav">
        <a className="lp-brand" href="#top">
          <BrandMark size={30} />
          MedMate<span className="lp-brand-dot">.</span>
        </a>
        <nav className={`lp-nav-links ${menuOpen ? "open" : ""}`} aria-label="Primary">
          <a href="#features" onClick={() => setMenuOpen(false)}>
            Features
          </a>
          <a href="#how-it-works" onClick={() => setMenuOpen(false)}>
            How it works
          </a>
          <a href="/index.html" className="lp-nav-cta">
            Sign in
            <ArrowRight size={15} />
          </a>
        </nav>
        <button
          className="lp-nav-toggle"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          onClick={() => setMenuOpen((v) => !v)}
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </header>

      <main id="top">
        <section className="lp-hero">
          <div className="lp-hero-copy">
            <span className="lp-eyebrow">Smart IoT Medicine Organizer</span>
            <h1>
              Never miss a dose.
              <br />
              Never guess a compartment.
            </h1>
            <p>
              MedMate connects a physical multi-compartment medicine box with a
              digital platform — scheduling reminders, identifying the correct
              compartment, tracking every access, monitoring stock, and
              recording on-time, late, missed and wrong-compartment events.
            </p>
            <div className="lp-hero-actions">
              <a className="btn primary" href="/index.html">
                Get started <ArrowRight size={17} />
              </a>
              <a className="btn secondary" href="#features">
                See how it works
              </a>
            </div>
          </div>
          <OrganizerVisual />
        </section>

        <section id="features" className="lp-features">
          <div className="lp-section-head">
            <span className="lp-eyebrow">Features</span>
            <h2>Everything a medicine routine needs</h2>
            <p>
              From the first schedule to every compartment opened, MedMate
              keeps the routine accurate and visible.
            </p>
          </div>
          <div className="lp-feature-grid">
            {FEATURES.map(({ icon: Icon, title, body }) => (
              <article className="lp-feature-card" key={title}>
                <span className="lp-feature-icon">
                  <Icon size={20} />
                </span>
                <h3>{title}</h3>
                <p>{body}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="how-it-works" className="lp-steps">
          <div className="lp-section-head">
            <span className="lp-eyebrow">How it works</span>
            <h2>From schedule to record, in three steps</h2>
          </div>
          <div className="lp-steps-grid">
            {STEPS.map((s) => (
              <div className="lp-step" key={s.n}>
                <span className="lp-step-n">{s.n}</span>
                <h3>{s.title}</h3>
                <p>{s.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="lp-cta">
          <div className="lp-cta-card">
            <div>
              <h2>Set up your MedMate organizer</h2>
              <p>
                Sign in to schedule medicines, assign compartments and start
                tracking activity.
              </p>
            </div>
            <a className="btn primary" href="/index.html">
              Sign in <ArrowRight size={17} />
            </a>
          </div>
        </section>
      </main>

      <footer className="lp-footer">
        <a className="lp-brand" href="#top">
          <BrandMark size={24} />
          MedMate<span className="lp-brand-dot">.</span>
        </a>
        <span>MedMate · Smart IoT Medicine Organizer</span>
      </footer>
    </>
  );
}
