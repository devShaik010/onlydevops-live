export default function SkipLink({ onSkip }) {
  return (
    <a className="skip-link" href="#main-content" onClick={(event) => {
      event.preventDefault();
      onSkip?.();
      requestAnimationFrame(() => {
        document.getElementById("main-content")?.focus({ preventScroll: true });
        window.scrollTo({ top: 0, behavior: "instant" });
      });
    }}>
      Skip to content
    </a>
  );
}
