<template>
  <div class="space-y-5">
    <!-- Page header -->
    <div class="page-header">
      <div>
        <h2>បណ្ណាល័យមេឌា</h2>
        <p>ផ្ទុក គ្រប់គ្រង និងជ្រើសរើសរូបភាពសម្រាប់អត្ថបទ</p>
      </div>
    </div>

    <!-- Toolbar: upload + filters -->
    <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div class="relative max-w-xs flex-1">
        <Search class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input v-model="search" type="text" placeholder="ស្វែងរកមេឌា..." class="input !pl-9" @input="onSearch" />
      </div>
      <select v-model="folderFilter" class="input !w-auto" @change="load(1)">
        <option value="all">គ្រប់ថតទាំងអស់</option>
        <option value="articles">អត្ថបទ</option>
        <option value="categories">ប្រភេទ</option>
        <option value="authors">អ្នកនិពន្ធ</option>
        <option value="ads">ផ្សាយពាណិជ្ជកម្ម</option>
        <option value="gallery">វិចិត្រសាល</option>
        <option value="site">គេហទំព័រ</option>
      </select>
      <label class="ml-auto flex cursor-pointer items-center gap-2 text-sm text-slate-600">
        <input
          type="checkbox"
          class="h-4 w-4 rounded border-slate-300"
          :checked="allSelected"
          :indeterminate.prop="someSelected"
          @change="toggleAll"
        />
        ជ្រើសរើសទាំងអស់
      </label>
    </div>

    <!-- Bulk action bar -->
    <div
      v-if="selected.size > 0"
      class="flex flex-wrap items-center gap-2 rounded-lg border border-brand-100 bg-brand-50/60 px-4 py-2.5"
    >
      <span class="text-sm font-medium text-brand-700">បានជ្រើសរើស {{ selected.size }} មេឌា</span>
      <span class="mx-1 hidden h-4 w-px bg-brand-200 sm:block" />
      <button class="btn-danger !py-1.5 text-xs" :disabled="bulkBusy" @click="askBulkDelete">
        <Trash2 class="h-3.5 w-3.5" /> លុប
      </button>
      <button class="ml-auto text-xs text-slate-500 hover:text-slate-700" :disabled="bulkBusy" @click="clearSelection">
        ឈប់ជ្រើសរើស
      </button>
    </div>

    <!-- Upload dropzone -->
    <div
      class="card flex cursor-pointer flex-col items-center justify-center gap-2 border-2 border-dashed p-8 text-center transition-colors"
      :class="dragging ? 'border-brand-500 bg-brand-50' : 'border-slate-300 hover:border-brand-400'"
      @click="fileInput?.click()"
      @dragover.prevent="dragging = true"
      @dragleave="dragging = false"
      @drop.prevent="onDrop"
    >
      <UploadCloud class="h-7 w-7 text-slate-400" />
      <p class="text-sm font-medium text-slate-600">អូសរូបភាពមកទីនេះ ឬចុចដើម្បីផ្ទុក</p>
      <p class="text-xs text-slate-400">JPG, PNG, WebP, GIF · អតិបរមា 8MB · រក្សាទុកក្នុង MinIO</p>
      <div class="flex items-center gap-2 text-left">
        <input v-model="altText" type="text" placeholder="អត្ថបទជំនួស (alt) — ស្រេចចិត្ត" class="input !w-64 !py-1.5 text-xs" @click.stop />
        <select v-model="uploadFolder" class="input !w-auto !py-1.5 text-xs" @click.stop>
          <option value="articles">ថត: អត្ថបទ</option>
          <option value="gallery">ថត: វិចិត្រសាល</option>
          <option value="ads">ថត: ផ្សាយពាណិជ្ជកម្ម</option>
          <option value="site">ថត: គេហទំព័រ</option>
        </select>
      </div>
      <input ref="fileInput" type="file" accept="image/*" class="hidden" @change="onFile" />
    </div>

    <!-- Grid -->
    <div v-if="uploading" class="py-10 text-center text-sm text-slate-500">កំពុងផ្ទុក...</div>
    <div v-else class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      <div
        v-for="m in items"
        :key="m.id"
        class="card group relative overflow-hidden transition-shadow"
        :class="selected.has(m.id) ? 'ring-2 ring-brand-500' : ''"
      >
        <input
          type="checkbox"
          class="absolute left-2 top-2 z-10 h-4 w-4 rounded border-slate-300 bg-white/80"
          :checked="selected.has(m.id)"
          :aria-label="`ជ្រើសរើស ${m.fileName}`"
          @change="toggleOne(m.id)"
        />
        <div class="relative aspect-video overflow-hidden bg-slate-100">
          <img :src="m.secureUrl ?? m.url" :alt="m.altText ?? m.fileName" class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]" loading="lazy" />
          <span class="absolute right-2 top-2 rounded-full bg-slate-900/60 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur">{{ m.folder }}</span>
        </div>
        <div class="p-3">
          <p class="truncate text-xs font-medium text-slate-700" :title="m.fileName">{{ m.fileName }}</p>
          <p class="text-[11px] text-slate-400">
            {{ m.width }}×{{ m.height }} · {{ formatSize(m.size) }}
          </p>
          <div class="mt-2 flex gap-1">
            <button class="btn-ghost !p-1.5 text-xs" title="ចម្លង URL" @click="copyUrl(m.secureUrl ?? m.url)">
              <Copy class="h-3.5 w-3.5" />
            </button>
            <button class="btn-ghost !p-1.5 text-xs text-red-600" title="លុប" @click="askDelete(m)">
              <Trash2 class="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <EmptyState
      v-if="!items.length && !uploading"
      title="មិនទាន់មានមេឌាទេ"
      message="ផ្ទុករូបភាពដំបូងរបស់អ្នក ដើម្បីប្រើក្នុងអត្ថបទ"
    />

    <AdminPagination :page="page" :total-pages="totalPages" :total="total" @change="load" />

    <ConfirmDialog v-model="confirmOpen" @confirm="doDelete" />
    <ConfirmDialog
      v-model="bulkConfirmOpen"
      :title="`លុប ${selected.size} មេឌា?`"
      :message="'ការលុបច្រើននឹងយកឯកសារចេញពី MinIO ផងដែរ ហើយមិនអាចត្រឡប់វិញបានទេ។'"
      :busy="bulkBusy"
      @confirm="doBulkDelete"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { UploadCloud, Copy, Trash2, Search } from "lucide-vue-next";
