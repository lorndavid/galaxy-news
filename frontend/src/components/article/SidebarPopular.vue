<template>
  <div class="news-sidebar mb-40">
    <h3 class="side-title">ព័ត៌មានពេញនិយម</h3>
    <div v-for="article in articles" :key="article.id" class="side-news">
      <ArticleThumb :src="article.featuredImage" :alt="article.title" />
      <div>
        <h5>
          <RouterLink :to="`/article/${article.slug}`">{{ article.title }}</RouterLink>
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

defineProps<{ articles: Article[] }>();
</script>
