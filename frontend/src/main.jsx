import React, { useState, useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";
import {
  Workflow,
  GitPullRequestArrow,
  ChevronDown,
  ChevronRight,
  Search,
  ArrowRight,
  Check,
  Layers,
  Menu,
  X,
} from "lucide-react";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/space-grotesk/500.css";
import "@fontsource/space-grotesk/600.css";
import "@fontsource/space-grotesk/700.css";
import "@fontsource/jetbrains-mono/400.css";
import "@fontsource/jetbrains-mono/500.css";
import "./styles.css";
import AccountDialog from "./AccountDialog";
import useLearningView from "./useLearningView";
import PracticePage from "./PracticePage";
import WorkspaceNav from "./WorkspaceNav";
import ThemeToggle from "./ThemeToggle";
import SkipLink from "./SkipLink";
import AdminPage from "./AdminPage";
import ProfileMenu from "./ProfileMenu";
import BrandMark from "./BrandMark";
import "./theme.css";

const toolLogos = {
  argocd: "argocd",
  terraform: "terraform",
  linux: "linux",
  shell: "bash",
  git: "git",
  docker: "docker",
  kubernetes: "kubernetes",
  jenkins: "jenkins",
  "github-actions": "githubactions",
};
function ToolLogo({ topic, decorative = false }) {
  return (
    <span
      className={`tool-logo tool-logo-${topic.id}`}
      aria-hidden={decorative || undefined}
    >
      {topic.id === "gitops" ? (
        <GitPullRequestArrow
          role={decorative ? undefined : "img"}
          aria-label={decorative ? undefined : "GitOps workflow"}
        />
      ) : topic.id === "cicd" ? (
        <Workflow
          role={decorative ? undefined : "img"}
          aria-label={decorative ? undefined : "CI/CD workflow"}
        />
      ) : (
        <img
          src={`/logos/${toolLogos[topic.id]}.svg`}
          alt={decorative ? "" : `${topic.title} logo`}
        />
      )}
      {topic.id === "git" && (
        <img
          className="github-companion"
          src="/logos/github.svg"
          alt={decorative ? "" : "GitHub logo"}
        />
      )}
    </span>
  );
}
const items = (t) =>
  t.sections.flatMap((s) => s.commands.flatMap((c) => c.items));
function App() {
  const roadmapToggle = useRef(null);
  const revision = useRef(0);
  const saving = useRef(new Set());
  const queuedProgress = useRef(new Map());
  const progressTimer = useRef(null);
  const lastSheetRefreshAt = useRef(0);
  const [data, setData] = useState(null),
    [done, setCompleted] = useState(new Set()),
    [pending, setPending] = useState(new Set()),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true),
    [mobile, setMobile] = useState(false),
    [accountBusy, setAccountBusy] = useState(false),
    [syncError, setSyncError] = useState(false);
  const {
    id,
    open,
    query,
    filter,
    setExpanded,
    setQuery,
    setFilter,
    navigate,
  } = useLearningView(data?.topics);
  useEffect(() => {
    if (!mobile) return;
    const closeOnEscape = (event) => {
      if (event.key !== "Escape") return;
      setMobile(false);
      roadmapToggle.current?.focus();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [mobile]);
  async function load(quiet = false) {
    if (saving.current.size) return;
    lastSheetRefreshAt.current = Date.now();
    const current = ++revision.current;
    if (!quiet) {
      setLoading(true);
      setError("");
    }
    try {
      const r = await fetch("/api/sheet");
      if (r.status === 401) {
        if (current === revision.current) {
          setData({ user: null });
          setCompleted(new Set());
        }
        return true;
      }
      if (!r.ok) throw Error();
      const d = await r.json();
      if (current !== revision.current) return;
      setData(d);
      setCompleted(new Set(d.completed));
      setSyncError(false);
      return true;
    } catch {
      if (current !== revision.current) return;
      if (quiet) setSyncError(true);
      else
        setError(
          "Your sheet couldn’t load. Check your connection and try again.",
        );
      return false;
    } finally {
      if (!quiet) setLoading(false);
    }
  }
  useEffect(() => {
    load();
  }, []);
  useEffect(
    () => () => {
      if (progressTimer.current) clearTimeout(progressTimer.current);
    },
    [],
  );
  useEffect(() => {
    const saveBeforeLeaving = () => {
      if (!progressTimer.current) return;
      clearTimeout(progressTimer.current);
      flushProgress();
    };
    window.addEventListener("pagehide", saveBeforeLeaving);
    return () => window.removeEventListener("pagehide", saveBeforeLeaving);
  }, [data?.learner]);
  useEffect(() => {
    if (!data?.user || pending.size || accountBusy) return;
    const refresh = () => {
      if (
        document.visibilityState === "visible" &&
        Date.now() - lastSheetRefreshAt.current >= 15000
      ) {
        load(true);
      }
    };
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [data?.user?.username, pending.size, accountBusy]);
  async function authenticated() {
    revision.current++;
    setAccountBusy(true);
    const loaded = await load();
    if (!loaded) setData(null);
    setAccountBusy(false);
  }
  async function logout() {
    if (saving.current.size || accountBusy) return;
    revision.current++;
    setAccountBusy(true);
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });
      if (!response.ok) throw Error();
      const loaded = await load();
      if (!loaded) setData(null);
    } catch {
      setError("Couldn’t sign out. Please try again.");
    } finally {
      setAccountBusy(false);
    }
  }
  function updateProfile(user) {
    setData((current) => current ? { ...current, user } : current);
  }
  async function flushProgress() {
    progressTimer.current = null;
    const changes = Array.from(
      queuedProgress.current,
      ([item_id, completed]) => ({
        item_id,
        completed,
      }),
    );
    if (!changes.length) return;
    queuedProgress.current.clear();
    try {
      const r = await fetch("/api/progress", {
        method: "PUT",
        keepalive: true,
        headers: {
          "Content-Type": "application/json",
          "X-Learner": data.learner,
        },
        body: JSON.stringify({ changes }),
      });
      if (!r.ok) throw Error();
      const result = await r.json();
      const failed = new Set(result.failed || []);
      if (failed.size) {
        setCompleted((current) => {
          const next = new Set(current);
          for (const { item_id, completed } of changes) {
            if (!failed.has(item_id)) continue;
            completed ? next.delete(item_id) : next.add(item_id);
          }
          return next;
        });
        setError("Some checks weren’t saved. Please try again.");
      } else {
        setSyncError(false);
      }
    } catch {
      setCompleted((current) => {
        const next = new Set(current);
        for (const { item_id, completed } of changes) {
          completed ? next.delete(item_id) : next.add(item_id);
        }
        return next;
      });
      setError("That check wasn’t saved. Please try again.");
    } finally {
      for (const { item_id } of changes) saving.current.delete(item_id);
      setPending((p) => {
        const n = new Set(p);
        for (const { item_id } of changes) n.delete(item_id);
        return n;
      });
    }
  }
  function toggle(item) {
    if (saving.current.has(item) || accountBusy) return;
    revision.current++;
    const completed = !done.has(item);
    saving.current.add(item);
    queuedProgress.current.set(item, completed);
    setCompleted((current) => {
      const next = new Set(current);
      completed ? next.add(item) : next.delete(item);
      return next;
    });
    setPending((p) => new Set(p).add(item));
    setError("");
    if (progressTimer.current) clearTimeout(progressTimer.current);
    progressTimer.current = setTimeout(flushProgress, 400);
  }
  function go(v) {
    navigate(v);
    setMobile(false);
  }
  if (!data)
    return (
      <div className="loading">
        <BrandMark size={48} label="OnlyDevOps logo" />
        <h1>onlydevops</h1>
        <p role="status">{loading ? "Opening your sheet…" : error}</p>
        {!loading && <button onClick={() => load()}>Try again</button>}
      </div>
    );
  if (!data.user)
    return (
      <AccountDialog required onAuthenticated={authenticated} />
    );
  const topics = data.topics,
    t = topics.find((t) => t.id === id) || topics[0],
    index = topics.indexOf(t),
    count = (a) => a.filter((i) => done.has(i.id)).length,
    all = topics.flatMap(items),
    list = items(t),
    n = count(list),
    pct = Math.round((n / list.length) * 100),
    total = count(all);
  const nextItem = [...topics.slice(index), ...topics.slice(0, index)]
    .flatMap((topic) =>
      topic.sections.flatMap((section) =>
        section.commands.flatMap((command) =>
          command.items.map((item) => ({ topic, section, item })),
        ),
      ),
    )
    .find(({ item }) => !done.has(item.id));
  function continueLearning() {
    if (!nextItem) return;
    navigate(nextItem.topic.id, {
      section: nextItem.section.id,
      item: nextItem.item.id,
    });
    setMobile(false);
  }
  const visible = t.sections
    .map((s) => ({
      ...s,
      commands: s.commands
        .map((c) => ({
          ...c,
          items: c.items.filter(
            (i) =>
              (!query ||
                `${s.title} ${c.title} ${i.label}`
                  .toLowerCase()
                  .includes(query.toLowerCase())) &&
              (filter === "all" ||
                (filter === "completed" ? done.has(i.id) : !done.has(i.id))),
          ),
        }))
        .filter((c) => c.items.length),
    }))
    .filter((s) => s.commands.length);
  return (
    <>
      <SkipLink onSkip={() => setMobile(false)} />
      <header className="topbar">
        <a
          className="brand"
          href="#linux"
          onClick={(e) => {
            e.preventDefault();
            go("linux");
          }}
        >
          <span className="brand-icon">
            <BrandMark />
          </span>
          only<span>devops</span>
        </a>
        <WorkspaceNav />
        <div className="top-right">
          <ThemeToggle />
          <ProfileMenu
            user={data.user}
            disabled={pending.size > 0 || accountBusy}
            onLogout={logout}
            onUpdated={updateProfile}
          />
          <button
            className="mobile-toggle"
            ref={roadmapToggle}
            aria-controls="learning-roadmap"
            aria-label="Toggle roadmap"
            aria-expanded={mobile}
            onClick={() => setMobile(!mobile)}
          >
            {mobile ? <X /> : <Menu />}
          </button>
        </div>
      </header>
      <aside id="learning-roadmap" className={mobile ? "sidebar mobile-open" : "sidebar"}>
        <div className="sidebar-heading">
          <span className="eyebrow">YOUR LEARNING PATH</span>
          <small>{String(topics.length).padStart(2, "0")}</small>
        </div>
        <nav aria-label="DevOps roadmap">
          {topics.map((v, i) => (
            <button
              key={v.id}
              className={"topic " + (v.id === t.id ? "active" : "")}
              aria-current={v.id === t.id ? "page" : undefined}
              onClick={() => go(v.id)}
            >
              <span className="step">
                {count(items(v)) === items(v).length ? (
                  <Check size={13} />
                ) : (
                  String(i + 1).padStart(2, "0")
                )}
              </span>
              <ToolLogo topic={v} decorative />
              <span className="topic-name">
                {v.title}
                <span className="mini-track">
                  <span
                    style={{
                      width: (count(items(v)) / items(v).length) * 100 + "%",
                    }}
                  />
                </span>
              </span>
              <ChevronRight size={14} />
            </button>
          ))}
        </nav>
        <div className="sidebar-note">
          <Layers size={18} />
          <p>
            One sheet.
            <br />
            Your path through DevOps.
          </p>
          <small>Learn it. Practice it. Check it off.</small>
        </div>
        <div className="overall">
          <div>
            Overall progress{" "}
            <strong>{Math.round((total / all.length) * 100)}%</strong>
          </div>
          <div className="track">
            <span style={{ width: (total / all.length) * 100 + "%" }} />
          </div>
          <p>
            {total} of {all.length} items completed
          </p>
        </div>
      </aside>
      <main id="main-content" tabIndex={-1}>
        <div className="breadcrumb">
          The DevOps sheet <ChevronRight size={12} />
          <span>{t.title}</span>
        </div>
        <div className="heading">
          <div>
            <div className="eyebrow blue">
              STEP {String(index + 1).padStart(2, "0")} /{" "}
              {String(topics.length).padStart(2, "0")}
            </div>
            <h1>
              {t.title}
              <em>.</em>
            </h1>
            <p>{t.subtitle}</p>
          </div>
          <div className="symbol">
            <ToolLogo topic={t} />
            <small>{String(index + 1).padStart(2, "0")}</small>
          </div>
        </div>
        <div className="progress-panel">
          <div className="progress-top">
            <div>
              Your progress{" "}
              <span>
                {n} <i>/ {list.length} completed</i>
              </span>
            </div>
            <strong>
              {pct}
              <small>%</small>
            </strong>
          </div>
          <div className="track">
            <span style={{ width: pct + "%" }} />
          </div>
        </div>
        <div className="resume-strip">
          {nextItem ? (
            <>
              <span>
                Up next <strong>{nextItem.topic.title}</strong>
                <span className="resume-divider">/</span>
                <code>{nextItem.item.label}</code>
              </span>
              <button
                onClick={continueLearning}
                disabled={accountBusy || pending.size > 0}
              >
                Continue learning <ArrowRight size={15} />
              </button>
            </>
          ) : (
            <span className="roadmap-complete">
              <Check size={16} /> You’ve completed the roadmap. Revisit any
              sheet to keep practicing.
            </span>
          )}
        </div>
        <a className="practice-entry" href="/practice">
          <span>
            <Workflow size={18} />
            Practice troubleshooting
          </span>
          <ArrowRight size={17} />
        </a>
        <div className="toolbar">
          <div className="tabs">
            {[
              ["all", "All items"],
              ["remaining", "To do"],
              ["completed", "Completed"],
            ].map(([v, label]) => (
              <button
                key={v}
                aria-pressed={filter === v}
                className={filter === v ? "selected" : ""}
                onClick={() => {
                  setFilter(v);
                  setExpanded({});
                }}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="search">
            <Search size={16} />
            <input
              aria-label={"Search " + t.title + " sheet"}
              placeholder="Find a topic or command…"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setExpanded({});
              }}
            />
            {query && (
              <button aria-label="Clear search" onClick={() => setQuery("")}>
                <X size={14} />
              </button>
            )}
          </div>
        </div>
        {error && (
          <div className="error" role="alert">
            {error}
            <button aria-label="Dismiss error" onClick={() => setError("")}>
              <X size={14} />
            </button>
          </div>
        )}
        <div className="section-label">
          <span>{query ? "SEARCH RESULTS" : "THE CHECKLIST"}</span>
          <button
            onClick={() =>
              setExpanded(
                Object.fromEntries(
                  t.sections.map((s) => [
                    s.id,
                    !visible.every(
                      (s) => open[s.id] ?? (!!query || filter !== "all"),
                    ),
                  ]),
                ),
              )
            }
          >
            {visible.every((s) => open[s.id] ?? (!!query || filter !== "all"))
              ? "Collapse all"
              : "Expand all"}
          </button>
        </div>
        {visible.map((s) => {
          const orig = t.sections.find((v) => v.id === s.id),
            a = orig.commands.flatMap((c) => c.items),
            expanded = open[s.id] ?? (!!query || filter !== "all");
          return (
            <section className="sheet-section" key={s.id}>
              <button
                className="section-header"
                aria-expanded={!!expanded}
                aria-controls={s.id + "-content"}
                onClick={() =>
                  setExpanded((p) => ({ ...p, [s.id]: !expanded }))
                }
              >
                <span className="section-number">
                  {count(a) === a.length ? (
                    <Check size={14} />
                  ) : (
                    String(t.sections.indexOf(orig) + 1).padStart(2, "0")
                  )}
                </span>
                <h2>{s.title}</h2>
                <span className="section-count">
                  {count(a)}
                  <i> / {a.length}</i>
                </span>
                <ChevronDown size={16} className={expanded ? "rotated" : ""} />
              </button>
              {expanded && (
                <div className="section-content" id={s.id + "-content"}>
                  {s.commands.map((c) => (
                    <div className="command" key={c.id}>
                      <div className="command-title">
                        <span className="branch" />
                        <h3>{c.title}</h3>
                        <small>{c.items.length} items</small>
                      </div>
                      <div className="checklist">
                        {c.items.map((i) => (
                          <label
                            key={i.id}
                            className={
                              "check-item " +
                              (done.has(i.id) ? "checked " : "") +
                              (pending.has(i.id) ? "saving" : "")
                            }
                          >
                            <input
                              id={`item-${i.id}`}
                              type="checkbox"
                              checked={done.has(i.id)}
                              disabled={pending.has(i.id) || accountBusy}
                              onChange={() => toggle(i.id)}
                            />
                            <span className="custom-check">
                              {done.has(i.id) && (
                                <Check size={12} strokeWidth={3} />
                              )}
                            </span>
                            <code>{i.label}</code>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          );
        })}
        {!visible.length && (
          <div className="empty">
            <Search size={25} />
            <h2>
              {filter === "completed" && !query
                ? "Your first check is waiting."
                : "No matching items."}
            </h2>
            <p>
              {filter === "completed" && !query
                ? "Check off something you’ve learned to see it here."
                : "Try another search or change your filter."}
            </p>
            <button
              onClick={() => {
                setQuery("");
                setFilter("all");
              }}
            >
              Show all items <ArrowRight size={14} />
            </button>
          </div>
        )}
        <div className="sheet-footer">
          <span>
            <b />
            {pending.size
              ? "Saving progress…"
              : error
                ? "Last change wasn’t saved"
                : syncError
                  ? "Sync paused. Reconnecting…"
                  : data.user
                    ? "Progress synced to your account"
                    : "Progress saved for this browser"}
          </span>
          {index < topics.length - 1 && (
            <button onClick={() => go(topics[index + 1].id)}>
              Next: {topics[index + 1].title}
              <ArrowRight size={15} />
            </button>
          )}
        </div>
        <footer>
          Build understanding. One check at a time.
          <span>onlydevops / 2026</span>
        </footer>
      </main>
    </>
  );
}

function Root() {
  const path = window.location.pathname.replace(/\/$/, "");
  if (path === "/admin") return <AdminPage />;
  if (path === "/practice") return <PracticePage />;
  return <App />;
}

createRoot(document.getElementById("root")).render(<Root />);
