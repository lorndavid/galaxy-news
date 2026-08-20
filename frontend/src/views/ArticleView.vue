<template>
  <div class="news-detail-area">
    <!-- Floating share rail — left side, appears on scroll -->
    <Transition name="share-rail">
      <aside v-if="showShareRail && shareLinks.length" class="g-share-rail" aria-label="ចែករំលែកអត្ថបទ">
        <span class="g-share-rail-label">{{ t.article.share }}</span>
        <a
          v-for="l in shareLinks"
          :key="l.key"
          :href="l.href"
          target="_blank"
          rel="noopener noreferrer"
          :style="{ background: l.color }"
          :aria-label="l.label"
          :title="l.label"
        >
          <i :class="l.icon"></i>
        </a>
        <button
          class="g-share-rail-copy"
          :style="{ background: '#0b1c39' }"
          :aria-label="t.article.share"
          :title="copied ? '✓' : 'Copy link'"
          @click="copyLink"
        >
          <i :class="copied ? 'ti-check' : 'ti-link'"></i>
        </button>
      </aside>
    </Transition>

    <div class="container">
      <div v-if="loading" class="row"><div class="col-12"><SkeletonArticle /></div></div>

      <div v-else-if="error" class="row"><div class="col-12"><ErrorState :message="error" @retry="load" /></div></div>

      <div v-else-if="article" class="row">
        <div class="col-lg-8">
          <nav class="g-breadcrumb" aria-label="Breadcrumb">
            <RouterLink to="/">{{ t.nav.home }}</RouterLink>
            <span aria-hidden="true">/</span>
            <RouterLink v-if="article.category" :to="`/category/${article.category.slug}`">{{ catName(article) }}</RouterLink>
            <span v-if="article.category" aria-hidden="true">/</span>
            <span>{{ title(article) }}</span>
          </nav>
          <div class="news-detail-wrap">
            <span class="news-cat" :style="catStyle">{{ catName(article) }}</span>
            <h1 class="news-title">{{ title(article) }}</h1>

            <div class="news-meta">
              <span v-if="article.publishedAt"><i class="ti-calendar"></i> {{ formatDateFull(article.publishedAt) }}</span>
              <span><i class="ti-user"></i> {{ article.author?.name }}</span>
            </div>

            <div class="news-thumb">
              <ArticleThumb :src="article.featuredImage" :alt="title(article)" />
            </div>

            <!-- Gallery images — switchable 2/3/4 column layout -->
            <div v-if="article.images?.length" class="news-gallery-block">
              <div class="news-gallery-toolbar">
                <span class="news-gallery-label"><i class="fas fa-images" aria-hidden="true"></i> {{ article.images.length }}</span>
                <div class="news-gallery-cols" role="radiogroup" aria-label="Gallery columns">
                  <button
                    v-for="c in [2, 3, 4]"
                    :key="c"
                    type="button"
                    class="news-gallery-col-btn"
                    :class="{ active: galleryCols === c }"
                    :aria-label="`${c} columns`"
                    :aria-pressed="galleryCols === c"
                    @click="galleryCols = c"
                  >
                    <template v-for="n in c" :key="n"><span class="col-dot" /><template v-if="n < c"> </template></template>
                  </button>
                </div>
              </div>
              <div class="news-gallery" :style="{ '--gallery-cols': galleryCols }">
                <button
                  v-for="(img, i) in article.images"
                  :key="img.id"
                  type="button"
                  class="news-gallery-item"
                  :aria-label="img.altText || title(article)"
                  @click="openLightbox(i)"
                >
                  <img :src="img.url" :alt="img.altText || title(article)" loading="lazy" decoding="async" />
                  <div v-if="img.title || img.description || img.caption" class="news-gallery-meta">
                    <strong v-if="img.title" class="news-gallery-title">{{ img.title }}</strong>
                    <p v-if="img.description" class="news-gallery-desc">{{ img.description }}</p>
                    <span v-else-if="img.caption" class="news-gallery-caption">{{ img.caption }}</span>
                  </div>
                </button>
              </div>
            </div>

            <div class="news-body">
              <p v-if="localizedExcerpt" class="news-lead">{{ localizedExcerpt }}</p>
              <!-- Article content -->
              <div class="news-content news-content-read" v-html="sanitizedContent"></div>

              <div v-if="article.tags?.length" class="news-tags">
                <RouterLink
                  v-for="tag in article.tags"
                  :key="tag.id"
                  :to="{ name: 'search', query: { q: tag.name } }"
                  class="tag-chip"
                >#{{ tag.name }}</RouterLink>
              </div>
            </div>


          </div>
        </div>

        <!-- Sidebar -->
        <div class="col-lg-4">
          <AdSlot position="sidebar" />
          <SidebarPopular :articles="popular" />
          <NavatraPoster />
        </div>
      </div>

      <!-- Related -->
      <div v-if="related.length" v-reveal class="news-related">
        <SectionTitle :title="t.article.related" to="/news" />
        <div class="row">
          <div v-for="(a, i) in related" :key="a.id" class="col-lg-4 col-md-6">
            <div v-reveal="i">
              <ArticleCard :article="a" />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Gallery lightbox -->
    <Teleport to="body">
      <Transition name="lightbox">
        <div
          v-if="lightboxIndex !== null"
          class="g-lightbox"
          role="dialog"
          aria-modal="true"
          :aria-label="t.article.share"
        >
          <button type="button" class="g-lightbox-close" aria-label="បិទ" @click="closeLightbox"><i class="ti-close"></i></button>
          <button type="button" class="g-lightbox-prev" aria-label="មុន" @click="lightboxPrev"><i class="ti-angle-left"></i></button>
          <figure class="g-lightbox-figure">
            <img :src="currentLightbox?.url" :alt="currentLightbox?.altText || (article ? title(article) : '')" />
            <figcaption v-if="currentLightbox?.caption" class="g-lightbox-caption">{{ currentLightbox.caption }}</figcaption>
          </figure>
          <button type="button" class="g-lightbox-next" aria-label="បន្ទាប់" @click="lightboxNext"><i class="ti-angle-right"></i></button>
          <span class="g-lightbox-count">
            {{ lightboxIndex !== null ? String(lightboxIndex + 1).padStart(2, "0") : "00" }} / {{ String(article?.images?.length ?? 0).padStart(2, "0") }}
          </span>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { useSeo } from "@/composables/useSeo";
