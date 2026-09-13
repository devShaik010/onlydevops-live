import { useEffect, useRef, useState } from "react";
import { ChevronDown, LogOut, Mail, Save, UserRound, X } from "lucide-react";
import Avatar from "./Avatar";

function ProfileDialog({ user, onClose, onUpdated }) {
  const dialog = useRef(null);
  const [displayName, setDisplayName] = useState(user.display_name || "");
  const [email, setEmail] = useState(user.email || "");
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
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ display_name: displayName, email }),
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.detail || "Your profile couldn’t be saved.");
      onUpdated(result.user);
      onClose();
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
      className="account-dialog profile-dialog"
      aria-labelledby="profile-title"
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) onClose();
      }}
    >
      <button
        className="dialog-close"
        onClick={onClose}
        disabled={busy}
        aria-label="Close profile settings"
      >
        <X size={20} />
      </button>
      <div className="profile-dialog-heading">
        <Avatar seed={user.username} size={68} />
        <div>
          <div className="eyebrow blue">YOUR PROFILE</div>
          <h2 id="profile-title">Profile settings</h2>
          <p>@{user.username}</p>
        </div>
      </div>
      <form onSubmit={submit}>
        <label htmlFor="profile-display-name">Display name</label>
        <div className="profile-input">
          <UserRound size={17} aria-hidden="true" />
          <input
            id="profile-display-name"
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            minLength={2}
            maxLength={50}
            placeholder={user.username}
            autoComplete="name"
          />
        </div>
        <small>Shown beside your avatar. Your username stays unchanged.</small>
        <label htmlFor="profile-email">Email</label>
        <div className="profile-input">
          <Mail size={17} aria-hidden="true" />
          <input
            id="profile-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            maxLength={254}
            placeholder="you@example.com"
            autoComplete="email"
          />
        </div>
        <small>Optional. It is not used to sign in yet.</small>
        {error && (
          <p className="dialog-error" role="alert">
            {error}
          </p>
        )}
        <button className="dialog-submit" disabled={busy}>
          <Save size={16} aria-hidden="true" />
          {busy ? "Saving…" : "Save changes"}
        </button>
      </form>
    </dialog>
  );
}

export default function ProfileMenu({ user, disabled, onLogout, onUpdated }) {
  const wrapper = useRef(null);
  const trigger = useRef(null);
  const [open, setOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const name = user.display_name || user.username;

  useEffect(() => {
    if (!open) return;
    const close = (event) => {
      if (event.key === "Escape" || !wrapper.current?.contains(event.target))
        setOpen(false);
    };
    window.addEventListener("keydown", close);
    window.addEventListener("pointerdown", close);
    return () => {
      window.removeEventListener("keydown", close);
      window.removeEventListener("pointerdown", close);
    };
  }, [open]);

  return (
    <>
      <div className="profile-menu" ref={wrapper}>
        <button
          ref={trigger}
          className="profile-trigger"
          aria-label="Open profile menu"
          aria-haspopup="menu"
          aria-expanded={open}
          disabled={disabled}
          onClick={() => setOpen((value) => !value)}
        >
          <Avatar seed={user.username} />
          <span>{name}</span>
          <ChevronDown size={15} aria-hidden="true" />
        </button>
        {open && (
          <div className="profile-dropdown" role="menu">
            <div className="profile-dropdown-identity">
              <strong>{name}</strong>
              <span>@{user.username}</span>
            </div>
            <button
              role="menuitem"
              onClick={() => {
                setOpen(false);
                setProfileOpen(true);
              }}
            >
              <UserRound size={17} aria-hidden="true" />
              Profile
            </button>
            <button
              role="menuitem"
              className="profile-logout"
              onClick={() => {
                setOpen(false);
                onLogout();
              }}
            >
              <LogOut size={17} aria-hidden="true" />
              Log out
            </button>
          </div>
        )}
      </div>
      {profileOpen && (
        <ProfileDialog
          user={user}
          onClose={() => {
            setProfileOpen(false);
            window.setTimeout(() => trigger.current?.focus(), 0);
          }}
          onUpdated={onUpdated}
        />
      )}
    </>
  );
}
