<template>
  <article class="row-news">
    <RouterLink :to="`/article/${article.slug}`" class="row-news-thumb">
      <ArticleThumb :src="article.featuredImage" :alt="title(article)" :width="320" />
      <span v-if="article.isBreaking" class="row-news-badge">{{ t.common.breaking }}</span>
    </RouterLink>
    <div class="row-news-body">
      <span class="row-news-cat" :style="{ background: catColor }">{{ catName(article) }}</span>
      <h3 class="row-news-title">
        <RouterLink :to="`/article/${article.slug}`">{{ title(article) }}</RouterLink>
      </h3>
      <p v-if="excerpt(article)" class="row-news-excerpt">{{ excerpt(article) }}</p>
      <div class="row-news-meta">
        <span v-if="article.publishedAt"><i class="ti-calendar"></i> {{ formatKhmerDate(article.publishedAt) }}</span>
        <span v-if="article.author?.name" class="row-news-author"><i class="ti-user"></i> {{ article.author.name }}</span>
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

const props = defineProps<{ article: Article }>();
const { title, excerpt, catName, t } = useLocalized();

const CAT_COLORS = [
  "var(--cat-national)", "var(--cat-political)", "var(--cat-international)",
  "var(--cat-business)", "var(--cat-technology)", "var(--cat-sports)",
  "var(--cat-entertainment)",
];
const catColor = computed(() => CAT_COLORS[props.article.categoryId % CAT_COLORS.length]);
</script>

<style scoped>
/* One-row news item — small image on the left, text on the right.
   Flat corners + single-line separators for a clean editorial list. */
.row-news {
  display: flex;
  gap: 20px;
  padding: 20px 0;
  border-bottom: 1px solid #000;
}

/* Thumbnail (left) */
.row-news-thumb {
  position: relative;
  flex-shrink: 0;
  width: 240px;
  aspect-ratio: 16 / 10;
  overflow: hidden;
  display: block;
  background: var(--color-surface, #fff);
  border: 1px solid var(--color-border, #e5e7eb);
}
.row-news-thumb :deep(img) {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.35s ease;
}
.row-news:hover .row-news-thumb :deep(img) {
  transform: scale(1.04);
}
.row-news-badge {
  position: absolute;
  top: 8px;
  left: 8px;
  background: var(--color-live, #dc2626);
  color: #fff;
  font-size: 10.5px;
  font-weight: 700;
  padding: 2px 8px;
  z-index: 2;
}

/* Text (right) */
.row-news-body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}
.row-news-cat {
  align-self: flex-start;
  font-size: 10.5px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: #fff;
  padding: 3px 9px;
  margin-bottom: 8px;
}
.row-news-title {
  margin: 0 0 8px;
  font-family: var(--font-heading, "Noto Sans Khmer", sans-serif);
  font-size: 18px;
  line-height: 1.45;
}
.row-news-title a {
  color: var(--color-text, #111827);
  text-decoration: none;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  transition: color 0.2s ease;
}
.row-news-title a:hover {
  color: var(--color-accent, #4f46e5);
}
.row-news-excerpt {
  margin: 0 0 10px;
  font-size: 14px;
  line-height: 1.65;
  color: var(--color-muted, #6b7280);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.row-news-meta {
  margin-top: auto;
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  font-size: 12.5px;
  color: var(--color-muted, #8a8a8a);
}
.row-news-meta span {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

/* Responsive — stays one row on mobile with a smaller thumbnail */
@media (max-width: 640px) {
  .row-news {
    gap: 14px;
    padding: 16px 0;
  }
  .row-news-thumb {
    width: 124px;
    border: none;
  }
  .row-news-title {
    font-size: 15.5px;
  }
  .row-news-excerpt,
  .row-news-author {
    display: none;
  }
  .row-news-meta {
    gap: 10px;
    font-size: 12px;
  }
}
@media (max-width: 380px) {
  .row-news-thumb {
    width: 108px;
  }
}
</style>