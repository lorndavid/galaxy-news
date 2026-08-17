<template>
  <div class="trand-right-single d-flex">
    <div class="trand-right-img">
      <RouterLink :to="`/article/${article.slug}`">
        <ArticleThumb :src="article.featuredImage" :alt="title(article)" />
      </RouterLink>
    </div>
    <div class="trand-right-cap">
      <span :class="catClass">{{ catName(article) }}</span>
      <h4>
        <RouterLink :to="`/article/${article.slug}`">{{ title(article) }}</RouterLink>
      </h4>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { Article } from "@/types";
import ArticleThumb from "@/components/common/ArticleThumb.vue";
import { useLocalized } from "@/composables/useLocalized";

const props = defineProps<{ article: Article }>();
const { title, catName } = useLocalized();
const catClass = computed(() => `color${(props.article.categoryId % 4) + 1}`);
</script>
