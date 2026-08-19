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
          <div class="news-detail-wrap">
            <span class="news-cat" :style="catStyle">{{ catName(article) }}</span>
            <h1 class="news-title">{{ title(article) }}</h1>

            <div class="news-meta">
              <span v-if="article.publishedAt"><i class="ti-calendar"></i> {{ formatKhmerDateFull(article.publishedAt) }}</span>
              <span><i class="ti-user"></i> {{ article.author?.name }}</span>
              <span><i class="ti-timer"></i> {{ toKhmerDigits(readingTime(localizedContent)) }} {{ t.common.minuteRead }}</span>
              <span><i class="ti-eye"></i> {{ formatViews(article.views) }} {{ t.common.times }}</span>
            </div>

            <div class="news-thumb">
              <ArticleThumb :src="article.featuredImage" :alt="title(article)" />
            </div>

            <!-- Gallery images — grid layout set from the admin editor -->
            <div v-if="article.images?.length" class="news-gallery" :style="{ '--gallery-cols': article.galleryColumns || 3 }">
              <button
                v-for="(img, i) in article.images"
                :key="img.id"
                type="button"
                class="news-gallery-item"
                :aria-label="img.altText || title(article)"
                @click="openLightbox(i)"
              >
                <img :src="img.url" :alt="img.altText || title(article)" loading="lazy" decoding="async" />
                <span v-if="img.caption" class="news-gallery-caption">{{ img.caption }}</span>
              </button>
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

            <!-- Comments -->
            <div class="news-comments">
              <h3 class="side-title">{{ t.article.comments }} ({{ comments.length }})</h3>
              <div v-if="comments.length" class="comment-list">
                <div v-for="c in comments" :key="c.id" class="single-comment">
                  <div class="comment-head">
                    <strong>{{ c.name }}</strong>
                    <span class="comment-date">{{ formatKhmerDate(c.createdAt) }}</span>
                  </div>
                  <p>{{ c.content }}</p>
                </div>
              </div>
              <EmptyState v-else :message="t.article.noComments" />

              <form class="comment-form mt-4" @submit.prevent="submitComment">
                <h4>{{ t.article.leaveComment }}</h4>
                <div class="row">
                  <div class="col-md-6">
                    <input v-model="commentForm.name" type="text" :placeholder="t.article.name" required class="form-control" />
                  </div>
                  <div class="col-md-6">
                    <input v-model="commentForm.email" type="email" :placeholder="t.article.email" required class="form-control" />
                  </div>
                  <div class="col-12">
                    <textarea v-model="commentForm.content" rows="4" :placeholder="t.article.commentPlaceholder" required class="form-control"></textarea>
                  </div>
                  <div class="col-12">
                    <button type="submit" class="btn boxed-btn" :disabled="commentSending">
                      {{ commentSending ? t.article.sendingComment : t.article.sendComment }}
                    </button>
                  </div>
                  <p v-if="commentMsg" class="col-12 comment-msg">{{ commentMsg }}</p>
                </div>
              </form>
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
import { computed, onMounted, onUnmounted, reactive, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { useSeo } from "@/composables/useSeo";
import { articleService } from "@/services/article.service";
import { useLocaleStore } from "@/stores/locale";
import { useSettingsStore } from "@/stores/settings";
import type { Article, Comment } from "@/types";
import ArticleThumb from "@/components/common/ArticleThumb.vue";
import SectionTitle from "@/components/common/SectionTitle.vue";
import SkeletonArticle from "@/components/common/SkeletonArticle.vue";
import ErrorState from "@/components/common/ErrorState.vue";
import EmptyState from "@/components/common/EmptyState.vue";
import ArticleCard from "@/components/article/ArticleCard.vue";
import SidebarPopular from "@/components/article/SidebarPopular.vue";
import AdSlot from "@/components/ads/AdSlot.vue";
import NavatraPoster from "@/components/article/NavatraPoster.vue";
import { useLocalized } from "@/composables/useLocalized";
import { useShareLinks } from "@/composables/useShareLinks";
import { formatKhmerDate, formatKhmerDateFull, formatViews, readingTime, toKhmerDigits } from "@/utils/format";

const route = useRoute();
const localeStore = useLocaleStore();
const settingsStore = useSettingsStore();

// The language in the URL (/kh/news/…, /en/news/…) takes priority over the
// stored preference — Telegram deep links must open in the right language.
function syncLocaleFromRoute() {
  const loc = route.meta.locale as "kh" | "en" | undefined;
  if (loc) localeStore.setLocale(loc);
}
watch(() => route.meta.locale, syncLocaleFromRoute);

const article = ref<Article | null>(null);
const related = ref<Article[]>([]);
const popular = ref<Article[]>([]);
const comments = ref<Comment[]>([]);
const loading = ref(true);
const error = ref("");

const commentForm = reactive({ name: "", email: "", content: "" });
const commentSending = ref(false);
const commentMsg = ref("");

const { title, excerpt, content, catName, t } = useLocalized();

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
      title: `${a ? title(a) : "Navatra 4K TV"} | Navatra 4K TV`,
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
              author: { "@type": "Person", name: a.author?.name ?? "Navatra 4K TV" },
              publisher: {
                "@type": "Organization",
                name: settingsStore.settings?.siteName ?? "Navatra 4K TV",
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
    comments.value = await articleService.comments(a.id).catch(() => []);
  } catch (e) {
    error.value = e instanceof Error ? e.message : t.article.loadFailed;
  } finally {
    loading.value = false;
  }
}

