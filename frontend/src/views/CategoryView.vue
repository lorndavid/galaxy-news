<template>
  <div class="category-area">
    <div class="container">
      <!-- Page header — clean text, no banner box -->
      <div class="category-hero">
        <h1 class="category-hero-title">{{ catNameOf(category) }}</h1>
        <p v-if="catDescriptionOf(category)" class="category-hero-desc">{{ catDescriptionOf(category) }}</p>
      </div>

      <div v-if="loading" class="row mt-4">
        <div v-for="i in 6" :key="i" class="col-lg-6 col-md-6 mb-4">
          <SkeletonCard />
        </div>
      </div>

      <div v-else-if="error" class="row mt-4"><div class="col-12"><ErrorState :message="error" @retry="load" /></div></div>

      <template v-else>
        <!-- Featured article -->
        <div v-if="featured" class="row mt-4">
          <div class="col-lg-8">
            <TrendingTopCard :article="featured" />
          </div>
          <div class="col-lg-4">
            <SidebarPopular :articles="popular" />
          </div>
        </div>

        <!-- Grid -->
        <div class="row">
          <div class="col-lg-8">
            <SectionTitle :title="sectionTitle" />
            <div v-if="items.length" class="row">
              <div v-for="a in items" :key="a.id" class="col-lg-6 col-md-6">
                <ArticleCard :article="a" />
              </div>
            </div>
            <EmptyState v-else :message="t.common.noResults" />
            <Pagination :page="page" :total-pages="totalPages" @change="goToPage" />
          </div>
          <div class="col-lg-4">
            <SidebarPopular :articles="popular" />
            <NavatraPoster />
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { useSeo } from "@/composables/useSeo";
import { articleService } from "@/services/article.service";
import { contentService } from "@/services/content.service";
import type { Article, Category } from "@/types";
import SectionTitle from "@/components/common/SectionTitle.vue";
import SkeletonCard from "@/components/common/SkeletonCard.vue";
import ErrorState from "@/components/common/ErrorState.vue";
import EmptyState from "@/components/common/EmptyState.vue";
import Pagination from "@/components/common/Pagination.vue";
import ArticleCard from "@/components/article/ArticleCard.vue";
import TrendingTopCard from "@/components/article/TrendingTopCard.vue";
import SidebarPopular from "@/components/article/SidebarPopular.vue";
import NavatraPoster from "@/components/article/NavatraPoster.vue";
import { useLocalized } from "@/composables/useLocalized";

const route = useRoute();
const { locale, t } = useLocalized();
const category = ref<Category | null>(null);
const items = ref<Article[]>([]);
const popular = ref<Article[]>([]);
const page = ref(1);
const totalPages = ref(1);
const loading = ref(true);
const error = ref("");

const catNameOf = (c: Category | null) => (c ? locale.pick(c.name, c.nameEn) : "");
const catDescriptionOf = (c: Category | null) => (c ? locale.pick(c.description, c.descriptionEn) : "");
const sectionTitle = computed(() => {
  const name = catNameOf(category.value);
  return name ? `${t.home.whatsNew} — ${name}` : t.home.whatsNew;
});

const featured = computed(() => items.value[0] ?? null);

useSeo(
  computed(() => {
    const c = category.value;
    return {
      title: `${c?.name ?? "ប្រភេទ"} | Navatra 4K TV`,
      description: c?.description ?? `អត្ថបទទាំងអស់ក្នុងប្រភេទ ${c?.name ?? ""}`,
      url: c ? `${window.location.origin}/category/${c.slug}` : undefined,
      type: "website",
      jsonLd: c
        ? [
            {
              "@context": "https://schema.org",
              "@type": "CollectionPage",
              name: c.name,
              description: c.description ?? undefined,
              url: `${window.location.origin}/category/${c.slug}`,
            },
          ]
        : [],
    };
  })
);

async function load() {
  loading.value = true;
  error.value = "";
  page.value = 1;
  try {
    const slug = String(route.params.slug);
    const data = await articleService.byCategory(slug, 1);
    items.value = data.items;
    page.value = data.page;
    totalPages.value = data.totalPages;
    if (!category.value) {
      const cats = await contentService.categories().catch(() => []);
      category.value = cats.find((c) => c.slug === slug) ?? null;
    }
    popular.value = await articleService.popular(5).catch(() => []);
  } catch (e) {
    error.value = e instanceof Error ? e.message : t.error.message;
  } finally {
    loading.value = false;
  }
}

async function goToPage(p: number) {
  page.value = p;
  loading.value = true;
  try {
    const data = await articleService.byCategory(String(route.params.slug), p);
    items.value = data.items;
    totalPages.value = data.totalPages;
    window.scrollTo({ top: 0, behavior: "smooth" });
  } finally {
    loading.value = false;
  }
}

onMounted(load);
watch(() => route.params.slug, () => { category.value = null; load(); });
</script>

<style scoped>
.category-area {
  padding-top: 26px;
}
/* Clean editorial page header — plain text, subtle accent underline,
   no colored banner box */
.category-hero {
  padding: 8px 0 20px;
  margin-bottom: 4px;
  border-bottom: 1px solid var(--color-border, #e5e7eb);
}
.category-hero-title {
  margin: 0;
  font-family: var(--font-heading, "Noto Sans Khmer", sans-serif);
  font-size: clamp(22px, 1.2vw + 0.9rem, 30px);
  font-weight: 700;
  line-height: 1.35;
  color: var(--color-text, #0b1c39);
  overflow-wrap: anywhere;
}
.category-hero-title::after {
  content: "";
  display: block;
  width: 34px;
  height: 3px;
  border-radius: 2px;
  background: var(--color-primary, #0d3fa9);
  margin-top: 10px;
}
.category-hero-desc {
  margin: 12px 0 0;
  font-size: 15px;
  line-height: 1.7;
  color: var(--color-muted, #667085);
  max-width: 720px;
}
</style>
