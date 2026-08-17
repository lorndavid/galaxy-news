<template>
  <div class="news-sidebar mb-40">
    <h3 class="side-title">{{ t.home.popular }}</h3>
    <div v-for="article in articles" :key="article.id" class="side-news">
      <ArticleThumb :src="article.featuredImage" :alt="title(article)" />
      <div>
        <h5>
          <RouterLink :to="`/article/${article.slug}`">{{ title(article) }}</RouterLink>
        </h5>
        <div class="side-date">
          <i class="ti-calendar"></i> {{ formatKhmerDate(article.publishedAt) }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Article } from "@/types";
import ArticleThumb from "@/components/common/ArticleThumb.vue";
import { formatKhmerDate } from "@/utils/format";
import { useLocalized } from "@/composables/useLocalized";

defineProps<{ articles: Article[] }>();
const { title, t } = useLocalized();
</script>
