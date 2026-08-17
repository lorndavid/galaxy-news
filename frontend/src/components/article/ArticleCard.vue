<template>
  <article class="single-what-news mb-100">
    <div class="what-img">
      <RouterLink :to="`/article/${article.slug}`">
        <ArticleThumb :src="article.featuredImage" :alt="title(article)" :width="640" />
      </RouterLink>
      <span v-if="article.isBreaking" class="breaking-badge">{{ t.common.breaking }}</span>
    </div>
    <div class="what-cap">
      <span :class="catClass">{{ catName(article) }}</span>
      <h4>
        <RouterLink :to="`/article/${article.slug}`">{{ title(article) }}</RouterLink>
      </h4>
      <div class="card-meta-line">
        <span v-if="article.publishedAt"><i class="ti-calendar"></i> {{ formatKhmerDate(article.publishedAt) }}</span>
        <span v-if="article.views >= 0"><i class="ti-eye"></i> {{ formatViews(article.views) }}</span>
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

const props = defineProps<{ article: Article; variant?: "default" | "compact" }>();
const { title, catName, t } = useLocalized();

const catClass = computed(() => {
  const id = props.article.categoryId;
  return `color${(id % 4) + 1}`;
});
</script>

<style scoped>
.breaking-badge {
  position: absolute;
  top: 10px;
  left: 10px;
  background: #e74c3c;
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 4px;
  z-index: 2;
}
.card-meta-line {
  display: flex;
  gap: 14px;
  margin-top: 6px;
  font-size: 12.5px;
  color: #8a8a8a;
}
.card-meta-line span {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
.card-meta-line i {
  font-size: 13px;
}
</style>
