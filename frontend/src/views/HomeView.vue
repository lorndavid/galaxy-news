<template>
  <div class="g-home">
    <!-- ═══════════ HERO SECTION ═══════════ -->
    <section v-if="showSection('hero')" v-reveal class="g-hero">
      <div class="container">
        <div class="g-hero-grid" :class="{ 'is-left': heroLeft && leftArticles.length, 'is-full': !heroSidebar }">
          <!-- Left column: featured small news -->
          <aside v-if="heroLeft && leftArticles.length" class="g-hero-left">
            <div class="g-sidebar-header">
              <h3><i class="ti-star g-section-icon" aria-hidden="true"></i> {{ t.home.featured }}</h3>
            </div>
            <article v-for="a in leftArticles" :key="a.id" class="g-hero-left-card">
              <RouterLink :to="`/article/${a.slug}`" class="g-hero-left-img">
                <ArticleThumb :src="a.featuredImage" :alt="title(a)" :width="320" />
              </RouterLink>
              <h4>
                <RouterLink :to="`/article/${a.slug}`">{{ title(a) }}</RouterLink>
              </h4>
              <span v-if="a.publishedAt" class="g-sidebar-time"><i class="ti-calendar"></i> {{ formatKhmerDate(a.publishedAt) }}</span>
            </article>
          </aside>

          <!-- Main featured story -->
          <div class="g-hero-main">
            <article v-if="hero" class="g-hero-card">
              <RouterLink :to="`/article/${hero.slug}`" class="g-hero-img">
                <ArticleThumb :src="hero.featuredImage" :alt="title(hero)" :width="960" />
                <span v-if="breakingBadges && hero.isBreaking" class="g-breaking">{{ t.common.breaking }}</span>
              </RouterLink>
              <div class="g-hero-body">
                <span class="g-cat-chip" :style="catStyle(hero)">{{ catName(hero) }}</span>
                <h1 class="g-hero-title">
                  <RouterLink :to="`/article/${hero.slug}`">{{ title(hero) }}</RouterLink>
                </h1>
                <p v-if="excerpt(hero)" class="g-hero-excerpt">{{ excerpt(hero) }}</p>
                <div class="g-hero-meta">
                  <span v-if="hero.publishedAt"><i class="ti-calendar"></i> {{ formatKhmerDate(hero.publishedAt) }}</span>
                  <span v-if="hero.author?.name"><i class="ti-user"></i> {{ hero.author.name }}</span>
                  <span><i class="ti-eye"></i> {{ formatViews(hero.views) }}</span>
                </div>
              </div>
            </article>

            <!-- Bottom 3 cards -->
            <div v-if="bottomThree.length" class="g-hero-bottom">
              <article v-for="a in bottomThree" :key="a.id" class="g-hero-bottom-card">
                <RouterLink :to="`/article/${a.slug}`" class="g-hero-bottom-img">
                  <ArticleThumb :src="a.featuredImage" :alt="title(a)" :width="480" />
                </RouterLink>
                <div class="g-hero-bottom-body">
                  <span class="g-cat-chip g-cat-chip--sm" :style="catStyle(a)">{{ catName(a) }}</span>
                  <h4 class="g-hero-bottom-title">
                    <RouterLink :to="`/article/${a.slug}`">{{ title(a) }}</RouterLink>
                  </h4>
                </div>
              </article>
            </div>
          </div>

          <!-- Sidebar: Latest stories -->
          <aside v-if="heroSidebar" class="g-hero-sidebar">
            <div class="g-sidebar-header">
              <h3><i class="ti-bolt" aria-hidden="true"></i> {{ t.home.latest }}</h3>
            </div>
            <article v-for="a in sidebarArticles" :key="a.id" class="g-sidebar-card">
              <RouterLink :to="`/article/${a.slug}`" class="g-sidebar-thumb">
                <ArticleThumb :src="a.featuredImage" :alt="title(a)" :width="160" />
              </RouterLink>
              <div class="g-sidebar-body">
                <span class="g-cat-chip g-cat-chip--xs" :style="catStyle(a)">{{ catName(a) }}</span>
                <h4>
                  <RouterLink :to="`/article/${a.slug}`">{{ title(a) }}</RouterLink>
                </h4>
                <span v-if="a.publishedAt" class="g-sidebar-time"><i class="ti-calendar"></i> {{ formatKhmerDate(a.publishedAt) }}</span>
              </div>
            </article>
          </aside>
        </div>
      </div>
    </section>

    <!-- ═══════════ WEEKLY SECTION ═══════════ -->
    <section v-if="showSection('weekly') && weeklyArticles.length" v-reveal class="g-category-section">
      <div class="container">
        <div class="g-section-header">
          <div class="g-section-accent" style="background: var(--color-accent)"></div>
          <h2><i class="ti-calendar g-section-icon" aria-hidden="true"></i> {{ sectionTitle("weekly", t.home.weekly) }}</h2>
          <RouterLink :to="'/news'" class="g-section-link">
            {{ t.common.viewAll }} <i class="ti-angle-right"></i>
          </RouterLink>
        </div>
        <div class="g-cards" :style="weeklyGridStyle">
          <article v-for="a in weeklyArticles" :key="a.id" class="g-news-card">
            <RouterLink :to="`/article/${a.slug}`" class="g-news-card-img">
              <ArticleThumb :src="a.featuredImage" :alt="title(a)" :width="480" />
              <span v-if="breakingBadges && a.isBreaking" class="g-breaking g-breaking--sm">{{ t.common.breaking }}</span>
            </RouterLink>
            <div class="g-news-card-body">
              <span class="g-cat-chip g-cat-chip--xs" :style="catStyle(a)">{{ catName(a) }}</span>
              <h4 class="g-news-card-title">
                <RouterLink :to="`/article/${a.slug}`">{{ title(a) }}</RouterLink>
              </h4>
              <div class="g-news-card-meta">
                <span v-if="a.publishedAt"><i class="ti-calendar"></i> {{ formatKhmerDate(a.publishedAt) }}</span>
                <span><i class="ti-eye"></i> {{ formatViews(a.views) }}</span>
              </div>
            </div>
          </article>
        </div>
      </div>
    </section>

    <!-- ═══════════ CATEGORY SECTIONS ═══════════ -->
    <section
      v-for="cat in displayCategories"
      :key="cat.id"
      v-reveal
      class="g-category-section"
    >
      <div class="container">
        <div class="g-section-header">
          <div class="g-section-accent" :style="{ background: cat.color || 'var(--color-accent)' }"></div>
          <h2><i class="ti-layout-grid2 g-section-icon" aria-hidden="true"></i> {{ catNameOf(cat) }}</h2>
          <RouterLink :to="`/category/${cat.slug}`" class="g-section-link">
            {{ t.common.viewAll }} <i class="ti-angle-right"></i>
          </RouterLink>
        </div>
        <div class="g-cards" :style="categoryGridStyle">
          <article
            v-for="a in getCategoryArticles(cat.slug)"
            :key="a.id"
            class="g-news-card"
          >
            <RouterLink :to="`/article/${a.slug}`" class="g-news-card-img">
              <ArticleThumb :src="a.featuredImage" :alt="title(a)" :width="480" />
              <span v-if="breakingBadges && a.isBreaking" class="g-breaking g-breaking--sm">{{ t.common.breaking }}</span>
            </RouterLink>
            <div class="g-news-card-body">
              <span class="g-cat-chip g-cat-chip--xs" :style="catStyle(a)">{{ catName(a) }}</span>
              <h4 class="g-news-card-title">
                <RouterLink :to="`/article/${a.slug}`">{{ title(a) }}</RouterLink>
              </h4>
              <div class="g-news-card-meta">
                <span v-if="a.publishedAt"><i class="ti-calendar"></i> {{ formatKhmerDate(a.publishedAt) }}</span>
                <span><i class="ti-eye"></i> {{ formatViews(a.views) }}</span>
              </div>
            </div>
          </article>
        </div>
      </div>
    </section>

    <!-- ═══════════ POPULAR / TRENDING ═══════════ -->
    <section v-if="showSection('whats-new') && popular.length" v-reveal class="g-popular-section">
      <div class="container">
        <div class="g-section-header">
          <div class="g-section-accent" style="background: var(--color-live)"></div>
          <h2><i class="ti-stats-up g-section-icon" aria-hidden="true"></i> {{ t.home.popular }}</h2>
        </div>
        <div class="g-cards" :style="popularGridStyle">
          <article v-for="a in popular" :key="a.id" class="g-popular-card">
            <RouterLink :to="`/article/${a.slug}`" class="g-popular-img">
              <ArticleThumb :src="a.featuredImage" :alt="title(a)" :width="320" />
            </RouterLink>
            <div class="g-popular-body">
              <span class="g-cat-chip g-cat-chip--xs" :style="catStyle(a)">{{ catName(a) }}</span>
              <h4>
                <RouterLink :to="`/article/${a.slug}`">{{ title(a) }}</RouterLink>
              </h4>
              <span v-if="a.publishedAt" class="g-popular-time">{{ formatKhmerDate(a.publishedAt) }}</span>
            </div>
          </article>
        </div>
      </div>
    </section>

    <!-- ═══════════ VIDEO SECTION ═══════════ -->
    <section v-if="showSection('video') && videoArticles.length" v-reveal class="g-video-section">
      <div class="container">
        <div class="g-section-header">
          <div class="g-section-accent" style="background: #dc2626"></div>
          <h2><i class="ti-video-camera g-section-icon" aria-hidden="true"></i> {{ t.home.video }}</h2>
          <a
            class="g-section-link"
            :href="youtubeChannel"
            target="_blank"
            rel="noopener"
          >
            <i class="fab fa-youtube"></i> {{ t.home.followChannel }}
          </a>
        </div>
        <div class="g-cards" :style="videoGridStyle">
          <a
            v-for="a in videoArticles"
            :key="a.id"
            class="g-video-card"
            :href="youtubeChannel"
            target="_blank"
            rel="noopener"
            :title="title(a)"
          >
            <ArticleThumb :src="a.featuredImage" :alt="title(a)" :width="480" />
            <span class="g-video-play"><i class="fas fa-play"></i></span>
            <span class="g-video-overlay"><h4>{{ title(a) }}</h4></span>
          </a>
        </div>
      </div>
    </section>

    <!-- ═══════════ RECENT SECTION ═══════════ -->
    <section v-if="showSection('recent') && recentArticles.length" v-reveal class="g-category-section">
      <div class="container">
        <div class="g-section-header">
          <div class="g-section-accent" style="background: var(--color-secondary)"></div>
          <h2><i class="ti-write g-section-icon" aria-hidden="true"></i> {{ sectionTitle("recent", t.home.recent) }}</h2>
          <RouterLink :to="'/news'" class="g-section-link">
            {{ t.common.viewAll }} <i class="ti-angle-right"></i>
          </RouterLink>
        </div>
        <div class="g-cards" :style="recentGridStyle">
          <article v-for="a in recentArticles" :key="a.id" class="g-news-card">
            <RouterLink :to="`/article/${a.slug}`" class="g-news-card-img">
              <ArticleThumb :src="a.featuredImage" :alt="title(a)" :width="480" />
            </RouterLink>
            <div class="g-news-card-body">
              <span class="g-cat-chip g-cat-chip--xs" :style="catStyle(a)">{{ catName(a) }}</span>
              <h4 class="g-news-card-title">
                <RouterLink :to="`/article/${a.slug}`">{{ title(a) }}</RouterLink>
              </h4>
              <div class="g-news-card-meta">
                <span v-if="a.publishedAt"><i class="ti-calendar"></i> {{ formatKhmerDate(a.publishedAt) }}</span>
                <span><i class="ti-eye"></i> {{ formatViews(a.views) }}</span>
              </div>
            </div>
          </article>
        </div>
      </div>
    </section>

    <!-- ═══════════ AD SLOT ═══════════ -->
    <section v-if="showSection('latest')" v-reveal class="g-ad-section">
      <div class="container">
        <AdSlot position="homepage-middle" />
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useSeo } from "@/composables/useSeo";
import { articleService } from "@/services/article.service";
import { contentService } from "@/services/content.service";
import { useCategoryStore } from "@/stores/categories";
import { useSettingsStore } from "@/stores/settings";
import { useLocalized } from "@/composables/useLocalized";
import type { Article, Category, HomepageSectionConfig } from "@/types";
import ArticleThumb from "@/components/common/ArticleThumb.vue";
import AdSlot from "@/components/ads/AdSlot.vue";
import { formatKhmerDate, formatViews } from "@/utils/format";

