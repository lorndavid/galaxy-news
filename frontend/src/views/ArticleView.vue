<template>
  <div class="news-detail-area">
    <div class="container">
      <!-- Breaking ticker -->
      <div class="row">
        <div class="col-lg-12">
          <div class="trending-tittle">
            <strong>កំពុងពេញនិយម</strong>
            <div class="trending-animated">
              <ul class="breaking-ticker" aria-label="ព័ត៌មានកំពុងពេញនិយម">
                <Transition name="ticker" mode="out-in">
                  <li v-if="breaking.length" :key="tickerIndex" class="news-item">
                    <RouterLink :to="`/article/${breaking[tickerIndex].slug}`">{{ breaking[tickerIndex].title }}</RouterLink>
                  </li>
                </Transition>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div v-if="loading" class="row"><div class="col-12"><SkeletonArticle /></div></div>

      <div v-else-if="error" class="row"><div class="col-12"><ErrorState :message="error" @retry="load" /></div></div>

      <div v-else-if="article" class="row">
        <div class="col-lg-8">
          <div class="news-detail-wrap">
            <!-- Breadcrumb -->
            <div class="news-breadcrumb">
              <RouterLink to="/">ទំព័រដើម</RouterLink>
              <span class="sep">/</span>
              <RouterLink :to="`/category/${article.category?.slug}`">{{ article.category?.name }}</RouterLink>
              <span class="sep">/</span>
              <span class="current">{{ shortTitle }}</span>
            </div>

            <span class="news-cat" :style="catStyle">{{ article.category?.name }}</span>
            <h1 class="news-title">{{ article.title }}</h1>

            <div class="news-meta">
              <span v-if="article.publishedAt"><i class="ti-calendar"></i> {{ formatKhmerDateFull(article.publishedAt) }}</span>
              <span><i class="ti-user"></i> {{ article.author?.name }}</span>
              <span><i class="ti-timer"></i> {{ toKhmerDigits(readingTime(article.content)) }} នាទីអាន</span>
              <span><i class="ti-eye"></i> {{ formatViews(article.views) }} ដង</span>
            </div>

            <div class="news-thumb">
              <ArticleThumb :src="article.featuredImage" :alt="article.title" />
            </div>

            <div class="news-body">
              <p v-if="article.excerpt" class="news-lead">{{ article.excerpt }}</p>
              <!-- Article content -->
              <div class="news-content news-content-read" v-html="sanitizedContent"></div>

              <div v-if="article.tags?.length" class="news-tags">
                <RouterLink
                  v-for="t in article.tags"
                  :key="t.id"
                  :to="{ name: 'search', query: { q: t.name } }"
                  class="tag-chip"
                >#{{ t.name }}</RouterLink>
              </div>
            </div>

            <!-- Share -->
            <div class="news-social">
              <h4>ចែករំលែកអត្ថបទនេះ</h4>
              <div class="social-row">
                <a :href="share.facebook" class="fb" target="_blank" rel="noopener"><i class="fab fa-facebook-f"></i> Facebook</a>
                <a :href="share.tiktok" class="tt" target="_blank" rel="noopener"><i class="fab fa-tiktok"></i> TikTok</a>
                <a :href="share.telegram" class="yt" target="_blank" rel="noopener"><i class="fab fa-telegram-plane"></i> Telegram</a>
                <a :href="share.whatsapp" class="ig" target="_blank" rel="noopener"><i class="fab fa-whatsapp"></i> WhatsApp</a>
              </div>
            </div>

            <!-- Comments -->
            <div class="news-comments">
              <h3 class="side-title">មតិយោបល់ ({{ comments.length }})</h3>
              <div v-if="comments.length" class="comment-list">
                <div v-for="c in comments" :key="c.id" class="single-comment">
                  <div class="comment-head">
                    <strong>{{ c.name }}</strong>
                    <span class="comment-date">{{ formatKhmerDate(c.createdAt) }}</span>
                  </div>
                  <p>{{ c.content }}</p>
                </div>
              </div>
              <EmptyState v-else message="មិនទាន់មានមតិយោបល់នៅឡើយទេ" />

              <form class="comment-form mt-4" @submit.prevent="submitComment">
                <h4>ទុកមតិយោបល់</h4>
                <div class="row">
                  <div class="col-md-6">
                    <input v-model="commentForm.name" type="text" placeholder="ឈ្មោះ" required class="form-control" />
                  </div>
                  <div class="col-md-6">
                    <input v-model="commentForm.email" type="email" placeholder="អ៊ីមែល" required class="form-control" />
                  </div>
                  <div class="col-12">
                    <textarea v-model="commentForm.content" rows="4" placeholder="មតិយោបល់របស់អ្នក..." required class="form-control"></textarea>
                  </div>
                  <div class="col-12">
                    <button type="submit" class="btn boxed-btn" :disabled="commentSending">
                      {{ commentSending ? "កំពុងផ្ញើ..." : "ផ្ញើមតិ" }}
                    </button>
                  </div>
                  <p v-if="commentMsg" class="col-12 comment-msg">{{ commentMsg }}</p>
                </div>
              </form>
            </div>
          </div>
        </div>

        <!-- Sidebar -->
        <div class="col-lg-4">
          <AdSlot position="sidebar" />
          <SidebarPopular :articles="popular" />
          <NavatraPoster />
        </div>
      </div>

      <!-- Related -->
      <div v-if="related.length" v-reveal class="news-related">
        <SectionTitle title="ព័ត៌មានពាក់ព័ន្ធ" to="/news" />
        <div class="row">
          <div v-for="(a, i) in related" :key="a.id" class="col-lg-4 col-md-6">
            <div v-reveal="i">
              <ArticleCard :article="a" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { useRoute } from "vue-router";
