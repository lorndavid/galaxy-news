<template>
  <div>
    <!-- Preview -->
    <div
      v-if="modelValue"
      class="relative overflow-hidden rounded-lg border border-slate-200 bg-slate-50"
    >
      <img :src="modelValue" :alt="altText" class="h-40 w-full object-cover" />
      <div v-if="uploading" class="absolute inset-0 flex items-center justify-center bg-slate-900/50">
        <div class="w-40">
          <div class="h-1.5 overflow-hidden rounded-full bg-white/30">
            <div class="h-full bg-white transition-all" :style="{ width: progress + '%' }"></div>
          </div>
          <p class="mt-2 text-center text-[11px] font-medium text-white">កំពុងផ្ទុក… {{ progress }}%</p>
        </div>
      </div>
    </div>

    <!-- Dropzone when empty -->
    <label
      v-else
      class="flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center transition-colors hover:border-brand-400 hover:bg-brand-50/50"
      :class="{ 'pointer-events-none opacity-60': uploading }"
      @dragenter.prevent="dragOver = true"
      @dragover.prevent="dragOver = true"
      @dragleave.prevent="dragOver = false"
      @drop.prevent="onDrop"
    >
      <input ref="fileInput" type="file" accept="image/jpeg,image/png,image/webp,image/gif" class="sr-only" @change="onPick" />
      <UploadCloud class="h-7 w-7 text-slate-400" />
      <span class="text-sm font-medium text-slate-600">អូសរូបភាពមកទីនេះ ឬចុចដើម្បីជ្រើសរើស</span>
      <span class="text-[11px] text-slate-400">JPG, PNG, WEBP — អតិបរមា 8MB</span>
    </label>

    <!-- Actions -->
    <div v-if="modelValue" class="mt-2 flex gap-2">
      <button type="button" class="btn-secondary !py-1.5 text-xs" :disabled="uploading" @click="openPicker">
        <RefreshCw class="h-3.5 w-3.5" /> ជំនួស
      </button>
      <button type="button" class="btn-ghost !py-1.5 text-xs text-red-600" :disabled="uploading" @click="remove">
        <Trash2 class="h-3.5 w-3.5" /> លុប
      </button>
      <input ref="fileInput" type="file" accept="image/jpeg,image/png,image/webp,image/gif" class="hidden" @change="onPick" />
    </div>

    <p v-if="error" class="mt-2 text-xs text-red-600">{{ error }}</p>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { UploadCloud, RefreshCw, Trash2 } from "lucide-vue-next";
import { uploadFile } from "@/services/api";

const props = defineProps<{
  modelValue: string;
  folder?: string;
  altText?: string;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void;
}>();

const fileInput = ref<HTMLInputElement | null>(null);
const uploading = ref(false);
const progress = ref(0);
const error = ref("");
const dragOver = ref(false);

function openPicker() {
  fileInput.value?.click();
}

function onPick(e: Event) {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  if (file) void upload(file);
  input.value = "";
}

function onDrop(e: DragEvent) {
  dragOver.value = false;
  const file = e.dataTransfer?.files?.[0];
  if (file) void upload(file);
}

async function upload(file: File) {
  error.value = "";
  if (!/^image\/(jpeg|png|webp|gif)$/.test(file.type)) {
    error.value = "សូមជ្រើសរើសឯកសារ JPG, PNG, WEBP ឬ GIF ប៉ុណ្ណោះ។";
    return;
  }
  if (file.size > 8 * 1024 * 1024) {
    error.value = "ឯកសារធំពេក (អតិបរមា 8MB)។";
    return;
  }

  uploading.value = true;
  progress.value = 0;
  try {
    // Upload straight to MinIO through the backend, then keep the URL.
    const res = await uploadFile(file, { folder: props.folder ?? "articles", altText: props.altText });
    progress.value = 100;
    emit("update:modelValue", res.data.data.secureUrl ?? res.data.data.url);
  } catch (e) {
    error.value = e instanceof Error ? e.message : "ការផ្ទុករូបភាពបរាជ័យ។";
  } finally {
    uploading.value = false;
  }
}

function remove() {
  emit("update:modelValue", "");
}
</script>