const categoryStore = useCategoryStore();
const settingsStore = useSettingsStore();
const { locale, title, excerpt, catName, t } = useLocalized();

const catNameOf = (c: Category) => locale.pick(c.name, c.nameEn);

useSeo(
  computed(() => ({
    title: "Galaxy TV 4K | ព័ត៌មានក្តៅៗប្រចាំថ្ងៃ",
    description:
      settingsStore.settings?.description ??
      "Galaxy TV 4K — មជ្ឈមណ្ឌលព័ត៌មានឌីជីថលរបស់កម្ពុជា៖ ព័ត៌មានក្តៅៗ កម្សាន្ត បច្ចេកវិទ្យា និងការផ្សាយបន្តផ្ទាល់",
    image: settingsStore.settings?.logo ?? "/assets/img/logo/logo1.png",
    url: window.location.origin,
    type: "website",
    jsonLd: [
      {
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: settingsStore.settings?.siteName ?? "Galaxy TV 4K",
        url: window.location.origin,
        potentialAction: {
          "@type": "SearchAction",
          target: `${window.location.origin}/search?q={search_term_string}`,
          "query-input": "required name=search_term_string",
        },
      },
    ],
  }))
);

const featured = ref<Article[]>([]);
const latest = ref<Article[]>([]);
const popular = ref<Article[]>([]);
const categories = ref<Category[]>([]);
const categoryArticles = ref<Record<string, Article[]>>({});
const sectionConfigs = ref<Record<string, HomepageSectionConfig | null>>({});
const sectionLabels = ref<Record<string, string>>({});

