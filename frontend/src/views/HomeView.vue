<template>
  <div>
    <!-- Trending Area -->
    <div class="trending-area fix">
      <div class="container">
        <div class="trending-main">
          <!-- Breaking ticker -->
          <div class="row">
            <div class="col-lg-12">
              <div class="trending-tittle">
                <strong>កំពុងពេញនិយម</strong>
                <div class="trending-animated">
                  <ul class="breaking-ticker">
                    <li v-for="a in breaking" :key="a.id" class="news-item">
                      <RouterLink :to="`/article/${a.slug}`">{{ a.title }}</RouterLink>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div class="row">
            <div class="col-lg-8">
              <!-- Hero -->
              <TrendingTopCard v-if="hero" :article="hero" is-hero />
              <!-- Bottom 3 -->
              <div class="trending-bottom">
                <div class="row">
                  <div v-for="a in bottomThree" :key="a.id" class="col-lg-4">
                    <div class="single-bottom mb-35">
                      <div class="trend-bottom-img mb-30">
                        <RouterLink :to="`/article/${a.slug}`">
                          <ArticleThumb :src="a.featuredImage" :alt="a.title" />
                        </RouterLink>
                      </div>
                      <div class="trend-bottom-cap">
                        <span :class="`color${(a.categoryId % 4) + 1}`">{{ a.category?.name }}</span>
                        <h4>
                          <RouterLink :to="`/article/${a.slug}`">{{ a.title }}</RouterLink>
                        </h4>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <!-- Right trending list -->
            <div class="col-lg-4">
              <TrendingRightCard v-for="a in rightList" :key="a.id" :article="a" />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Weekly News -->
    <div class="weekly-news-area pt-50">
      <div class="container">
        <div class="weekly-wrapper">
          <SectionTitle title="ព័ត៌មានប្រចាំសប្តាហ៍" />
          <div class="row">
            <div class="col-12">
              <CarouselScroll>
                <div v-for="a in weekly" :key="a.id" class="weekly-single">
                  <div class="weekly-img">
                    <RouterLink :to="`/article/${a.slug}`">
                      <ArticleThumb :src="a.featuredImage" :alt="a.title" />
                    </RouterLink>
                  </div>
                  <div class="weekly-caption">
                    <span class="color1">{{ a.category?.name }}</span>
                    <h4>
                      <RouterLink :to="`/article/${a.slug}`">{{ a.title }}</RouterLink>
                    </h4>
                  </div>
                </div>
              </CarouselScroll>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- What's New with category tabs -->
    <section class="whats-news-area pt-50 pb-20">
      <div class="container">
        <div class="row">
          <div class="col-lg-8">
            <div class="row d-flex justify-content-between">
              <div class="col-lg-3 col-md-3">
                <SectionTitle title="អ្វីដែលថ្មី" />
              </div>
              <div class="col-lg-9 col-md-9">
                <div class="properties__button">
                  <nav>
                    <div class="nav nav-tabs" role="tablist">
                      <a
                        class="nav-item nav-link"
                        :class="{ active: activeTab === 'all' }"
                        href="#"
                        role="tab"
                        @click.prevent="activeTab = 'all'"
                      >ទាំងអស់</a>
                      <a
                        v-for="cat in categories.slice(0, 5)"
                        :key="cat.id"
                        class="nav-item nav-link"
                        :class="{ active: activeTab === cat.slug }"
                        href="#"
                        role="tab"
                        @click.prevent="setTab(cat.slug)"
                      >{{ cat.name }}</a>
                    </div>
                  </nav>
                </div>
              </div>
            </div>
            <div class="row">
              <div class="col-12">
                <div class="whats-news-caption">
                  <div class="row">
                    <div v-for="a in tabArticles" :key="a.id" class="col-lg-6 col-md-6">
                      <ArticleCard :article="a" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <!-- Sidebar -->
          <div class="col-lg-4">
            <SidebarPopular :articles="popular" />
            <NavatraPoster />
          </div>
        </div>
      </div>
    </section>

    <!-- Weekly 2 (gray) -->
    <div class="weekly2-news-area weekly2-pading gray-bg">
      <div class="container">
        <div class="weekly2-wrapper">
          <SectionTitle title="ព័ត៌មានថ្មីៗ" />
          <div class="row">
            <div class="col-12">
              <CarouselScroll>
                <div v-for="a in latest" :key="a.id" class="weekly2-single">
                  <div class="weekly2-img">
                    <RouterLink :to="`/article/${a.slug}`">
                      <ArticleThumb :src="a.featuredImage" :alt="a.title" />
                    </RouterLink>
                  </div>
                  <div class="weekly2-caption">
                    <span class="color1">{{ a.category?.name }}</span>
                    <p>{{ formatKhmerDate(a.publishedAt) }}</p>
                    <h4>
                      <RouterLink :to="`/article/${a.slug}`">{{ a.title }}</RouterLink>
                    </h4>
                  </div>
                </div>
              </CarouselScroll>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- YouTube area -->
    <div class="youtube-area video-padding">
      <div class="container">
        <div class="row">
          <div class="col-12">
            <div class="video-grid">
              <a
                v-for="a in videoArticles"
                :key="a.id"
                class="video-card"
                :href="youtubeChannel"
                target="_blank"
                rel="noopener"
                :title="a.title"
              >
                <ArticleThumb :src="a.featuredImage" :alt="a.title" />
                <span class="video-play"><i class="fas fa-play"></i></span>
                <span class="video-overlay"><h4>{{ a.title }}</h4></span>
              </a>
            </div>
          </div>
        </div>
        <div class="video-info">
          <div class="row">
            <div class="col-lg-12">
              <div class="video-caption">
                <div class="top-caption">
                  <span class="color1">វីដេអូ</span>
                </div>
                <div class="bottom-caption">
                  <h2>ទស្សនាវីដេអូព័ត៌មានក្តៅៗពី Navatra 4K TV</h2>
                  <p>សូមស្វាគមន៍មកកាន់ Navatra 4K TV ជាមជ្ឈមណ្ឌលព័ត៌មានឌីជីថលដែលផ្តល់ជូនអ្នកនូវព័ត៌មានក្តៅៗ កម្សាន្ត និងបច្ចេកវិទ្យាថ្មីៗប្រចាំថ្ងៃ។</p>
                  <a class="video-cta" :href="youtubeChannel" target="_blank" rel="noopener">
                    <i class="fab fa-youtube"></i> តាមដានឆានែល YouTube
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Recent Articles -->
    <div class="recent-articles">
      <div class="container">
        <div class="recent-wrapper">
          <div class="row">
            <div class="col-lg-12">
              <div class="section-tittle mb-30 d-flex justify-content-between align-items-end">
                <h3>អត្ថបទថ្មីៗ</h3>
                <RouterLink to="/news" class="news-list-all">មើលទាំងអស់ <i class="ti-angle-right"></i></RouterLink>
              </div>
            </div>
          </div>
          <div class="row">
            <div class="col-12">
              <CarouselScroll>
                <div v-for="a in recent" :key="a.id" class="single-recent mb-100">
                  <div class="what-img">
                    <RouterLink :to="`/article/${a.slug}`">
                      <ArticleThumb :src="a.featuredImage" :alt="a.title" />
                    </RouterLink>
                  </div>
                  <div class="what-cap">
                    <span :class="`color${(a.categoryId % 4) + 1}`">{{ a.category?.name }}</span>
                    <h4>
                      <RouterLink :to="`/article/${a.slug}`">{{ a.title }}</RouterLink>
                    </h4>
                  </div>
                </div>
              </CarouselScroll>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useSeo } from "@/composables/useSeo";
