<template>
  <article class="g-hero-card">
    <RouterLink :to="`/article/${article.slug}`" class="g-hero-card-img">
      <ArticleThumb :src="article.featuredImage" :alt="title(article)" :width="960" />
      <span v-if="article.isBreaking" class="g-breaking">{{ t.common.breaking }}</span>
    </RouterLink>
    <div class="g-hero-card-body">
      <span class="g-cat-chip" :style="catStyle">{{ catName(article) }}</span>
      <h1 v-if="isHero" class="g-hero-card-title">
        <RouterLink :to="`/article/${article.slug}`">{{ title(article) }}</RouterLink>
      </h1>
      <h2 v-else class="g-hero-card-title">
        <RouterLink :to="`/article/${article.slug}`">{{ title(article) }}</RouterLink>
      </h2>
      <p v-if="isHero && excerpt(article)" class="g-hero-card-excerpt">{{ excerpt(article) }}</p>
      <div class="g-hero-card-meta">
        <span v-if="article.publishedAt"><i class="ti-calendar"></i> {{ formatKhmerDate(article.publishedAt) }}</span>
        <span v-if="article.author?.name"><i class="ti-user"></i> {{ article.author.name }}</span>
        <span><i class="ti-eye"></i> {{ formatViews(article.views) }}</span>
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { Article } from "@/types";
import ArticleThumb from "@/components/common/ArticleThumb.vue";
import { formatKhmerDate, formatViews } from "@/utils/format";
import { useLocalized } from "@/composables/useLocalized";

const props = withDefaults(defineProps<{ article: Article; isHero?: boolean }>(), {
  isHero: false,
});
const { title, excerpt, catName, t } = useLocalized();

const CAT_COLORS = [
  "var(--cat-national)", "var(--cat-political)", "var(--cat-international)",
  "var(--cat-business)", "var(--cat-technology)", "var(--cat-sports)",
  "var(--cat-entertainment)",
];
const catStyle = computed(() => ({
  background: CAT_COLORS[props.article.categoryId % CAT_COLORS.length],
}));
</script>

<style scoped>
.g-hero-card {
  border-radius: var(--radius-card, 8px);
  overflow: hidden;
  background: var(--color-surface, #fff);
  border: 1px solid var(--color-border, #e5e7eb);
}
.g-hero-card-img {
  position: relative;
  display: block;
  aspect-ratio: 16 / 9;
  overflow: hidden;
}
.g-hero-card-img :deep(img) {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.45s cubic-bezier(0.22, 0.61, 0.36, 1);
}
.g-hero-card-img:hover :deep(img) {
  transform: scale(1.03);
}
.g-breaking {
  position: absolute;
  top: 12px;
  left: 12px;
  background: var(--color-live, #dc2626);
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: var(--radius-badge, 4px);
}
.g-hero-card-body {
  padding: 16px 18px 18px;
}
.g-cat-chip {
  display: inline-block;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.03em;
  padding: 3px 10px;
  border-radius: var(--radius-badge, 4px);
  color: #fff;
  text-transform: uppercase;
  margin-bottom: 8px;
}
.g-hero-card-title {
  margin: 0;
  font-size: clamp(18px, 1.2vw + 0.85rem, 26px);
  line-height: 1.35;
  font-weight: 700;
  font-family: var(--font-display, "Kantumruy Pro", "Noto Sans Khmer", sans-serif);
}
.g-hero-card-title a {
  color: var(--color-text, #111827);
  text-decoration: none;
  transition: color 0.25s ease;
}
.g-hero-card-title a:hover {
  color: var(--color-accent, #4f46e5);
}
.g-hero-card-excerpt {
  margin: 10px 0 0;
  font-size: 13.5px;
  line-height: 1.7;
  color: var(--color-muted, #6b7280);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.g-hero-card-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  margin-top: 12px;
  font-size: 12.5px;
  color: var(--color-muted, #6b7280);
}
.g-hero-card-meta span {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}
</style>
