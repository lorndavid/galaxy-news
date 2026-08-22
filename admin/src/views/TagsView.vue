<template>
  <div class="card overflow-hidden">
    <div class="flex items-center justify-between border-b border-slate-200 px-5 py-4">
      <h3 class="text-sm font-semibold text-slate-700">{{ prefs.t('tags.title') }} ({{ items.length }})</h3>
      <button class="btn-primary !py-1.5 text-xs" @click="openCreate"><Plus class="h-3.5 w-3.5" /> {{ prefs.t('categories.add') }}</button>
    </div>
    <div v-if="loading" class="flex flex-wrap gap-2 p-5">
      <div v-for="i in 8" :key="i" class="h-8 w-24 animate-pulse rounded-full bg-slate-200"></div>
    </div>
    <div v-else-if="error" class="p-8 text-center">
      <p class="text-sm text-red-600">{{ error }}</p>
      <button class="btn-secondary mt-3 !py-1.5 text-xs" @click="load()">{{ prefs.t('common.retry') }}</button>
    </div>
    <div v-else class="flex flex-wrap gap-2 p-5">
      <div v-for="t in items" :key="t.id" class="flex items-center gap-2 rounded-full bg-slate-100 py-1 pl-3 pr-1 text-sm">
        <span class="text-slate-700">{{ t.name }}</span>
        <span class="text-xs text-slate-400">/{{ t.slug }}</span>
        <button class="rounded-full p-1 hover:bg-slate-200" title="prefs.t('common.edit')" @click="openEdit(t)"><Pencil class="h-3.5 w-3.5" /></button>
        <button class="rounded-full p-1 text-red-500 hover:bg-red-50" title="prefs.t('common.delete')" @click="askDelete(t)"><X class="h-3.5 w-3.5" /></button>
      </div>
    </div>

    <div v-if="!loading && !error && !items.length" class="empty-state">
      <div class="empty-icon"><Tags class="h-6 w-6" /></div>
      <h3>មិនមានស្លាកទេ</h3>
      <p>បន្ថែមស្លាកដើម្បីរៀបចំអត្ថបទរបស់អ្នក</p>
    </div>

    <Modal v-model="modalOpen" :title="editing ? 'កែសម្រួលស្លាក' : 'បន្ថែមស្លាក'">
      <form class="space-y-3" @submit.prevent="save">
        <div>
          <label class="label">ឈ្មោះ (ខ្មែរ) *</label>
          <input v-model="form.name" type="text" class="input" required />
        </div>
        <div>
          <label class="label">ឈ្មោះ (English)</label>
          <input v-model="form.nameEn" type="text" class="input" placeholder="Technology" />
        </div>
        <div>
          <label class="label">ឈ្មោះ (中文)</label>
          <input v-model="form.nameZh" type="text" class="input" placeholder="科技" />
        </div>
        <div>
          <label class="label">Slug</label>
          <input v-model="form.slug" type="text" class="input" placeholder="ទុកទទេដើម្បីបង្កើតដោយស្វ័យប្រវត្តិ" />
        </div>
        <button type="submit" class="btn-primary w-full">{{ prefs.t('common.save') }}</button>
      </form>
    </Modal>

    <ConfirmDialog v-model="confirmOpen" @confirm="doDelete" />
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { Plus, Pencil, X, Tags } from "lucide-vue-next";
import { adminService } from "@/services/admin.service";
import { useToastStore } from "@/stores/toast";
import Modal from "@/components/ui/Modal.vue";
import ConfirmDialog from "@/components/ui/ConfirmDialog.vue";
import type { Tag } from "@/types";
import { usePreferencesStore } from "@/stores/preferences";

const toast = useToastStore();
const prefs = usePreferencesStore();
const items = ref<Tag[]>([]);
const loading = ref(false);
const error = ref("");
const modalOpen = ref(false);
const confirmOpen = ref(false);
const editing = ref(false);
let target: Tag | null = null;
const form = reactive({ name: "", nameEn: "", nameZh: "", slug: "" });

async function load() {
  loading.value = true;
  error.value = "";
  try {
    items.value = await adminService.tags();
  } catch (e) {
    error.value = e instanceof Error ? e.message : "ផ្ទុកទិន្នន័យបរាជ័យ";
  } finally {
    loading.value = false;
  }
}

function openCreate() {
  editing.value = false;
  Object.assign(form, { name: "", nameEn: "", nameZh: "", slug: "" });
  modalOpen.value = true;
}

function openEdit(t: Tag) {
  editing.value = true;
  Object.assign(form, { name: t.name, nameEn: t.nameEn ?? "", nameZh: t.nameZh ?? "", slug: t.slug });
  target = t;
  modalOpen.value = true;
}

async function save() {
  const payload = { name: form.name, nameEn: form.nameEn || null, nameZh: form.nameZh || null, slug: form.slug || undefined };
  try {
    if (editing.value && target) {
      await adminService.updateTag(target.id, payload);
      toast.success(prefs.t('toast.tagUpdated'));
    } else {
      await adminService.createTag(payload);
      toast.success(prefs.t('toast.tagCreated'));
    }
    modalOpen.value = false;
    load();
  } catch (e) {
    toast.error(e instanceof Error ? e.message : prefs.t('toast.saveError'));
  }
}

function askDelete(t: Tag) {
  target = t;
  confirmOpen.value = true;
}

async function doDelete() {
  if (!target) return;
  try {
    await adminService.deleteTag(target.id);
    toast.success(prefs.t('toast.tagDeleted'));
    load();
  } catch (e) {
    toast.error(e instanceof Error ? e.message : prefs.t('toast.deleteError'));
  } finally {
    confirmOpen.value = false;
    target = null;
  }
}

onMounted(load);
</script>