import { articleService } from "@/services/article.service";
import { useLocaleStore } from "@/stores/locale";
import { useSettingsStore } from "@/stores/settings";
import type { Article } from "@/types";
import ArticleThumb from "@/components/common/ArticleThumb.vue";
import SectionTitle from "@/components/common/SectionTitle.vue";
import SkeletonArticle from "@/components/common/SkeletonArticle.vue";
import ErrorState from "@/components/common/ErrorState.vue";
import ArticleCard from "@/components/article/ArticleCard.vue";
import SidebarPopular from "@/components/article/SidebarPopular.vue";
import AdSlot from "@/components/ads/AdSlot.vue";
import NavatraPoster from "@/components/article/NavatraPoster.vue";
import { useLocalized } from "@/composables/useLocalized";
import { useShareLinks } from "@/composables/useShareLinks";

const route = useRoute();
const localeStore = useLocaleStore();
const settingsStore = useSettingsStore();

// The language in the URL (/kh/news/…, /en/news/…) takes priority over the
// stored preference — Telegram deep links must open in the right language.
function syncLocaleFromRoute() {
  const loc = route.meta.locale as "kh" | "en" | "zh" | undefined;
  if (loc) localeStore.setLocale(loc);
}
watch(() => route.meta.locale, syncLocaleFromRoute);

const article = ref<Article | null>(null);
const related = ref<Article[]>([]);
const popular = ref<Article[]>([]);
const loading = ref(true);
const error = ref("");

const { title, excerpt, content, catName, t, formatDateFull } = useLocalized();

const localizedExcerpt = computed(() => (article.value ? excerpt(article.value) : ""));
const localizedContent = computed(() => (article.value ? content(article.value) : ""));

const catStyle = computed(() => {
  const color = article.value?.category?.color;
  return color ? { background: color, borderColor: color } : {};
});

const sanitizedContent = computed(() => {
  const raw = localizedContent.value;
  // Lightweight sanitize: strip script/iframe/on* attributes.
  return raw
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, "")
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "");
});

const pageUrl = computed(() => window.location.href);
const shareTitle = computed(() => title(article.value as never));
const { links: shareLinks } = useShareLinks(() => pageUrl.value, () => shareTitle.value);

