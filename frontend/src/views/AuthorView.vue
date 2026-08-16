<template>
  <div class="author-area">
    <div class="container">
      <div class="row">
        <div class="col-lg-8">
          <div v-if="!loading && items.length" class="author-header">
            <div class="author-avatar">
              <img :src="authorAvatar" :alt="authorName" />
            </div>
            <div>
              <h1>{{ authorName }}</h1>
              <p class="text-muted">អ្នកនិពន្ធ · {{ total }} អត្ថបទ</p>
            </div>
          </div>

          <SectionTitle title="អត្ថបទរបស់អ្នកនិពន្ធ" />

          <div v-if="loading" class="mt-3">
            <div v-for="i in 4" :key="i" class="mb-3"><SkeletonCard /></div>
          </div>
          <div v-else-if="error" class="mt-3"><ErrorState :message="error" @retry="load" /></div>

          <template v-else-if="items.length">
            <NewsRowCard v-for="a in items" :key="a.id" :article="a" />
            <Pagination :page="page" :total-pages="totalPages" @change="goToPage" />
          </template>
          <EmptyState v-else message="អ្នកនិពន្ធនេះមិនទាន់មានអត្ថបទទេ" />
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
const total = ref(0);
const loading = ref(true);
const error = ref("");

const authorName = computed(() => items.value[0]?.author?.name ?? "អ្នកនិពន្ធ");
const authorAvatar = computed(() => items.value[0]?.author?.avatar ?? "/assets/img/news/icon-user.png");

useSeo(
  computed(() => ({
    title: `${authorName.value} | Navatra 4K TV`,
    description: `អត្ថបទទាំងអស់របស់ ${authorName.value}`,
  }))
);

async function load() {
  loading.value = true;
  error.value = "";
  try {
    const id = String(route.params.id);
    const data = await articleService.byAuthor(id, page.value);
    items.value = data.items;
    page.value = data.page;
    totalPages.value = data.totalPages;
    total.value = data.total;
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
.author-area {
  padding-top: 30px;
}
.author-header {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 24px;
  background: #f8fafc;
  border-radius: 12px;
  margin-bottom: 10px;
}
.author-avatar img {
  width: 84px;
  height: 84px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid #fff;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
}
.author-header h1 {
  font-size: 26px;
  margin-bottom: 2px;
  color: #0b1c39;
}
</style>
