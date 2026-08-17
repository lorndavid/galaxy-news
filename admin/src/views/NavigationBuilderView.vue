<template>
  <div class="grid gap-5 lg:grid-cols-3">
    <!-- List -->
    <div class="card overflow-hidden lg:col-span-2">
      <div class="border-b border-slate-200 px-5 py-4">
        <h3 class="text-sm font-semibold text-slate-700">ម៉ឺនុយរុករក</h3>
      </div>
      <div v-if="loading" class="p-8 text-center text-sm text-slate-400">កំពុងផ្ទុក...</div>
      <div v-else-if="error" class="p-8 text-center">
        <p class="text-sm text-red-600">{{ error }}</p>
        <button class="btn-secondary mt-3 !py-1.5 text-xs" @click="load">ព្យាយាមម្តងទៀត</button>
      </div>
      <div v-else class="divide-y divide-slate-100">
        <div v-for="(item, i) in items" :key="item.id" class="flex items-center gap-3 px-5 py-3" :class="{ 'opacity-50': !item.isActive }">
          <span class="cursor-grab text-slate-300" aria-hidden="true"><GripVertical class="h-4 w-4" /></span>
          <div class="min-w-0 flex-1">
            <p class="font-medium text-slate-700">{{ item.label }}</p>
            <p class="text-xs text-slate-400">
              {{ typeLabel(item.type) }}
              <span v-if="item.value" class="font-mono">· {{ item.value }}</span>
            </p>
          </div>
          <div class="flex items-center gap-1">
            <button class="btn-ghost !p-1.5" :disabled="i === 0" title="ឡើងលើ" @click="move(i, -1)"><ChevronUp class="h-4 w-4" /></button>
            <button class="btn-ghost !p-1.5" :disabled="i === items.length - 1" title="ចុះក្រោម" @click="move(i, 1)"><ChevronDown class="h-4 w-4" /></button>
            <button class="btn-ghost !p-1.5" title="កែសម្រួល" @click="edit(item)"><Pencil class="h-4 w-4" /></button>
            <button class="btn-ghost !p-1.5 text-red-600 hover:!bg-red-50" title="លុប" @click="askDelete(item)"><Trash2 class="h-4 w-4" /></button>
          </div>
        </div>
        <div v-if="!items.length" class="p-8 text-center text-sm text-slate-400">មិនទាន់មានធាតុម៉ឺនុយទេ</div>
      </div>
      <div class="flex items-center justify-end gap-2 border-t border-slate-200 px-5 py-3">
        <button class="btn-primary !py-1.5 text-xs" :disabled="!dirty || saving" @click="save">
          {{ saving ? "កំពុងរក្សាទុក..." : "រក្សាទុកលំដាប់" }}
        </button>
      </div>
    </div>

    <!-- Form -->
    <div class="card h-fit p-5">
      <h3 class="text-sm font-semibold text-slate-700">{{ editing ? "កែសម្រួលធាតុ" : "បន្ថែមធាតុ" }}</h3>
      <form class="mt-4 space-y-3" @submit.prevent="submit">
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="label">ឈ្មោះ (ខ្មែរ) *</label>
            <input v-model="form.label" type="text" class="input" required />
          </div>
          <div>
            <label class="label">ឈ្មោះ (English)</label>
            <input v-model="form.labelEn" type="text" class="input" placeholder="Home" />
          </div>
        </div>
        <div>
          <label class="label">ប្រភេទ</label>
          <select v-model="form.type" class="input">
            <option value="home">ទំព័រដើម</option>
            <option value="category">ប្រភេទ</option>
            <option value="page">ទំព័រផ្សេង</option>
            <option value="link">តំណភ្ជាប់ខាងក្រៅ</option>
          </select>
        </div>
        <div>
          <label class="label">{{ valueLabel }}</label>
          <input
            v-model="form.value"
            type="text"
            class="input"
            :placeholder="valuePlaceholder"
            :required="form.type === 'category' || form.type === 'link'"
          />
          <p v-if="form.type === 'category'" class="mt-1 text-xs text-slate-400">បញ្ចូល slug របស់ប្រភេទ (ឧ. politics)</p>
        </div>
        <label class="flex items-center gap-2 text-sm text-slate-600">
          <input v-model="form.isActive" type="checkbox" class="h-4 w-4 rounded border-slate-300" />
          សកម្ម
        </label>
        <button type="submit" class="btn-primary w-full">{{ editing ? "រក្សាទុក" : "បន្ថែម" }}</button>
        <button v-if="editing" type="button" class="btn-secondary w-full" @click="resetForm">បោះបង់</button>
      </form>
    </div>

    <ConfirmDialog v-model="confirmOpen" @confirm="doDelete" />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { ChevronDown, ChevronUp, GripVertical, Pencil, Trash2 } from "lucide-vue-next";
