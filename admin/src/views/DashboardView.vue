<template>
  <div class="space-y-5">
    <!-- Page header -->
    <div class="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 class="text-lg font-semibold text-slate-800 dark:text-slate-100">ផ្ទាំងគ្រប់គ្រង</h2>
        <p class="mt-0.5 text-[13px] text-slate-500 dark:text-slate-400">ទិដ្ឋភាពទូទៅនៃការផ្សាយ មាតិកា និងសកម្មភាពថ្មីៗ</p>
      </div>
      <div class="flex items-center gap-2">
        <button
          class="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          :disabled="loading"
          @click="load"
        >
          <RefreshCw class="h-3.5 w-3.5" :class="{ 'animate-spin': loading }" />
          ធ្វើឱ្យថ្មី
        </button>
      </div>
    </div>

    <!-- Quick actions -->
    <div class="flex flex-wrap gap-2">
      <RouterLink to="/articles/new" class="btn btn-primary !py-1.5 text-xs">
        <PlusCircle class="h-3.5 w-3.5" /> អត្ថបទថ្មី
      </RouterLink>
      <RouterLink to="/media" class="btn btn-secondary !py-1.5 text-xs">
        <UploadCloud class="h-3.5 w-3.5" /> បង្ហោះមេឌា
      </RouterLink>
      <RouterLink to="/system/health" class="btn btn-secondary !py-1.5 text-xs">
        <HeartPulse class="h-3.5 w-3.5" /> សុខភាពប្រព័ន្ធ
      </RouterLink>
    </div>

    <!-- Loading skeleton -->
    <div v-if="loading" class="space-y-5">
      <div class="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        <div v-for="i in 6" :key="i" class="card animate-pulse p-4">
          <div class="h-3 w-16 rounded bg-slate-200"></div>
          <div class="mt-3 h-7 w-12 rounded bg-slate-200"></div>
        </div>
      </div>
      <div class="card h-56 animate-pulse bg-slate-100"></div>
      <div class="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div class="card h-64 animate-pulse bg-slate-100 lg:col-span-2"></div>
        <div class="card h-64 animate-pulse bg-slate-100"></div>
      </div>
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="card flex flex-col items-center gap-3 p-10 text-center">
      <p class="text-sm text-slate-500">{{ error }}</p>
      <button class="btn btn-primary" @click="load">ព្យាយាមម្តងទៀត</button>
    </div>

    <template v-else>
      <!-- Stat cards -->
      <div class="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        <div v-for="s in statCards" :key="s.label" class="card p-4">
          <div class="flex items-center justify-between gap-2">
            <p class="truncate text-[11px] font-medium text-slate-500">{{ s.label }}</p>
            <component :is="s.icon" class="h-4 w-4 shrink-0" :class="s.color" />
          </div>
          <p class="mt-1.5 text-2xl font-bold tabular-nums leading-none text-slate-800">{{ s.value }}</p>
          <p class="mt-1.5 truncate text-[11px] text-slate-400">{{ s.sub }}</p>
        </div>
      </div>

      <!-- Views over time -->
      <div class="card p-5">
        <div class="mb-4 flex items-center justify-between">
          <h3 class="text-sm font-semibold text-slate-700">ការមើលតាមកាលកំណត់</h3>
          <span class="text-xs text-slate-400">14 ថ្ងៃចុងក្រោយ</span>
        </div>
        <ViewsTrendChart :data="stats?.viewsByDay ?? []" />
      </div>

      <div class="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <!-- Content status analysis -->
        <div class="card p-5 lg:col-span-2">
          <div class="mb-4 flex items-center justify-between">
            <h3 class="text-sm font-semibold text-slate-700">ការវិភាគស្ថានភាពមាតិកា</h3>
            <span class="text-xs text-slate-400">{{ counts?.totalArticles ?? 0 }} អត្ថបទសរុប</span>
          </div>

          <!-- Stacked distribution bar -->
          <div class="flex h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              v-for="s in statusDist"
              :key="s.key"
              class="h-full transition-all duration-700"
              :class="s.bar"
              :style="{ width: s.pct + '%' }"
              :title="`${s.label}: ${s.count} (${s.pct}%)`"
            ></div>
          </div>

          <!-- Legend with counts -->
          <ul class="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4">
            <li v-for="s in statusDist" :key="s.key" class="flex items-center gap-2.5">
              <span class="h-2.5 w-2.5 shrink-0 rounded-sm" :class="s.dot"></span>
              <div class="min-w-0">
                <p class="truncate text-xs text-slate-500">{{ s.label }}</p>
                <p class="text-[13px] font-semibold tabular-nums text-slate-700">
                  {{ s.count }} <span class="font-normal text-slate-400">· {{ s.pct }}%</span>
                </p>
              </div>
            </li>
          </ul>

          <!-- Category breakdown -->
          <div v-if="catItems.length" class="mt-5 border-t border-slate-100 pt-4">
            <div class="mb-3 flex items-center justify-between">
              <h4 class="text-xs font-semibold uppercase tracking-wide text-slate-500">តាមប្រភេទ</h4>
              <span class="text-xs text-slate-400">{{ stats?.categoryBreakdown.total ?? 0 }} បានផ្សាយ</span>
            </div>
            <ul class="space-y-2.5">
              <li v-for="c in catItems" :key="c.id">
                <div class="mb-0.5 flex items-center justify-between gap-3 text-[13px]">
                  <span class="min-w-0 truncate text-slate-700">{{ c.name }}</span>
                  <span class="shrink-0 font-semibold tabular-nums text-slate-500">{{ c.count }}</span>
                </div>
                <div class="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    class="h-full rounded-full transition-all duration-700"
                    :style="{ width: catWidth(c.count), backgroundColor: c.color ?? '#0d3fa9' }"
                  ></div>
                </div>
              </li>
            </ul>
          </div>
        </div>

        <!-- Top articles by views -->
        <div class="card p-5">
          <div class="mb-4 flex items-center justify-between">
            <h3 class="text-sm font-semibold text-slate-700">អត្ថបទពេញនិយមបំផុត</h3>
            <span class="text-xs text-slate-400">តាមការមើល</span>
          </div>
          <ul v-if="stats?.topArticles.length" class="space-y-3.5">
            <li v-for="a in stats.topArticles" :key="a.id">
              <div class="mb-1 flex items-center justify-between gap-3 text-[13px]">
                <span class="min-w-0 truncate text-slate-700">{{ a.title }}</span>
                <span class="shrink-0 font-semibold tabular-nums text-slate-500">{{ a.views.toLocaleString() }}</span>
              </div>
              <div class="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                <div class="h-full rounded-full bg-brand-500 transition-all duration-700" :style="{ width: barWidth(a.views) }"></div>
              </div>
            </li>
          </ul>
          <EmptyState v-else title="មិនទាន់មានទិន្នន័យទេ" />
        </div>
      </div>

      <div class="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <!-- Recent articles -->
        <div class="card overflow-hidden lg:col-span-2">
          <div class="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <h3 class="text-sm font-semibold text-slate-700">អត្ថបទថ្មីៗ</h3>
            <RouterLink to="/articles" class="text-xs font-medium text-brand-600 hover:underline">មើលទាំងអស់</RouterLink>
          </div>
          <div class="overflow-x-auto">
            <table class="data-table">
              <thead>
                <tr>
                  <th>ចំណងជើង</th>
                  <th>ស្ថានភាព</th>
                  <th class="hidden sm:table-cell">អ្នកនិពន្ធ</th>
                  <th class="hidden md:table-cell">កែប្រែចុងក្រោយ</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="a in stats?.recentArticles" :key="a.id">
                  <td class="max-w-[240px] truncate font-medium text-slate-700">{{ a.title }}</td>
                  <td><StatusBadge :status="a.status" /></td>
                  <td class="hidden text-slate-500 sm:table-cell">{{ a.author.name }}</td>
                  <td class="hidden text-slate-400 md:table-cell">{{ formatDate(a.updatedAt) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Recent activity -->
        <div class="card p-5">
          <h3 class="mb-4 text-sm font-semibold text-slate-700">សកម្មភាពថ្មីៗ</h3>
          <ul v-if="stats?.recentActivity.length" class="space-y-3.5">
            <li v-for="a in stats.recentActivity" :key="a.id" class="flex items-start gap-3 text-[13px]">
              <span class="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500"></span>
              <div class="min-w-0">
                <p class="break-words text-slate-700">
                  <span class="font-medium">{{ a.user?.name ?? "ប្រព័ន្ធ" }}</span>
                  <span class="text-slate-500"> — {{ actionLabel(a.action) }}</span>
                </p>
                <p class="break-words text-[11px] text-slate-400">{{ relativeTime(a.createdAt) }}</p>
              </div>
            </li>
          </ul>
          <p v-else class="text-[13px] text-slate-400">មិនទាន់មានសកម្មភាពទេ</p>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { FileText, CheckCircle2, FileEdit, Eye, MessageSquare, Mail, RefreshCw, PlusCircle, UploadCloud, HeartPulse } from "lucide-vue-next";
import { adminService } from "@/services/admin.service";
import StatusBadge from "@/components/ui/StatusBadge.vue";
import EmptyState from "@/components/ui/EmptyState.vue";
import ViewsTrendChart from "@/components/ui/ViewsTrendChart.vue";
import type { DashboardStats } from "@/types";

const stats = ref<DashboardStats | null>(null);
const loading = ref(true);
const error = ref("");

const counts = computed(() => stats.value?.counts);

const statCards = computed(() => {
  const c = counts.value;
  if (!c) return [];
  const publishPct = c.totalArticles ? Math.round((c.published / c.totalArticles) * 100) : 0;
  const avgViews = c.published ? Math.round(c.totalViews / c.published) : 0;
  return [
    { label: "អត្ថបទសរុប", value: c.totalArticles.toLocaleString(), sub: `${publishPct}% បានផ្សាយ`, icon: FileText, bg: "bg-brand-50", color: "text-brand-600" },
    { label: "បានផ្សាយ", value: c.published.toLocaleString(), sub: `${c.scheduled} បានកំណត់ពេល`, icon: CheckCircle2, bg: "bg-emerald-50", color: "text-emerald-600" },
    { label: "សេចក្តីព្រាង", value: c.drafts.toLocaleString(), sub: `${c.archived} បានរក្សាទុក`, icon: FileEdit, bg: "bg-amber-50", color: "text-amber-600" },
    { label: "ការមើលសរុប", value: c.totalViews.toLocaleString(), sub: `មធ្យម ${avgViews.toLocaleString()} / អត្ថបទ`, icon: Eye, bg: "bg-sky-50", color: "text-sky-600" },
    { label: "មតិរង់ចាំ", value: c.commentsPending.toLocaleString(), sub: "ត្រូវការត្រួតពិនិត្យ", icon: MessageSquare, bg: "bg-rose-50", color: "text-rose-600" },
    { label: "ព្រឹត្តិបត្រ", value: c.newsletter.toLocaleString(), sub: `${c.adsActive} ផ្សាយពាណិជ្ជកម្មសកម្ម`, icon: Mail, bg: "bg-violet-50", color: "text-violet-600" },
  ];
});

// Content status analysis
const statusDist = computed(() => {
  const c = counts.value;
  if (!c || !c.totalArticles) return [];
  const parts = [
    { key: "published", label: "បានផ្សាយ", count: c.published, bar: "bg-emerald-500", dot: "bg-emerald-500" },
    { key: "drafts", label: "សេចក្តីព្រាង", count: c.drafts, bar: "bg-amber-500", dot: "bg-amber-500" },
    { key: "scheduled", label: "កំណត់ពេល", count: c.scheduled, bar: "bg-sky-500", dot: "bg-sky-500" },
    { key: "archived", label: "រក្សាទុក", count: c.archived, bar: "bg-slate-400", dot: "bg-slate-400" },
  ];
  const visible = parts.filter((p) => p.count > 0);
  return visible.map((p) => ({ ...p, pct: Math.round((p.count / c.totalArticles) * 100) }));
});

const maxViews = computed(() => Math.max(1, ...(stats.value?.topArticles.map((a) => a.views) ?? [1])));

function barWidth(views: number) {
  return `${Math.max(3, Math.round((views / maxViews.value) * 100))}%`;
}

// Category breakdown (analysis card)
const catItems = computed(() => stats.value?.categoryBreakdown?.items ?? []);
const maxCatCount = computed(() => Math.max(1, ...catItems.value.map((c) => c.count)));

function catWidth(count: number) {
  return `${Math.max(3, Math.round((count / maxCatCount.value) * 100))}%`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString();
}

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "ទើបតែឥឡូវ";
  if (mins < 60) return `${mins} នាទីមុន`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} ម៉ោងមុន`;
  const days = Math.floor(hours / 24);
  return `${days} ថ្ងៃមុន`;
}

function actionLabel(action: string) {
  const map: Record<string, string> = {
    LOGIN: "បានចូលប្រព័ន្ធ",
    USER_LOGGED_IN: "បានចូលប្រព័ន្ធ",
    TOKEN_REFRESHED: "បានធ្វើឱ្យសម័យថ្មី",
    ARTICLE_CREATED: "បានបង្កើតអត្ថបទ",
    ARTICLE_UPDATED: "បានកែសម្រួលអត្ថបទ",
    ARTICLE_PUBLISHED: "បានផ្សាយអត្ថបទ",
    ARTICLE_DELETED: "បានលុបអត្ថបទ",
    CATEGORY_CREATED: "បានបង្កើតប្រភេទ",
    CATEGORY_UPDATED: "បានកែសម្រួលប្រភេទ",
    CATEGORY_DELETED: "បានលុបប្រភេទ",
    CATEGORIES_REORDERED: "បានរៀបចំលំដាប់ប្រភេទ",
    TAG_CREATED: "បានបង្កើតស្លាក",
    TAG_UPDATED: "បានកែសម្រួលស្លាក",
    TAG_DELETED: "បានលុបស្លាក",
    MEDIA_UPLOADED: "បានផ្ទុកមេឌា",
    MEDIA_DELETED: "បានលុបមេឌា",
    USER_CREATED: "បានបង្កើតអ្នកប្រើប្រាស់",
    USER_UPDATED: "បានកែសម្រួលអ្នកប្រើប្រាស់",
    USER_ROLE_CHANGED: "បានផ្លាស់ប្តូរតួនាទី",
    USER_DELETED: "បានលុបអ្នកប្រើប្រាស់",
    COMMENT_MODERATED: "បានត្រួតពិនិត្យមតិ",
    COMMENT_SUBMITTED: "បានផ្ញើមតិ",
    COMMENT_DELETED: "បានលុបមតិ",
    SETTINGS_UPDATED: "បានកែសម្រួលការកំណត់",
    AD_CREATED: "បានបង្កើតផ្សាយពាណិជ្ជកម្ម",
    AD_UPDATED: "បានកែសម្រួលផ្សាយពាណិជ្ជកម្ម",
    AD_DELETED: "បានលុបផ្សាយពាណិជ្ជកម្ម",
    HOMEPAGE_REORDERED: "បានរៀបចំលំដាប់ទំព័រដើម",
    HOMEPAGE_SECTIONS_UPDATED: "បានកែសម្រួលផ្នែកទំព័រដើម",
    NAV_CREATED: "បានបង្កើតម៉ឺនុយ",
    NAV_UPDATED: "បានកែសម្រួលម៉ឺនុយ",
    NAV_DELETED: "បានលុបម៉ឺនុយ",
    NAV_REORDERED: "បានរៀបចំលំដាប់ម៉ឺនុយ",
    PROFILE_UPDATED: "បានកែសម្រួលប្រវត្តិរូប",
  };
  return map[action] ?? action;
}

async function load() {
  loading.value = true;
  error.value = "";
  try {
    stats.value = await adminService.stats();
  } catch (e) {
    error.value = e instanceof Error ? e.message : "មានបញ្ហាក្នុងការផ្ទុកទិន្នន័យ";
  } finally {
    loading.value = false;
  }
}

onMounted(load);
</script>
