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
              <span v-if="a.publishedAt" class="g-sidebar-time"><i class="ti-calendar"></i> {{ formatDate(a.publishedAt) }}</span>
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
                  <span v-if="hero.publishedAt"><i class="ti-calendar"></i> {{ formatDate(hero.publishedAt) }}</span>
                  <span v-if="hero.author?.name"><i class="ti-user"></i> {{ hero.author.name }}</span>
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
                <h4>
                  <RouterLink :to="`/article/${a.slug}`">{{ title(a) }}</RouterLink>
                </h4>
                <span v-if="a.publishedAt" class="g-sidebar-time"><i class="ti-calendar"></i> {{ formatDate(a.publishedAt) }}</span>
              </div>
            </article>
          </aside>
        </div>
      </div>
    </section>

    <!-- ═══════════ FACEBOOK LIVE STREAM ═══════════ -->
    <LiveStreamBanner />

    <!-- ═══════════ MORE NEWS — secondary editorial grid ═══════════ -->
    <MoreNewsSection :exclude-ids="primaryArticleIds" />

    <!-- ═══════════ EDITORIAL CATEGORY SECTIONS — different layouts for visual rhythm ═══════════ -->
    <EditorialSection
      v-for="sec in editorialSections"
      :key="sec.key"
      :title="sec.title"
      :articles="sec.articles"
      :layout-type="sec.layoutType"
      :accent-color="sec.accentColor"
      :view-all-to="sec.viewAllTo"
      :visible="sec.articles.length > 0"
    />

    <!-- ═══════════ AD SLOT ═══════════ -->
    <section v-if="showSection('latest')" v-reveal class="g-ad-section">
      <div class="container">
        <AdSlot position="homepage-middle" />
      </div>
    </section>

    <!-- ═══════════ POPULAR / TRENDING ═══════════ -->
    <section v-if="showSection('whats-new') && popular.length" v-reveal class="g-popular-section">
      <div class="container">
        <SectionHeaderComp
          :title="t.home.popular"
          accent-color="var(--color-live)"
          :view-all-to="'/news'"
          :link-text="t.common.viewAll"
        />
        <EditorialCompactLayout :articles="popular" />
      </div>
    </section>

    <!-- ═══════════ VIDEO SECTION ═══════════ -->
    <section v-if="showSection('video') && videoArticles.length" v-reveal class="g-video-section">
      <div class="container">
        <SectionHeaderComp
          :title="t.home.video"
          accent-color="#dc2626"
          :view-all-to="youtubeChannel"
          link-text="YouTube"
        />
        <div class="g-video-grid">
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
    <section v-if="showSection('recent') && recentArticles.length" v-reveal class="g-recent-section">
      <div class="container">
        <SectionHeaderComp
          :title="sectionTitle('recent', t.home.recent)"
          accent-color="var(--color-secondary)"
          :view-all-to="'/news'"
          :link-text="t.common.viewAll"
        />
        <EditorialListLayout :articles="recentArticles" />
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
import type { Article, Category, EditorialLayoutType, HomepageSectionConfig } from "@/types";
import ArticleThumb from "@/components/common/ArticleThumb.vue";
import AdSlot from "@/components/ads/AdSlot.vue";
import MoreNewsSection from "@/components/sections/MoreNewsSection.vue";
import EditorialSection from "@/components/editorial/EditorialSection.vue";
import SectionHeaderComp from "@/components/editorial/SectionHeader.vue";
import EditorialCompactLayout from "@/components/editorial/layouts/EditorialCompactLayout.vue";
import EditorialListLayout from "@/components/editorial/layouts/EditorialListLayout.vue";
import LiveStreamBanner from "@/components/common/LiveStreamBanner.vue";

const categoryStore = useCategoryStore();
const settingsStore = useSettingsStore();
const { locale, title, excerpt, catName, t, formatDate } = useLocalized();