async function submitComment() {
  if (!article.value) return;
  commentSending.value = true;
  commentMsg.value = "";
  try {
    await articleService.submitComment({
      articleId: article.value.id,
      name: commentForm.name,
      email: commentForm.email,
      content: commentForm.content,
    });
    commentMsg.value = t.article.commentThanks;
    commentForm.content = "";
  } catch (e) {
    commentMsg.value = e instanceof Error ? e.message : t.article.commentFailed;
  } finally {
    commentSending.value = false;
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

/* ─── Gallery grid (columns from the admin editor) ─── */
.news-gallery {
  margin: 22px 0;
  display: grid;
  grid-template-columns: repeat(var(--gallery-cols, 3), 1fr);
  gap: 12px;
}
.news-gallery-item {
  position: relative;
  display: block;
  padding: 0;
  border: none;
  background: var(--color-surface, #fff);
  border: 1px solid var(--color-border, #e5e7eb);
  overflow: hidden;
  text-align: left;
  cursor: zoom-in;
  transition: filter 0.2s ease;
}
.news-gallery-item:hover {
  filter: brightness(0.96);
}
.news-gallery-item img {
  width: 100%;
  height: auto;
  display: block;
  object-fit: cover;
}
.news-gallery-caption {
  display: block;
  margin: 0;
  padding: 8px 10px 10px;
  font-size: 12.5px;
  color: var(--color-muted, #6b7280);
  font-style: italic;
  line-height: 1.5;
}
@media (max-width: 767px) {
  .news-gallery {
    grid-template-columns: 1fr 1fr;
  }
}
@media (max-width: 460px) {
  .news-gallery {
    grid-template-columns: 1fr;
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

/* ─── Comments ─── */
.comment-list {
  margin-bottom: 10px;
}
.single-comment {
  border-bottom: 1px solid #eee;
  padding: 14px 0;
}
.comment-head {
  display: flex;
  align-items: baseline;
  gap: 12px;
  margin-bottom: 4px;
}
.comment-head strong {
  color: #0b1c39;
  font-size: 15px;
}
.comment-date {
  font-size: 12.5px;
  color: #999;
}
.single-comment p {
  font-size: 14.5px;
  color: #444;
  line-height: 1.7;
  margin: 0;
}
.comment-form .form-control {
  margin-bottom: 16px;
  font-family: "Noto Sans Khmer", "Kantumruy", sans-serif;
}
.comment-msg {
  color: #0d3fa9;
  font-size: 14px;
  margin-top: 8px;
}
.news-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 20px;
}
.tag-chip {
  background: #f1f5f9;
  color: #0d3fa9;
  font-size: 13px;
  padding: 5px 12px;
  border-radius: 20px;
}
.tag-chip:hover {
  background: #0d3fa9;
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
  border-left: 4px solid #0d3fa9;
  background: #f7f9ff;
  padding: 16px 20px;
  margin: 18px 0;
  color: #444;
}
.news-content a {
  color: #0d3fa9;
  text-decoration: underline;
}
</style>
