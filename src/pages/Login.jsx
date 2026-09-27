import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { Brand, Field } from "../components/ui.jsx";
import { login, register, resetPassword } from "../services/auth-service.js";
import { userMessage } from "../services/errors.js";

export default function Login({ authError }) {
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [mode, setMode] = useState("signin");
  const [busy, setBusy] = useState(false);
  async function submit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const data = new FormData(form);
      if (mode === "signup") {
        if (data.get("password") !== data.get("confirmPassword"))
          throw new Error("PASSWORDS_DO_NOT_MATCH");
        await register(data.get("name"), data.get("email"), data.get("password"));
        setMode("signin");
        setMessage(
          "Account created. Verify your email, then sign in.",
        );
        form.reset();
        setEmail(data.get("email"));
      } else {
        await login(data.get("email"), data.get("password"));
      }
    } catch (error) {
      setError(
        error.message === "PASSWORDS_DO_NOT_MATCH"
          ? "Passwords do not match."
          : userMessage(error),
      );
    } finally {
      setBusy(false);
    }
  }
  async function forgotPassword() {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await resetPassword(email);
      setMessage(
        "If this email has an account, a password reset link has been sent.",
      );
    } catch (error) {
      setError(userMessage(error));
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="sign-in-page">
      <section className="sign-in-card" aria-labelledby="welcome-title">
        <Brand />
        <div className="auth-tabs" aria-label="Account access">
          <button
            type="button"
            className={mode === "signin" ? "selected" : ""}
            onClick={() => {
              setMode("signin");
              setError("");
              setMessage("");
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            className={mode === "signup" ? "selected" : ""}
            onClick={() => {
              setMode("signup");
              setError("");
              setMessage("");
            }}
          >
            Create Account
          </button>
        </div>
        <h1 id="welcome-title">
          {mode === "signin" ? "Welcome back." : "Create your account."}
        </h1>
        <p className="sign-in-subtitle">
          {mode === "signin"
            ? "Sign in to your MedMate workspace."
            : "Register your MedMate caregiver workspace."}
        </p>
        <form onSubmit={submit}>
          {mode === "signup" && (
            <Field label="Full name">
              <input
                name="name"
                type="text"
                autoComplete="name"
                maxLength={100}
                required
                disabled={busy}
              />
            </Field>
          )}
          <Field label="Email">
            <input
              name="email"
              type="email"
              autoComplete="username"
              required
              disabled={busy}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </Field>
          <Field label="Password">
            <input
              name="password"
              type="password"
              minLength={mode === "signup" ? 8 : undefined}
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              required
              disabled={busy}
            />
          </Field>
          {mode === "signup" && (
            <Field label="Confirm password">
              <input
                name="confirmPassword"
                type="password"
                minLength={8}
                autoComplete="new-password"
                required
                disabled={busy}
              />
            </Field>
          )}
          {(error || (mode === "signin" && authError)) && (
            <p className="form-error" role="alert">
              {error || authError}
            </p>
          )}
          {message && <p className="form-success" role="status">{message}</p>}
          <button className="btn primary full" type="submit" disabled={busy}>
            {busy
              ? mode === "signup"
                ? "Creating account…"
                : "Signing in…"
              : <>{mode === "signup" ? "Create Account" : "Sign In"} <ArrowRight size={18} aria-hidden="true" /></>}
          </button>
          {mode === "signin" && (
            <button
              className="forgot-password"
              type="button"
              disabled={busy}
              onClick={forgotPassword}
            >
              Forgot Password?
            </button>
          )}
        </form>
      </section>
    </main>
  );
}