function showSection(key: string) {
  return sectionConfigs.value[key] !== undefined;
}

function sectionConfig(key: string): HomepageSectionConfig | null {
  return sectionConfigs.value[key] ?? null;
}

function sectionTitle(key: string, fallback: string): string {
  return sectionLabels.value[key] ?? fallback;
}

const heroSidebar = computed(() => sectionConfig("hero")?.sidebar ?? true);
const heroLeft = computed(() => sectionConfig("hero")?.left ?? true);
const breakingBadges = computed(() => showSection("breaking"));
const popularColumns = computed(() => sectionConfig("whats-new")?.columns ?? 5);
const videoColumns = computed(() => sectionConfig("video")?.columns ?? 5);
const weeklyColumns = computed(() => sectionConfig("weekly")?.columns ?? 4);
const recentColumns = computed(() => sectionConfig("recent")?.columns ?? 4);

const categoryGridStyle = { "--grid-cols": 4 } as Record<string, string | number>;
const popularGridStyle = computed(() => ({ "--grid-cols": popularColumns.value }));
const videoGridStyle = computed(() => ({ "--grid-cols": videoColumns.value }));
const weeklyGridStyle = computed(() => ({ "--grid-cols": weeklyColumns.value }));
const recentGridStyle = computed(() => ({ "--grid-cols": recentColumns.value }));

