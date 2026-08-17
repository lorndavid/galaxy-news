<template>
  <div
    v-if="data && data.enabled && data.items.length"
    class="live-ticker"
    :class="`ticker-speed-${data.speed}`"
    :style="tickerStyle"
    role="marquee"
    aria-label="Live news ticker"
  >
    <span class="live-ticker-badge" :style="{ background: data.accentColor }">
      <span class="live-dot" aria-hidden="true"></span>
      {{ data.title }}
    </span>
    <div class="live-ticker-viewport">
      <div class="live-ticker-track" :class="data.direction === 'right' ? 'is-right' : 'is-left'">
        <!-- Track duplicated for a seamless infinite loop -->
        <a
          v-for="(item, i) in loopItems"
          :key="`${item.slug}-${i}`"
          class="live-ticker-item"
          :href="`/article/${item.slug}`"
          :style="{ color: data.textColor }"
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

const tickerStyle = computed(() =>
  data.value
    ? {
        background: data.value.backgroundColor,
        borderColor: data.value.backgroundColor,
      }
    : {}
);

// Loop the list twice so the marquee never shows a gap when wrapping.
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
    // keep last known state; the ticker quietly retries on the next poll
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
.live-ticker {
  display: flex;
  align-items: stretch;
  overflow: hidden;
  position: relative;
  z-index: 990;
  border-bottom: 1px solid rgba(255, 255, 255, 0.14);
}

.live-ticker-badge {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  flex-shrink: 0;
  color: #fff;
  font-family: var(--font-body, "Noto Sans Khmer", sans-serif);
  font-size: 12.5px;
  font-weight: 700;
  letter-spacing: 0.04em;
  padding: 0 16px;
  min-height: 38px;
  white-space: nowrap;
  text-transform: uppercase;
}
.live-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #fff;
  animation: live-blink 1.4s ease-in-out infinite;
}
@keyframes live-blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.25; }
}

.live-ticker-viewport {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  display: flex;
  align-items: center;
}
.live-ticker-track {
  display: inline-flex;
  align-items: center;
  white-space: nowrap;
  will-change: transform;
}
.live-ticker-track.is-left {
  animation: ticker-left var(--ticker-duration, 60s) linear infinite;
}
.live-ticker-track.is-right {
  animation: ticker-right var(--ticker-duration, 60s) linear infinite;
}
.live-ticker:hover .live-ticker-track {
  animation-play-state: paused;
}

.live-ticker-item {
  display: inline-block;
  padding: 0 22px;
  font-family: var(--font-body, "Noto Sans Khmer", sans-serif);
  font-size: 13.5px;
  line-height: 38px;
  text-decoration: none;
  opacity: 0.92;
  transition: opacity 0.2s ease;
  border-right: 1px solid rgba(255, 255, 255, 0.16);
  overflow-wrap: anywhere;
}
.live-ticker-item:hover {
  opacity: 1;
  text-decoration: underline;
  text-underline-offset: 3px;
}

/* Speed presets — longer duration = slower */
.ticker-speed-slow .live-ticker-track { --ticker-duration: 90s; }
.ticker-speed-medium .live-ticker-track { --ticker-duration: 55s; }
.ticker-speed-fast .live-ticker-track { --ticker-duration: 30s; }

@keyframes ticker-left {
  from { transform: translateX(0); }
  to { transform: translateX(-50%); }
}
@keyframes ticker-right {
  from { transform: translateX(-50%); }
  to { transform: translateX(0); }
}

/* Reduced motion: static readable list instead of continuous scroll */
@media (prefers-reduced-motion: reduce) {
  .live-ticker-track.is-left,
  .live-ticker-track.is-right {
    animation: none;
    flex-wrap: wrap;
    white-space: normal;
  }
  .live-ticker-item {
    line-height: 30px;
  }
}

@media (max-width: 640px) {
  .live-ticker-badge {
    padding: 0 12px;
    font-size: 11.5px;
  }
  .live-ticker-item {
    font-size: 12.5px;
    padding: 0 14px;
  }
}
</style>
