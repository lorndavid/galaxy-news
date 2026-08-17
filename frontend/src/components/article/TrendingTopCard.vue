<template>
  <article class="hero-card">
    <RouterLink :to="`/article/${article.slug}`" class="hero-card-image">
      <ArticleThumb :src="article.featuredImage" :alt="title(article)" :width="960" />
      <span v-if="article.isBreaking" class="hero-breaking">{{ t.common.breaking }}</span>
    </RouterLink>
    <div class="hero-card-body">
      <span class="hero-card-cat">{{ catName(article) }}</span>
      <h1 v-if="isHero" class="hero-card-title">
        <RouterLink :to="`/article/${article.slug}`">{{ title(article) }}</RouterLink>
      </h1>
      <h2 v-else class="hero-card-title">
        <RouterLink :to="`/article/${article.slug}`">{{ title(article) }}</RouterLink>
      </h2>
      <p v-if="isHero && excerpt(article)" class="hero-card-excerpt">{{ excerpt(article) }}</p>
      <div class="hero-card-meta">
        <span v-if="article.publishedAt"><i class="ti-calendar"></i> {{ formatKhmerDate(article.publishedAt) }}</span>
        <span v-if="article.author?.name"><i class="ti-user"></i> {{ article.author.name }}</span>
        <span><i class="ti-eye"></i> {{ formatViews(article.views) }}</span>
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
import type { Article } from "@/types";
import ArticleThumb from "@/components/common/ArticleThumb.vue";
import { formatKhmerDate, formatViews } from "@/utils/format";
import { useLocalized } from "@/composables/useLocalized";

withDefaults(defineProps<{ article: Article; isHero?: boolean }>(), {
  isHero: false,
});
const { title, excerpt, catName, t } = useLocalized();
</script>

<style scoped>
/* Editorial hero — image on top, clean text block below (no heavy
   overlay), matching the "clean editorial" design language. */
.hero-card {
  border-radius: var(--radius-card, 10px);
  overflow: hidden;
  background: var(--color-surface, #fff);
  border: 1px solid var(--color-border, #e5e7eb);
}
.hero-card-image {
  position: relative;
  display: block;
  aspect-ratio: 16 / 9;
  overflow: hidden;
}
.hero-card-image :deep(img) {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.45s cubic-bezier(0.22, 0.61, 0.36, 1);
}
.hero-card-image:hover :deep(img) {
  transform: scale(1.03);
}
.hero-breaking {
  position: absolute;
  top: 12px;
  left: 12px;
  background: var(--color-accent, #fc3f00);
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 4px;
}
.hero-card-body {
  padding: 16px 18px 18px;
}
.hero-card-cat {
  display: inline-block;
  font-size: 10.5px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--color-primary, #0d3fa9);
  margin-bottom: 8px;
}
.hero-card-title {
  margin: 0;
  font-size: clamp(18px, 1.2vw + 0.85rem, 26px);
  line-height: 1.4;
  font-weight: 700;
}
.hero-card-title a {
  color: var(--color-text, #0b1c39);
  text-decoration: none;
  transition: color 0.25s ease;
}
.hero-card-title a:hover {
  color: var(--color-primary, #0d3fa9);
}
.hero-card-excerpt {
  margin: 10px 0 0;
  font-size: 13.5px;
  line-height: 1.7;
  color: var(--color-muted, #667085);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.hero-card-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  margin-top: 12px;
  font-size: 12.5px;
  color: var(--color-muted, #667085);
}
.hero-card-meta span {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}
</style>
