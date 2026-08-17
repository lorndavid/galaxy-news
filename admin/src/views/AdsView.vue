<template>
  <div class="card overflow-hidden">
    <div class="flex items-center justify-between border-b border-slate-200 px-5 py-4">
      <h3 class="text-sm font-semibold text-slate-700">ការផ្សាយពាណិជ្ជកម្ម / Banner Ads</h3>
      <button class="btn-primary !py-1.5 text-xs" @click="openCreate"><Plus class="h-3.5 w-3.5" /> បន្ថែម</button>
    </div>
    <div class="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3">
      <div v-for="a in items" :key="a.id" class="card overflow-hidden">
        <img :src="a.image" :alt="a.name" class="h-28 w-full object-cover" />
        <div class="p-4">
          <div class="flex items-center justify-between">
            <p class="font-medium text-slate-700">{{ a.name }}</p>
            <span class="badge" :class="effectiveStatus(a).cls">
              {{ effectiveStatus(a).label }}
            </span>
          </div>
          <p class="mt-1 text-xs text-slate-400">ទីតាំង៖ {{ positionLabel(a.position) }} · {{ deviceLabel(a.device) }}</p>
          <p v-if="a.link" class="truncate text-xs text-slate-400">{{ a.link }}</p>
          <p v-if="a.startDate || a.endDate" class="mt-0.5 text-[11px] text-slate-400">
            {{ a.startDate ? formatDate(a.startDate) : "…" }} → {{ a.endDate ? formatDate(a.endDate) : "…" }}
          </p>
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
          <label class="label">ចំណងជើង (ស្រេចចិត្ត)</label>
          <input v-model="form.title" type="text" class="input" placeholder="ចំណងជើងដែលបង្ហាញក្រោមរូបភាព" />
        </div>
        <div>
          <label class="label">រូបភាព URL *</label>
          <!-- text (not url): MinIO/uploads paths are relative and the backend
               validates them — type=url would silently block the submit -->
          <input v-model="form.image" type="text" class="input" required placeholder="/minio/… ឬ https://…" />
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="label">តំណ</label>
            <input v-model="form.link" type="text" class="input" placeholder="https://… ឬ /ផ្លូវខាងក្នុង" />
          </div>
          <div>
            <label class="label">បើកក្នុង</label>
            <select v-model="form.target" class="input">
              <option value="_blank">ផ្ទាំងថ្មី (New tab)</option>
              <option value="_self">ផ្ទាំងដដែល (Same tab)</option>
            </select>
          </div>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="label">ទីតាំង</label>
            <select v-model="form.position" class="input">
              <option value="homepage-top">កំពូលទំព័រដើម</option>
              <option value="homepage-middle">កណ្តាលទំព័រដើម</option>
              <option value="homepage-bottom">បាតទំព័រដើម</option>
              <option value="header">ក្បាលទំព័រ</option>
              <option value="article-top">កំពូលអត្ថបទ</option>
              <option value="article-middle">កណ្តាលអត្ថបទ</option>
              <option value="article-bottom">បាតអត្ថបទ</option>
              <option value="sidebar">ចំហៀង</option>
              <option value="category-top">កំពូលប្រភេទ</option>
              <option value="category-bottom">បាតប្រភេទ</option>
              <option value="inline">ក្នុងបញ្ជី</option>
              <option value="footer">បាតទំព័រ</option>
            </select>
          </div>
          <div>
            <label class="label">ឧបករណ៍</label>
            <select v-model="form.device" class="input">
              <option value="all">ទាំងអស់</option>
              <option value="desktop">កុំព្យូទ័រ</option>
              <option value="tablet">ថេប្លេត</option>
              <option value="mobile">ទូរស័ព្ទ</option>
            </select>
          </div>
        </div>
        <div>
          <label class="label">អាទិភាព (0–100, ធំជាង = បង្ហាញមុន)</label>
          <input v-model.number="form.priority" type="number" min="0" max="100" class="input" />
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="label">ចាប់ផ្តើម (ស្រេចចិត្ត)</label>
            <input v-model="form.startDate" type="datetime-local" class="input" />
          </div>
          <div>
            <label class="label">បញ្ចប់ (ស្រេចចិត្ត)</label>
            <input v-model="form.endDate" type="datetime-local" class="input" />
          </div>
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

const form = reactive({
  name: "",
  title: "",
  image: "",
  link: "",
  target: "_blank",
  position: "sidebar",
  device: "all",
  priority: 0,
  isActive: true,
  startDate: "",
  endDate: "",
});

const POSITION_LABELS: Record<string, string> = {
  "homepage-top": "កំពូលទំព័រដើម",
  "homepage-middle": "កណ្តាលទំព័រដើម",
  "homepage-bottom": "បាតទំព័រដើម",
  header: "ក្បាលទំព័រ",
  "article-top": "កំពូលអត្ថបទ",
  "article-middle": "កណ្តាលអត្ថបទ",
  "article-bottom": "បាតអត្ថបទ",
  sidebar: "ចំហៀង",
  "category-top": "កំពូលប្រភេទ",
  "category-bottom": "បាតប្រភេទ",
  inline: "ក្នុងបញ្ជី",
  footer: "បាតទំព័រ",
};

const DEVICE_LABELS: Record<string, string> = {
  all: "ទាំងអស់",
  desktop: "កុំព្យូទ័រ",
  tablet: "ថេប្លេត",
  mobile: "ទូរស័ព្ទ",
};

function positionLabel(p: string) {
  return POSITION_LABELS[p] ?? p;
}
function deviceLabel(d: string) {
  return DEVICE_LABELS[d] ?? d;
}
function formatDate(v: string) {
  try {
    return new Date(v).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return v;
  }
}
function effectiveStatus(a: Advertisement) {
  const now = Date.now();
  if (!a.isActive) return { label: "អសកម្ម", cls: "bg-slate-100 text-slate-500" };
  if (a.startDate && new Date(a.startDate).getTime() > now)
    return { label: "បានកំណត់ពេល", cls: "bg-amber-100 text-amber-700" };
  if (a.endDate && new Date(a.endDate).getTime() < now)
    return { label: "ផុតកំណត់", cls: "bg-red-100 text-red-700" };
  return { label: "សកម្ម", cls: "bg-emerald-100 text-emerald-700" };
}

async function load() {
  items.value = await adminService.ads();
}

function openCreate() {
  editing.value = false;
  Object.assign(form, {
    name: "", title: "", image: "", link: "", target: "_blank",
    position: "sidebar", device: "all", priority: 0, isActive: true, startDate: "", endDate: "",
  });
  modalOpen.value = true;
}

function toLocalInput(v: string | null) {
  if (!v) return "";
  try {
    const d = new Date(v);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch {
    return "";
  }
}

function openEdit(a: Advertisement) {
  editing.value = true;
  Object.assign(form, {
    name: a.name,
    title: a.title ?? "",
    image: a.image,
    link: a.link ?? "",
    target: a.target ?? "_blank",
    position: a.position,
    device: a.device ?? "all",
    priority: a.priority ?? 0,
    isActive: a.isActive,
    startDate: toLocalInput(a.startDate),
    endDate: toLocalInput(a.endDate),
  });
  target = a;
  modalOpen.value = true;
}

async function save() {
  const payload = {
    name: form.name,
    title: form.title || null,
    image: form.image,
    link: form.link || null,
    target: form.target,
    position: form.position,
    device: form.device,
    priority: form.priority,
    isActive: form.isActive,
    startDate: form.startDate ? new Date(form.startDate).toISOString() : null,
    endDate: form.endDate ? new Date(form.endDate).toISOString() : null,
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
