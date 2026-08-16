import type { Directive } from "vue";

/**
 * v-reveal — subtle scroll-in animation.
 *
 * Adds a "revealed" class when the element enters the viewport (one time).
 * Elements start visually hidden ONLY when JavaScript + IntersectionObserver
 * are available, so content is never lost for no-JS / reduced-motion users.
 * Honors prefers-reduced-motion by skipping the animation entirely.
 */

let reduceMotion = false;
if (typeof window !== "undefined" && typeof window.matchMedia === "function") {
  reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

const observed = new WeakSet<HTMLElement>();

function observe(el: HTMLElement) {
  if (observed.has(el)) return;
  observed.add(el);

  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          el.classList.add("revealed");
          io.unobserve(el);
        }
      }
    },
    { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
  );
  io.observe(el);
}

export const vReveal: Directive<HTMLElement, number | undefined> = {
  mounted(el, binding) {
    if (reduceMotion || typeof IntersectionObserver === "undefined") return;
    el.classList.add("reveal");
    if (typeof binding.value === "number") {
      el.style.transitionDelay = `${Math.min(binding.value, 6) * 60}ms`;
    }
    observe(el);
  },
};
