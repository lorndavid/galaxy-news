<template>
  <div class="card overflow-hidden">
    <div class="flex gap-2 border-b border-slate-200 p-4">
      <button
        v-for="f in filters"
        :key="f.value"
        class="rounded-full px-3 py-1 text-xs font-medium transition-colors"
        :class="filter === f.value ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'"
        @click="setFilter(f.value)"
      >{{ f.label }}</button>
    </div>
    <div class="divide-y divide-slate-100">
      <div v-for="c in items" :key="c.id" class="px-5 py-4">
        <div class="flex items-start justify-between gap-4">
          <div class="min-w-0">
            <div class="flex items-center gap-2">
              <span class="font-medium text-slate-700">{{ c.name }}</span>
              <span class="text-xs text-slate-400">{{ new Date(c.createdAt).toLocaleString() }}</span>
            </div>
            <p class="mt-1 text-sm text-slate-600">{{ c.content }}</p>
            <p class="mt-1 text-xs text-slate-400">
              អត្ថបទ៖ <RouterLink :to="`/articles/${c.articleId}/edit`" class="text-brand-600 hover:underline">{{ c.article?.title ?? `#${c.articleId}` }}</RouterLink>
            </p>
          </div>
          <div class="flex shrink-0 items-center gap-1">
            <StatusBadge :status="c.status" />
            <button v-if="c.status !== 'APPROVED'" class="btn-ghost !p-2 text-emerald-600" title="អនុម័ត" @click="moderate(c, 'APPROVED')">
              <Check class="h-4 w-4" />
            </button>
            <button v-if="c.status !== 'REJECTED'" class="btn-ghost !p-2 text-red-600" title="បដិសេធ" @click="moderate(c, 'REJECTED')">
              <X class="h-4 w-4" />
            </button>
            <button class="btn-ghost !p-2 text-slate-400" title="លុប" @click="askDelete(c)">
              <Trash2 class="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
    <div v-if="!items.length" class="p-10 text-center text-sm text-slate-400">មិនមានមតិយោបល់ទេ</div>
    <div class="px-4 pb-4">
      <AdminPagination :page="page" :total-pages="totalPages" :total="total" @change="load" />
    </div>

    <ConfirmDialog v-model="confirmOpen" @confirm="doDelete" />
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { Check, X, Trash2 } from "lucide-vue-next";
import { adminService } from "@/services/admin.service";
import { useToastStore } from "@/stores/toast";
import StatusBadge from "@/components/ui/StatusBadge.vue";
import AdminPagination from "@/components/ui/AdminPagination.vue";
import ConfirmDialog from "@/components/ui/ConfirmDialog.vue";
import type { Comment } from "@/types";

const toast = useToastStore();
const items = ref<Comment[]>([]);
const filter = ref("");
const page = ref(1);
const totalPages = ref(1);
const total = ref(0);
const confirmOpen = ref(false);
let target: Comment | null = null;

const filters = [
  { value: "", label: "ទាំងអស់" },
  { value: "PENDING", label: "រង់ចាំ" },
  { value: "APPROVED", label: "បានអនុម័ត" },
  { value: "REJECTED", label: "បានបដិសេធ" },
];

async function load(p = 1) {
  const data = await adminService.comments({ page: p, pageSize: 10, status: filter.value || undefined });
  items.value = data.items;
  page.value = data.page;
  totalPages.value = data.totalPages;
  total.value = data.total;
}

function setFilter(f: string) {
  filter.value = f;
  load(1);
}

async function moderate(c: Comment, status: string) {
  try {
    await adminService.moderateComment(c.id, status);
    toast.success(status === "APPROVED" ? "បានអនុម័តមតិ" : "បានបដិសេធមតិ");
    load(page.value);
  } catch (e) {
    toast.error(e instanceof Error ? e.message : "ដំណើរការបរាជ័យ");
  }
}

function askDelete(c: Comment) {
  target = c;
  confirmOpen.value = true;
}

async function doDelete() {
  if (!target) return;
  try {
    await adminService.deleteComment(target.id);
    toast.success("បានលុបមតិ");
    load(page.value);
  } catch (e) {
    toast.error(e instanceof Error ? e.message : "លុបបរាជ័យ");
  } finally {
    confirmOpen.value = false;
    target = null;
  }
}

onMounted(() => load(1));
</script>
