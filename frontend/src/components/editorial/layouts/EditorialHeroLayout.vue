<template>
  <!-- Hero: Large feature + 2-3 supporting stories on right -->
  <div class="ed-hero">
    <div class="ed-hero-grid" :class="{ 'has-left': leftArticles.length }">
      <!-- Left: 2 small stories -->
      <aside v-if="leftArticles.length" class="ed-hero-left">
        <article v-for="a in leftArticles" :key="a.id" class="ed-hero-left-card">
          <RouterLink :to="`/article/${a.slug}`" class="ed-hero-left-img">
            <ArticleThumb :src="a.featuredImage" :alt="titleFn(a)" :width="320" />
          </RouterLink>
          <h4><RouterLink :to="`/article/${a.slug}`">{{ titleFn(a) }}</RouterLink></h4>
          <span v-if="a.publishedAt" class="ed-meta">{{ formatDate(a.publishedAt) }}</span>
        </article>
      </aside>

      <!-- Main feature -->
      <div class="ed-hero-main">
        <article v-if="feature" class="ed-hero-card">
          <RouterLink :to="`/article/${feature.slug}`" class="ed-hero-img">
            <ArticleThumb :src="feature.featuredImage" :alt="titleFn(feature)" :width="960" />
            <span v-if="feature.isBreaking" class="ed-breaking">HOT</span>
          </RouterLink>
          <div class="ed-hero-body">
            <span class="ed-cat-chip" :style="{ background: catColor(feature) }">{{ catNameFn(feature) }}</span>
            <h2 class="ed-hero-title">
              <RouterLink :to="`/article/${feature.slug}`">{{ titleFn(feature) }}</RouterLink>
            </h2>
            <p v-if="excerptFn(feature)" class="ed-hero-excerpt">{{ excerptFn(feature) }}</p>
            <div class="ed-hero-meta">
              <span v-if="feature.publishedAt"><i class="ti-calendar"></i> {{ formatDate(feature.publishedAt) }}</span>
              <span v-if="feature.author?.name"><i class="ti-user"></i> {{ feature.author.name }}</span>
            </div>
          </div>
        </article>
        <!-- Bottom row -->
        <div v-if="bottomCards.length" class="ed-hero-bottom">
          <article v-for="a in bottomCards" :key="a.id" class="ed-hero-bottom-card">
            <RouterLink :to="`/article/${a.slug}`" class="ed-hero-bottom-img">
              <ArticleThumb :src="a.featuredImage" :alt="titleFn(a)" :width="480" />
            </RouterLink>
            <div class="ed-hero-bottom-body">
              <h4><RouterLink :to="`/article/${a.slug}`">{{ titleFn(a) }}</RouterLink></h4>
            </div>
          </article>
        </div>
      </div>

      <!-- Right sidebar: small stories -->
      <aside v-if="rightArticles.length" class="ed-hero-right">
        <article v-for="a in rightArticles" :key="a.id" class="ed-hero-right-card">
          <RouterLink :to="`/article/${a.slug}`" class="ed-hero-right-img">
            <ArticleThumb :src="a.featuredImage" :alt="titleFn(a)" :width="160" />
          </RouterLink>
          <div class="ed-hero-right-body">
            <h4><RouterLink :to="`/article/${a.slug}`">{{ titleFn(a) }}</RouterLink></h4>
            <span v-if="a.publishedAt" class="ed-meta">{{ formatDate(a.publishedAt) }}</span>
          </div>
        </article>
      </aside>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { Article } from "@/types";
import { useLocalized } from "@/composables/useLocalized";
import ArticleThumb from "@/components/common/ArticleThumb.vue";

const props = defineProps<{ articles: Article[]; accentColor?: string }>();
const { title: titleFn, excerpt: excerptFn, catName: catNameFn, formatDate } = useLocalized();

const feature = computed(() => props.articles[0] ?? null);
const leftArticles = computed(() => props.articles.slice(1, 3));
const rightArticles = computed(() => props.articles.slice(3, 6));
const bottomCards = computed(() => props.articles.slice(1, 4));

const CAT_COLORS = ["var(--cat-national)", "var(--cat-political)", "var(--cat-international)", "var(--cat-business)", "var(--cat-technology)", "var(--cat-sports)", "var(--cat-entertainment)"];
function catColor(a: Article) { return CAT_COLORS[a.categoryId % CAT_COLORS.length]; }
</script>

<style scoped>
.ed-hero-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 340px;
  gap: 24px;
}
.ed-hero-grid.has-left {
  grid-template-columns: 280px minmax(0, 1fr) 340px;
}
@media (max-width: 1199px) {
  .ed-hero-grid.has-left { grid-template-columns: minmax(0, 1fr) 340px; }
}
@media (max-width: 991px) {
  .ed-hero-grid, .ed-hero-grid.has-left { grid-template-columns: 1fr; }
}