import { useSeo } from "@/composables/useSeo";
import { articleService } from "@/services/article.service";
import { useSettingsStore } from "@/stores/settings";
import type { Article, Comment } from "@/types";
import ArticleThumb from "@/components/common/ArticleThumb.vue";
import SectionTitle from "@/components/common/SectionTitle.vue";
import SkeletonArticle from "@/components/common/SkeletonArticle.vue";
import ErrorState from "@/components/common/ErrorState.vue";
import EmptyState from "@/components/common/EmptyState.vue";
import ArticleCard from "@/components/article/ArticleCard.vue";
import SidebarPopular from "@/components/article/SidebarPopular.vue";
import AdSlot from "@/components/ads/AdSlot.vue";
import NavatraPoster from "@/components/article/NavatraPoster.vue";
import { formatKhmerDate, formatKhmerDateFull, formatViews, readingTime, toKhmerDigits } from "@/utils/format";

const route = useRoute();
const settingsStore = useSettingsStore();

const article = ref<Article | null>(null);
const related = ref<Article[]>([]);
const popular = ref<Article[]>([]);
const breaking = ref<Article[]>([]);
const comments = ref<Comment[]>([]);
const loading = ref(true);
const error = ref("");
const tickerIndex = ref(0);
let tickerTimer: number | undefined;

function startTicker() {
  if (!breaking.value.length) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  if (tickerTimer) window.clearInterval(tickerTimer);
  tickerTimer = window.setInterval(() => {
    tickerIndex.value = (tickerIndex.value + 1) % breaking.value.length;
  }, 4000);
}

function stopTicker() {
  if (tickerTimer) window.clearInterval(tickerTimer);
  tickerTimer = undefined;
}

const commentForm = reactive({ name: "", email: "", content: "" });
const commentSending = ref(false);
const commentMsg = ref("");

const shortTitle = computed(() => {
  const t = article.value?.title ?? "";
  return t.length > 40 ? `${t.slice(0, 40)}...` : t;
});

const catStyle = computed(() => {
  const color = article.value?.category?.color;
  return color ? { background: color, borderColor: color } : {};
});

const sanitizedContent = computed(() => {
  const raw = article.value?.content ?? "";
  // Lightweight sanitize: strip script/iframe/on* attributes.
  return raw
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, "")
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "");
});

const pageUrl = computed(() => window.location.href);
const share = computed(() => ({
  facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(pageUrl.value)}`,
  tiktok: `https://www.tiktok.com/share?url=${encodeURIComponent(pageUrl.value)}`,
  telegram: `https://t.me/share/url?url=${encodeURIComponent(pageUrl.value)}&text=${encodeURIComponent(article.value?.title ?? "")}`,
  whatsapp: `https://wa.me/?text=${encodeURIComponent(`${article.value?.title ?? ""} ${pageUrl.value}`)}`,
}));

