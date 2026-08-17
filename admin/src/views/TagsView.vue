<template>
  <div class="card overflow-hidden">
    <div class="flex items-center justify-between border-b border-slate-200 px-5 py-4">
      <h3 class="text-sm font-semibold text-slate-700">ស្លាក ({{ items.length }})</h3>
      <button class="btn-primary !py-1.5 text-xs" @click="openCreate"><Plus class="h-3.5 w-3.5" /> បន្ថែម</button>
    </div>
    <div class="flex flex-wrap gap-2 p-5">
      <div v-for="t in items" :key="t.id" class="flex items-center gap-2 rounded-full bg-slate-100 py-1 pl-3 pr-1 text-sm">
        <span class="text-slate-700">{{ t.name }}</span>
        <span class="text-xs text-slate-400">/{{ t.slug }}</span>
        <button class="rounded-full p-1 hover:bg-slate-200" title="កែសម្រួល" @click="openEdit(t)"><Pencil class="h-3.5 w-3.5" /></button>
        <button class="rounded-full p-1 text-red-500 hover:bg-red-50" title="លុប" @click="askDelete(t)"><X class="h-3.5 w-3.5" /></button>
      </div>
    </div>
    <div v-if="!items.length" class="p-8 text-center text-sm text-slate-400">មិនមានស្លាកទេ</div>

    <Modal v-model="modalOpen" :title="editing ? 'កែសម្រួលស្លាក' : 'បន្ថែមស្លាក'">
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
        <button type="submit" class="btn-primary w-full">រក្សាទុក</button>
      </form>
    </Modal>

    <ConfirmDialog v-model="confirmOpen" @confirm="doDelete" />
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { Plus, Pencil, X } from "lucide-vue-next";
import { adminService } from "@/services/admin.service";
import { useToastStore } from "@/stores/toast";
import Modal from "@/components/ui/Modal.vue";
import ConfirmDialog from "@/components/ui/ConfirmDialog.vue";
import type { Tag } from "@/types";

const toast = useToastStore();
const items = ref<Tag[]>([]);
const modalOpen = ref(false);
const confirmOpen = ref(false);
const editing = ref(false);
let target: Tag | null = null;
const form = reactive({ name: "", nameEn: "", slug: "" });

async function load() {
  items.value = await adminService.tags();
}

function openCreate() {
  editing.value = false;
  Object.assign(form, { name: "", nameEn: "", slug: "" });
  modalOpen.value = true;
}

function openEdit(t: Tag) {
  editing.value = true;
  Object.assign(form, { name: t.name, nameEn: t.nameEn ?? "", slug: t.slug });
  target = t;
  modalOpen.value = true;
}

async function save() {
  const payload = { name: form.name, nameEn: form.nameEn || null, slug: form.slug || undefined };
  try {
    if (editing.value && target) {
      await adminService.updateTag(target.id, payload);
      toast.success("បានកែសម្រួលស្លាក");
    } else {
      await adminService.createTag(payload);
      toast.success("បានបង្កើតស្លាក");
    }
    modalOpen.value = false;
    load();
  } catch (e) {
    toast.error(e instanceof Error ? e.message : "រក្សាទុកបរាជ័យ");
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
    toast.success("បានលុបស្លាក");
    load();
  } catch (e) {
    toast.error(e instanceof Error ? e.message : "លុបបរាជ័យ");
  } finally {
    confirmOpen.value = false;
    target = null;
  }
}

onMounted(load);
</script>
