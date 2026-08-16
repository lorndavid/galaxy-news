<template>
  <div class="card overflow-hidden">
    <div class="border-b border-slate-200 px-5 py-4">
      <h3 class="text-sm font-semibold text-slate-700">សារទំនាក់ទំនង ({{ total }})</h3>
    </div>
    <div class="divide-y divide-slate-100">
      <div v-for="m in items" :key="m.id" class="px-5 py-4">
        <div class="flex items-start justify-between gap-4">
          <div class="min-w-0">
            <div class="flex items-center gap-2">
              <span class="font-medium text-slate-700">{{ m.name }}</span>
              <span class="text-xs text-slate-400">{{ m.email }}</span>
              <span class="text-xs text-slate-300">{{ new Date(m.createdAt).toLocaleString() }}</span>
            </div>
            <p v-if="m.subject" class="mt-1 text-sm font-medium text-slate-600">{{ m.subject }}</p>
            <p class="mt-1 text-sm text-slate-600">{{ m.message }}</p>
          </div>
          <button class="btn-ghost !p-2 shrink-0 text-red-600" title="លុប" @click="askDelete(m)">
            <Trash2 class="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
    <div v-if="!items.length" class="p-10 text-center text-sm text-slate-400">មិនមានសារទេ</div>
    <div class="px-4 pb-4">
      <AdminPagination :page="page" :total-pages="totalPages" :total="total" @change="load" />
    </div>

    <ConfirmDialog v-model="confirmOpen" @confirm="doDelete" />
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { Trash2 } from "lucide-vue-next";
import { adminService } from "@/services/admin.service";
import { useToastStore } from "@/stores/toast";
import AdminPagination from "@/components/ui/AdminPagination.vue";
import ConfirmDialog from "@/components/ui/ConfirmDialog.vue";
import type { ContactMessage } from "@/types";

const toast = useToastStore();
const items = ref<ContactMessage[]>([]);
const page = ref(1);
const totalPages = ref(1);
const total = ref(0);
const confirmOpen = ref(false);
let target: ContactMessage | null = null;

async function load(p = 1) {
  const data = await adminService.messages({ page: p, pageSize: 10 });
  items.value = data.items;
  page.value = data.page;
  totalPages.value = data.totalPages;
  total.value = data.total;
}

function askDelete(m: ContactMessage) {
  target = m;
  confirmOpen.value = true;
}

async function doDelete() {
  if (!target) return;
  try {
    await adminService.deleteMessage(target.id);
    toast.success("បានលុបសារ");
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