// ---- Floating share rail (left side, appears on scroll) ----
const showShareRail = ref(false);
const copied = ref(false);
let copyTimer: number | undefined;
let scrollTimer: number | undefined;

function onScroll() {
  if (scrollTimer) window.clearTimeout(scrollTimer);
  scrollTimer = window.setTimeout(() => {
    showShareRail.value = window.scrollY > 520;
  }, 60);
}

async function copyLink() {
  try {
    await navigator.clipboard.writeText(pageUrl.value);
    copied.value = true;
    if (copyTimer) window.clearTimeout(copyTimer);
    copyTimer = window.setTimeout(() => (copied.value = false), 1600);
  } catch {
    // clipboard unavailable — do nothing
  }
}

// ---- Gallery column switcher ----
const galleryCols = ref(3);
watch(article, (a) => { if (a) galleryCols.value = a.galleryColumns ?? 3; });

// ---- Gallery lightbox ----
const lightboxIndex = ref<number | null>(null);
const galleryImages = computed(() => article.value?.images ?? []);
const currentLightbox = computed(() =>
  lightboxIndex.value !== null ? galleryImages.value[lightboxIndex.value] : null
);
const lightboxCount = computed(() => galleryImages.value.length);

function openLightbox(i: number) {
  lightboxIndex.value = i;
  document.body.style.overflow = "hidden";
}

function closeLightbox() {
  lightboxIndex.value = null;
  document.body.style.overflow = "";
}

function lightboxPrev() {
  if (lightboxIndex.value === null || !lightboxCount.value) return;
  lightboxIndex.value = (lightboxIndex.value - 1 + lightboxCount.value) % lightboxCount.value;
}

function lightboxNext() {
  if (lightboxIndex.value === null || !lightboxCount.value) return;
  lightboxIndex.value = (lightboxIndex.value + 1) % lightboxCount.value;
}

function onKeydown(e: KeyboardEvent) {
  if (lightboxIndex.value === null) return;
  if (e.key === "Escape") closeLightbox();
  if (e.key === "ArrowLeft") lightboxPrev();
  if (e.key === "ArrowRight") lightboxNext();
}

useSeo(
  computed(() => {
    const a = article.value;
    const base = window.location.origin;
    return {
      title: `${a ? title(a) : "Galaxy TV V4K"} | Galaxy TV V4K`,
      description: a ? excerpt(a) || title(a) : "",
      image: a?.featuredImage,
      url: pageUrl.value,
      type: "article",
      jsonLd: a
        ? [
            {
              "@context": "https://schema.org",
              "@type": "NewsArticle",
              headline: title(a),
              description: excerpt(a) || undefined,
              image: a.featuredImage ?? undefined,
              datePublished: a.publishedAt ?? a.createdAt,
              dateModified: a.updatedAt,
              url: pageUrl.value,
              author: { "@type": "Person", name: a.author?.name ?? "Galaxy TV V4K" },
              publisher: {
                "@type": "Organization",
                name: settingsStore.settings?.siteName ?? "Galaxy TV V4K",
                logo: settingsStore.settings?.logo
                  ? { "@type": "ImageObject", url: settingsStore.settings.logo }
                  : undefined,
              },
              mainEntityOfPage: { "@type": "WebPage", "@id": pageUrl.value },
            },
            {
              "@context": "https://schema.org",
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: t.nav.home, item: base },
                {
                  "@type": "ListItem",
                  position: 2,
                  name: catName(a) || t.nav.news,
                  item: `${base}/category/${a.category?.slug ?? "news"}`,
                },
                { "@type": "ListItem", position: 3, name: title(a) },
              ],
            },
          ]
        : [],
    };
  })
);

async function load() {
  loading.value = true;
  error.value = "";
  try {
    const slug = String(route.params.slug);
    const [a, rel, pop] = await Promise.all([
      articleService.getBySlug(slug),
      articleService.related(slug).catch(() => []),
      articleService.popular(5).catch(() => []),
    ]);
    article.value = a;
    related.value = rel.slice(0, 6);
    popular.value = pop;

  } catch (e) {
    error.value = e instanceof Error ? e.message : t.article.loadFailed;
  } finally {
    loading.value = false;
  }
}



onMounted(() => {
  syncLocaleFromRoute();
  settingsStore.load();
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("keydown", onKeydown);
  load();
});

