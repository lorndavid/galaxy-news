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
        <button class="btn-secondary mt-3 !py-1.5 text-xs" @click="load">{{ prefs.t('common.retry') }}</button>
      </div>
      <div v-else class="divide-y divide-slate-100">
        <div v-for="(item, i) in items" :key="item.id" class="px-5 py-3" :class="{ 'opacity-50': !item.isActive }">
          <div class="flex items-center gap-3">
            <span class="cursor-grab text-slate-300" aria-hidden="true"><GripVertical class="h-4 w-4" /></span>
            <div class="min-w-0 flex-1">
              <p class="font-medium text-slate-700">{{ item.label }}</p>
              <p class="text-xs text-slate-400">
                {{ typeLabel(item.type) }}
                <span v-if="item.value" class="font-mono">· {{ item.value }}</span>
                <span v-if="item.config" class="ml-1 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">
                  {{ layoutLabel(item.config) }}
                </span>
              </p>
            </div>
            <div class="flex items-center gap-1">
              <button class="btn-ghost !p-1.5" :class="{ 'text-brand-600': editingLayout === item.id }" title="កែប្លង់ / Grid" @click="toggleLayout(item.id)">
                <LayoutGrid class="h-4 w-4" />
              </button>
              <button class="btn-ghost !p-1.5" :disabled="i === 0" title="ឡើងលើ" @click="move(i, -1)"><ChevronUp class="h-4 w-4" /></button>
              <button class="btn-ghost !p-1.5" :disabled="i === items.length - 1" title="ចុះក្រោម" @click="move(i, 1)"><ChevronDown class="h-4 w-4" /></button>
              <button class="btn-ghost !p-1.5" title="prefs.t('common.edit')" @click="edit(item)"><Pencil class="h-4 w-4" /></button>
              <button class="btn-ghost !p-1.5 text-red-600 hover:!bg-red-50" title="prefs.t('common.delete')" @click="askDelete(item)"><Trash2 class="h-4 w-4" /></button>
            </div>
          </div>

          <!-- Layout / grid editor with live preview -->
          <Transition name="nav-fade">
            <div v-if="editingLayout === item.id" class="mt-3 rounded border border-slate-200 bg-slate-50 p-4">
              <div class="flex flex-wrap items-end gap-5">
                <div>
                  <label class="label">រចនាប័ទ្មប្លង់</label>
                  <div class="flex gap-1.5">
                    <button
                      v-for="opt in layoutOptions"
                      :key="opt.key"
                      type="button"
                      class="flex h-9 items-center gap-1.5 rounded border px-3 text-xs font-semibold transition-colors"
                      :class="layoutOf(item) === opt.key ? 'border-brand-600 bg-brand-600 text-white' : 'border-slate-300 bg-white text-slate-600 hover:border-brand-400'"
                      @click="setLayout(item, opt.key)"
                    >
                      {{ opt.icon }} {{ opt.label }}
                    </button>
                  </div>
                </div>
                <div v-if="layoutOf(item) === 'grid'">
                  <label class="label">ចំនួនជួរឈរ</label>
                  <div class="flex gap-1.5">
                    <button
                      v-for="n in [2, 3, 4]"
                      :key="n"
                      type="button"
                      class="h-8 w-8 rounded border text-xs font-semibold transition-colors"
                      :class="columnsOf(item) === n ? 'border-brand-600 bg-brand-600 text-white' : 'border-slate-300 bg-white text-slate-600 hover:border-brand-400'"
                      @click="setColumns(item, n)"
                    >
                      {{ n }}
                    </button>
                  </div>
                </div>
                <div class="ml-auto text-right">
                  <span class="label mb-1 block">ការមើលជាមុន</span>
                  <div class="flex h-14 w-44 items-center gap-1.5 border border-slate-200 bg-white p-2">
                    <template v-if="layoutOf(item) === 'list'">
                      <div v-for="n in 3" :key="n" class="flex flex-1 flex-col gap-1">
                        <div class="h-8 w-full bg-slate-300"></div>
                        <div class="h-1.5 w-3/4 bg-slate-200"></div>
                        <div class="h-1.5 w-1/2 bg-slate-200"></div>
                      </div>
                    </template>
                    <template v-else>
                      <div
                        v-for="n in columnsOf(item) || 3"
                        :key="n"
                        class="flex flex-1 flex-col gap-1"
                      >
                        <div class="h-9 w-full bg-slate-300"></div>
                        <div class="h-1.5 w-3/4 bg-slate-200"></div>
                      </div>
                    </template>
                  </div>
                  <p class="mt-1 text-[10px] text-slate-400">Grid = កាត ពីលើចុះក្រោម · List = រូបឆ្វេង អក្សរស្តាំ</p>
                </div>
              </div>
              <div class="mt-3 flex items-center justify-between border-t border-slate-200 pt-3">
                <button type="button" class="text-xs font-medium text-slate-400 hover:text-slate-600" @click="resetLayout(item)">
                  កំណត់ស្តង់ដារ
                </button>
                <button type="button" class="btn-primary !py-1.5 text-xs" @click="saveLayout(item)">
                  រក្សាទុកប្លង់
                </button>
              </div>
            </div>
          </Transition>
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
import { ChevronDown, ChevronUp, GripVertical, LayoutGrid, Pencil, Trash2 } from "lucide-vue-next";
import { adminService } from "@/services/admin.service";
import { useToastStore } from "@/stores/toast";
import ConfirmDialog from "@/components/ui/ConfirmDialog.vue";
import type { NavigationItem, NavigationItemConfig } from "@/types";
import { usePreferencesStore } from "@/stores/preferences";