/* Left rail */
.ed-hero-left-card {
  padding-bottom: 14px;
  margin-bottom: 14px;
  border-bottom: 1px solid var(--color-border, #e5e7eb);
}
.ed-hero-left-card:last-child { border-bottom: none; margin-bottom: 0; }
.ed-hero-left-img {
  display: block; aspect-ratio: 16 / 10; overflow: hidden;
  border: 1px solid var(--color-border, #e5e7eb);
}
.ed-hero-left-img :deep(img) { width: 100%; height: 100%; object-fit: cover; transition: transform 0.35s ease; }
.ed-hero-left-card:hover .ed-hero-left-img :deep(img) { transform: scale(1.04); }
.ed-hero-left-card h4 { margin: 8px 0 0; font-size: 14px; line-height: 1.45; }
.ed-hero-left-card h4 a { color: var(--color-text, #111827); text-decoration: none; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; transition: color 0.2s ease; }
.ed-hero-left-card h4 a:hover { color: var(--color-accent, #4f46e5); }

/* Main feature */
.ed-hero-card { overflow: hidden; background: var(--color-surface, #fff); border: 1px solid var(--color-border, #e5e7eb); }
.ed-hero-img { position: relative; display: block; aspect-ratio: 16 / 9; overflow: hidden; }
.ed-hero-img :deep(img) { width: 100%; height: 100%; object-fit: cover; transition: transform 0.45s cubic-bezier(0.22, 0.61, 0.36, 1); }
.ed-hero-img:hover :deep(img) { transform: scale(1.03); }
.ed-hero-body { padding: 16px 18px 18px; }
.ed-hero-title { margin: 8px 0 0; font-size: clamp(22px, 1.5vw + 0.9rem, 30px); line-height: 1.35; font-family: var(--font-display, "Noto Sans Khmer", sans-serif); }
.ed-hero-title a { color: var(--color-text, #111827); text-decoration: none; transition: color 0.2s ease; }
.ed-hero-title a:hover { color: var(--color-accent, #4f46e5); }
.ed-hero-excerpt { margin: 8px 0 0; font-size: 14px; line-height: 1.7; color: var(--color-muted, #6b7280); display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.ed-hero-meta { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 10px; font-size: 12px; color: var(--color-muted, #6b7280); }
.ed-hero-meta span { display: inline-flex; align-items: center; gap: 4px; }

/* Bottom 3 */
.ed-hero-bottom { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-top: 16px; }
@media (max-width: 767px) { .ed-hero-bottom { grid-template-columns: 1fr; gap: 12px; } }
.ed-hero-bottom-card { overflow: hidden; background: var(--color-surface, #fff); border: 1px solid var(--color-border, #e5e7eb); display: flex; gap: 12px; align-items: center; }
.ed-hero-bottom-img { flex-shrink: 0; width: 100px; aspect-ratio: 4 / 3; overflow: hidden; }
.ed-hero-bottom-img :deep(img) { width: 100%; height: 100%; object-fit: cover; transition: transform 0.35s ease; }
.ed-hero-bottom-card:hover .ed-hero-bottom-img :deep(img) { transform: scale(1.05); }
.ed-hero-bottom-body { padding: 8px 12px 8px 0; }
.ed-hero-bottom-body h4 { margin: 0; font-size: 14px; line-height: 1.45; }
.ed-hero-bottom-body h4 a { color: var(--color-text, #111827); text-decoration: none; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; transition: color 0.2s ease; }
.ed-hero-bottom-body h4 a:hover { color: var(--color-accent, #4f46e5); }

/* Right sidebar */
.ed-hero-right { border-left: 1px solid var(--color-border, #e5e7eb); padding-left: 24px; }
@media (max-width: 991px) { .ed-hero-right { border-left: none; padding-left: 0; border-top: 1px solid var(--color-border, #e5e7eb); padding-top: 20px; } }
.ed-hero-right-card { display: flex; gap: 12px; padding: 12px 0; border-bottom: 1px solid var(--color-border, #e5e7eb); }
.ed-hero-right-card:last-child { border-bottom: none; }
.ed-hero-right-img { flex-shrink: 0; width: 100px; aspect-ratio: 4 / 3; overflow: hidden; }
.ed-hero-right-img :deep(img) { width: 100%; height: 100%; object-fit: cover; transition: transform 0.35s ease; }
.ed-hero-right-card:hover .ed-hero-right-img :deep(img) { transform: scale(1.06); }
.ed-hero-right-body { flex: 1; min-width: 0; display: flex; flex-direction: column; justify-content: center; gap: 4px; }
.ed-hero-right-body h4 { margin: 0; font-size: 14px; line-height: 1.5; font-weight: 600; }
.ed-hero-right-body h4 a { color: var(--color-text, #111827); text-decoration: none; transition: color 0.2s ease; }
.ed-hero-right-body h4 a:hover { color: var(--color-accent, #4f46e5); }

/* Shared */
.ed-breaking { position: absolute; top: 10px; left: 10px; background: var(--color-live, #dc2626); color: #fff; font-size: 10.5px; font-weight: 700; padding: 3px 10px; z-index: 2; }
.ed-cat-chip { display: inline-block; font-size: 10.5px; font-weight: 700; letter-spacing: 0.04em; padding: 3px 10px; color: #fff; text-transform: uppercase; margin-bottom: 6px; }
.ed-meta { font-size: 12px; color: var(--color-muted, #6b7280); display: inline-flex; align-items: center; gap: 4px; }

@media (max-width: 640px) {
  .ed-hero-title { font-size: 20px; }
  .ed-hero-excerpt { display: none; }
}
</style>
