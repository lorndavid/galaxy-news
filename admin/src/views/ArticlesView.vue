<template>
  <div class="card overflow-hidden">
    <!-- Toolbar -->
    <div class="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:items-center">
      <div class="relative max-w-xs flex-1">
        <Search class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input v-model="search" type="text" placeholder="prefs.t('articles.search')" class="input !pl-9" @input="onSearch" />
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <select v-model="statusFilter" class="input !w-auto" @change="load(1)">
          <option value="">{{ prefs.t('articles.allStatus') }}</option>
          <option value="PUBLISHED">បានផ្សាយ</option>
          <option value="DRAFT">សេចក្តីព្រាង</option>
          <option value="SCHEDULED">បានកំណត់ពេល</option>
          <option value="ARCHIVED">ប័ណ្ណសារ</option>
        </select>
        <select v-model="categoryFilter" class="input !w-auto" @change="load(1)">
          <option value="">{{ prefs.t('articles.allCategories') }}</option>
          <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.name }}</option>
        </select>
        <RouterLink to="/articles/new" class="btn-primary">
          <Plus class="h-4 w-4" /> {{ prefs.t('articles.new') }}
        </RouterLink>
      </div>
    </div>

    <!-- Bulk action bar -->
    <div
      v-if="selected.size > 0"
      class="flex flex-wrap items-center gap-2 border-b border-brand-100 bg-brand-50/60 px-4 py-2.5"
    >
      <span class="text-sm font-medium text-brand-700">
        {{ prefs.t('articles.bulkSelected') }} {{ selected.size }} {{ prefs.t('nav.articles') }}
      </span>
      <span class="mx-1 hidden h-4 w-px bg-brand-200 sm:block" />
      <div class="flex flex-wrap items-center gap-1.5">
        <button class="btn-secondary !py-1.5 text-xs" :disabled="bulkBusy" @click="runBulk('publish')">
          <Send class="h-3.5 w-3.5" /> {{ prefs.t('articles.bulkPublish') }}
        </button>
        <button class="btn-secondary !py-1.5 text-xs" :disabled="bulkBusy" @click="runBulk('unpublish')">
          <Archive class="h-3.5 w-3.5" /> {{ prefs.t('articles.bulkUnpublish') }}
        </button>
        <button class="btn-danger !py-1.5 text-xs" :disabled="bulkBusy" @click="askBulkDelete">
          <Trash2 class="h-3.5 w-3.5" /> {{ prefs.t('articles.bulkDelete') }}
        </button>
      </div>
      <button class="ml-auto text-xs text-slate-500 hover:text-slate-700" :disabled="bulkBusy" @click="clearSelection">
        prefs.t('common.deselect')
      </button>
    </div>

    <!-- Table -->
    <div class="overflow-x-auto">
      <table class="data-table">
        <thead>
          <tr>
            <th class="w-10">
              <input
                type="checkbox"
                class="h-4 w-4 rounded border-slate-300"
                aria-label="prefs.t('common.selectAll')"
                :checked="allSelected"
                :indeterminate.prop="someSelected"
                @change="toggleAll"
              />
            </th>
            <th>{{ prefs.t('articles.colArticle') }}</th>
            <th>{{ prefs.t('articles.colStatus') }}</th>
            <th class="hidden md:table-cell">{{ prefs.t('articles.colCategory') }}</th>
            <th class="hidden lg:table-cell">{{ prefs.t('articles.colAuthor') }}</th>
            <th class="hidden lg:table-cell">{{ prefs.t('articles.colViews') }}</th>
            <th class="hidden xl:table-cell">{{ prefs.t('articles.colPublished') }}</th>
            <th class="text-right">{{ prefs.t('articles.colActions') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="a in articles" :key="a.id" :class="selected.has(a.id) ? 'bg-brand-50/50' : ''">
            <td>
              <input
                type="checkbox"
                class="h-4 w-4 rounded border-slate-300"
                :checked="selected.has(a.id)"
                :aria-label="`ជ្រើសរើស ${a.title}`"
                @change="toggleOne(a.id)"
              />
            </td>
            <td class="max-w-[280px]">
              <div class="flex items-center gap-3">
                <img :src="a.featuredImage ?? '/assets/img/news/KH.jpg'" alt="" class="h-11 w-16 shrink-0 rounded-md border border-slate-200 object-cover" loading="lazy" />
                <div class="min-w-0">
                  <p class="truncate font-medium text-slate-700">
                    <RouterLink :to="`/articles/${a.id}/edit`" class="transition-colors hover:text-brand-600">{{ a.title }}</RouterLink>
                  </p>
                  <p class="flex items-center gap-2 text-xs text-slate-400">
                    <span v-if="a.isFeatured" class="badge bg-brand-50 text-brand-600">{{ prefs.t('articles.featured') }}</span>
                    <span v-if="a.isBreaking" class="badge bg-red-50 text-red-600">{{ prefs.t('articles.breaking') }}</span>
                  </p>
                </div>
              </div>
            </td>
            <td><StatusBadge :status="a.status" /></td>
            <td class="hidden text-slate-500 md:table-cell">{{ a.category?.name }}</td>
            <td class="hidden text-slate-500 lg:table-cell">{{ a.author?.name }}</td>
            <td class="hidden tabular-nums text-slate-500 lg:table-cell">{{ a.views.toLocaleString() }}</td>
            <td class="hidden text-slate-400 xl:table-cell">{{ a.publishedAt ? new Date(a.publishedAt).toLocaleDateString() : "—" }}</td>
            <td>
              <div class="flex justify-end gap-1">
                <RouterLink :to="`/articles/${a.id}/edit`" class="btn-ghost !p-2" title="prefs.t('common.edit')">
                  <Pencil class="h-4 w-4" />
                </RouterLink>
                <a :href="`/article/${a.slug}`" target="_blank" rel="noopener" class="btn-ghost !p-2" title="prefs.t('top.previewSite')">
                  <Eye class="h-4 w-4" />
                </a>
                <button class="btn-ghost !p-2 text-red-600 hover:!bg-red-50" title="prefs.t('common.delete')" @click="askDelete(a)">
                  <Trash2 class="h-4 w-4" />
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <EmptyState
      v-if="!loading && articles.length === 0"
      title="មិនមានអត្ថបទទេ"
      message="សាកល្បងប្តូរតម្រង ឬស្វែងរក ឬបង្កើតអត្ថបទថ្មី"
    />

    <div class="px-4 pb-4 pt-1">
      <AdminPagination :page="page" :total-pages="totalPages" :total="total" @change="load" />
    </div>

    <ConfirmDialog v-model="confirmOpen" :busy="deleting" @confirm="doDelete" />
    <ConfirmDialog
      v-model="bulkConfirmOpen"
      :title="`លុប ${selected.size} អត្ថបទ?`"
      :message="'ការលុបច្រើនមិនអាចត្រឡប់វិញបានទេ។ តើអ្នកប្រាកដទេ?'"
      :busy="bulkBusy"
      @confirm="doBulkDelete"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { Plus, Pencil, Trash2, Eye, Search, Send, Archive } from "lucide-vue-next";
import { adminService } from "@/services/admin.service";
import { useToastStore } from "@/stores/toast";
import StatusBadge from "@/components/ui/StatusBadge.vue";
import AdminPagination from "@/components/ui/AdminPagination.vue";
import ConfirmDialog from "@/components/ui/ConfirmDialog.vue";
import EmptyState from "@/components/ui/EmptyState.vue";
import type { Article, Category } from "@/types";
import { usePreferencesStore } from "@/stores/preferences";

const toast = useToastStore();
const prefs = usePreferencesStore();
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
const bulkConfirmOpen = ref(false);
const bulkBusy = ref(false);
const selected = ref<Set<number>>(new Set());
let target: Article | null = null;
let debounce: number | undefined;

const allSelected = computed(() => articles.value.length > 0 && articles.value.every((a) => selected.value.has(a.id)));
const someSelected = computed(() => selected.value.size > 0 && !allSelected.value);

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
    // Drop selections for rows that no longer exist (e.g. after deletion).
    const ids = new Set(data.items.map((a) => a.id));
    selected.value = new Set([...selected.value].filter((id) => ids.has(id)));
  } catch (e) {
    toast.error(e instanceof Error ? e.message : prefs.t('toast.loadError'));
  } finally {
    loading.value = false;
  }
}

