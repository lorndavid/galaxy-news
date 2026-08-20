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
        <span v-if="article.publishedAt"><i class="ti-calendar"></i> {{ formatDate(article.publishedAt) }}</span>
        <span v-if="article.author?.name" class="row-news-author"><i class="ti-user"></i> {{ article.author.name }}</span>
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { Article } from "@/types";
import ArticleThumb from "@/components/common/ArticleThumb.vue";
import { useLocalized } from "@/composables/useLocalized";

const props = defineProps<{ article: Article }>();
const { title, excerpt, catName, t, formatDate } = useLocalized();

const CAT_COLORS = [
  "var(--cat-national)", "var(--cat-political)", "var(--cat-international)",
  "var(--cat-business)", "var(--cat-technology)", "var(--cat-sports)",
  "var(--cat-entertainment)",
];
const catColor = computed(() => CAT_COLORS[props.article.categoryId % CAT_COLORS.length]);
</script>

<style scoped>
/* One-row news item — small image on the left, text on the right.
   Clean editorial list with modern hover & spacing. */
.row-news {
  display: flex;
  gap: 20px;
  padding: 20px 0;
  border-bottom: 1px solid var(--color-border, #e5e7eb);
  transition: background 0.2s ease;
  border-radius: 8px;
}
.row-news:hover {
  background: var(--color-surface-alt, #f8fafc);
}

/* Thumbnail (left) */
.row-news-thumb {
  position: relative;
  flex-shrink: 0;
  width: 220px;
  aspect-ratio: 16 / 10;
  overflow: hidden;
  display: block;
  background: var(--color-surface, #fff);
  border: 1px solid var(--color-border, #e5e7eb);
  border-radius: 8px;
}
.row-news-thumb :deep(img) {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.4s cubic-bezier(0.22, 0.61, 0.36, 1);
}
.row-news:hover .row-news-thumb :deep(img) {
  transform: scale(1.05);
}
.row-news-badge {
  position: absolute;
  top: 8px;
  left: 8px;
  background: var(--color-live, #dc2626);
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  padding: 2px 8px;
  z-index: 2;
}

/* Text (right) */
.row-news-body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
}
.row-news-cat {
  align-self: flex-start;
  font-size: 10.5px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: #fff;
  padding: 3px 10px;
  border-radius: 4px;
  margin-bottom: 8px;
}
.row-news-title {
  margin: 0 0 6px;
  font-family: var(--font-heading, "Noto Sans Khmer", sans-serif);
  font-size: 17px;
  font-weight: 600;
  line-height: 1.5;
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
  color: var(--color-accent, #fc3f00);
}
.row-news-excerpt {
  margin: 0 0 8px;
  font-size: 13.5px;
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
  gap: 12px;
  font-size: 12px;
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
    width: 110px;
    border: none;
    border-radius: 6px;
  }
  .row-news-title {
    font-size: 15px;
  }
  .row-news-excerpt,
  .row-news-author {
    display: none;
  }
  .row-news-meta {
    gap: 10px;
    font-size: 11.5px;
  }
}
@media (max-width: 380px) {
  .row-news-thumb {
    width: 96px;
  }
}
</style>