const hero = computed(() => featured.value[0] ?? null);
const bottomThree = computed(() => featured.value.slice(1, 4));
const weeklyArticles = computed(() => featured.value.slice(4, 9));
const leftArticles = computed(() => latest.value.slice(6, 8));
const sidebarArticles = computed(() => latest.value.slice(0, 6));
const recentArticles = computed(() => latest.value.slice(6, 14));
const videoArticles = computed(() => featured.value.slice(0, 5));
const youtubeChannel = computed(() => settingsStore.settings?.youtube ?? "https://www.youtube.com/@GalaxyTV4K");

// Show top 4 categories with articles
const displayCategories = computed(() => {
  return categories.value
    .filter((c) => c.isActive && categoryArticles.value[c.slug]?.length)
    .slice(0, 4);
});

function getCategoryArticles(slug: string): Article[] {
  return (categoryArticles.value[slug] ?? []).slice(0, 4);
}

// Map category ID to a consistent color
const CAT_COLORS: Record<number, string> = {};
function catStyle(a: Article) {
  const id = a.categoryId;
  if (!CAT_COLORS[id]) {
    const palette = [
      "var(--cat-national)", "var(--cat-political)", "var(--cat-international)",
      "var(--cat-business)", "var(--cat-technology)", "var(--cat-sports)",
      "var(--cat-entertainment)",
    ];
    CAT_COLORS[id] = palette[id % palette.length];
  }
  return { background: CAT_COLORS[id] };
}

