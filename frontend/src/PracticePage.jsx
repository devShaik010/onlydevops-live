import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronRight,
  Cloud,
  Infinity,
  LogOut,
  Terminal,
  Search,
  X,
  Clock3,
} from "lucide-react";
import AccountDialog from "./AccountDialog";
import WorkspaceNav from "./WorkspaceNav";
import ThemeToggle from "./ThemeToggle";
import SkipLink from "./SkipLink";
import "./practice.css";

const topicNames = {
  linux: "Linux",
  git: "Git",
  docker: "Docker",
  kubernetes: "Kubernetes",
  "github-actions": "GitHub Actions",
};
const status = (challenge) =>
  !challenge.result
    ? "Not attempted"
    : challenge.result.correct
      ? "Solved"
      : "Review";

function Exercise({ challenge, learner, onSaved, onBusy }) {
  const [choice, setChoice] = useState(challenge.result?.choice_id || "");
  const [retry, setRetry] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const saving = useRef(false);
  const feedbackRef = useRef(null);
  const formRef = useRef(null);
  const result = retry ? null : challenge.result;

  async function submit(event) {
    event.preventDefault();
    if (!choice || saving.current) return;
    saving.current = true;
    setBusy(true);
    onBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/practice/${challenge.id}/answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Learner": learner },
        body: JSON.stringify({ choice_id: choice, version: challenge.version }),
      });
      if (!response.ok) {
        if ([401, 409].includes(response.status)) {
          const body = await response.json();
          throw new Error(
            typeof body.detail === "string"
              ? body.detail
              : "Reload practice and try again.",
          );
        }
        throw new Error(
          "Your answer wasn’t saved. Check your connection and try again.",
        );
      }
      const saved = await response.json();
      onSaved(challenge.id, saved);
      setRetry(false);
      requestAnimationFrame(() => feedbackRef.current?.focus());
    } catch (err) {
      setError(
        err instanceof TypeError
          ? "Your answer wasn’t saved. Check your connection and try again."
          : err.message,
      );
    } finally {
      saving.current = false;
      setBusy(false);
      onBusy(false);
    }
  }

  return (
    <div className="practice-workspace">
      <section className="practice-evidence" aria-labelledby="evidence-title">
        <h2 id="evidence-title">Investigate the evidence</h2>
        <p>{challenge.brief}</p>
        {challenge.evidence.map((block) => (
          <figure className="evidence-block" key={block.label}>
            <figcaption>
              <Terminal size={14} aria-hidden="true" />
              {block.label}
            </figcaption>
            <pre tabIndex={0} aria-label={block.label}>
              <code>{block.code}</code>
            </pre>
          </figure>
        ))}
      </section>
      <section className="practice-answer" aria-labelledby="diagnosis-title">
        <h2 id="diagnosis-title">Make the diagnosis</h2>
        {!result ? (
          <form onSubmit={submit} ref={formRef}>
            <fieldset disabled={busy}>
              <legend>{challenge.question}</legend>
              {challenge.options.map((option) => (
                <label
                  className={`answer-option ${choice === option.id ? "chosen" : ""}`}
                  key={option.id}
                >
                  <input
                    type="radio"
                    name="diagnosis"
                    value={option.id}
                    checked={choice === option.id}
                    onChange={() => setChoice(option.id)}
                    required
                  />
                  <span>{option.label}</span>
                </label>
              ))}
            </fieldset>
            {error && (
              <div role="alert" className="error">
                {error}
              </div>
            )}
            <button className="practice-primary" disabled={!choice || busy}>
              {busy ? "Saving answer…" : "Check answer"}
              <ArrowRight size={16} aria-hidden="true" />
            </button>
          </form>
        ) : (
          <div ref={feedbackRef} tabIndex={-1} className="practice-feedback">
            <div
              className={`answer-outcome ${result.correct ? "correct" : "review"}`}
              role="status"
            >
              {result.correct ? (
                <Check size={18} aria-hidden="true" />
              ) : (
                <Terminal size={18} aria-hidden="true" />
              )}
              {result.correct ? "Correct diagnosis" : "Take another look"}
            </div>
            <p className="submitted-answer">
              <strong>Your answer</strong>
              {challenge.options.find((o) => o.id === result.choice_id)?.label}
            </p>
            <p>{result.feedback}</p>
            {!result.correct && (
              <p>
                <strong>Best answer: </strong>
                {challenge.options.find((o) => o.id === result.answer)?.label}
              </p>
            )}
            <h3>Why this works</h3>
            <p>{result.explanation}</p>
            <h3>Verify the fix</h3>
            <p>{result.verification}</p>
            <h3>Read the documentation</h3>
            <ul>
              {result.sources.map((source) => (
                <li key={source.url}>
                  <a href={source.url} target="_blank" rel="noreferrer">
                    {source.title} ↗
                  </a>
                </li>
              ))}
            </ul>
            <button
              className="practice-secondary"
              onClick={() => {
                setChoice("");
                setRetry(true);
                setError("");
                requestAnimationFrame(() =>
                  formRef.current?.querySelector("input")?.focus(),
                );
              }}
            >
              Try again
            </button>
            <p className="practice-format">
              Retrying keeps your saved result until you check another answer.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}

export default function PracticePage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(() => location.hash.slice(1));
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [topic, setTopic] = useState("all");
  const [accountOpen, setAccountOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const headingRef = useRef(null);
  const generation = useRef(0);

  async function load() {
    const current = ++generation.current;
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/practice");
      if (!response.ok) throw Error();
      const body = await response.json();
      if (current === generation.current) setData(body);
    } catch {
      if (current === generation.current) {
        setData(null);
        setError(
          "Practice couldn’t load. Check your connection and try again.",
        );
      }
    } finally {
      if (current === generation.current) setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const onHash = () => setSelected(location.hash.slice(1));
    window.addEventListener("hashchange", onHash);
    return () => {
      generation.current++;
      window.removeEventListener("hashchange", onHash);
    };
  }, []);
  const challenge = data?.challenges.find((c) => c.id === selected);
  useEffect(() => {
    document.title = `${challenge?.title || "Troubleshooting practice"} · OnlyDevOps`;
    if (!loading) headingRef.current?.focus({ preventScroll: true });
  }, [selected, loading, challenge?.title]);

  function navigate(id) {
    setSelected(id);
    setError("");
    history.pushState(null, "", id ? `/practice#${id}` : "/practice");
    window.scrollTo({ top: 0, behavior: "instant" });
  }
  async function authenticated() {
    setAccountOpen(false);
    setBusy(true);
    // Unmount the old account's answer form before refreshing its identity.
    setData(null);
    await load();
    setBusy(false);
  }
  async function logout() {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });
      if (!response.ok) throw Error();
      setData(null);
      await load();
    } catch {
      setError("Couldn’t sign out. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  const solved = data?.challenges.filter((c) => c.result?.correct).length || 0;
  const nextChallenge = data?.challenges.find((c) => c.id !== selected && !c.result?.correct);
  const visible =
    data?.challenges.filter(
      (c) =>
        (topic === "all" || c.topic === topic) &&
        `${c.title} ${c.summary} ${topicNames[c.topic]}`.toLowerCase().includes(query.trim().toLowerCase()) &&
        (filter === "all" ||
        (filter === "solved"
          ? c.result?.correct
          : c.result && !c.result.correct)),
    ) || [];
  return (
    <>
      {accountOpen && (
        <AccountDialog
          onClose={() => setAccountOpen(false)}
          onAuthenticated={authenticated}
          hasProgress={data?.challenges.some((c) => c.result)}
          hasPractice
        />
      )}
      <SkipLink />
      <header className="topbar practice-topbar">
        <a className="brand" href="/" aria-label="OnlyDevOps learning sheet">
          <span className="brand-icon">
            <Infinity size={23} />
          </span>
          only<span>devops</span>
        </a>
        <WorkspaceNav practice />
        <div className="top-right">
          <ThemeToggle />
          {data?.user ? (
            <div className="account-control">
              <span className="account-name">
                <Cloud size={15} />
                {data.user.username}
              </span>
              <button aria-label="Sign out" disabled={busy} onClick={logout}>
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <button
              className="save-account"
              aria-label="Save my progress"
              title="Save my progress"
              disabled={!data || busy}
              onClick={() => setAccountOpen(true)}
            >
              <Cloud size={15} />
              <span>Save my progress</span>
            </button>
          )}
        </div>
      </header>
      <main id="main-content" tabIndex={-1} className="practice-main">
        <nav className="practice-breadcrumb" aria-label="Practice navigation">
          <a href="/">
            <ArrowLeft size={14} />
            Learning sheet
          </a>
          <ChevronRight size={12} aria-hidden="true" />
          <button disabled={busy} onClick={() => navigate("")}>
            Practice
          </button>
          {challenge && (
            <>
              <ChevronRight size={12} aria-hidden="true" />
              <span>{topicNames[challenge.topic]}</span>
            </>
          )}
        </nav>
        {loading ? (
          <p role="status">Opening practice…</p>
        ) : !data ? (
          <div className="practice-load-error">
            <p role="alert">{error}</p>
            <button className="practice-primary" onClick={load}>
              Try again
            </button>
          </div>
        ) : (
          <>
            {error && (
              <div className="error" role="alert">
                {error}
              </div>
            )}
            {selected && !challenge ? (
              <div className="practice-load-error">
                <h1 ref={headingRef} tabIndex={-1}>
                  Challenge not found.
                </h1>
                <p>This link does not match an available challenge.</p>
                <button
                  className="practice-primary"
                  onClick={() => navigate("")}
                >
                  Browse challenges
                </button>
              </div>
            ) : challenge ? (
              <>
                <div className="practice-heading">
                  <div className="eyebrow blue">
                    {topicNames[challenge.topic]} · {challenge.difficulty} ·{" "}
                    {challenge.minutes} MIN
                  </div>
                  <h1 ref={headingRef} tabIndex={-1}>
                    {challenge.title}
                    <em>.</em>
                  </h1>
                  <p>{challenge.summary}</p>
                </div>
                <Exercise
                  key={`${data.learner}:${challenge.id}`}
                  challenge={challenge}
                  learner={data.learner}
                  onBusy={setBusy}
                  onSaved={(id, result) =>
                    setData((previous) => ({
                      ...previous,
                      challenges: previous.challenges.map((c) =>
                        c.id === id ? { ...c, result } : c,
                      ),
                    }))
                  }
                />
                <div className="practice-bottom">
                  <button disabled={busy} onClick={() => navigate("")}>
                    <ArrowLeft size={15} />
                    All challenges
                  </button>
                  {challenge.result && nextChallenge && (
                    <button className="practice-primary" disabled={busy} onClick={() => navigate(nextChallenge.id)}>
                      Next challenge <ArrowRight size={15} />
                    </button>
                  )}
                  <a href={`/#${challenge.topic}`}>
                    Review the {topicNames[challenge.topic]} sheet
                    <ArrowRight size={15} />
                  </a>
                </div>
              </>
            ) : (
              <>
                <div className="practice-heading practice-intro">
                  <div>
                    <div className="eyebrow blue">TROUBLESHOOTING PRACTICE</div>
                    <h1 ref={headingRef} tabIndex={-1}>
                      Follow the evidence<em>.</em>
                    </h1>
                    <p>Docker, Linux, Git and Kubernetes. Real incidents, one diagnosis at a time.</p>
                  </div>
                  <div className="practice-progress">
                    <strong>
                      {solved}
                      <span> / {data.challenges.length}</span>
                    </strong>
                    <span>challenges solved</span>
                  </div>
                </div>
                <div className="practice-discovery">
                  <div className="search">
                    <Search size={16} aria-hidden="true" />
                    <input aria-label="Search challenges" placeholder="Search incidents or tools" value={query} onChange={(event) => setQuery(event.target.value)} />
                    {query && <button aria-label="Clear challenge search" onClick={() => setQuery("")}><X size={15} /></button>}
                  </div>
                  <select aria-label="Filter by tool" value={topic} onChange={(event) => setTopic(event.target.value)}>
                    <option value="all">All tools</option>
                    {Object.entries(topicNames).map(([id, name]) => <option key={id} value={id}>{name}</option>)}
                  </select>
                </div>
                <div className="practice-library-bar">
                  <div className="tabs">
                    {[
                      ["all", "All challenges"],
                      ["review", "To review"],
                      ["solved", "Solved"],
                    ].map(([value, label]) => (
                      <button
                        key={value}
                        className={filter === value ? "selected" : ""}
                        aria-pressed={filter === value}
                        onClick={() => setFilter(value)}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  <span>{visible.length} challenges · Free starter collection</span>
                </div>
                <div className="practice-grid">
                  {visible.map((c) => (
                    <button
                      key={c.id}
                      className={`practice-card ${c.result?.correct ? "is-solved" : c.result ? "needs-review" : ""}`}
                      onClick={() => navigate(c.id)}
                    >
                      <div className="practice-card-meta">
                        <span><img src={`/logos/${c.topic === "github-actions" ? "githubactions" : c.topic}.svg`} alt="" />{topicNames[c.topic]}</span>
                        <span><Clock3 size={13} aria-hidden="true" />{c.minutes} min</span>
                      </div>
                      <h2>{c.title}</h2>
                      <p>{c.summary}</p>
                      <div className="practice-card-bottom">
                        <span
                          className={c.result?.correct ? "solved-label" : ""}
                        >
                          {status(c)}
                        </span>
                        <span>
                          {c.result ? "Open challenge" : "Start challenge"}
                          <ArrowRight size={16} />
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
                {!visible.length && (
                  <div className="empty">
                    <h2>
                      {query || topic !== "all" ? "No matching challenges." : filter === "solved"
                        ? "Your first diagnosis is waiting."
                        : "Nothing to review yet."}
                    </h2>
                    <button onClick={() => { setFilter("all"); setQuery(""); setTopic("all"); }}>
                      Browse all challenges
                      <ArrowRight size={14} />
                    </button>
                  </div>
                )}
              </>
            )}
            <footer className="practice-footer">
              <span>
                {data.user
                  ? "Practice saved to your account"
                  : "Practice saved for this browser"}
              </span>
              <span>Checklist progress stays separate.</span>
            </footer>
          </>
        )}
      </main>
    </>
  );
}
