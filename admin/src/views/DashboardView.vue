<template>
  <div class="space-y-5">
    <!-- Page header -->
    <div class="page-header">
      <div>
        <h2>ផ្ទាំងគ្រប់គ្រង</h2>
        <p>ទិដ្ឋភាពទូទៅនៃការផ្សាយ មាតិកា និងសកម្មភាពថ្មីៗ</p>
      </div>
    </div>

    <!-- Loading skeleton -->
    <div v-if="loading" class="space-y-5">
      <div class="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        <div v-for="i in 6" :key="i" class="card animate-pulse p-4">
          <div class="h-4 w-16 rounded bg-slate-200"></div>
          <div class="mt-3 h-7 w-12 rounded bg-slate-200"></div>
        </div>
      </div>
      <div class="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div v-for="i in 3" :key="i" class="card h-56 animate-pulse bg-slate-100"></div>
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
          <div class="flex items-center gap-2.5">
            <div class="flex h-8 w-8 items-center justify-center rounded-lg" :class="s.bg">
              <component :is="s.icon" class="h-4 w-4" :class="s.color" />
            </div>
            <p class="text-[11px] font-medium text-slate-500">{{ s.label }}</p>
          </div>
          <p class="mt-2.5 text-2xl font-bold tabular-nums text-slate-800">{{ s.value }}</p>
        </div>
      </div>

      <div class="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <!-- Top articles by views (pure-CSS bars) -->
        <div class="card p-5 lg:col-span-2">
          <div class="mb-4 flex items-center justify-between">
            <h3 class="text-sm font-semibold text-slate-700">អត្ថបទពេញនិយមបំផុត</h3>
            <span class="text-xs text-slate-400">តាមចំនួនការមើល</span>
          </div>
          <ul v-if="stats?.topArticles.length" class="space-y-3.5">
            <li v-for="a in stats.topArticles" :key="a.id">
              <div class="mb-1 flex items-center justify-between gap-3 text-[13px]">
                <span class="min-w-0 truncate text-slate-700">{{ a.title }}</span>
                <span class="shrink-0 font-semibold tabular-nums text-slate-500">{{ a.views.toLocaleString() }}</span>
              </div>
              <div class="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  class="h-full rounded-full bg-brand-500 transition-all duration-700"
                  :style="{ width: barWidth(a.views) }"
                ></div>
              </div>
            </li>
          </ul>
          <EmptyState v-else title="មិនទាន់មានទិន្នន័យទេ" />
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

      <!-- Recent articles -->
      <div class="card overflow-hidden">
        <div class="flex items-center justify-between border-b border-slate-200 px-5 py-4">
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
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { FileText, FileEdit, CheckCircle2, Eye, Mail, MessageSquare } from "lucide-vue-next";
import { adminService } from "@/services/admin.service";
import StatusBadge from "@/components/ui/StatusBadge.vue";
import EmptyState from "@/components/ui/EmptyState.vue";
import type { DashboardStats } from "@/types";

const stats = ref<DashboardStats | null>(null);
const loading = ref(true);
const error = ref("");

const statCards = computed(() => {
  const c = stats.value?.counts;
  if (!c) return [];
  return [
    { label: "អត្ថបទសរុប", value: c.totalArticles.toLocaleString(), icon: FileText, bg: "bg-brand-50", color: "text-brand-600" },
    { label: "បានផ្សាយ", value: c.published.toLocaleString(), icon: CheckCircle2, bg: "bg-emerald-50", color: "text-emerald-600" },
    { label: "សេចក្តីព្រាង", value: c.drafts.toLocaleString(), icon: FileEdit, bg: "bg-amber-50", color: "text-amber-600" },
    { label: "ការមើលសរុប", value: c.totalViews.toLocaleString(), icon: Eye, bg: "bg-sky-50", color: "text-sky-600" },
    { label: "មតិរង់ចាំ", value: c.commentsPending.toLocaleString(), icon: MessageSquare, bg: "bg-rose-50", color: "text-rose-600" },
    { label: "ព្រឹត្តិបត្រ", value: c.newsletter.toLocaleString(), icon: Mail, bg: "bg-violet-50", color: "text-violet-600" },
  ];
});

const maxViews = computed(() => Math.max(1, ...(stats.value?.topArticles.map((a) => a.views) ?? [1])));

function barWidth(views: number) {
  return `${Math.max(3, Math.round((views / maxViews.value) * 100))}%`;
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
