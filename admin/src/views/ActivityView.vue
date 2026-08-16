<template>
  <div class="card overflow-hidden">
    <div class="border-b border-slate-200 px-5 py-4">
      <h3 class="text-sm font-semibold text-slate-700">ប្រវត្តិសកម្មភាព</h3>
    </div>
    <div class="divide-y divide-slate-100">
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
    <div v-if="!items.length" class="p-10 text-center text-sm text-slate-400">មិនមានសកម្មភាពទេ</div>
    <div class="px-4 pb-4">
      <AdminPagination :page="page" :total-pages="totalPages" :total="total" @change="load" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { adminService } from "@/services/admin.service";
import AdminPagination from "@/components/ui/AdminPagination.vue";
import type { ActivityLog } from "@/types";

const items = ref<ActivityLog[]>([]);
const page = ref(1);
const totalPages = ref(1);
const total = ref(0);

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
  const data = await adminService.activity(p, 15);
  items.value = data.items;
  page.value = data.page;
  totalPages.value = data.totalPages;
  total.value = data.total;
}

onMounted(() => load(1));
</script>
