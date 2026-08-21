<template>
  <div class="space-y-5">
    <div class="card overflow-hidden">
      <div class="flex items-center justify-between border-b border-slate-200 px-5 py-4">
        <h3 class="text-sm font-semibold text-slate-700">{{ prefs.t('categories.title') }} ({{ items.length }})</h3>
        <button class="btn-primary !py-1.5 text-xs" @click="openCreate"><Plus class="h-3.5 w-3.5" /> {{ prefs.t('categories.add') }}</button>
      </div>
      <div class="divide-y divide-slate-100">
        <div v-for="c in items" :key="c.id" class="flex items-center gap-4 px-5 py-3">
          <span class="h-8 w-8 shrink-0 rounded-lg" :style="{ background: c.color ?? '#0d3fa9' }"></span>
          <div class="min-w-0 flex-1">
            <p class="font-medium text-slate-700">{{ c.name }}</p>
            <p class="text-xs text-slate-400">/{{ c.slug }} · {{ c.description ?? "—" }}</p>
          </div>
          <span class="badge" :class="c.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'">
            {{ c.isActive ? prefs.t('common.active') : prefs.t('common.inactive') }}
          </span>
          <div class="flex gap-1">
            <button class="btn-ghost !p-2" title="prefs.t('common.edit')" @click="openEdit(c)"><Pencil class="h-4 w-4" /></button>
            <button class="btn-ghost !p-2 text-red-600 hover:!bg-red-50" title="prefs.t('common.delete')" @click="askDelete(c)"><Trash2 class="h-4 w-4" /></button>
          </div>
        </div>
      </div>
    </div>

    <Modal v-model="modalOpen" :title="editing ? 'កែសម្រួលប្រភេទ' : 'បន្ថែមប្រភេទ'">
      <form class="space-y-3" @submit.prevent="save">
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="label">ឈ្មោះ (ខ្មែរ) *</label>
            <input v-model="form.name" type="text" class="input" required />
          </div>
          <div>
            <label class="label">ឈ្មោះ (English)</label>
            <input v-model="form.nameEn" type="text" class="input" placeholder="Technology" />
          </div>
        </div>
        <div>
          <label class="label">Slug</label>
          <input v-model="form.slug" type="text" class="input" placeholder="ទុកទទេដើម្បីបង្កើតដោយស្វ័យប្រវត្តិ" />
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="label">ការពិពណ៌នា (ខ្មែរ)</label>
            <textarea v-model="form.description" rows="2" class="input"></textarea>
          </div>
          <div>
            <label class="label">ការពិពណ៌នា (English)</label>
            <textarea v-model="form.descriptionEn" rows="2" class="input"></textarea>
          </div>
        </div>
        <div>
          <label class="label">ពណ៌</label>
          <input v-model="form.color" type="color" class="h-10 w-full rounded border border-slate-300" />
        </div>
        <label class="flex items-center gap-2 text-sm text-slate-600">
          <input v-model="form.isActive" type="checkbox" class="h-4 w-4 rounded border-slate-300" />
          សកម្ម
        </label>
        <button type="submit" class="btn-primary w-full">{{ prefs.t('common.save') }}</button>
      </form>
    </Modal>

    <ConfirmDialog v-model="confirmOpen" @confirm="doDelete" />
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { Plus, Pencil, Trash2 } from "lucide-vue-next";
import { adminService } from "@/services/admin.service";
import { useToastStore } from "@/stores/toast";
import Modal from "@/components/ui/Modal.vue";
import ConfirmDialog from "@/components/ui/ConfirmDialog.vue";
import type { Category } from "@/types";
import { usePreferencesStore } from "@/stores/preferences";

const toast = useToastStore();
const prefs = usePreferencesStore();
const items = ref<Category[]>([]);
const modalOpen = ref(false);
const confirmOpen = ref(false);
const editing = ref(false);
let target: Category | null = null;

const form = reactive({
  name: "",
  nameEn: "",
  slug: "",
  description: "",
  descriptionEn: "",
  color: "#0d3fa9",
  isActive: true,
});

async function load() {
  items.value = await adminService.categories();
}

function openCreate() {
  editing.value = false;
  Object.assign(form, { name: "", nameEn: "", slug: "", description: "", descriptionEn: "", color: "#0d3fa9", isActive: true });
  modalOpen.value = true;
}

function openEdit(c: Category) {
  editing.value = true;
  Object.assign(form, {
    name: c.name,
    nameEn: c.nameEn ?? "",
    slug: c.slug,
    description: c.description ?? "",
    descriptionEn: c.descriptionEn ?? "",
    color: c.color ?? "#0d3fa9",
    isActive: c.isActive,
  });
  target = c;
  modalOpen.value = true;
}

async function save() {
  const payload = {
    name: form.name,
    nameEn: form.nameEn || null,
    slug: form.slug || undefined,
    description: form.description || null,
    descriptionEn: form.descriptionEn || null,
    color: form.color,
    isActive: form.isActive,
  };
  try {
    if (editing.value && target) {
      await adminService.updateCategory(target.id, payload);
      toast.success(prefs.t('toast.categoryUpdated'));
    } else {
      await adminService.createCategory(payload);
      toast.success(prefs.t('toast.categoryCreated'));
    }
    modalOpen.value = false;
    load();
  } catch (e) {
    toast.error(e instanceof Error ? e.message : prefs.t('toast.saveError'));
  }
}

function askDelete(c: Category) {
  target = c;
  confirmOpen.value = true;
}

async function doDelete() {
  if (!target) return;
  try {
    await adminService.deleteCategory(target.id);
    toast.success(prefs.t('toast.categoryDeleted'));
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