import { articleService } from "@/services/article.service";
import { contentService } from "@/services/content.service";
import { useCategoryStore } from "@/stores/categories";
import { useSettingsStore } from "@/stores/settings";
import type { Article, Category } from "@/types";
import ArticleThumb from "@/components/common/ArticleThumb.vue";
import SectionTitle from "@/components/common/SectionTitle.vue";
import CarouselScroll from "@/components/common/CarouselScroll.vue";
import ArticleCard from "@/components/article/ArticleCard.vue";
import TrendingTopCard from "@/components/article/TrendingTopCard.vue";
import TrendingRightCard from "@/components/article/TrendingRightCard.vue";
import SidebarPopular from "@/components/article/SidebarPopular.vue";
import NavatraPoster from "@/components/article/NavatraPoster.vue";
import { formatKhmerDate } from "@/utils/format";

const categoryStore = useCategoryStore();
const settingsStore = useSettingsStore();

useSeo(
  computed(() => ({
    title: "Navatra 4K TV | ព័ត៌មានក្តៅៗប្រចាំថ្ងៃ",
    description:
      settingsStore.settings?.description ??
      "Navatra 4K TV — មជ្ឈមណ្ឌលព័ត៌មានឌីជីថលរបស់កម្ពុជា៖ ព័ត៌មានក្តៅៗ កម្សាន្ត បច្ចេកវិទ្យា និងការផ្សាយបន្តផ្ទាល់",
    image: settingsStore.settings?.logo ?? "/assets/img/hero/banner4.png",
    url: window.location.origin,
    type: "website",
    jsonLd: [
      {
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: settingsStore.settings?.siteName ?? "Navatra 4K TV",
        url: window.location.origin,
        potentialAction: {
          "@type": "SearchAction",
          target: `${window.location.origin}/search?q={search_term_string}`,
          "query-input": "required name=search_term_string",
        },
      },
    ],
  }))
);