import { adminService } from "@/services/admin.service";
import { useToastStore } from "@/stores/toast";
import ConfirmDialog from "@/components/ui/ConfirmDialog.vue";
import type { NavigationItem } from "@/types";

const toast = useToastStore();
const items = ref<NavigationItem[]>([]);
const loading = ref(false);
const error = ref("");
const saving = ref(false);
const dirty = ref(false);
const confirmOpen = ref(false);
const editing = ref<NavigationItem | null>(null);
let deleteTarget: NavigationItem | null = null;

const form = reactive({
  label: "",
  labelEn: "",
  type: "page" as NavigationItem["type"],
  value: "",
  isActive: true,
});

const valueLabel = computed(() =>
  form.type === "category" ? "Slug ប្រភេទ" : form.type === "link" ? "URL" : "តម្លៃ"
);
const valuePlaceholder = computed(() =>
  form.type === "category" ? "politics" : form.type === "link" ? "https://..." : form.type === "home" ? "/" : "news | about | contact"
);

function typeLabel(t: string) {
  return { home: "ទំព័រដើម", category: "ប្រភេទ", page: "ទំព័រ", link: "តំណក្រៅ" }[t] ?? t;
}

async function load() {
  loading.value = true;
  error.value = "";
  try {
    items.value = await adminService.navigation();
    dirty.value = false;
  } catch (e) {
    error.value = e instanceof Error ? e.message : "ផ្ទុកទិន្នន័យបរាជ័យ";
  } finally {
    loading.value = false;
  }
}

function resetForm() {
  editing.value = null;
  form.label = "";
  form.labelEn = "";
  form.type = "page";
  form.value = "";
  form.isActive = true;
}

function edit(item: NavigationItem) {
  editing.value = item;
  form.label = item.label;
  form.labelEn = item.labelEn ?? "";
  form.type = item.type;
  form.value = item.value ?? "";
  form.isActive = item.isActive;
}

function move(i: number, dir: -1 | 1) {
  const j = i + dir;
  if (j < 0 || j >= items.value.length) return;
  const arr = items.value;
  [arr[i], arr[j]] = [arr[j], arr[i]];
  arr.forEach((it, idx) => (it.sortOrder = idx + 1));
  dirty.value = true;
}

async function submit() {
  try {
    if (editing.value) {
      await adminService.updateNavItem(editing.value.id, {
        label: form.label,
        labelEn: form.labelEn || null,
        type: form.type,
        value: form.value || null,
        isActive: form.isActive,
      });
      toast.success("បានកែសម្រួលធាតុម៉ឺនុយ");
    } else {
      await adminService.createNavItem({
        label: form.label,
        labelEn: form.labelEn || null,
        type: form.type,
        value: form.value || null,
        isActive: form.isActive,
      });
      toast.success("បានបន្ថែមធាតុម៉ឺនុយ");
    }
    resetForm();
    await load();
  } catch (e) {
    toast.error(e instanceof Error ? e.message : "ប្រតិបត្តិការបរាជ័យ");
  }
}

function askDelete(item: NavigationItem) {
  deleteTarget = item;
  confirmOpen.value = true;
}

async function doDelete() {
  if (!deleteTarget) return;
  try {
    await adminService.deleteNavItem(deleteTarget.id);
    toast.success("បានលុបធាតុម៉ឺនុយ");
    await load();
  } catch (e) {
    toast.error(e instanceof Error ? e.message : "លុបបរាជ័យ");
  } finally {
    confirmOpen.value = false;
    deleteTarget = null;
  }
}

async function save() {
  saving.value = true;
  try {
    await adminService.reorderNav(items.value.map((it, idx) => ({ id: it.id, sortOrder: idx + 1 })));
    toast.success("បានរក្សាទុកលំដាប់ម៉ឺនុយ");
    dirty.value = false;
  } catch (e) {
    toast.error(e instanceof Error ? e.message : "រក្សាទុកបរាជ័យ");
  } finally {
    saving.value = false;
  }
}

onMounted(load);
</script>
