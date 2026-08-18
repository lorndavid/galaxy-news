<template>
  <div class="g-popular-sidebar">
    <h3 class="g-popular-title">{{ t.home.popular }}</h3>
    <article v-for="(article, i) in articles" :key="article.id" class="g-popular-row">
      <span class="g-popular-num">{{ String(i + 1).padStart(2, '0') }}</span>
      <div class="g-popular-body">
        <h5>
          <RouterLink :to="`/article/${article.slug}`">{{ title(article) }}</RouterLink>
        </h5>
        <span v-if="article.publishedAt" class="g-popular-date">
          <i class="ti-calendar"></i> {{ formatKhmerDate(article.publishedAt) }}
        </span>
      </div>
    </article>
  </div>
</template>

<script setup lang="ts">
import type { Article } from "@/types";
import { formatKhmerDate } from "@/utils/format";
import { useLocalized } from "@/composables/useLocalized";

defineProps<{ articles: Article[] }>();
const { title, t } = useLocalized();
</script>

<style scoped>
.g-popular-sidebar {
  margin-bottom: 32px;
}
.g-popular-title {
  font-family: var(--font-heading, "Kantumruy Pro", "Noto Sans Khmer", sans-serif);
  font-size: 18px;
  font-weight: 700;
  color: var(--color-text, #111827);
  margin: 0 0 16px;
}
.g-popular-row {
  display: flex;
  gap: 14px;
  align-items: flex-start;
  padding: 14px 0;
  border-bottom: 1px solid var(--color-border, #e5e7eb);
}
.g-popular-row:last-child {
  border-bottom: none;
}
.g-popular-num {
  flex-shrink: 0;
  font-family: "Inter", sans-serif;
  font-size: 22px;
  font-weight: 800;
  color: var(--color-border, #e5e7eb);
  line-height: 1;
  min-width: 30px;
}
.g-popular-body h5 {
  margin: 0 0 4px;
  font-size: 14px;
  font-weight: 600;
  line-height: 1.45;
}
.g-popular-body h5 a {
  color: var(--color-text, #111827);
  text-decoration: none;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  transition: color 0.2s ease;
}
.g-popular-body h5 a:hover {
  color: var(--color-accent, #4f46e5);
}
.g-popular-date {
  font-size: 12px;
  color: var(--color-muted, #6b7280);
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
</style>