const breaking = ref<Article[]>([]);
const featured = ref<Article[]>([]);
const latest = ref<Article[]>([]);
const popular = ref<Article[]>([]);
const recent = ref<Article[]>([]);
const categories = ref<Category[]>([]);
const activeTab = ref("all");
const tabCache = ref<Record<string, Article[]>>({});
const tabLoading = ref(false);

const hero = computed(() => featured.value[0] ?? null);
const bottomThree = computed(() => featured.value.slice(1, 4));
const rightList = computed(() => [...popular.value.slice(0, 3), ...featured.value.slice(4, 6)].filter(Boolean));
const weekly = computed(() => featured.value.slice(0, 6));
const videoArticles = computed(() => recent.value.slice(0, 5));
const tabArticles = computed(() =>
  activeTab.value === "all"
    ? tabCache.value["all"] ?? []
    : tabCache.value[activeTab.value] ?? []
);
const youtubeChannel = computed(() => settingsStore.settings?.youtube ?? "https://www.youtube.com/@KarpitNews");

async function loadTab(slug: string) {
  if (tabCache.value[slug]) return;
  tabLoading.value = true;
  try {
    const data = slug === "all" ? await articleService.latest(8) : await articleService.byCategory(slug, 1);
    tabCache.value[slug] = Array.isArray(data) ? data.slice(0, 8) : data.items.slice(0, 8);
  } finally {
    tabLoading.value = false;
  }
}

function setTab(slug: string) {
  activeTab.value = slug;
  loadTab(slug);
}

onMounted(async () => {
  categoryStore.load();
  settingsStore.load();
  try {
    categories.value = await contentService.categories();
  } catch {
    categories.value = [];
  }
  const [br, feat, lat, pop] = await Promise.all([
    articleService.breaking().catch(() => []),
    articleService.featured(6).catch(() => []),
    articleService.latest(10).catch(() => []),
    articleService.popular(5).catch(() => []),
  ]);
  breaking.value = br;
  featured.value = feat;
  popular.value = pop;
  // One fetch serves both the "all" tab and the recent list
  latest.value = lat.slice(0, 8);
  recent.value = lat.slice(0, 10);
  tabCache.value["all"] = lat.slice(0, 8);
});
</script>
