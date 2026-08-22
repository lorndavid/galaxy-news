<template>
  <section v-if="stream" class="g-live-banner" v-reveal>
    <div class="container">
      <div class="g-live-banner-inner">
        <div class="g-live-banner-header">
          <span class="g-live-badge-sm">
            <span class="g-live-dot-sm"></span>
            {{ locale.pick('កំពុងផ្សាយផ្ទាល់', 'LIVE') }}
          </span>
          <h3>{{ locale.pick(stream.titleKh, stream.titleEn) }}</h3>
          <RouterLink to="/live" class="g-live-view-all">
            {{ locale.pick('មើលទាំងអស់', 'View All') }} <i class="fas fa-arrow-right"></i>
          </RouterLink>
        </div>
        <div class="g-live-banner-player">
          <iframe
            :src="toEmbedUrl(stream.facebookUrl)"
            class="g-live-banner-iframe"
            allowfullscreen
            allow="autoplay; encrypted-media"
            loading="lazy"
          ></iframe>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { RouterLink } from "vue-router";
import { useLocalized } from "@/composables/useLocalized";
import { api, unwrap } from "@/services/api";
import type { LiveStream } from "@/types";

const { locale } = useLocalized();
const stream = ref<LiveStream | null>(null);

function toEmbedUrl(url: string): string {
  const match = url.match(/facebook\.com\/.*\/videos\/(\d+)/);
  if (match) return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}`;
  const watchMatch = url.match(/fb\.watch\/(\w+)/);
  if (watchMatch) return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}`;
  return `https://www.facebook.com/plugins/post.php?href=${encodeURIComponent(url)}&show_text=true&width=800`;
}

onMounted(async () => {
  try {
    const data = await unwrap<LiveStream | null>(api.get("/live-streams/homepage"));
    if (data && (data.effectiveStatus === "LIVE" || data.status === "LIVE")) {
      stream.value = data;
    }
  } catch {
    // Silently fail — banner is optional
  }
});
</script>

<style scoped>
.g-live-banner {
  padding: 0 0 32px;
}
.g-live-banner-inner {
  border-radius: 10px;
  overflow: hidden;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
}
.g-live-banner-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 20px;
  border-bottom: 1px solid var(--color-border);
}
.g-live-badge-sm {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #dc2626;
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 4px;
  letter-spacing: 0.03em;
  flex-shrink: 0;
}
.g-live-dot-sm {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #fff;
  animation: pulse-dot 1.5s ease-in-out infinite;
}
@keyframes pulse-dot {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}
@media (prefers-reduced-motion: reduce) {
  .g-live-dot-sm { animation: none; }
}
.g-live-banner-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text);
  flex: 1;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.g-live-view-all {
  flex-shrink: 0;
  font-size: 12px;
  font-weight: 600;
  color: var(--color-primary);
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
.g-live-view-all:hover { text-decoration: underline; }
.g-live-banner-player {
  aspect-ratio: 16 / 9;
  background: #000;
}
.g-live-banner-iframe {
  width: 100%;
  height: 100%;
  border: 0;
}

@media (max-width: 640px) {
  .g-live-banner-header {
    padding: 10px 14px;
    flex-wrap: wrap;
  }
  .g-live-banner-header h3 {
    font-size: 14px;
    white-space: normal;
  }
  .g-live-view-all {
    width: 100%;
    justify-content: flex-end;
  }
}
</style>
