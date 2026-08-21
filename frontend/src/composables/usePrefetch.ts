/**
 * v-prefetch — Prefetch a Vue route chunk on pointerenter / touchstart.
 *
 * Usage:
 *   <RouterLink v-prefetch="'article'" :to="...">  <!-- prefetches ArticleView -->
 *   <RouterLink v-prefetch="'category'" :to="..."> <!-- prefetches CategoryView -->
 *
 * The component is loaded lazily on hover, so when the user clicks the link
 * the chunk is already in the browser cache and navigation feels instant.
 */
import type { Directive } from "vue";
import { type RouteRecordRaw } from "vue-router";

// Map route names → their import functions (extracted from the router definition)
const prefetchMap = new Map<string, () => Promise<unknown>>();

function buildMap(routes: RouteRecordRaw[]) {
  for (const r of routes) {
    if (typeof r.component === "function") {
      prefetchMap.set(r.name as string, r.component as () => Promise<unknown>);
    }
    if (r.children) buildMap(r.children);
  }
}

export function initPrefetch(routes: RouteRecordRaw[]) {
  buildMap(routes);

  // Global hover prefetch: any <a> or <RouterLink> pointing to /article/*
  // triggers a prefetch of the article route chunk on mouseenter/touchstart.
  // This covers ALL article links across the entire site without modifying
  // individual editorial layout components.
  document.addEventListener(
    "pointerenter",
    (e) => {
      const target = (e.target as HTMLElement).closest("a[href]");
      if (!target) return;
      const href = target.getAttribute("href") ?? "";
      // Match /article/*, /kh/news/*, /en/news/*, /zh/news/*
      if (/^\/((kh|en|zh)\/news\/|article\/)/.test(href)) {
        const loader = prefetchMap.get("article");
        if (loader && !prefetching) {
          prefetching = true;
          loader().finally(() => {
            setTimeout(() => { prefetching = false; }, 2000);
          });
        }
      }
    },
    { capture: true, passive: true }
  );
}

let prefetching = false;

export const vPrefetch: Directive<HTMLElement, string> = {
  mounted(el, binding) {
    const routeName = binding.value;
    if (!routeName) return;

    const loader = prefetchMap.get(routeName);
    if (!loader) return;

    const trigger = () => {
      if (prefetching) return;
      prefetching = true;
      loader().finally(() => {
        // Small delay so rapid hovers don't re-trigger immediately
        setTimeout(() => { prefetching = false; }, 2000);
      });
    };

    el.addEventListener("pointerenter", trigger, { once: true, passive: true });
    // Also handle touch for mobile
    el.addEventListener("touchstart", trigger, { once: true, passive: true });
  },
};
