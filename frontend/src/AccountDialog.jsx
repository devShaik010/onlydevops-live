import { useEffect, useRef, useState } from "react";
import { X, Cloud, ArrowRight } from "lucide-react";

export default function AccountDialog({
  onClose,
  onAuthenticated,
  hasProgress,
  hasPractice = false,
}) {
  const dialog = useRef(null);
  const [mode, setMode] = useState("register");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    dialog.current.showModal();
  }, []);
  async function submit(event) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(
          typeof result.detail === "string"
            ? result.detail
            : "Check your username and password requirements.",
        );
      await onAuthenticated();
    } catch (err) {
      setError(
        err instanceof TypeError
          ? "Couldn’t connect. Please try again."
          : err.message,
      );
      setBusy(false);
    }
  }
  return (
    <dialog
      ref={dialog}
      className="account-dialog"
      aria-labelledby="account-title"
      onCancel={(e) => {
        e.preventDefault();
        if (!busy) onClose();
      }}
    >
      <button
        className="dialog-close"
        onClick={onClose}
        disabled={busy}
        aria-label="Close account dialog"
      >
        <X size={20} />
      </button>
      <div className="account-icon">
        <Cloud size={25} />
      </div>
      <div className="eyebrow blue">YOUR PROGRESS, EVERYWHERE</div>
      <h2 id="account-title">
        {mode === "register" ? "Make your progress yours." : "Welcome back."}
      </h2>
      <p>
        {mode === "register"
          ? "Create an account to keep your checklist across devices."
          : "Sign in to pick up where you left off."}
      </p>
      <form onSubmit={submit}>
        <label htmlFor="account-username">Username</label>
        <input
          id="account-username"
          autoFocus
          autoComplete="username"
          autoCapitalize="none"
          spellCheck="false"
          required
          minLength={3}
          maxLength={32}
          pattern="[A-Za-z0-9_]{3,32}"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          disabled={busy}
          aria-describedby="username-hint"
        />
        <small id="username-hint">3–32 letters, numbers, or underscores.</small>
        <label htmlFor="account-password">Password</label>
        <input
          id="account-password"
          type="password"
          autoComplete={
            mode === "register" ? "new-password" : "current-password"
          }
          required
          minLength={12}
          maxLength={128}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={busy}
          aria-describedby="password-hint"
        />
        <small id="password-hint">
          At least 12 characters.
          {mode === "register"
            ? " Save it in your password manager; password reset isn’t available yet."
            : ""}
        </small>
        {hasProgress && (
          <div className="merge-note">
            {hasPractice
              ? "Your guest practice results will be added to your account."
              : "Your completed guest items will be added to your account."}
          </div>
        )}
        {error && (
          <div className="error" role="alert">
            {error}
          </div>
        )}
        <button className="account-submit" disabled={busy}>
          {busy
            ? "Please wait…"
            : mode === "register"
              ? "Create account"
              : "Sign in"}
          {!busy && <ArrowRight size={16} />}
        </button>
      </form>
      <div className="account-switch">
        {mode === "register"
          ? "Already have an account?"
          : "New to OnlyDevOps?"}{" "}
        <button
          disabled={busy}
          onClick={() => {
            setMode(mode === "register" ? "login" : "register");
            setError("");
            setPassword("");
          }}
        >
          {mode === "register" ? "Sign in" : "Create account"}
        </button>
      </div>
    </dialog>
  );
}
