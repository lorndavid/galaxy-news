<template>
  <div class="g-live-page">
    <div class="container">
      <!-- Breadcrumb -->
      <nav class="g-breadcrumb" aria-label="Breadcrumb">
        <RouterLink to="/">{{ locale.pick('ទំព័រដើម', 'Home', '首页') }}</RouterLink>
        <span>/</span>
        <span>{{ locale.pick('ផ្សាយផ្ទាល់', 'Live', '直播') }}</span>
      </nav>

      <!-- Active Live Stream -->
      <section v-if="activeStream" class="g-live-hero" v-reveal>
        <div class="g-live-badge">
          <span class="g-live-dot"></span>
          {{ locale.pick('កំពុងផ្សាយផ្ទាល់', 'LIVE NOW', '正在直播') }}
        </div>
        <div class="g-live-player">
          <iframe
            :src="toEmbedUrl(activeStream.facebookUrl)"
            class="g-live-iframe"
            allowfullscreen
            allow="autoplay; encrypted-media"
            loading="eager"
          ></iframe>
        </div>
        <div class="g-live-info">
          <h1>{{ locale.pick(activeStream.titleKh, activeStream.titleEn, activeStream.titleZh) }}</h1>
          <p v-if="locale.pick(activeStream.descriptionKh, activeStream.descriptionEn, activeStream.descriptionZh)" class="g-live-desc">
            {{ locale.pick(activeStream.descriptionKh, activeStream.descriptionEn, activeStream.descriptionZh) }}
          </p>
          <div class="g-live-meta">
            <span v-if="activeStream.startAt"><i class="ti-calendar"></i> {{ formatDate(activeStream.startAt) }}</span>
          </div>
        </div>
      </section>

      <!-- No active stream -->
      <section v-else-if="!loading" class="g-live-empty" v-reveal>
        <div class="g-live-empty-icon"><i class="fas fa-broadcast-tower"></i></div>
        <h2>{{ locale.pick('មិនមានការផ្សាយផ្ទាល់', 'No Live Stream', '暂无直播') }}</h2>
        <p>{{ locale.pick('សូមពិនិត្យមើលទំព័រនេះនៅពេលក្រោយ', 'Check back later for live broadcasts', '请稍后再来查看直播') }}</p>
      </section>

      <!-- Loading -->
      <section v-if="loading" class="g-live-loading">
        <div class="g-live-skeleton"></div>
        <div class="g-live-skeleton-text"></div>
      </section>

      <!-- Upcoming Streams -->
      <section v-if="upcomingStreams.length" class="g-live-upcoming" v-reveal>
        <div class="g-live-section-header">
          <h2>{{ locale.pick('ការផ្សាយនឹងមកដល់', 'Upcoming Streams', '即将直播') }}</h2>
        </div>
        <div class="g-live-grid">
          <div v-for="s in upcomingStreams" :key="s.id" class="g-live-card">
            <div class="g-live-card-thumb">
              <img v-if="s.thumbnailUrl" :src="s.thumbnailUrl" :alt="s.titleKh" loading="lazy" />
              <div v-else class="g-live-card-placeholder"><i class="fas fa-video"></i></div>
              <span class="g-live-card-status g-live-card-status--scheduled">
                {{ locale.pick('នឹងផ្សាយ', 'Scheduled', '已安排') }}
              </span>
            </div>
            <div class="g-live-card-body">
              <h3>{{ locale.pick(s.titleKh, s.titleEn, s.titleZh) }}</h3>
              <p v-if="s.startAt" class="g-live-card-date">
                <i class="ti-calendar"></i> {{ formatDate(s.startAt) }}
              </p>
            </div>
          </div>
        </div>
      </section>

      <!-- Recent / Ended Streams -->
      <section v-if="recentStreams.length" class="g-live-recent" v-reveal>
        <div class="g-live-section-header">
          <h2>{{ locale.pick('ការផ្សាយកន្លងមក', 'Past Streams', '历史直播') }}</h2>
        </div>
        <div class="g-live-grid">
          <div v-for="s in recentStreams" :key="s.id" class="g-live-card">
            <div class="g-live-card-thumb">
              <img v-if="s.thumbnailUrl" :src="s.thumbnailUrl" :alt="s.titleKh" loading="lazy" />
              <div v-else class="g-live-card-placeholder"><i class="fas fa-video"></i></div>
              <span class="g-live-card-status g-live-card-status--ended">
                {{ locale.pick('បានបញ្ចប់', 'Ended', '已结束') }}
              </span>
            </div>
            <div class="g-live-card-body">
              <h3>{{ locale.pick(s.titleKh, s.titleEn, s.titleZh) }}</h3>
              <p v-if="s.descriptionKh || s.descriptionEn || s.descriptionZh" class="g-live-card-desc">
                {{ locale.pick(s.descriptionKh, s.descriptionEn, s.descriptionZh) }}
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { RouterLink } from "vue-router";
import { useSeo } from "@/composables/useSeo";
import { useLocalized } from "@/composables/useLocalized";
import { api, unwrap } from "@/services/api";
import type { LiveStream } from "@/types";

const { locale } = useLocalized();
const loading = ref(true);
const streams = ref<LiveStream[]>([]);

useSeo(
  computed(() => ({
    title: locale.pick("ផ្សាយផ្ទាល់ | Galaxy TV V4K", "Live | Galaxy TV V4K", "直播 | Galaxy TV V4K"),
    description: locale.pick("ការផ្សាយផ្ទាល់ព័ត៌មាន", "Live news broadcasts", "直播新闻"),
    url: window.location.href,
  }))
);

