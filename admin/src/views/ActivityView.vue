<template>
  <div class="card overflow-hidden">
    <div class="border-b border-slate-200 px-5 py-4">
      <h3 class="text-sm font-semibold text-slate-700">{{ prefs.t('activity.title') }}</h3>
    </div>
    <div v-if="loading" class="space-y-3 p-5">
      <div v-for="i in 6" :key="i" class="flex animate-pulse gap-3">
        <div class="mt-1 h-2 w-2 rounded-full bg-slate-200"></div>
        <div class="flex-1 space-y-1.5">
          <div class="h-3 w-48 rounded bg-slate-200"></div>
          <div class="h-2.5 w-24 rounded bg-slate-200"></div>
        </div>
      </div>
    </div>
    <div v-else-if="error" class="p-8 text-center">
      <p class="text-sm text-red-600">{{ error }}</p>
      <button class="btn-secondary mt-3 !py-1.5 text-xs" @click="load(1)">{{ prefs.t('common.retry') }}</button>
    </div>
    <div v-else class="divide-y divide-slate-100">
      <div v-for="a in items" :key="a.id" class="flex items-start gap-3 px-5 py-3">
        <span class="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-500"></span>
        <div class="min-w-0 flex-1">
          <p class="break-words text-sm text-slate-700">
            <span class="font-medium">{{ a.user?.name ?? "ប្រព័ន្ធ" }}</span>
            <span class="text-slate-500"> — {{ actionLabel(a.action) }}</span>
            <span v-if="a.entity" class="text-xs text-slate-400"> ({{ a.entity }} #{{ a.entityId }})</span>
          </p>
          <p class="break-words text-xs text-slate-400">{{ new Date(a.createdAt).toLocaleString() }}</p>
        </div>
      </div>
    </div>

    <div v-if="!loading && !error && !items.length" class="empty-state">
      <div class="empty-icon"><Activity class="h-6 w-6" /></div>
      <h3>{{ prefs.t('activity.emptyTitle') }}</h3>
      <p>សកម្មភាពនឹងបង្ហាញនៅទីនេះនៅពេលអ្នកប្រើប្រាស់ប្រព័ន្ធផ្សេងៗ</p>
    </div>
    <div class="px-4 pb-4">
      <AdminPagination :page="page" :total-pages="totalPages" :total="total" @change="load" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { Activity } from "lucide-vue-next";
import { adminService } from "@/services/admin.service";
import AdminPagination from "@/components/ui/AdminPagination.vue";
import type { ActivityLog } from "@/types";
import { usePreferencesStore } from "@/stores/preferences";

const items = ref<ActivityLog[]>([]);
const prefs = usePreferencesStore();
const page = ref(1);
const totalPages = ref(1);
const total = ref(0);
const loading = ref(false);
const error = ref("");

const labels: Record<string, string> = {
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

function actionLabel(action: string) {
  return labels[action] ?? action;
}

async function load(p = 1) {
  loading.value = true;
  error.value = "";
  try {
    const data = await adminService.activity(p, 15);
    items.value = data.items;
    page.value = data.page;
    totalPages.value = data.totalPages;
    total.value = data.total;
  } catch (e) {
    error.value = e instanceof Error ? e.message : "ផ្ទុកទិន្នន័យបរាជ័យ";
  } finally {
    loading.value = false;
  }
}

onMounted(() => load(1));
</script>
