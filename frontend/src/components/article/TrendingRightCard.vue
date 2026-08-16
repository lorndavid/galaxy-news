<template>
  <div class="trand-right-single d-flex">
    <div class="trand-right-img">
      <RouterLink :to="`/article/${article.slug}`">
        <ArticleThumb :src="article.featuredImage" :alt="article.title" />
      </RouterLink>
    </div>
    <div class="trand-right-cap">
      <span :class="catClass">{{ article.category?.name }}</span>
      <h4>
        <RouterLink :to="`/article/${article.slug}`">{{ article.title }}</RouterLink>
      </h4>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { Article } from "@/types";
import ArticleThumb from "@/components/common/ArticleThumb.vue";

const props = defineProps<{ article: Article }>();
const catClass = computed(() => `color${(props.article.categoryId % 4) + 1}`);
</script>