useSeo(
  computed(() => {
    const a = article.value;
    const base = window.location.origin;
    return {
      title: `${a?.title ?? "Navatra 4K TV"} | Navatra 4K TV`,
      description: a?.excerpt ?? a?.title ?? "",
      image: a?.featuredImage,
      url: pageUrl.value,
      type: "article",
      jsonLd: a
        ? [
            {
              "@context": "https://schema.org",
              "@type": "NewsArticle",
              headline: a.title,
              description: a.excerpt ?? undefined,
              image: a.featuredImage ?? undefined,
              datePublished: a.publishedAt ?? a.createdAt,
              dateModified: a.updatedAt,
              url: pageUrl.value,
              author: { "@type": "Person", name: a.author?.name ?? "Navatra 4K TV" },
              publisher: {
                "@type": "Organization",
                name: settingsStore.settings?.siteName ?? "Navatra 4K TV",
                logo: settingsStore.settings?.logo
                  ? { "@type": "ImageObject", url: settingsStore.settings.logo }
                  : undefined,
              },
              mainEntityOfPage: { "@type": "WebPage", "@id": pageUrl.value },
            },
            {
              "@context": "https://schema.org",
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: "ទំព័រដើម", item: base },
                {
                  "@type": "ListItem",
                  position: 2,
                  name: a.category?.name ?? "ព័ត៌មាន",
                  item: `${base}/category/${a.category?.slug ?? "news"}`,
                },
                { "@type": "ListItem", position: 3, name: a.title },
              ],
            },
          ]
        : [],
    };
  })
);

async function load() {
  loading.value = true;
  error.value = "";
  try {
    const slug = String(route.params.slug);
    const [a, rel, pop, br] = await Promise.all([
      articleService.getBySlug(slug),
      articleService.related(slug).catch(() => []),
      articleService.popular(5).catch(() => []),
      articleService.breaking().catch(() => []),
    ]);
    article.value = a;
    related.value = rel.slice(0, 6);
    popular.value = pop;
    breaking.value = br;
    comments.value = await articleService.comments(a.id).catch(() => []);
    startTicker();
  } catch (e) {
    error.value = e instanceof Error ? e.message : "មិនអាចផ្ទុកអត្ថបទបានទេ";
  } finally {
    loading.value = false;
  }
}

async function submitComment() {
  if (!article.value) return;
  commentSending.value = true;
  commentMsg.value = "";
  try {
    await articleService.submitComment({
      articleId: article.value.id,
      name: commentForm.name,
      email: commentForm.email,
      content: commentForm.content,
    });
    commentMsg.value = "សូមអរគុណ! មតិរបស់អ្នកត្រូវបានទទួល ហើយកំពុងរង់ចាំការអនុម័ត។";
    commentForm.content = "";
  } catch (e) {
    commentMsg.value = e instanceof Error ? e.message : "មានបញ្ហាក្នុងការផ្ញើមតិ";
  } finally {
    commentSending.value = false;
  }
}

onMounted(() => {
  settingsStore.load();
  load();
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stopTicker();
    else startTicker();
  });
});
</script>

<style scoped>
.comment-list {
  margin-bottom: 10px;
}
.single-comment {
  border-bottom: 1px solid #eee;
  padding: 14px 0;
}
.comment-head {
  display: flex;
  align-items: baseline;
  gap: 12px;
  margin-bottom: 4px;
}
.comment-head strong {
  color: #0b1c39;
  font-size: 15px;
}
.comment-date {
  font-size: 12.5px;
  color: #999;
}
.single-comment p {
  font-size: 14.5px;
  color: #444;
  line-height: 1.7;
  margin: 0;
}
.comment-form .form-control {
  margin-bottom: 16px;
  font-family: "Noto Sans Khmer", "Kantumruy", sans-serif;
}
.comment-msg {
  color: #0d3fa9;
  font-size: 14px;
  margin-top: 8px;
}
.news-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 20px;
}
.tag-chip {
  background: #f1f5f9;
  color: #0d3fa9;
  font-size: 13px;
  padding: 5px 12px;
  border-radius: 20px;
}
.tag-chip:hover {
  background: #0d3fa9;
  color: #fff;
}
.news-content img {
  max-width: 100%;
  height: auto;
  border-radius: 10px;
  margin: 16px 0;
}
.news-content h2,
.news-content h3 {
  color: #0b1c39;
  margin: 20px 0 10px;
}

/* Reading width — keep paragraphs comfortable instead of full-column wide */
.news-content-read {
  max-width: 720px;
}
.news-content-read p {
  text-wrap: pretty;
}
.news-content-read img {
  display: block;
  margin-left: auto;
  margin-right: auto;
}
.news-content blockquote {
  border-left: 4px solid #0d3fa9;
  background: #f7f9ff;
  padding: 16px 20px;
  margin: 18px 0;
  color: #444;
}
.news-content a {
  color: #0d3fa9;
  text-decoration: underline;
}
</style>