onMounted(async () => {
  categoryStore.load();
  settingsStore.load();

  try {
    const sections = await contentService.homepageSections();
    sectionConfigs.value = Object.fromEntries(
      sections.map((s) => [s.key, s.config ?? null])
    );
    sectionLabels.value = Object.fromEntries(sections.map((s) => [s.key, s.label]));
  } catch {
    sectionConfigs.value = {
      hero: { sidebar: true },
      "whats-new": { columns: 5 },
      video: { columns: 5 },
      latest: null,
    };
    sectionLabels.value = {};
  }

  categories.value = categoryStore.categories;

  const [feat, lat, pop] = await Promise.all([
    articleService.featured(12).catch(() => []),
    articleService.latest(14).catch(() => []),
    articleService.popular(5).catch(() => []),
  ]);

  featured.value = feat;
  latest.value = lat;
  popular.value = pop;

  // Load articles for each displayed category
  for (const cat of categories.value.filter((c) => c.isActive).slice(0, 4)) {
    try {
      const data = await articleService.byCategory(cat.slug, 1);
      const items = Array.isArray(data) ? data : data.items;
      categoryArticles.value[cat.slug] = items.slice(0, 4);
    } catch {
      categoryArticles.value[cat.slug] = [];
    }
  }
});
</script>

<style scoped>
/* ==================================================================
   Galaxy TV Homepage — clean editorial layout
=================================================================== */

/* ─── Hero Section ─── */
.g-hero {
  padding: 24px 0 0;
}
/* 3-column wide grid: left rail | main big image | latest right */
.g-hero-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 340px;
  gap: 28px;
}
.g-hero-grid.is-left {
  grid-template-columns: 300px minmax(0, 1fr) 340px;
}
.g-hero-grid.is-full {
  grid-template-columns: minmax(0, 1fr);
}
.g-hero-grid.is-left.is-full {
  grid-template-columns: 300px minmax(0, 1fr);
}
@media (max-width: 1199px) {
  .g-hero-grid.is-left,
  .g-hero-grid.is-left.is-full {
    grid-template-columns: minmax(0, 1fr) 340px;
  }
}
@media (max-width: 991px) {
  .g-hero-grid,
  .g-hero-grid.is-left,
  .g-hero-grid.is-full,
  .g-hero-grid.is-left.is-full {
    grid-template-columns: 1fr;
  }
}

/* Left rail — small news cards with images */
.g-hero-left-card {
  padding: 0 0 14px;
  margin-bottom: 14px;
  border-bottom: 1px solid #000;
}
.g-hero-left-card:last-child {
  border-bottom: none;
}
.g-hero-left-img {
  display: block;
  aspect-ratio: 16 / 10;
  overflow: hidden;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
}
.g-hero-left-img :deep(img) {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.35s ease;
}
.g-hero-left-card:hover .g-hero-left-img :deep(img) {
  transform: scale(1.04);
}
.g-hero-left-card h4 {
  margin: 10px 0 0;
  font-size: 14px;
  line-height: 1.45;
}
.g-hero-left-card h4 a {
  color: var(--color-text);
  text-decoration: none;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  transition: color 0.2s ease;
}
.g-hero-left-card h4 a:hover {
  color: var(--color-accent);
}
.g-hero-left-card .g-sidebar-time {
  margin-top: 6px;
}

