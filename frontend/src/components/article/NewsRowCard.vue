<template>
  <div class="news-row-card">
    <div class="news-row-thumb">
      <RouterLink :to="`/article/${article.slug}`">
        <ArticleThumb :src="article.featuredImage" :alt="title(article)" />
      </RouterLink>
      <span v-if="article.isBreaking" class="breaking-badge">{{ t.common.breaking }}</span>
    </div>
    <div class="news-row-body">
      <span :class="catClass">{{ catName(article) }}</span>
      <h4>
        <RouterLink :to="`/article/${article.slug}`">{{ title(article) }}</RouterLink>
      </h4>
      <p v-if="excerpt(article)" class="news-row-excerpt">{{ excerpt(article) }}</p>
      <div class="card-meta-line">
        <span v-if="article.publishedAt"><i class="ti-calendar"></i> {{ formatKhmerDate(article.publishedAt) }}</span>
        <span><i class="ti-user"></i> {{ article.author?.name }}</span>
        <span><i class="ti-eye"></i> {{ formatViews(article.views) }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { Article } from "@/types";
import ArticleThumb from "@/components/common/ArticleThumb.vue";
import { formatKhmerDate, formatViews } from "@/utils/format";
import { useLocalized } from "@/composables/useLocalized";

const props = defineProps<{ article: Article }>();
const { title, excerpt, catName, t } = useLocalized();
const catClass = computed(() => `color${(props.article.categoryId % 4) + 1}`);
</script>

<style scoped>
.news-row-card {
  display: flex;
  gap: 18px;
  padding: 18px 0;
  border-bottom: 1px solid #f0f0f0;
}
.news-row-thumb {
  position: relative;
  flex-shrink: 0;
  width: 220px;
}
.news-row-thumb img {
  width: 100%;
  height: 130px;
  object-fit: cover;
  border-radius: 8px;
}
.breaking-badge {
  position: absolute;
  top: 8px;
  left: 8px;
  background: #e74c3c;
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 4px;
}
.news-row-body h4 {
  font-size: 18px;
  line-height: 1.45;
  margin: 8px 0 6px;
}
.news-row-body h4 a:hover {
  color: #0d3fa9;
}
.news-row-excerpt {
  font-size: 14px;
  color: #6b7280;
  line-height: 1.6;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  margin-bottom: 8px;
}
.card-meta-line {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  font-size: 12.5px;
  color: #8a8a8a;
}
.card-meta-line span {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
@media (max-width: 575px) {
  .news-row-card {
    flex-direction: column;
    gap: 12px;
  }
  .news-row-thumb {
    width: 100%;
  }
  .news-row-thumb img {
    height: 180px;
  }
}
</style>
