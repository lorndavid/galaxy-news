<template>
  <div class="space-y-5">
    <!-- Upload dropzone -->
    <div
      class="card flex cursor-pointer flex-col items-center justify-center gap-2 border-2 border-dashed p-8 text-center transition-colors"
      :class="dragging ? 'border-brand-500 bg-brand-50' : 'border-slate-300 hover:border-brand-400'"
      @click="fileInput?.click()"
      @dragover.prevent="dragging = true"
      @dragleave="dragging = false"
      @drop.prevent="onDrop"
    >
      <UploadCloud class="h-8 w-8 text-slate-400" />
      <p class="text-sm font-medium text-slate-600">អូសរូបភាពមកទីនេះ ឬចុចដើម្បីផ្ទុក</p>
      <p class="text-xs text-slate-400">JPG, PNG, WebP, GIF · អតិបរមា 5MB</p>
      <input ref="fileInput" type="file" accept="image/*" class="hidden" @change="onFile" />
    </div>

    <!-- Grid -->
    <div v-if="uploading" class="text-center text-sm text-slate-500">កំពុងផ្ទុក...</div>
    <div v-else class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      <div v-for="m in items" :key="m.id" class="card group overflow-hidden">
        <img :src="m.secureUrl" :alt="m.altText ?? m.fileName" class="h-32 w-full object-cover" />
        <div class="p-3">
          <p class="truncate text-xs font-medium text-slate-700">{{ m.fileName }}</p>
          <p class="text-[11px] text-slate-400">
            {{ m.width }}×{{ m.height }} · {{ formatSize(m.size) }}
          </p>
          <div class="mt-2 flex gap-1">
            <button class="btn-ghost !p-1.5 text-xs" title="ចម្លង URL" @click="copyUrl(m.secureUrl)">
              <Copy class="h-3.5 w-3.5" />
            </button>
            <button class="btn-ghost !p-1.5 text-xs text-red-600" title="លុប" @click="askDelete(m)">
              <Trash2 class="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="!items.length && !uploading" class="card p-10 text-center text-sm text-slate-400">
      មិនទាន់មានមេឌាទេ
    </div>

    <AdminPagination :page="page" :total-pages="totalPages" :total="total" @change="load" />

    <ConfirmDialog v-model="confirmOpen" @confirm="doDelete" />
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { UploadCloud, Copy, Trash2 } from "lucide-vue-next";
import { adminService } from "@/services/admin.service";
import { uploadFile } from "@/services/api";
import { useToastStore } from "@/stores/toast";
import AdminPagination from "@/components/ui/AdminPagination.vue";
import ConfirmDialog from "@/components/ui/ConfirmDialog.vue";
import type { Media } from "@/types";

const toast = useToastStore();
const items = ref<Media[]>([]);
const page = ref(1);
const totalPages = ref(1);
const total = ref(0);
const uploading = ref(false);
const dragging = ref(false);
const confirmOpen = ref(false);
const fileInput = ref<HTMLInputElement | null>(null);
let target: Media | null = null;

async function load(p = 1) {
  const data = await adminService.media({ page: p, pageSize: 24 });
  items.value = data.items;
  page.value = data.page;
  totalPages.value = data.totalPages;
  total.value = data.total;
}

async function doUpload(file: File) {
  if (!file.type.startsWith("image/")) {
    toast.error("សូមជ្រើសរើសឯកសាររូបភាព");
    return;
  }
  if (file.size > 5 * 1024 * 1024) {
    toast.error("ទំហំឯកសារលើសពី 5MB");
    return;
  }
  uploading.value = true;
  try {
    await uploadFile(file);
    toast.success("បានផ្ទុកមេឌា");
    load(page.value);
  } catch (e) {
    toast.error(e instanceof Error ? e.message : "ផ្ទុកមេឌាបរាជ័យ");
  } finally {
    uploading.value = false;
  }
}

function onFile(e: Event) {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  if (file) doUpload(file);
  input.value = "";
}

function onDrop(e: DragEvent) {
  dragging.value = false;
  const file = e.dataTransfer?.files?.[0];
  if (file) doUpload(file);
}

function formatSize(bytes: number | null) {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

async function copyUrl(url: string) {
  await navigator.clipboard.writeText(url);
  toast.success("បានចម្លង URL");
}

function askDelete(m: Media) {
  target = m;
  confirmOpen.value = true;
}

async function doDelete() {
  if (!target) return;
  try {
    await adminService.deleteMedia(target.id);
    toast.success("បានលុបមេឌា");
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
