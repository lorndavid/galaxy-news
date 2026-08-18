<template>
  <div
    v-if="data && data.enabled && data.items.length"
    class="g-ticker"
    :class="`g-ticker--${data.speed}`"
    role="marquee"
    aria-label="Live news ticker"
  >
    <!-- Diagonal-cut LIVE badge -->
    <div class="g-ticker-badge">
      <span class="g-ticker-pulse" aria-hidden="true"></span>
      <span class="g-ticker-badge-text">{{ data.title }}</span>
    </div>

    <!-- Auto-scrolling headlines -->
    <div class="g-ticker-viewport">
      <div
        class="g-ticker-track"
        :class="data.direction === 'right' ? 'is-right' : 'is-left'"
      >
        <a
          v-for="(item, i) in loopItems"
          :key="`${item.slug}-${i}`"
          class="g-ticker-item"
          :href="`/article/${item.slug}`"
        >
          {{ displayTitle(item) }}
        </a>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from "vue";
import { useLocaleStore } from "@/stores/locale";
import { contentService } from "@/services/content.service";
import type { TickerData } from "@/types";

const locale = useLocaleStore();
const data = ref<TickerData | null>(null);
let pollTimer: number | undefined;

// Loop the list twice so the marquee never shows a gap when wrapping
const loopItems = computed(() => {
  const items = data.value?.items ?? [];
  return items.length > 1 ? [...items, ...items] : items;
});

function displayTitle(item: { title: string; titleEn: string | null }) {
  return locale.pick(item.title, item.titleEn);
}

async function load() {
  try {
    data.value = await contentService.ticker();
  } catch {
    // keep last known state
  }
}

onMounted(() => {
  load();
  const refreshMs = Math.max((data.value?.refresh ?? 30) * 1000, 10_000);
  pollTimer = window.setInterval(load, refreshMs);
});

onUnmounted(() => {
  if (pollTimer) window.clearInterval(pollTimer);
});
</script>

<style scoped>
/* ==================================================================
   Galaxy TV Live Ticker — signature diagonal-cut LIVE badge
   High contrast, sticky-capable, auto-scrolling headlines
=================================================================== */
.g-ticker {
  display: flex;
  align-items: stretch;
  overflow: hidden;
  position: relative;
  z-index: 990;
  background: var(--color-primary, #0b1c39);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

/* ─── Diagonal-cut LIVE badge ─── */
.g-ticker-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
  background: var(--color-live, #dc2626);
  color: #fff;
  padding: 0 20px;
  min-height: 40px;
  white-space: nowrap;
  position: relative;
  /* Diagonal cut on the right edge */
  clip-path: polygon(0 0, calc(100% - 12px) 0, 100% 100%, 0 100%);
  padding-right: 28px;
}
.g-ticker-badge-text {
  font-family: var(--font-latin, "Inter", sans-serif);
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

/* Pulsing red dot */
.g-ticker-pulse {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #fff;
  flex-shrink: 0;
  animation: g-ticker-blink 1.4s ease-in-out infinite;
  box-shadow: 0 0 6px rgba(255, 255, 255, 0.6);
}
@keyframes g-ticker-blink {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.3; transform: scale(0.85); }
}

/* ─── Scrolling viewport ─── */
.g-ticker-viewport {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  display: flex;
  align-items: center;
}
.g-ticker-track {
  display: inline-flex;
  align-items: center;
  white-space: nowrap;
  will-change: transform;
}
.g-ticker-track.is-left {
  animation: g-ticker-scroll-left var(--ticker-duration, 60s) linear infinite;
}
.g-ticker-track.is-right {
  animation: g-ticker-scroll-right var(--ticker-duration, 60s) linear infinite;
}
.g-ticker:hover .g-ticker-track {
  animation-play-state: paused;
}

/* Individual headline item */
.g-ticker-item {
  display: inline-block;
  padding: 0 24px;
  font-family: var(--font-body, "Noto Sans Khmer", sans-serif);
  font-size: 14px;
  line-height: 40px;
  color: rgba(255, 255, 255, 0.9);
  text-decoration: none;
  transition: color 0.2s ease;
  border-right: 1px solid rgba(255, 255, 255, 0.12);
  overflow-wrap: anywhere;
}
.g-ticker-item:hover {
  color: #fff;
  text-decoration: underline;
  text-underline-offset: 3px;
}

/* Speed presets */
.g-ticker--slow .g-ticker-track { --ticker-duration: 90s; }
.g-ticker--medium .g-ticker-track { --ticker-duration: 55s; }
.g-ticker--fast .g-ticker-track { --ticker-duration: 30s; }

@keyframes g-ticker-scroll-left {
  from { transform: translateX(0); }
  to { transform: translateX(-50%); }
}
@keyframes g-ticker-scroll-right {
  from { transform: translateX(-50%); }
  to { transform: translateX(0); }
}

/* Reduced motion: static readable list */
@media (prefers-reduced-motion: reduce) {
  .g-ticker-track.is-left,
  .g-ticker-track.is-right {
    animation: none;
    flex-wrap: wrap;
    white-space: normal;
  }
  .g-ticker-pulse {
    animation: none;
    opacity: 1;
  }
}

/* Mobile */
@media (max-width: 640px) {
  .g-ticker-badge {
    padding: 0 14px;
    padding-right: 22px;
    min-height: 36px;
  }
  .g-ticker-badge-text {
    font-size: 11px;
  }
  .g-ticker-item {
    font-size: 13px;
    padding: 0 16px;
    line-height: 36px;
  }
}
</style>