function onSearch() {
  if (debounce) window.clearTimeout(debounce);
  debounce = window.setTimeout(() => load(1), 400);
}

function toggleOne(id: number) {
  const next = new Set(selected.value);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  selected.value = next;
}

function toggleAll() {
  if (allSelected.value) {
    selected.value = new Set();
  } else {
    selected.value = new Set(articles.value.map((a) => a.id));
  }
}

function clearSelection() {
  selected.value = new Set();
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
    toast.success(prefs.t('toast.articleDeleted'));
    load(page.value);
  } catch (e) {
    toast.error(e instanceof Error ? e.message : prefs.t('toast.deleteError'));
  } finally {
    deleting.value = false;
    confirmOpen.value = false;
    target = null;
  }
}

async function runBulk(action: "publish" | "unpublish") {
  if (selected.value.size === 0) return;
  bulkBusy.value = true;
  try {
    const { count } = await adminService.bulkArticles([...selected.value], action);
    toast.success(action === "publish" ? `បានផ្សាយ ${count} អត្ថបទ` : `បានឈប់ផ្សាយ ${count} អត្ថបទ`);
    clearSelection();
    load(page.value);
  } catch (e) {
    toast.error(e instanceof Error ? e.message : "សកម្មភាពបរាជ័យ");
  } finally {
    bulkBusy.value = false;
  }
}

function askBulkDelete() {
  if (selected.value.size === 0) return;
  bulkConfirmOpen.value = true;
}

async function doBulkDelete() {
  bulkBusy.value = true;
  try {
    const { count } = await adminService.bulkArticles([...selected.value], "delete");
    toast.success(`បានលុប ${count} អត្ថបទ`);
    clearSelection();
    load(page.value);
  } catch (e) {
    toast.error(e instanceof Error ? e.message : prefs.t('toast.deleteError'));
  } finally {
    bulkBusy.value = false;
    bulkConfirmOpen.value = false;
  }
}

onMounted(async () => {
  load(1);
  categories.value = await adminService.categories().catch(() => []);
});
</script>