const activeStream = computed(() =>
  streams.value.find((s) => s.effectiveStatus === "LIVE" || s.status === "LIVE")
);

const upcomingStreams = computed(() =>
  streams.value.filter((s) => s.effectiveStatus === "SCHEDULED")
);

const recentStreams = computed(() =>
  streams.value.filter((s) => s.effectiveStatus === "ENDED" || s.status === "ENDED")
);

function toEmbedUrl(url: string): string {
  const match = url.match(/facebook\.com\/.*\/videos\/(\d+)/);
  if (match) return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}`;
  const watchMatch = url.match(/fb\.watch\/(\w+)/);
  if (watchMatch) return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}`;
  return `https://www.facebook.com/plugins/post.php?href=${encodeURIComponent(url)}&show_text=true&width=800`;
}

function formatDate(v: string | null): string {
  if (!v) return "";
  try {
    return new Date(v).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return v;
  }
}

onMounted(async () => {
  try {
    streams.value = await unwrap<LiveStream[]>(api.get("/live-streams"));
  } catch {
    streams.value = [];
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.g-live-page { padding: 20px 0 60px; }

.g-breadcrumb {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 24px;
  font-size: 13px;
  color: var(--color-muted);
  flex-wrap: nowrap;
  overflow-x: auto;
  white-space: nowrap;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}
.g-breadcrumb::-webkit-scrollbar {
  display: none;
}
.g-breadcrumb a { color: var(--color-primary); text-decoration: none; }
.g-breadcrumb a:hover { text-decoration: underline; }

/* ─── Live Hero ─── */
.g-live-hero {
  margin-bottom: 48px;
}
.g-live-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: #dc2626;
  color: #fff;
  font-size: 13px;
  font-weight: 700;
  padding: 6px 16px;
  border-radius: 6px 6px 0 0;
  letter-spacing: 0.03em;
}
.g-live-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #fff;
  animation: pulse-dot 1.5s ease-in-out infinite;
}
@keyframes pulse-dot {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}
@media (prefers-reduced-motion: reduce) {
  .g-live-dot { animation: none; }
}
.g-live-player {
  border-radius: 0 8px 0 0;
  overflow: hidden;
  background: #000;
  aspect-ratio: 16 / 9;
  width: 100%;
}
.g-live-iframe {
  width: 100%;
  height: 100%;
  border: 0;
}
.g-live-info {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-top: none;
  border-radius: 0 0 8px 8px;
  padding: 20px 24px;
}
.g-live-info h1 {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  line-height: 1.4;
  color: var(--color-text);
}
.g-live-desc {
  margin: 8px 0 0;
  font-size: 15px;
  color: var(--color-muted);
  line-height: 1.7;
}
.g-live-meta {
  display: flex;
  gap: 16px;
  margin-top: 12px;
  font-size: 13px;
  color: var(--color-muted);
}
.g-live-meta span {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

/* ─── Empty State ─── */
.g-live-empty {
  text-align: center;
  padding: 80px 20px;
}
.g-live-empty-icon {
  width: 80px;
  height: 80px;
  margin: 0 auto 20px;
  border-radius: 50%;
  background: var(--color-surface-alt);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  color: var(--color-muted);
}
.g-live-empty h2 {
  margin: 0 0 8px;
  font-size: 22px;
  color: var(--color-text);
}
.g-live-empty p {
  margin: 0;
  font-size: 15px;
  color: var(--color-muted);
}

/* ─── Loading ─── */
.g-live-loading { padding: 20px 0; }
.g-live-skeleton {
  width: 100%;
  aspect-ratio: 16 / 9;
  border-radius: 8px;
  background: var(--color-surface-alt);
  animation: pulse 1.5s ease-in-out infinite;
}
.g-live-skeleton-text {
  margin-top: 12px;
  height: 40px;
  border-radius: 6px;
  background: var(--color-surface-alt);
  animation: pulse 1.5s ease-in-out infinite;
}
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* ─── Section Header ─── */
.g-live-section-header {
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 2px solid var(--color-primary);
}
.g-live-section-header h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  color: var(--color-text);
}

/* ─── Grid ─── */
.g-live-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  margin-bottom: 48px;
}

/* ─── Card ─── */
.g-live-card {
  border-radius: 8px;
  overflow: hidden;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.g-live-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(0,0,0,0.08);
}
.g-live-card-thumb {
  position: relative;
  aspect-ratio: 16 / 9;
  overflow: hidden;
  background: var(--color-surface-alt);
}
.g-live-card-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.g-live-card-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  font-size: 32px;
  color: var(--color-muted);
  background: var(--color-surface-alt);
}
.g-live-card-status {
  position: absolute;
  top: 10px;
  left: 10px;
  font-size: 11px;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 4px;
  color: #fff;
  letter-spacing: 0.02em;
}
.g-live-card-status--scheduled { background: #f59e0b; }
.g-live-card-status--ended { background: #6b7280; }
.g-live-card-body { padding: 14px 16px 16px; }
.g-live-card-body h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  line-height: 1.5;
  color: var(--color-text);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.g-live-card-desc {
  margin: 6px 0 0;
  font-size: 13px;
  color: var(--color-muted);
  line-height: 1.6;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.g-live-card-date {
  margin: 6px 0 0;
  font-size: 12px;
  color: var(--color-muted);
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

/* ─── Mobile ─── */
@media (max-width: 640px) {
  .g-live-page { padding: 12px 0 40px; }
  .g-live-info { padding: 14px 16px; }
  .g-live-info h1 { font-size: 18px; }
  .g-live-grid { grid-template-columns: 1fr; gap: 14px; }
  .g-live-section-header h2 { font-size: 17px; }
}
</style>