import { adminService } from "@/services/admin.service";
import { uploadFile } from "@/services/api";
import { useToastStore } from "@/stores/toast";
import AdminPagination from "@/components/ui/AdminPagination.vue";
import ConfirmDialog from "@/components/ui/ConfirmDialog.vue";
import EmptyState from "@/components/ui/EmptyState.vue";
import type { Media } from "@/types";

const toast = useToastStore();
const items = ref<Media[]>([]);
const page = ref(1);
const totalPages = ref(1);
const total = ref(0);
const uploading = ref(false);
const dragging = ref(false);
const confirmOpen = ref(false);
const bulkConfirmOpen = ref(false);
const bulkBusy = ref(false);
const search = ref("");
const folderFilter = ref("all");
const altText = ref("");
const uploadFolder = ref("articles");
const fileInput = ref<HTMLInputElement | null>(null);
const selected = ref<Set<number>>(new Set());
let target: Media | null = null;
let debounce: number | undefined;

const allSelected = computed(() => items.value.length > 0 && items.value.every((m) => selected.value.has(m.id)));
const someSelected = computed(() => selected.value.size > 0 && !allSelected.value);

async function load(p = 1) {
  const data = await adminService.media({
    page: p,
    pageSize: 30,
    q: search.value.trim() || undefined,
    folder: folderFilter.value === "all" ? undefined : folderFilter.value,
  });
  items.value = data.items;
  page.value = data.page;
  totalPages.value = data.totalPages;
  total.value = data.total;
  const ids = new Set(data.items.map((m) => m.id));
  selected.value = new Set([...selected.value].filter((id) => ids.has(id)));
}

function onSearch() {
  if (debounce) window.clearTimeout(debounce);
  debounce = window.setTimeout(() => load(1), 400);
}

function toggleOne(id: number) {
  const next = new Set(selected.value);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  selected.value = next;
}

function toggleAll() {
  if (allSelected.value) {
    selected.value = new Set();
  } else {
    selected.value = new Set(items.value.map((m) => m.id));
  }
}

function clearSelection() {
  selected.value = new Set();
}

async function doUpload(file: File) {
  if (!file.type.startsWith("image/")) {
    toast.error("សូមជ្រើសរើសឯកសាររូបភាព");
    return;
  }
  if (file.size > 8 * 1024 * 1024) {
    toast.error("ទំហំឯកសារលើសពី 8MB");
    return;
  }
  uploading.value = true;
  try {
    await uploadFile(file, {
      altText: altText.value.trim() || undefined,
      folder: uploadFolder.value,
    });
    toast.success("បានផ្ទុកមេឌាទៅ MinIO");
    altText.value = "";
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

function askBulkDelete() {
  if (selected.value.size === 0) return;
  bulkConfirmOpen.value = true;
}

async function doBulkDelete() {
  bulkBusy.value = true;
  try {
    const { count } = await adminService.bulkMedia([...selected.value], "delete");
    toast.success(`បានលុប ${count} មេឌា`);
    clearSelection();
    load(page.value);
  } catch (e) {
    toast.error(e instanceof Error ? e.message : "លុបបរាជ័យ");
  } finally {
    bulkBusy.value = false;
    bulkConfirmOpen.value = false;
  }
}

onMounted(() => load(1));
</script>