useSeo(
  computed(() => ({
    title: "Galaxy TV V4K | ព័ត៌មានក្តៅៗប្រចាំថ្ងៃ",
    description:
      settingsStore.settings?.description ??
      "Galaxy TV V4K — មជ្ឈមណ្ឌលព័ត៌មានឌីជីថលរបស់កម្ពុជា៖ ព័ត៌មានក្តៅៗ កម្សាន្ត បច្ចេកវិទ្យា និងការផ្សាយបន្តផ្ទាល់",
    image: settingsStore.settings?.logo ?? "/assets/img/logo/logo1.png",
    url: window.location.origin,
    type: "website",
    jsonLd: [
      {
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: settingsStore.settings?.siteName ?? "Galaxy TV V4K",
        url: window.location.origin,
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
const sectionLabelsEn = ref<Record<string, string>>({});
const sectionLabelsZh = ref<Record<string, string>>({});

function showSection(key: string) {
  return sectionConfigs.value[key] !== undefined;
}
function sectionConfig(key: string): HomepageSectionConfig | null {
  return sectionConfigs.value[key] ?? null;
}
function sectionTitle(key: string, fallback: string): string {
  const label = sectionLabels.value[key];
  const labelEn = sectionLabelsEn.value[key];
  const labelZh = sectionLabelsZh.value[key];
  return locale.pick(label, labelEn ?? label, labelZh ?? labelEn ?? label) || fallback;
}

const heroSidebar = computed(() => sectionConfig("hero")?.sidebar ?? true);
const heroLeft = computed(() => sectionConfig("hero")?.left ?? true);
const breakingBadges = computed(() => showSection("breaking"));

const hero = computed(() => featured.value[0] ?? null);
const bottomThree = computed(() => featured.value.slice(1, 4));
const leftArticles = computed(() => latest.value.slice(6, 8));
const sidebarArticles = computed(() => latest.value.slice(0, 6));
const recentArticles = computed(() => latest.value.slice(6, 14));
const videoArticles = computed(() => featured.value.slice(0, 5));
const youtubeChannel = computed(() => settingsStore.settings?.youtube ?? "https://www.youtube.com/@GalaxyTV4K");

const primaryArticleIds = computed(() => {
  const ids = new Set<number>();
  for (const a of featured.value) ids.add(a.id);
  for (const a of sidebarArticles.value) ids.add(a.id);
  for (const a of leftArticles.value) ids.add(a.id);
  return [...ids];
});

/** Layout rhythm — each category gets a different editorial layout */
const LAYOUT_RHYTHM: EditorialLayoutType[] = [
  "editorial-three-col",
  "editorial-split",
  "editorial-mosaic",
  "editorial-horizontal",
  "editorial-feature-compact",
  "editorial-magazine",
  "editorial-compact",
  "editorial-list",
];

const CAT_COLORS = ["var(--cat-national)", "var(--cat-political)", "var(--cat-international)", "var(--cat-business)", "var(--cat-technology)", "var(--cat-sports)", "var(--cat-entertainment)"];
function catStyle(a: Article) {
  return { background: CAT_COLORS[a.categoryId % CAT_COLORS.length] };
}

const editorialSections = computed(() => {
  const cats = categories.value
    .filter((c) => c.isActive && categoryArticles.value[c.slug]?.length)
    .slice(0, 8);

  return cats.map((cat, i) => {
    const articles = categoryArticles.value[cat.slug] ?? [];
    const adminConfig = sectionConfig(`cat-${cat.slug}`);
    const layoutType = adminConfig?.layoutType ?? LAYOUT_RHYTHM[i % LAYOUT_RHYTHM.length];
    const articleLimit = adminConfig?.articleLimit ?? 6;
    return {
      key: `cat-${cat.slug}`,
      title: locale.pick(cat.name, cat.nameEn, cat.nameZh),
      articles: articles.slice(0, articleLimit),
      layoutType,
      accentColor: cat.color || CAT_COLORS[i % CAT_COLORS.length],
      viewAllTo: `/category/${cat.slug}`,
    };
  });
});

onMounted(async () => {
  categoryStore.load();
  settingsStore.load();

  try {
    const sections = await contentService.homepageSections();
    sectionConfigs.value = Object.fromEntries(
      sections.map((s) => [s.key, s.config ?? null])
    );
    sectionLabels.value = Object.fromEntries(sections.map((s) => [s.key, s.label]));
    sectionLabelsEn.value = Object.fromEntries(sections.map((s) => [s.key, s.labelEn ?? s.label]));
    sectionLabelsZh.value = Object.fromEntries(sections.map((s) => [s.key, s.labelZh ?? s.labelEn ?? s.label]));
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

  // Load articles for each category
  for (const cat of categories.value.filter((c) => c.isActive).slice(0, 8)) {
    try {
      const data = await articleService.byCategory(cat.slug, 1);
      const items = Array.isArray(data) ? data : data.items;
      categoryArticles.value[cat.slug] = items.slice(0, 6);
    } catch {
      categoryArticles.value[cat.slug] = [];
    }
  }
});
</script>

<style scoped>
/* ==================================================================
   Galaxy TV Homepage — editorial layout
=================================================================== */

/* ─── Hero Section ─── */
.g-hero { padding: 24px 0 0; }
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
  .g-hero-grid.is-left, .g-hero-grid.is-left.is-full {
    grid-template-columns: minmax(0, 1fr) 340px;
  }
}
@media (max-width: 991px) {
  .g-hero-grid, .g-hero-grid.is-left, .g-hero-grid.is-full, .g-hero-grid.is-left.is-full {
    grid-template-columns: 1fr;
  }
}

/* Left rail */
.g-hero-left-card {
  padding: 0 0 14px;
  margin-bottom: 14px;
  border-bottom: 1px solid #000;
}
.g-hero-left-card:last-child { border-bottom: none; }
.g-hero-left-img {
  display: block;
  aspect-ratio: 16 / 10;
  overflow: hidden;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
}
.g-hero-left-img :deep(img) { width: 100%; height: 100%; object-fit: cover; transition: transform 0.35s ease; }
.g-hero-left-card:hover .g-hero-left-img :deep(img) { transform: scale(1.04); }
.g-hero-left-card h4 { margin: 10px 0 0; font-size: 14px; line-height: 1.45; }
.g-hero-left-card h4 a { color: var(--color-text); text-decoration: none; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; transition: color 0.2s ease; }
.g-hero-left-card h4 a:hover { color: var(--color-accent); }
.g-hero-left-card .g-sidebar-time { margin-top: 6px; }

/* Hero main card */
.g-hero-card { border-radius: var(--radius-card); overflow: hidden; background: var(--color-surface); border: 1px solid var(--color-border); }
.g-hero-img { position: relative; display: block; aspect-ratio: 16 / 9; overflow: hidden; border-radius: var(--radius-card); }
.g-hero-img :deep(img) { width: 100%; height: 100%; object-fit: cover; transition: transform 0.45s cubic-bezier(0.22, 0.61, 0.36, 1); }
.g-hero-img:hover :deep(img) { transform: scale(1.03); }
.g-hero-body { padding: 18px 20px 20px; }
.g-hero-title { margin: 8px 0 0; font-family: var(--font-display); font-size: clamp(22px, 1.5vw + 0.9rem, 30px); line-height: 1.35; }
.g-hero-title a { color: var(--color-text); text-decoration: none; transition: color 0.2s ease; }
.g-hero-title a:hover { color: var(--color-accent); }
.g-hero-excerpt { margin: 10px 0 0; font-size: 14px; line-height: 1.7; color: var(--color-muted); display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.g-hero-meta { display: flex; flex-wrap: wrap; gap: 14px; margin-top: 12px; font-size: 12.5px; color: var(--color-muted); }
.g-hero-meta span { display: inline-flex; align-items: center; gap: 5px; }

/* Hero bottom 3 */
.g-hero-bottom { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-top: 20px; }
@media (max-width: 767px) { .g-hero-bottom { grid-template-columns: 1fr; gap: 16px; } }
.g-hero-bottom-card { border-radius: var(--radius-card); overflow: hidden; background: var(--color-surface); border: 1px solid var(--color-border); }
.g-hero-bottom-img { display: block; aspect-ratio: 16 / 9; overflow: hidden; border-radius: var(--radius-card); }
.g-hero-bottom-img :deep(img) { width: 100%; height: 100%; object-fit: cover; transition: transform 0.4s ease; }
.g-hero-bottom-card:hover .g-hero-bottom-img :deep(img) { transform: scale(1.04); }
.g-hero-bottom-body { padding: 12px 14px 14px; }
.g-hero-bottom-title { margin: 6px 0 0; font-size: 15px; line-height: 1.45; }
.g-hero-bottom-title a { color: var(--color-text); text-decoration: none; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; transition: color 0.2s ease; }
.g-hero-bottom-title a:hover { color: var(--color-accent); }

/* ─── Sidebar ─── */
.g-hero-sidebar { border-left: 1px solid var(--color-border); padding-left: 28px; position: relative; }
@media (max-width: 991px) {
  .g-hero-sidebar { border-left: none; padding-left: 0; border-top: 1px solid var(--color-border); padding-top: 24px; }
}
.g-sidebar-header { margin-bottom: 20px; padding-bottom: 10px; border-bottom: 2px solid var(--color-primary); display: flex; align-items: center; }
.g-sidebar-header h3 { font-family: var(--font-heading); font-size: 18px; font-weight: 700; color: var(--color-text); display: flex; align-items: center; gap: 8px; }
.g-sidebar-header h3 i { color: var(--color-accent); font-size: 15px; }
.g-sidebar-card { display: flex; gap: 14px; align-items: flex-start; padding: 14px 0; border-bottom: 1px solid var(--color-border); transition: background 0.2s ease; }
.g-sidebar-card:hover { background: var(--color-surface-alt); margin-inline: -8px; padding-inline: 8px; border-radius: 2px; }
.g-sidebar-card:last-child { border-bottom: none; }
.g-sidebar-thumb { flex-shrink: 0; width: 110px; aspect-ratio: 4 / 3; overflow: hidden; display: block; background: var(--color-surface); border: 1px solid var(--color-border); }
.g-sidebar-thumb :deep(img) { width: 100%; height: 100%; object-fit: cover; transition: transform 0.35s cubic-bezier(0.22, 0.61, 0.36, 1); }
.g-sidebar-card:hover .g-sidebar-thumb :deep(img) { transform: scale(1.06); }
.g-sidebar-body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 4px; }
.g-sidebar-body h4 { margin: 0; font-size: 14.5px; line-height: 1.5; font-weight: 600; }
.g-sidebar-body h4 a { color: var(--color-text); text-decoration: none; display: block; transition: color 0.2s ease; }
.g-sidebar-body h4 a:hover { color: var(--color-accent); }
.g-sidebar-time { font-size: 12px; color: var(--color-muted); margin-top: 2px; display: inline-flex; align-items: center; gap: 4px; }

/* ─── Category Chips ─── */
.g-cat-chip { display: inline-block; font-size: 11px; font-weight: 700; letter-spacing: 0.03em; padding: 3px 10px; border-radius: var(--radius-badge); color: #fff; text-transform: uppercase; line-height: 1.4; }
.g-cat-chip--sm { font-size: 10px; padding: 2px 8px; }

/* Breaking badge */
.g-breaking { position: absolute; top: 12px; left: 12px; background: var(--color-live); color: #fff; font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: var(--radius-badge); z-index: 2; }

/* ─── Popular Section ─── */
.g-popular-section { padding: 48px 0 0; }

/* ─── Video Section ─── */
.g-video-section { padding: 48px 0 0; }
.g-video-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 14px; }
@media (max-width: 991px) { .g-video-grid { grid-template-columns: repeat(3, 1fr); } }
@media (max-width: 575px) { .g-video-grid { grid-template-columns: repeat(2, 1fr); } }
.g-video-card { position: relative; display: block; aspect-ratio: 16 / 9; overflow: hidden; background: var(--color-surface); border: 1px solid var(--color-border); }
.g-video-card :deep(img) { width: 100%; height: 100%; object-fit: cover; transition: transform 0.4s ease; }
.g-video-card:hover :deep(img) { transform: scale(1.04); }
.g-video-play { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 44px; height: 44px; border-radius: 50%; background: rgba(255, 255, 255, 0.9); color: var(--color-live); display: flex; align-items: center; justify-content: center; font-size: 16px; transition: transform 0.25s ease; z-index: 2; }
.g-video-card:hover .g-video-play { transform: translate(-50%, -50%) scale(1.1); }
.g-video-overlay { position: absolute; left: 0; right: 0; bottom: 0; padding: 28px 12px 10px; background: linear-gradient(to bottom, rgba(11,28,57,0) 0%, rgba(11,28,57,0.8) 100%); z-index: 1; }
.g-video-overlay h4 { color: #fff; font-size: 13px; line-height: 1.4; margin: 0; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }

/* ─── Recent Section ─── */
.g-recent-section { padding: 48px 0 0; }

/* ─── Ad Section ─── */
.g-ad-section { padding: 32px 0; }
</style>
