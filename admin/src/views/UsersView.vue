<template>
  <div class="card overflow-hidden">
    <div class="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:items-center">
      <input v-model="search" type="text" placeholder="ស្វែងរកអ្នកប្រើប្រាស់..." class="input max-w-xs" @input="onSearch" />
      <button class="btn-primary ml-auto !py-1.5 text-xs" @click="openCreate"><Plus class="h-3.5 w-3.5" /> បន្ថែមអ្នកប្រើប្រាស់</button>
    </div>
    <div v-if="loading" class="p-6 space-y-3">
      <div v-for="i in 4" :key="i" class="flex animate-pulse items-center gap-3">
        <div class="h-9 w-9 rounded-full bg-slate-200"></div>
        <div class="flex-1 space-y-1.5">
          <div class="h-3 w-32 rounded bg-slate-200"></div>
          <div class="h-2.5 w-24 rounded bg-slate-200"></div>
        </div>
      </div>
    </div>
    <div v-else-if="error" class="p-8 text-center">
      <p class="text-sm text-red-600">{{ error }}</p>
      <button class="btn-secondary mt-3 !py-1.5 text-xs" @click="load(1)">ព្យាយាមម្តងទៀត</button>
    </div>
    <div v-else class="overflow-x-auto">
      <table class="data-table">
        <thead class="bg-slate-50 text-xs uppercase text-slate-500">
          <tr>
            <th class="px-4 py-3">អ្នកប្រើប្រាស់</th>
            <th class="px-4 py-3">តួនាទី</th>
            <th class="px-4 py-3">ស្ថានភាព</th>
            <th class="px-4 py-3 text-right">សកម្មភាព</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          <tr v-for="u in items" :key="u.id" class="hover:bg-slate-50">
            <td class="px-4 py-3">
              <div class="flex items-center gap-3">
                <div class="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700">
                  {{ u.name.charAt(0) }}
                </div>
                <div>
                  <p class="font-medium text-slate-700">{{ u.name }}</p>
                  <p class="text-xs text-slate-400">{{ u.email }}</p>
                </div>
              </div>
            </td>
            <td class="px-4 py-3">
              <span class="badge" :class="roleBadge(u.role)">{{ roleLabel(u.role) }}</span>
            </td>
            <td class="px-4 py-3">
              <span class="badge" :class="u.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'">
                {{ u.isActive ? "សកម្ម" : "អសកម្ម" }}
              </span>
            </td>
            <td class="px-4 py-3">
              <div class="flex justify-end gap-1">
                <button class="btn-ghost !p-2" title="កែសម្រួល" @click="openEdit(u)"><Pencil class="h-4 w-4" /></button>
                <button class="btn-ghost !p-2 text-red-600 hover:!bg-red-50" title="លុប" @click="askDelete(u)"><Trash2 class="h-4 w-4" /></button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <EmptyState
      v-if="!loading && !error && !items.length"
      title="មិនមានអ្នកប្រើប្រាស់ទេ"
      message="បង្កើតអ្នកប្រើប្រាស់ដើម្បីចូលប្រើប្រាស់ប្រព័ន្ធ"
    />

    <div v-if="!loading && !error && items.length" class="px-4 pb-4">
      <AdminPagination :page="page" :total-pages="totalPages" :total="total" @change="load" />
    </div>

    <Modal v-model="modalOpen" :title="editing ? 'កែសម្រួលអ្នកប្រើប្រាស់' : 'បន្ថែមអ្នកប្រើប្រាស់'">
      <form class="space-y-3" @submit.prevent="save">
        <div>
          <label class="label">ឈ្មោះ *</label>
          <input v-model="form.name" type="text" class="input" required />
        </div>
        <div>
          <label class="label">អ៊ីមែល *</label>
          <input v-model="form.email" type="email" class="input" required />
        </div>
        <div v-if="!editing">
          <label class="label">ពាក្យសម្ងាត់ *</label>
          <input v-model="form.password" type="password" class="input" required minlength="6" />
        </div>
        <div>
          <label class="label">តួនាទី</label>
          <select v-model="form.role" class="input">
            <option value="AUTHOR">អ្នកនិពន្ធ</option>
            <option value="EDITOR">អ្នកកែសម្រួល</option>
            <option value="ADMIN">អ្នកគ្រប់គ្រង</option>
            <option value="SUPER_ADMIN">អ្នកគ្រប់គ្រងកំពូល</option>
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
import AdminPagination from "@/components/ui/AdminPagination.vue";
import EmptyState from "@/components/ui/EmptyState.vue";
import type { User, UserRole } from "@/types";

const toast = useToastStore();
const items = ref<User[]>([]);
const search = ref("");
const page = ref(1);
const totalPages = ref(1);
const total = ref(0);
const loading = ref(false);
const error = ref("");
const modalOpen = ref(false);
const confirmOpen = ref(false);
const editing = ref(false);
let target: User | null = null;
let debounce: number | undefined;

const form = reactive({
  name: "",
  email: "",
  password: "",
  role: "AUTHOR" as UserRole,
  isActive: true,
});

function roleLabel(r: UserRole) {
  return { SUPER_ADMIN: "កំពូល", ADMIN: "គ្រប់គ្រង", EDITOR: "កែសម្រួល", AUTHOR: "និពន្ធ" }[r] ?? r;
}
function roleBadge(r: UserRole) {
  return {
    SUPER_ADMIN: "bg-red-100 text-red-700",
    ADMIN: "bg-brand-100 text-brand-700",
    EDITOR: "bg-amber-100 text-amber-700",
    AUTHOR: "bg-slate-100 text-slate-600",
  }[r] ?? "bg-slate-100 text-slate-600";
}

async function load(p = 1) {
  loading.value = true;
  error.value = "";
  try {
    const data = await adminService.users({
      page: p,
      pageSize: 10,
      q: search.value.trim() || undefined,
    });
    items.value = data.items;
    page.value = data.page;
    totalPages.value = data.totalPages;
    total.value = data.total;
  } catch (e) {
    error.value = e instanceof Error ? e.message : "ផ្ទុកទិន្នន័យបរាជ័យ";
  } finally {
    loading.value = false;
  }
}

function onSearch() {
  if (debounce) window.clearTimeout(debounce);
  debounce = window.setTimeout(() => load(1), 400);
}

function openCreate() {
  editing.value = false;
  Object.assign(form, { name: "", email: "", password: "", role: "AUTHOR", isActive: true });
  modalOpen.value = true;
}

function openEdit(u: User) {
  editing.value = true;
  Object.assign(form, { name: u.name, email: u.email, password: "", role: u.role, isActive: u.isActive });
  target = u;
  modalOpen.value = true;
}

async function save() {
  const payload: Record<string, unknown> = {
    name: form.name,
    email: form.email,
    role: form.role,
    isActive: form.isActive,
  };
  if (!editing.value) payload.password = form.password;
  try {
    if (editing.value && target) {
      await adminService.updateUser(target.id, payload);
      toast.success("បានកែសម្រួលអ្នកប្រើប្រាស់");
    } else {
      await adminService.createUser(payload);
      toast.success("បានបង្កើតអ្នកប្រើប្រាស់");
    }
    modalOpen.value = false;
    load(page.value);
  } catch (e) {
    toast.error(e instanceof Error ? e.message : "រក្សាទុកបរាជ័យ");
  }
}

function askDelete(u: User) {
  target = u;
  confirmOpen.value = true;
}

async function doDelete() {
  if (!target) return;
  try {
    await adminService.deleteUser(target.id);
    toast.success("បានលុបអ្នកប្រើប្រាស់");
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