onUnmounted(() => {
  window.removeEventListener("scroll", onScroll);
  window.removeEventListener("keydown", onKeydown);
  document.body.style.overflow = "";
  if (scrollTimer) window.clearTimeout(scrollTimer);
  if (copyTimer) window.clearTimeout(copyTimer);
});
</script>

<style scoped>
/* Breadcrumb */
.g-breadcrumb {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px 0 0;
  font-size: 13px;
  color: var(--color-muted);
  flex-wrap: wrap;
}
.g-breadcrumb a {
  color: var(--color-muted);
  text-decoration: none;
  transition: color 0.2s ease;
}
.g-breadcrumb a:hover {
  color: var(--color-accent);
}
.g-breadcrumb span:last-child {
  color: var(--color-text);
  font-weight: 600;
  max-width: 300px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
/* ─── Floating share rail (left side) ─── */
.g-share-rail {
  position: fixed;
  left: 18px;
  top: 46%;
  transform: translateY(-50%);
  z-index: 940;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}
.g-share-rail-label {
  font-size: 10px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--color-muted, #6b7280);
  writing-mode: vertical-rl;
  margin-bottom: 2px;
}
.g-share-rail a,
.g-share-rail button {
  width: 38px;
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  color: #fff;
  font-size: 15px;
  cursor: pointer;
  transition: transform 0.2s ease, filter 0.2s ease;
}
.g-share-rail a:hover,
.g-share-rail button:hover {
  transform: translateX(3px);
  filter: brightness(1.12);
}
@media (max-width: 1399px) {
  .g-share-rail {
    display: none;
  }
}
.share-rail-enter-active,
.share-rail-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}
.share-rail-enter-from,
.share-rail-leave-to {
  opacity: 0;
  transform: translateY(-50%) translateX(-10px);
}

