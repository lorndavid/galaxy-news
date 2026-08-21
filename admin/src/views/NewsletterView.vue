<template>
  <div class="card overflow-hidden">
    <div class="border-b border-slate-200 px-5 py-4">
      <h3 class="text-sm font-semibold text-slate-700">{{ prefs.t('newsletter.title') }} ({{ total }})</h3>
      <p class="mt-0.5 text-xs text-slate-400">អ្នកដែលបានចុះឈ្មោះទទួលព័ត៌មានពីគេហទំព័រ</p>
    </div>
    <div class="divide-y divide-slate-100">
      <div v-for="s in items" :key="s.id" class="flex items-center gap-4 px-5 py-3.5">
        <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600">
          <Mail class="h-4 w-4" />
        </div>
        <div class="min-w-0 flex-1">
          <p class="truncate font-medium text-slate-700">{{ s.email }}</p>
          <p class="text-xs text-slate-400">{{ new Date(s.createdAt).toLocaleString() }}</p>
        </div>
        <span class="badge" :class="s.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'">
          {{ s.isActive ? "សកម្ម" : "អសកម្ម" }}
        </span>
        <button class="btn-ghost !p-2 shrink-0 text-red-600 hover:!bg-red-50" title="prefs.t('common.delete')" @click="askDelete(s)">
          <Trash2 class="h-4 w-4" />
        </button>
      </div>
    </div>
    <div v-if="!loading && !items.length" class="p-10 text-center text-sm text-slate-400">{{ prefs.t('newsletter.empty') }}</div>
    <div v-if="loading" class="p-10 text-center text-sm text-slate-400">កំពុងផ្ទុក...</div>
    <div v-if="error" class="p-8 text-center">
      <p class="text-sm text-red-600">{{ error }}</p>
      <button class="btn-secondary mt-3 !py-1.5 text-xs" @click="load(1)">{{ prefs.t('common.retry') }}</button>
    </div>
    <div v-if="!loading && !error && items.length" class="px-4 pb-4">
      <AdminPagination :page="page" :total-pages="totalPages" :total="total" @change="load" />
    </div>

    <ConfirmDialog v-model="confirmOpen" @confirm="doDelete" />
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { Trash2, Mail } from "lucide-vue-next";
import { adminService } from "@/services/admin.service";
import { useToastStore } from "@/stores/toast";
import AdminPagination from "@/components/ui/AdminPagination.vue";
import ConfirmDialog from "@/components/ui/ConfirmDialog.vue";
import type { NewsletterSubscriber } from "@/types";
import { usePreferencesStore } from "@/stores/preferences";

const toast = useToastStore();
const prefs = usePreferencesStore();
const items = ref<NewsletterSubscriber[]>([]);
const page = ref(1);
const totalPages = ref(1);
const total = ref(0);
const loading = ref(false);
const error = ref("");
const confirmOpen = ref(false);
let target: NewsletterSubscriber | null = null;

async function load(p = 1) {
  loading.value = true;
  error.value = "";
  try {
    const data = await adminService.newsletter({ page: p, pageSize: 10 });
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

function askDelete(s: NewsletterSubscriber) {
  target = s;
  confirmOpen.value = true;
}

async function doDelete() {
  if (!target) return;
  try {
    await adminService.deleteSubscriber(target.id);
    toast.success("បានលុបអ្នកចុះឈ្មោះ");
    load(page.value);
  } catch (e) {
    toast.error(e instanceof Error ? e.message : prefs.t('toast.deleteError'));
  } finally {
    confirmOpen.value = false;
    target = null;
  }
}

onMounted(() => load(1));
</script>