const toast = useToastStore();
const prefs = usePreferencesStore();
const items = ref<NavigationItem[]>([]);
const loading = ref(false);
const error = ref("");
const saving = ref(false);
const dirty = ref(false);
const confirmOpen = ref(false);
const editing = ref<NavigationItem | null>(null);
const editingLayout = ref<number | null>(null);
let deleteTarget: NavigationItem | null = null;

const layoutOptions = [
  { key: "grid", label: "Grid", icon: "▦" },
  { key: "list", label: "List", icon: "≡" },
] as const;

function layoutOf(item: NavigationItem): "grid" | "list" {
  return item.config?.layout ?? "list";
}
function columnsOf(item: NavigationItem): number {
  return item.config?.columns ?? 3;
}
function layoutLabel(item: NavigationItem["config"] | null): string {
  if (!item?.layout) return "";
  return item.layout === "grid" ? `Grid · ${item.columns ?? 3} ជួរ` : "List · រូបឆ្វេង";
}

function toggleLayout(id: number) {
  editingLayout.value = editingLayout.value === id ? null : id;
}

function setLayout(item: NavigationItem, layout: "grid" | "list") {
  item.config = { ...(item.config ?? {}), layout };
}
function setColumns(item: NavigationItem, columns: number) {
  item.config = { ...(item.config ?? {}), columns, layout: "grid" };
}
function resetLayout(item: NavigationItem) {
  item.config = null;
}

async function saveLayout(item: NavigationItem) {
  try {
    const config: NavigationItemConfig | null = item.config ?? null;
    await adminService.updateNavItem(item.id, { config });
    toast.success("បានរក្សាទុកប្លង់");
    editingLayout.value = null;
    await load();
  } catch (e) {
    toast.error(e instanceof Error ? e.message : "រក្សាទុកប្លង់បរាជ័យ");
  }
}

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
    toast.error(e instanceof Error ? e.message : prefs.t('toast.deleteError'));
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
    toast.error(e instanceof Error ? e.message : prefs.t('toast.saveError'));
  } finally {
    saving.value = false;
  }
}

onMounted(load);
</script>

<style scoped>
.nav-fade-enter-active,
.nav-fade-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}
.nav-fade-enter-from,
.nav-fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
