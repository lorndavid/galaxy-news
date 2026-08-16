<template>
  <div class="news-list-area">
    <div class="container">
      <div class="row">
        <div class="col-lg-8">
          <SectionTitle :title="title" />

          <div v-if="loading" class="mt-3">
            <div v-for="i in 4" :key="i" class="mb-3"><SkeletonCard /></div>
          </div>
          <div v-else-if="error" class="mt-3"><ErrorState :message="error" @retry="load" /></div>

          <template v-else-if="items.length">
            <NewsRowCard v-for="a in items" :key="a.id" :article="a" />
            <Pagination :page="page" :total-pages="totalPages" @change="goToPage" />
          </template>
          <EmptyState v-else message="មិនទាន់មានអត្ថបទទេ" />
        </div>
        <div class="col-lg-4">
          <SidebarPopular :articles="popular" />
          <NavatraPoster />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import { useSeo } from "@/composables/useSeo";
import { articleService } from "@/services/article.service";
import type { Article } from "@/types";
import SectionTitle from "@/components/common/SectionTitle.vue";
import SkeletonCard from "@/components/common/SkeletonCard.vue";
import ErrorState from "@/components/common/ErrorState.vue";
import EmptyState from "@/components/common/EmptyState.vue";
import Pagination from "@/components/common/Pagination.vue";
import NewsRowCard from "@/components/article/NewsRowCard.vue";
import SidebarPopular from "@/components/article/SidebarPopular.vue";
import NavatraPoster from "@/components/article/NavatraPoster.vue";

const route = useRoute();
const items = ref<Article[]>([]);
const popular = ref<Article[]>([]);
const page = ref(1);
const totalPages = ref(1);
const loading = ref(true);
const error = ref("");

const isLatest = computed(() => route.name === "latest");
const title = computed(() => (isLatest.value ? "ព័ត៌មានថ្មីៗ" : "បញ្ជីព័ត៌មាន"));

useSeo(
  computed(() => ({
    title: `${title.value} | Navatra 4K TV`,
    description: `បញ្ជីអត្ថបទព័ត៌មានទាំងអស់`,
  }))
);

async function load() {
  loading.value = true;
  error.value = "";
  try {
    const data = isLatest.value
      ? await articleService.list({ page: page.value, pageSize: 10, sort: "latest" })
      : await articleService.list({ page: page.value, pageSize: 10 });
    items.value = data.items;
    page.value = data.page;
    totalPages.value = data.totalPages;
  } catch (e) {
    error.value = e instanceof Error ? e.message : "មិនអាចផ្ទុកទិន្នន័យបានទេ";
  } finally {
    loading.value = false;
  }
}

async function goToPage(p: number) {
  page.value = p;
  await load();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

onMounted(async () => {
  popular.value = await articleService.popular(5).catch(() => []);
  load();
});
</script>

<style scoped>
.news-list-area {
  padding-top: 30px;
}
</style>
