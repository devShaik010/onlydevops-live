import confetti from "@hiseb/confetti";

export function celebrate() {
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
  confetti({
    count: 55,
    velocity: 170,
    fade: true,
    color: ["#8acbd0", "#9ed9b7", "#eac392", "#f5f7fa"],
  });
}
