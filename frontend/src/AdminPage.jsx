import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Infinity, LogOut, RefreshCw, ShieldCheck, Users } from "lucide-react";
import ThemeToggle from "./ThemeToggle";
import "./admin.css";

function Login({ onLogin }) {
  const [form, setForm] = useState({ username: "", password: "", authcode: "" });
  const [error, setError] = useState("");
  async function submit(event) {
    event.preventDefault();
    setError("");
    const response = await fetch("/api/admin/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    if (!response.ok) { setError("Those admin credentials did not match."); return; }
    onLogin();
  }
  return <main className="admin-shell admin-login"><div className="admin-topline"><span className="admin-brand"><Infinity size={20} /> onlydevops</span><ThemeToggle /></div><section className="admin-login-panel"><ShieldCheck size={28} /><p className="admin-kicker">Private workspace</p><h1>Admin dashboard</h1><p className="admin-muted">Sign in to review the launch signal.</p><form onSubmit={submit}><label>Username<input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} autoComplete="username" required /></label><label>Password<input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} autoComplete="current-password" required /></label><label>Auth code<input value={form.authcode} onChange={(e) => setForm({ ...form, authcode: e.target.value })} autoComplete="one-time-code" required /></label>{error && <p className="admin-error" role="alert">{error}</p>}<button className="admin-primary">Open dashboard <ArrowRight size={16} /></button></form></section></main>;
}

function Stat({ label, value, detail }) { return <article className="admin-stat"><p>{label}</p><strong>{value.toLocaleString()}</strong><span>{detail}</span></article>; }

export default function AdminPage() {
  const [authorized, setAuthorized] = useState(false);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");
  async function load() { const response = await fetch("/api/admin/stats"); if (response.status === 401) { setAuthorized(false); return; } if (!response.ok) { setError("Stats are temporarily unavailable."); return; } setStats(await response.json()); }
  useEffect(() => { if (authorized) load(); }, [authorized]);
  if (!authorized) return <Login onLogin={() => setAuthorized(true)} />;
  const max = useMemo(() => Math.max(1, ...(stats?.registrations || []).map((item) => item.count)), [stats]);
  return <main className="admin-shell"><header className="admin-header"><div><p className="admin-kicker">Private workspace</p><h1>Launch dashboard</h1><p className="admin-muted">A lightweight read on adoption before the scale-up track.</p></div><div className="admin-actions"><ThemeToggle /><button className="admin-icon-button" onClick={load} title="Refresh stats" aria-label="Refresh stats"><RefreshCw size={17} /></button><button className="admin-icon-button" onClick={async () => { await fetch("/api/admin/logout", { method: "POST" }); setAuthorized(false); setStats(null); }} title="Sign out" aria-label="Sign out"><LogOut size={17} /></button></div></header>{error && <p className="admin-error">{error}</p>}{stats && <><section className="admin-stats"><Stat label="Registered users" value={stats.registered} detail="Target: 200 users" /><Stat label="Active sessions" value={stats.activeSessions} detail="Unexpired accounts" /><Stat label="Checklist completions" value={stats.checklistCompletions} detail="Learning actions" /><Stat label="Practice attempts" value={stats.practiceAttempts} detail={`${stats.correctAttempts} correct`} /></section><section className="admin-chart"><div className="admin-section-heading"><div><p className="admin-kicker">Last 14 days</p><h2>Registration trend</h2></div><span className="admin-threshold"><Users size={15} /> {Math.max(0, 200 - stats.registered)} to launch</span></div><div className="bars" role="img" aria-label="Registrations by day">{stats.registrations.map((item) => <div className="bar-column" key={item.date}><span className="bar-value">{item.count || ""}</span><div className="bar-track"><div className={`bar ${stats.registered >= 200 ? "bar-ready" : ""}`} style={{ height: `${Math.max(item.count ? 10 : 3, (item.count / max) * 100)}%` }} /></div><time dateTime={item.date}>{item.date.slice(5)}</time></div>)}</div></section><p className="admin-updated">Updated {new Date(stats.updatedAt).toLocaleString()}</p></>}</main>;
}