/* Hero main card */
.g-hero-card {
  border-radius: var(--radius-card);
  overflow: hidden;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
}
.g-hero-img {
  position: relative;
  display: block;
  aspect-ratio: 16 / 9;
  overflow: hidden;
  border-radius: var(--radius-card);
}
.g-hero-img :deep(img) {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.45s cubic-bezier(0.22, 0.61, 0.36, 1);
}
.g-hero-img:hover :deep(img) {
  transform: scale(1.03);
}
.g-hero-body {
  padding: 18px 20px 20px;
}
.g-hero-title {
  margin: 8px 0 0;
  font-family: var(--font-display);
  font-size: clamp(22px, 1.5vw + 0.9rem, 30px);
  line-height: 1.35;
}
.g-hero-title a {
  color: var(--color-text);
  text-decoration: none;
  transition: color 0.2s ease;
}
.g-hero-title a:hover {
  color: var(--color-accent);
}
.g-hero-excerpt {
  margin: 10px 0 0;
  font-size: 14px;
  line-height: 1.7;
  color: var(--color-muted);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.g-hero-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  margin-top: 12px;
  font-size: 12.5px;
  color: var(--color-muted);
}
.g-hero-meta span {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

/* Hero bottom 3 */
.g-hero-bottom {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin-top: 20px;
}
@media (max-width: 767px) {
  .g-hero-bottom {
    grid-template-columns: 1fr;
    gap: 16px;
  }
}
.g-hero-bottom-card {
  border-radius: var(--radius-card);
  overflow: hidden;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
}
.g-hero-bottom-img {
  display: block;
  aspect-ratio: 16 / 9;
  overflow: hidden;
  border-radius: var(--radius-card);
}
.g-hero-bottom-img :deep(img) {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.4s ease;
}
.g-hero-bottom-card:hover .g-hero-bottom-img :deep(img) {
  transform: scale(1.04);
}
.g-hero-bottom-body {
  padding: 12px 14px 14px;
}
.g-hero-bottom-title {
  margin: 6px 0 0;
  font-size: 15px;
  line-height: 1.45;
}
.g-hero-bottom-title a {
  color: var(--color-text);
  text-decoration: none;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  transition: color 0.2s ease;
}
.g-hero-bottom-title a:hover {
  color: var(--color-accent);
}

/* ─── Sidebar ─── */
.g-hero-sidebar {
  border-left: 1px solid var(--color-border);
  padding-left: 28px;
}
@media (max-width: 991px) {
  .g-hero-sidebar {
    border-left: none;
    padding-left: 0;
    border-top: 1px solid var(--color-border);
    padding-top: 24px;
  }
}
.g-sidebar-header {
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 2px solid var(--color-text);
}
.g-sidebar-header h3 {
  font-family: var(--font-heading);
  font-size: 18px;
  font-weight: 700;
  color: var(--color-text);
  display: flex;
  align-items: center;
  gap: 8px;
}
.g-sidebar-header h3 i {
  color: var(--color-accent);
  font-size: 15px;
}
.g-sidebar-card {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  padding: 12px 0;
  border-bottom: 1px solid #000;
}
.g-sidebar-card:last-child {
  border-bottom: none;
}
.g-sidebar-thumb {
  flex-shrink: 0;
  width: 78px;
  aspect-ratio: 16 / 11;
  overflow: hidden;
  display: block;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
}
.g-sidebar-thumb :deep(img) {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}
.g-sidebar-card:hover .g-sidebar-thumb :deep(img) {
  transform: scale(1.05);
}
.g-sidebar-body {
  flex: 1;
  min-width: 0;
}
.g-sidebar-body h4 {
  margin: 0;
  font-size: 13.5px;
  line-height: 1.45;
}
.g-sidebar-body h4 a {
  color: var(--color-text);
  text-decoration: none;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  transition: color 0.2s ease;
}
.g-sidebar-body h4 a:hover {
  color: var(--color-accent);
}
.g-sidebar-time {
  font-size: 12px;
  color: var(--color-muted);
  margin-top: 6px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

/* ─── Category Chips ─── */
.g-cat-chip {
  display: inline-block;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.03em;
  padding: 3px 10px;
  border-radius: var(--radius-badge);
  color: #fff;
  text-transform: uppercase;
  line-height: 1.4;
}
.g-cat-chip--sm {
  font-size: 10px;
  padding: 2px 8px;
}
.g-cat-chip--xs {
  font-size: 10px;
  padding: 2px 8px;
  margin-bottom: 6px;
}

/* Breaking badge */
.g-breaking {
  position: absolute;
  top: 12px;
  left: 12px;
  background: var(--color-live);
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: var(--radius-badge);
  z-index: 2;
}
.g-breaking--sm {
  font-size: 10px;
  padding: 2px 8px;
  top: 8px;
  left: 8px;
}

/* ─── Section Headers — single clean line ─── */
.g-section-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
  padding-bottom: 8px;
  border-bottom: 2px solid var(--color-text);
}
.g-section-accent {
  width: 4px;
  height: 24px;
  flex-shrink: 0;
}
.g-section-header h2 {
  font-family: var(--font-heading);
  font-size: clamp(18px, 0.8vw + 0.85rem, 22px);
  font-weight: 700;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}
.g-section-icon {
  font-size: 16px;
  color: var(--color-accent);
}
.g-section-link {
  margin-left: auto;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  font-weight: 600;
  color: var(--color-muted);
  text-decoration: none;
  white-space: nowrap;
  transition: color 0.2s ease, transform 0.2s ease;
}
.g-section-link:hover {
  color: var(--color-accent);
  transform: translateX(2px);
}

/* ─── Category Section ─── */
.g-category-section {
  padding: 40px 0 0;
}

/* News card */
.g-news-card {
  overflow: hidden;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
}
.g-news-card-img {
  display: block;
  aspect-ratio: 16 / 9;
  overflow: hidden;
  border-radius: var(--radius-card);
}
.g-news-card-img :deep(img) {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.4s ease;
}
.g-news-card:hover .g-news-card-img :deep(img) {
  transform: scale(1.04);
}
.g-news-card-body {
  padding: 14px 16px 16px;
}
.g-news-card-title {
  margin: 6px 0 0;
  font-size: 15px;
  line-height: 1.45;
}
.g-news-card-title a {
  color: var(--color-text);
  text-decoration: none;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  transition: color 0.2s ease;
}
.g-news-card-title a:hover {
  color: var(--color-accent);
}
.g-news-card-meta {
  display: flex;
  gap: 12px;
  margin-top: 8px;
  font-size: 12px;
  color: var(--color-muted);
}
.g-news-card-meta span {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

/* ─── Popular Section ─── */
.g-popular-section {
  padding: 48px 0 0;
}
.g-popular-card {
  position: relative;
  overflow: hidden;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
}
.g-popular-img {
  display: block;
  aspect-ratio: 16 / 9;
  overflow: hidden;
}
.g-popular-img :deep(img) {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.4s ease;
}
.g-popular-card:hover .g-popular-img :deep(img) {
  transform: scale(1.04);
}
.g-popular-body {
  padding: 12px 14px 14px;
}
.g-popular-body h4 {
  margin: 4px 0 0;
  font-size: 14px;
  line-height: 1.45;
}
.g-popular-body h4 a {
  color: var(--color-text);
  text-decoration: none;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  transition: color 0.2s ease;
}
.g-popular-body h4 a:hover {
  color: var(--color-accent);
}
.g-popular-time {
  font-size: 12px;
  color: var(--color-muted);
  margin-top: 4px;
  display: block;
}

/* ─── Video Section ─── */
.g-video-section {
  padding: 48px 0 0;
}
.g-video-card {
  position: relative;
  display: block;
  aspect-ratio: 16 / 9;
  overflow: hidden;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
}
.g-video-card :deep(img) {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.4s ease;
}
.g-video-card:hover :deep(img) {
  transform: scale(1.04);
}
.g-video-play {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.9);
  color: var(--color-live);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  transition: transform 0.25s ease;
  z-index: 2;
}
.g-video-card:hover .g-video-play {
  transform: translate(-50%, -50%) scale(1.1);
}
.g-video-overlay {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 28px 12px 10px;
  background: linear-gradient(to bottom, rgba(11, 28, 57, 0) 0%, rgba(11, 28, 57, 0.8) 100%);
  z-index: 1;
}
.g-video-overlay h4 {
  color: #fff;
  font-size: 13px;
  line-height: 1.4;
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* ─── Ad Section ─── */
.g-ad-section {
  padding: 32px 0;
}
</style>
