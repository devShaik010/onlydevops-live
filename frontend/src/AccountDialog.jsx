import { useEffect, useRef, useState } from "react";
import { ArrowRight, Eye, EyeOff, X } from "lucide-react";
import Avatar from "./Avatar";
import { celebrate } from "./celebrate";

export default function AccountDialog({
  onClose,
  onAuthenticated,
  hasProgress,
  hasPractice = false,
  required = false,
}) {
  const dialog = useRef(null);
  const avatarSeed = useRef(`new-learner-${crypto.randomUUID()}`);
  const [mode, setMode] = useState("register");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
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
        body: JSON.stringify({
          username,
          password,
          accept_privacy: mode === "register" ? acceptedPrivacy : undefined,
        }),
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(
          typeof result.detail === "string"
            ? result.detail
            : "Check your username and password requirements.",
        );
      if (mode === "register") celebrate();
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

  function switchMode() {
    setMode(mode === "register" ? "login" : "register");
    setError("");
    setPassword("");
    setShowPassword(false);
  }

  return (
    <dialog
      ref={dialog}
      className={`account-dialog auth-dialog${required ? " auth-required" : ""}`}
      aria-labelledby="account-title"
      onCancel={(event) => {
        event.preventDefault();
        if (!required && !busy) onClose?.();
      }}
    >
      {!required && (
        <button
          className="dialog-close"
          onClick={onClose}
          disabled={busy}
          aria-label="Close account dialog"
        >
          <X size={20} />
        </button>
      )}
      <div className="auth-avatar">
        <Avatar
          seed={username.trim().toLowerCase() || avatarSeed.current}
          size={88}
        />
      </div>
      <div className="eyebrow blue">WELCOME TO ONLYDEVOPS</div>
      <h2 id="account-title">
        {mode === "register" ? "Create your account." : "Welcome back."}
      </h2>
      <p>
        {mode === "register"
          ? "Create one account to open your learning sheet and save progress."
          : "Sign in to continue your DevOps learning path."}
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
          onChange={(event) => setUsername(event.target.value)}
          disabled={busy}
          aria-describedby="username-hint"
          placeholder="Choose a username"
        />
        <small id="username-hint">3–32 letters, numbers, or underscores.</small>
        <label htmlFor="account-password">Password</label>
        <div className="password-field">
          <input
            id="account-password"
            type={showPassword ? "text" : "password"}
            autoComplete={
              mode === "register" ? "new-password" : "current-password"
            }
            required
            minLength={8}
            maxLength={128}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            disabled={busy}
            aria-describedby="password-hint"
            placeholder="At least 8 characters"
          />
          <button
            type="button"
            onClick={() => setShowPassword((visible) => !visible)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            aria-pressed={showPassword}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        <small id="password-hint">At least 8 characters.</small>
        {mode === "register" && (
          <label className="privacy-acceptance">
            <input
              type="checkbox"
              checked={acceptedPrivacy}
              onChange={(event) => setAcceptedPrivacy(event.target.checked)}
              required
            />
            <span>
              I agree to the{" "}
              <a href="/privacy.html" target="_blank" rel="noreferrer">
                Privacy Policy
              </a>
              .
            </span>
          </label>
        )}
        {hasProgress && (
          <div className="merge-note">
            {hasPractice
              ? "Your saved practice results will be added to this account."
              : "Your saved checklist items will be added to this account."}
          </div>
        )}
        {error && (
          <div className="error" role="alert">
            {error}
          </div>
        )}
        <button
          className="account-submit"
          disabled={busy || (mode === "register" && !acceptedPrivacy)}
        >
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
        <button disabled={busy} onClick={switchMode}>
          {mode === "register" ? "Sign in" : "Create account"}
        </button>
      </div>
    </dialog>
  );
}
