<template>
  <div class="trending-top mb-30">
    <div class="trend-top-img">
      <RouterLink :to="`/article/${article.slug}`">
        <ArticleThumb :src="article.featuredImage" :alt="article.title" :width="960" />
      </RouterLink>
      <div class="trend-top-cap">
        <span>{{ article.category?.name }}</span>
        <h1 v-if="isHero">
          <RouterLink :to="`/article/${article.slug}`">{{ article.title }}</RouterLink>
        </h1>
        <h2 v-else>
          <RouterLink :to="`/article/${article.slug}`">{{ article.title }}</RouterLink>
        </h2>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Article } from "@/types";
import ArticleThumb from "@/components/common/ArticleThumb.vue";

withDefaults(defineProps<{ article: Article; isHero?: boolean }>(), {
  isHero: false,
});
</script>
