<template>
  <div class="card overflow-hidden">
    <!-- Toolbar -->
    <div class="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:items-center">
      <input v-model="search" type="text" placeholder="ស្វែងរកអត្ថបទ..." class="input max-w-xs" @input="onSearch" />
      <select v-model="statusFilter" class="input max-w-[160px]" @change="load(1)">
        <option value="">ទាំងអស់</option>
        <option value="PUBLISHED">បានផ្សាយ</option>
        <option value="DRAFT">សេចក្តីព្រាង</option>
        <option value="SCHEDULED">បានកំណត់ពេល</option>
        <option value="ARCHIVED">ប័ណ្ណសារ</option>
      </select>
      <select v-model="categoryFilter" class="input max-w-[180px]" @change="load(1)">
        <option value="">ប្រភេទទាំងអស់</option>
        <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.name }}</option>
      </select>
      <RouterLink to="/articles/new" class="btn-primary ml-auto">
        <Plus class="h-4 w-4" /> អត្ថបទថ្មី
      </RouterLink>
    </div>

    <!-- Table -->
    <div class="overflow-x-auto">
      <table class="w-full text-left text-sm">
        <thead class="bg-slate-50 text-xs uppercase text-slate-500">
          <tr>
            <th class="px-4 py-3">អត្ថបទ</th>
            <th class="px-4 py-3">ស្ថានភាព</th>
            <th class="px-4 py-3">ប្រភេទ</th>
            <th class="px-4 py-3">អ្នកនិពន្ធ</th>
            <th class="px-4 py-3">ការមើល</th>
            <th class="px-4 py-3">ផ្សាយនៅ</th>
            <th class="px-4 py-3 text-right">សកម្មភាព</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          <tr v-for="a in articles" :key="a.id" class="hover:bg-slate-50">
            <td class="max-w-[280px] px-4 py-3">
              <div class="flex items-center gap-3">
                <img :src="a.featuredImage ?? '/assets/img/news/KH.jpg'" alt="" class="h-10 w-14 shrink-0 rounded object-cover" />
                <div class="min-w-0">
                  <p class="truncate font-medium text-slate-700">
                    <RouterLink :to="`/articles/${a.id}/edit`" class="hover:text-brand-600">{{ a.title }}</RouterLink>
                  </p>
                  <p class="flex items-center gap-2 text-xs text-slate-400">
                    <span v-if="a.isFeatured" class="badge bg-brand-50 text-brand-600">ពិសេស</span>
                    <span v-if="a.isBreaking" class="badge bg-red-50 text-red-600">ក្តៅ</span>
                  </p>
                </div>
              </div>
            </td>
            <td class="px-4 py-3"><StatusBadge :status="a.status" /></td>
            <td class="px-4 py-3 text-slate-500">{{ a.category?.name }}</td>
            <td class="px-4 py-3 text-slate-500">{{ a.author?.name }}</td>
            <td class="px-4 py-3 text-slate-500">{{ a.views }}</td>
            <td class="px-4 py-3 text-slate-400">{{ a.publishedAt ? new Date(a.publishedAt).toLocaleDateString() : "—" }}</td>
            <td class="px-4 py-3">
              <div class="flex justify-end gap-1">
                <RouterLink :to="`/articles/${a.id}/edit`" class="btn-ghost !p-2" title="កែសម្រួល">
                  <Pencil class="h-4 w-4" />
                </RouterLink>
                <button class="btn-ghost !p-2 text-red-600 hover:!bg-red-50" title="លុប" @click="askDelete(a)">
                  <Trash2 class="h-4 w-4" />
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="!loading && articles.length === 0" class="p-10 text-center text-sm text-slate-400">
      មិនមានអត្ថបទទេ
    </div>

    <div class="px-4 pb-4">
      <AdminPagination :page="page" :total-pages="totalPages" :total="total" @change="load" />
    </div>

    <ConfirmDialog v-model="confirmOpen" :busy="deleting" @confirm="doDelete" />
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { Plus, Pencil, Trash2 } from "lucide-vue-next";
import { adminService } from "@/services/admin.service";
import { useToastStore } from "@/stores/toast";
import StatusBadge from "@/components/ui/StatusBadge.vue";
import AdminPagination from "@/components/ui/AdminPagination.vue";
import ConfirmDialog from "@/components/ui/ConfirmDialog.vue";
import type { Article, Category } from "@/types";

const toast = useToastStore();
const articles = ref<Article[]>([]);
const categories = ref<Category[]>([]);
const search = ref("");
const statusFilter = ref("");
const categoryFilter = ref<number | "">("");
const page = ref(1);
const totalPages = ref(1);
const total = ref(0);
const loading = ref(false);
const confirmOpen = ref(false);
const deleting = ref(false);
let target: Article | null = null;
let debounce: number | undefined;

async function load(p = 1) {
  loading.value = true;
  try {
    const data = await adminService.articles({
      page: p,
      pageSize: 10,
      q: search.value.trim() || undefined,
      status: statusFilter.value || undefined,
      categoryId: categoryFilter.value || undefined,
    });
    articles.value = data.items;
    page.value = data.page;
    totalPages.value = data.totalPages;
    total.value = data.total;
  } catch (e) {
    toast.error(e instanceof Error ? e.message : "ផ្ទុកទិន្នន័យបរាជ័យ");
  } finally {
    loading.value = false;
  }
}

function onSearch() {
  if (debounce) window.clearTimeout(debounce);
  debounce = window.setTimeout(() => load(1), 400);
}

function askDelete(a: Article) {
  target = a;
  confirmOpen.value = true;
}

async function doDelete() {
  if (!target) return;
  deleting.value = true;
  try {
    await adminService.deleteArticle(target.id);
    toast.success("បានលុបអត្ថបទ");
    load(page.value);
  } catch (e) {
    toast.error(e instanceof Error ? e.message : "លុបបរាជ័យ");
  } finally {
    deleting.value = false;
    confirmOpen.value = false;
    target = null;
  }
}

onMounted(async () => {
  load(1);
  categories.value = await adminService.categories().catch(() => []);
});
</script>
