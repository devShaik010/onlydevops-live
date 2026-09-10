import { useEffect, useLayoutEffect, useRef, useState } from "react";

const STORAGE_KEY = "onlydevops.learning-view.v1";
const emptyView = (id) => ({
  open: { [`${id}-0`]: true },
  query: "",
  filter: "all",
  scroll: 0,
});
function readSaved() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!saved || typeof saved !== "object")
      return { topic: "linux", views: {} };
    const views = {};
    for (const [id, view] of Object.entries(saved.views || {})) {
      if (!view || typeof view !== "object") continue;
      views[id] = {
        open: Object.fromEntries(
          Object.entries(view.open || {}).filter(
            ([key, value]) => typeof value === "boolean",
          ),
        ),
        query: typeof view.query === "string" ? view.query.slice(0, 200) : "",
        filter: ["all", "remaining", "completed"].includes(view.filter)
          ? view.filter
          : "all",
        scroll: Number.isFinite(view.scroll) ? Math.max(0, view.scroll) : 0,
      };
    }
    return {
      topic: typeof saved.topic === "string" ? saved.topic : "linux",
      views,
    };
  } catch {
    return { topic: "linux", views: {} };
  }
}

export default function useLearningView(topics) {
  const cache = useRef(null);
  if (!cache.current) cache.current = readSaved();
  const [id, setId] = useState(
    () => location.hash.slice(1) || cache.current.topic,
  );
  const [view, setView] = useState(
    () => cache.current.views[id] || emptyView(id),
  );
  const [jump, setJump] = useState(null);
  const [navigation, setNavigation] = useState(0);
  const current = useRef({ id, view });
  const ready = useRef(false);
  const available = !!topics;
  function persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cache.current));
    } catch {
      /* Storage is optional. */
    }
  }
  function saveScroll() {
    if (!ready.current) return;
    const { id, view } = current.current;
    const saved = { ...view, scroll: window.scrollY };
    current.current.view = saved;
    cache.current.views[id] = saved;
    cache.current.topic = id;
    persist();
  }
  function navigate(nextId, target = null) {
    saveScroll();
    ready.current = false;
    const saved = cache.current.views[nextId] || emptyView(nextId);
    setNavigation((n) => n + 1);
    setId(nextId);
    setView(
      target
        ? {
            ...saved,
            query: "",
            filter: "all",
            open: { ...saved.open, [target.section]: true },
          }
        : saved,
    );
    setJump(target ? { ...target } : null);
    // Preserve hash history without the browser doing its own scroll restoration.
    if (location.hash !== `#${nextId}`)
      history.pushState(null, "", `#${nextId}`);
  }
  useLayoutEffect(() => {
    current.current = {
      id,
      view: { ...view, scroll: cache.current.views[id]?.scroll ?? view.scroll },
    };
    cache.current.topic = id;
    cache.current.views[id] = current.current.view;
    if (available) persist();
  }, [id, view, available]);
  useLayoutEffect(() => {
    if (!available) return;
    if (!topics.some((t) => t.id === id)) {
      navigate(topics[0].id);
      return;
    }
    if (!location.hash) history.replaceState(null, "", `#${id}`);
    ready.current = false;
    let cancelled = false;
    const restore = () => {
      if (cancelled) return;
      if (jump) {
        const input = document.getElementById(`item-${jump.item}`);
        input?.focus({ preventScroll: true });
        input
          ?.closest("label")
          ?.scrollIntoView({ block: "center", behavior: "instant" });
      } else
        window.scrollTo({
          top: cache.current.views[id]?.scroll || 0,
          behavior: "instant",
        });
      ready.current = true;
      saveScroll();
    };
    const frame = requestAnimationFrame(() =>
      (document.fonts?.ready || Promise.resolve()).then(restore),
    );
    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
    };
  }, [available, id, jump, navigation]);
  useEffect(() => {
    const previous = history.scrollRestoration;
    history.scrollRestoration = "manual";
    const hashChange = () => {
      const nextId = location.hash.slice(1) || cache.current.topic;
      if (nextId !== current.current.id) navigate(nextId);
    };
    const hidden = () => {
      if (document.visibilityState === "hidden") saveScroll();
    };
    let timer;
    const scroll = () => {
      clearTimeout(timer);
      timer = setTimeout(saveScroll, 120);
    };
    window.addEventListener("scroll", scroll, { passive: true });
    window.addEventListener("pagehide", saveScroll);
    window.addEventListener("hashchange", hashChange);
    document.addEventListener("visibilitychange", hidden);
    return () => {
      saveScroll();
      clearTimeout(timer);
      history.scrollRestoration = previous;
      window.removeEventListener("scroll", scroll);
      window.removeEventListener("pagehide", saveScroll);
      window.removeEventListener("hashchange", hashChange);
      document.removeEventListener("visibilitychange", hidden);
    };
  }, []);
  const update = (key) => (value) =>
    setView((previous) => ({
      ...previous,
      [key]: typeof value === "function" ? value(previous[key]) : value,
    }));
  return {
    id,
    open: view.open,
    query: view.query,
    filter: view.filter,
    setExpanded: update("open"),
    setQuery: update("query"),
    setFilter: update("filter"),
    navigate,
  };
}
