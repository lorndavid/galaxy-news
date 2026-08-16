<template>
  <div class="card overflow-hidden">
    <div class="flex items-center justify-between border-b border-slate-200 px-5 py-4">
      <h3 class="text-sm font-semibold text-slate-700">ការផ្សាយពាណិជ្ជកម្ម</h3>
      <button class="btn-primary !py-1.5 text-xs" @click="openCreate"><Plus class="h-3.5 w-3.5" /> បន្ថែម</button>
    </div>
    <div class="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3">
      <div v-for="a in items" :key="a.id" class="card overflow-hidden">
        <img :src="a.image" :alt="a.name" class="h-28 w-full object-cover" />
        <div class="p-4">
          <div class="flex items-center justify-between">
            <p class="font-medium text-slate-700">{{ a.name }}</p>
            <span class="badge" :class="a.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'">
              {{ a.isActive ? "សកម្ម" : "អសកម្ម" }}
            </span>
          </div>
          <p class="mt-1 text-xs text-slate-400">ទីតាំង៖ {{ a.position }}</p>
          <p v-if="a.link" class="truncate text-xs text-slate-400">{{ a.link }}</p>
          <div class="mt-3 flex gap-1">
            <button class="btn-ghost !p-2" title="កែសម្រួល" @click="openEdit(a)"><Pencil class="h-4 w-4" /></button>
            <button class="btn-ghost !p-2 text-red-600" title="លុប" @click="askDelete(a)"><Trash2 class="h-4 w-4" /></button>
          </div>
        </div>
      </div>
    </div>
    <div v-if="!items.length" class="p-10 text-center text-sm text-slate-400">មិនមានការផ្សាយពាណិជ្ជកម្មទេ</div>

    <Modal v-model="modalOpen" :title="editing ? 'កែសម្រួលផ្សាយពាណិជ្ជកម្ម' : 'បន្ថែមផ្សាយពាណិជ្ជកម្ម'">
      <form class="space-y-3" @submit.prevent="save">
        <div>
          <label class="label">ឈ្មោះ *</label>
          <input v-model="form.name" type="text" class="input" required />
        </div>
        <div>
          <label class="label">រូបភាព URL *</label>
          <input v-model="form.image" type="url" class="input" required />
        </div>
        <div>
          <label class="label">តំណ</label>
          <input v-model="form.link" type="url" class="input" />
        </div>
        <div>
          <label class="label">ទីតាំង</label>
          <select v-model="form.position" class="input">
            <option value="header">ក្បាលទំព័រ</option>
            <option value="sidebar">ចំហៀង</option>
            <option value="in_article">ក្នុងអត្ថបទ</option>
            <option value="footer">បាតទំព័រ</option>
          </select>
        </div>
        <label class="flex items-center gap-2 text-sm text-slate-600">
          <input v-model="form.isActive" type="checkbox" class="h-4 w-4 rounded border-slate-300" />
          សកម្ម
        </label>
        <button type="submit" class="btn-primary w-full">រក្សាទុក</button>
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
import type { Advertisement } from "@/types";

const toast = useToastStore();
const items = ref<Advertisement[]>([]);
const modalOpen = ref(false);
const confirmOpen = ref(false);
const editing = ref(false);
let target: Advertisement | null = null;

const form = reactive({ name: "", image: "", link: "", position: "sidebar", isActive: true });

async function load() {
  items.value = await adminService.ads();
}

function openCreate() {
  editing.value = false;
  Object.assign(form, { name: "", image: "", link: "", position: "sidebar", isActive: true });
  modalOpen.value = true;
}

function openEdit(a: Advertisement) {
  editing.value = true;
  Object.assign(form, { name: a.name, image: a.image, link: a.link ?? "", position: a.position, isActive: a.isActive });
  target = a;
  modalOpen.value = true;
}

async function save() {
  const payload = {
    name: form.name,
    image: form.image,
    link: form.link || null,
    position: form.position,
    isActive: form.isActive,
  };
  try {
    if (editing.value && target) {
      await adminService.updateAd(target.id, payload);
      toast.success("បានកែសម្រួលផ្សាយពាណិជ្ជកម្ម");
    } else {
      await adminService.createAd(payload);
      toast.success("បានបង្កើតផ្សាយពាណិជ្ជកម្ម");
    }
    modalOpen.value = false;
    load();
  } catch (e) {
    toast.error(e instanceof Error ? e.message : "រក្សាទុកបរាជ័យ");
  }
}

function askDelete(a: Advertisement) {
  target = a;
  confirmOpen.value = true;
}

async function doDelete() {
  if (!target) return;
  try {
    await adminService.deleteAd(target.id);
    toast.success("បានលុបផ្សាយពាណិជ្ជកម្ម");
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