/* ─── Gallery block (toolbar + grid) ─── */
.news-gallery-block {
  margin: 24px 0;
}
.news-gallery-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 0 12px;
  border-bottom: 1px solid var(--color-border, #e5e7eb);
  margin-bottom: 16px;
}
.news-gallery-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-muted, #6b7280);
  display: flex;
  align-items: center;
  gap: 6px;
}
.news-gallery-label i {
  font-size: 14px;
  color: var(--color-accent, #fc3f00);
}
.news-gallery-cols {
  display: flex;
  align-items: center;
  gap: 4px;
}
.news-gallery-col-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 3px;
  width: 36px;
  height: 28px;
  border: 1px solid var(--color-border, #e5e7eb);
  border-radius: 6px;
  background: var(--color-surface, #fff);
  color: var(--color-muted, #9ca3af);
  cursor: pointer;
  transition: all 0.15s ease;
  padding: 0;
}
.news-gallery-col-btn:hover {
  border-color: var(--color-accent, #fc3f00);
  color: var(--color-accent, #fc3f00);
}
.news-gallery-col-btn.active {
  background: var(--color-accent, #fc3f00);
  border-color: var(--color-accent, #fc3f00);
  color: #fff;
}
.col-dot {
  display: inline-block;
  width: 4px;
  height: 12px;
  border-radius: 1px;
  background: currentColor;
}

/* ─── Gallery grid ─── */
.news-gallery {
  display: grid;
  grid-template-columns: repeat(var(--gallery-cols, 3), 1fr);
  gap: 14px;
}
.news-gallery-item {
  position: relative;
  display: flex;
  flex-direction: column;
  padding: 0;
  border: none;
  background: var(--color-surface, #fff);
  border: 1px solid var(--color-border, #e5e7eb);
  border-radius: 8px;
  overflow: hidden;
  text-align: left;
  cursor: zoom-in;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.news-gallery-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0,0,0,0.08);
}
.news-gallery-item img {
  width: 100%;
  aspect-ratio: 16 / 10;
  display: block;
  object-fit: cover;
}
.news-gallery-meta {
  padding: 10px 12px 12px;
  border-top: 1px solid var(--color-border, #f0f0f0);
}
.news-gallery-title {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text, #0b1c39);
  line-height: 1.4;
  margin-bottom: 2px;
}
.news-gallery-desc {
  font-size: 12px;
  color: var(--color-muted, #6b7280);
  line-height: 1.5;
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.news-gallery-caption {
  display: block;
  margin: 0;
  font-size: 12px;
  color: var(--color-muted, #6b7280);
  font-style: italic;
  line-height: 1.5;
}

/* ─── Gallery responsive ─── */
@media (max-width: 767px) {
  .news-gallery-toolbar {
    padding: 8px 0 10px;
  }
  .news-gallery {
    grid-template-columns: 1fr 1fr !important;
    gap: 10px;
  }
}
@media (max-width: 460px) {
  .news-gallery {
    grid-template-columns: 1fr !important;
  }
  .news-gallery-item img {
    aspect-ratio: 16 / 9;
  }
}

/* ─── Lightbox ─── */
.g-lightbox {
  position: fixed;
  inset: 0;
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(4, 8, 18, 0.94);
  padding: 24px;
}
.g-lightbox-figure {
  margin: 0;
  max-width: min(1080px, 92vw);
  max-height: 88vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}
.g-lightbox-figure img {
  max-width: 100%;
  max-height: 78vh;
  object-fit: contain;
  display: block;
}
.g-lightbox-caption {
  color: rgba(255, 255, 255, 0.85);
  font-size: 13.5px;
  font-style: italic;
  text-align: center;
}
.g-lightbox-close,
.g-lightbox-prev,
.g-lightbox-next {
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  cursor: pointer;
  transition: background 0.2s ease;
}
.g-lightbox-close {
  top: 18px;
  right: 18px;
  width: 42px;
  height: 42px;
  font-size: 18px;
}
.g-lightbox-prev,
.g-lightbox-next {
  top: 50%;
  transform: translateY(-50%);
  width: 44px;
  height: 64px;
  font-size: 20px;
}
.g-lightbox-prev { left: 14px; }
.g-lightbox-next { right: 14px; }
.g-lightbox-close:hover,
.g-lightbox-prev:hover,
.g-lightbox-next:hover {
  background: rgba(255, 255, 255, 0.22);
}
.g-lightbox-count {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  color: rgba(255, 255, 255, 0.6);
  font-family: var(--font-latin), monospace;
  font-size: 13px;
  letter-spacing: 0.08em;
}
.lightbox-enter-active,
.lightbox-leave-active {
  transition: opacity 0.22s ease;
}
.lightbox-enter-from,
.lightbox-leave-to {
  opacity: 0;
}

.news-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 20px;
}
.tag-chip {
  background: var(--color-surface-alt);
  color: var(--color-accent);
  font-size: 13px;
  padding: 5px 12px;
  border-radius: 20px;
  transition: background 0.2s ease, color 0.2s ease;
}
.tag-chip:hover {
  background: var(--color-accent);
  color: #fff;
}
.news-content img {
  max-width: 100%;
  height: auto;
  border-radius: 10px;
  margin: 16px 0;
}
.news-content h2,
.news-content h3 {
  color: #0b1c39;
  margin: 20px 0 10px;
}

/* Reading width — keep paragraphs comfortable instead of full-column wide */
.news-content-read {
  max-width: 720px;
}
.news-content-read p {
  text-wrap: pretty;
}
.news-content-read img {
  display: block;
  margin-left: auto;
  margin-right: auto;
}
.news-content blockquote {
  border-left: 4px solid var(--color-accent);
  background: var(--color-surface-alt);
  padding: 16px 20px;
  margin: 18px 0;
  color: var(--color-text-secondary);
}
.news-content a {
  color: var(--color-accent);
  text-decoration: underline;
}

/* ─── Mobile article optimizations ─── */
@media (max-width: 640px) {
  .g-breadcrumb {
    font-size: 12px;
    padding: 12px 0 0;
  }
  .g-breadcrumb span:last-child {
    max-width: 180px;
  }
  .news-content-read {
    max-width: 100%;
  }
  .news-gallery-toolbar {
    flex-wrap: wrap;
    gap: 6px;
  }
  .news-gallery-meta {
    padding: 8px 10px 10px;
  }
  .news-gallery-title {
    font-size: 12.5px;
  }
  .news-gallery-desc {
    font-size: 11.5px;
    -webkit-line-clamp: 2;
  }
  .news-tags {
    gap: 6px;
  }
  .tag-chip {
    font-size: 12px;
    padding: 4px 10px;
  }
  .g-lightbox {
    padding: 12px;
  }
  .g-lightbox-prev,
  .g-lightbox-next {
    width: 36px;
    height: 52px;
    font-size: 16px;
  }
  .g-lightbox-prev { left: 8px; }
  .g-lightbox-next { right: 8px; }
}
</style>
