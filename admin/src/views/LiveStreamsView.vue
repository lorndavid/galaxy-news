<template>
  <div class="space-y-4">
    <!-- Header -->
    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 class="text-lg font-semibold text-slate-800 dark:text-slate-100">{{ prefs.t('livestream.title') }}</h2>
        <p class="text-xs text-slate-500 dark:text-slate-400">{{ prefs.t('livestream.subtitle') }}</p>
      </div>
      <button class="btn-primary !py-2 text-sm" @click="openCreate">
        <Plus class="h-4 w-4" /> {{ prefs.t('livestream.addStream') }}
      </button>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <div v-for="stat in stats" :key="stat.label" class="card p-3">
        <p class="text-[11px] font-medium text-slate-400 dark:text-slate-500">{{ stat.label }}</p>
        <p class="text-xl font-bold" :class="stat.color">{{ stat.value }}</p>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="card p-8 text-center">
      <div class="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600"></div>
      <p class="mt-3 text-sm text-slate-500">{{ prefs.t('common.loading') }}</p>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="card p-8 text-center">
      <p class="text-sm text-red-600">{{ error }}</p>
      <button class="btn-secondary mt-3 !py-1.5 text-xs" @click="load()">{{ prefs.t('common.retry') }}</button>
    </div>

    <!-- Empty -->
    <div v-else-if="!items.length" class="card p-12 text-center">
      <Radio class="mx-auto h-10 w-10 text-slate-300" />
      <h3 class="mt-3 text-sm font-semibold text-slate-600">{{ prefs.t('livestream.empty') }}</h3>
      <p class="mt-1 text-xs text-slate-400">{{ prefs.t('livestream.emptyHint') }}</p>
      <button class="btn-primary mt-4 !py-2 text-sm" @click="openCreate">
        <Plus class="h-4 w-4" /> {{ prefs.t('livestream.addFirst') }}
      </button>
    </div>

    <!-- Streams Table -->
    <div v-else class="card overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-sm">
          <thead class="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
            <tr>
              <th class="px-4 py-3">{{ prefs.t('livestream.order') }}</th>
              <th class="px-4 py-3">{{ prefs.t('livestream.titleKh') }}</th>
              <th class="px-4 py-3 hidden sm:table-cell">{{ prefs.t('livestream.titleEn') }}</th>
              <th class="px-4 py-3">{{ prefs.t('livestream.status') }}</th>
              <th class="px-4 py-3 hidden md:table-cell">{{ prefs.t('livestream.visibility') }}</th>
              <th class="px-4 py-3 hidden lg:table-cell">{{ prefs.t('livestream.schedule') }}</th>
              <th class="px-4 py-3 text-right">{{ prefs.t('livestream.actions') }}</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
            <tr v-for="s in items" :key="s.id" class="transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
              <td class="px-4 py-3 text-xs text-slate-400">{{ s.displayOrder }}</td>
              <td class="px-4 py-3">
                <div class="flex items-center gap-2">
                  <span v-if="s.isHomepage" class="inline-block h-2 w-2 rounded-full bg-blue-500" title="Homepage"></span>
                  <span v-if="s.isFeatured" class="inline-block h-2 w-2 rounded-full bg-amber-500" title="Featured"></span>
                  <div>
                    <p class="font-medium text-slate-700 dark:text-slate-200">{{ s.titleKh }}</p>
                    <a :href="s.facebookUrl" target="_blank" rel="noopener" class="text-[11px] text-blue-500 hover:underline">{{ truncateUrl(s.facebookUrl) }}</a>
                  </div>
                </div>
              </td>
              <td class="px-4 py-3 hidden sm:table-cell text-slate-500 dark:text-slate-400">{{ s.titleEn || '—' }}</td>
              <td class="px-4 py-3">
                <span class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold" :class="statusClass(s.status)">
                  <span v-if="s.status === 'LIVE'" class="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500"></span>
                  {{ statusLabel(s.status) }}
                </span>
              </td>
              <td class="px-4 py-3 hidden md:table-cell text-xs text-slate-500">{{ visibilityLabel(s.visibility) }}</td>
              <td class="px-4 py-3 hidden lg:table-cell text-[11px] text-slate-400">
                <span v-if="s.startAt">{{ formatDate(s.startAt) }}</span>
                <span v-else>—</span>
              </td>
              <td class="px-4 py-3">
                <div class="flex items-center justify-end gap-1">
                  <!-- Quick status toggle -->
                  <button
                    v-if="s.status !== 'LIVE'"
                    class="rounded p-1.5 text-emerald-600 transition-colors hover:bg-emerald-50 dark:hover:bg-emerald-900/30"
                    :title="prefs.t('livestream.goLive')"
                    @click="toggleLive(s)"
                  >
                    <Radio class="h-4 w-4" />
                  </button>
                  <button
                    v-else
                    class="rounded p-1.5 text-amber-600 transition-colors hover:bg-amber-50 dark:hover:bg-amber-900/30"
                    :title="prefs.t('livestream.endStream')"
                    @click="endStream(s)"
                  >
                    <Square class="h-4 w-4" />
                  </button>
                  <button
                    class="rounded p-1.5 text-slate-500 transition-colors hover:bg-slate-100 dark:hover:bg-slate-700"
                    :title="prefs.t('livestream.preview')"
                    @click="previewStream(s)"
                  >
                    <Eye class="h-4 w-4" />
                  </button>
                  <button
                    class="rounded p-1.5 text-slate-500 transition-colors hover:bg-slate-100 dark:hover:bg-slate-700"
                    :title="prefs.t('common.edit')"
                    @click="openEdit(s)"
                  >
                    <Pencil class="h-4 w-4" />
                  </button>
                  <button
                    class="rounded p-1.5 text-red-600 transition-colors hover:bg-red-50 dark:hover:bg-red-900/30"
                    :title="prefs.t('common.delete')"
                    @click="askDelete(s)"
                  >
                    <Trash2 class="h-4 w-4" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Create/Edit Modal -->
    <Modal v-model="modalOpen" :title="editing ? prefs.t('livestream.editStream') : prefs.t('livestream.createStream')">
      <form class="space-y-4" @submit.prevent="save">
        <div class="grid gap-4 sm:grid-cols-2">
          <div>
            <label class="label">{{ prefs.t('livestream.titleKh') }} *</label>
            <input v-model="form.titleKh" type="text" class="input" required :placeholder="prefs.t('livestream.titleKhPlaceholder')" />
          </div>
          <div>
            <label class="label">{{ prefs.t('livestream.titleEn') }}</label>
            <input v-model="form.titleEn" type="text" class="input" :placeholder="prefs.t('livestream.titleEnPlaceholder')" />
          </div>
        </div>

        <div>
          <label class="label">{{ prefs.t('livestream.facebookUrl') }} *</label>
          <input v-model="form.facebookUrl" type="url" class="input" required placeholder="https://www.facebook.com/..." />
          <p class="mt-1 text-[11px] text-slate-400">{{ prefs.t('livestream.facebookUrlHint') }}</p>
        </div>

        <div class="grid gap-4 sm:grid-cols-2">
          <div>
            <label class="label">{{ prefs.t('livestream.descKh') }}</label>
            <textarea v-model="form.descriptionKh" class="input" rows="2" :placeholder="prefs.t('livestream.descKhPlaceholder')"></textarea>
          </div>
          <div>
            <label class="label">{{ prefs.t('livestream.descEn') }}</label>
            <textarea v-model="form.descriptionEn" class="input" rows="2" :placeholder="prefs.t('livestream.descEnPlaceholder')"></textarea>
          </div>
        </div>

        <div>
          <label class="label">{{ prefs.t('livestream.thumbnail') }}</label>
          <input v-model="form.thumbnailUrl" type="url" class="input" placeholder="https://... (thumbnail image URL)" />
          <div v-if="form.thumbnailUrl" class="mt-2">
            <img :src="form.thumbnailUrl" alt="Preview" class="h-24 rounded-md object-cover" @error="(e: any) => e.target.style.display = 'none'" />
          </div>
        </div>

        <div class="grid gap-4 sm:grid-cols-2">
          <div>
            <label class="label">{{ prefs.t('livestream.status') }}</label>
            <select v-model="form.status" class="input">
              <option value="DRAFT">{{ prefs.t('livestream.statusDraft') }}</option>
              <option value="SCHEDULED">{{ prefs.t('livestream.statusScheduled') }}</option>
              <option value="LIVE">{{ prefs.t('livestream.statusLive') }}</option>
              <option value="ENDED">{{ prefs.t('livestream.statusEnded') }}</option>
              <option value="DISABLED">{{ prefs.t('livestream.statusDisabled') }}</option>
            </select>
          </div>
          <div>
            <label class="label">{{ prefs.t('livestream.visibility') }}</label>
            <select v-model="form.visibility" class="input">
              <option value="HOMEPAGE">{{ prefs.t('livestream.visHomepage') }}</option>
              <option value="PAGE_ONLY">{{ prefs.t('livestream.visPageOnly') }}</option>
              <option value="HIDDEN">{{ prefs.t('livestream.visHidden') }}</option>
            </select>
          </div>
        </div>

        <div class="grid gap-4 sm:grid-cols-2">
          <div>
            <label class="label">{{ prefs.t('livestream.startAt') }}</label>
            <input v-model="form.startAt" type="datetime-local" class="input" />
          </div>
          <div>
            <label class="label">{{ prefs.t('livestream.endAt') }}</label>
            <input v-model="form.endAt" type="datetime-local" class="input" />
          </div>
        </div>

        <div class="grid gap-4 sm:grid-cols-3">
          <div>
            <label class="label">{{ prefs.t('livestream.order') }}</label>
            <input v-model.number="form.displayOrder" type="number" min="0" class="input" />
          </div>
          <div class="flex items-end gap-4">
            <label class="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
              <input v-model="form.isHomepage" type="checkbox" class="h-4 w-4 rounded border-slate-300" />
              {{ prefs.t('livestream.onHomepage') }}
            </label>
          </div>
          <div class="flex items-end gap-4">
            <label class="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
              <input v-model="form.isFeatured" type="checkbox" class="h-4 w-4 rounded border-slate-300" />
              {{ prefs.t('livestream.featured') }}
            </label>
          </div>
        </div>

        <!-- Preview section -->
        <div v-if="previewUrl" class="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
          <p class="mb-2 text-xs font-semibold text-slate-500">{{ prefs.t('livestream.preview') }}</p>
          <div class="aspect-video w-full overflow-hidden rounded-md bg-black">
            <iframe
              :src="previewUrl"
              class="h-full w-full border-0"
              allowfullscreen
              allow="autoplay; encrypted-media"
              loading="lazy"
            ></iframe>
          </div>
        </div>

        <div class="flex justify-end gap-2 border-t border-slate-200 pt-4 dark:border-slate-700">
          <button type="button" class="btn-secondary text-sm" @click="modalOpen = false">{{ prefs.t('common.cancel') }}</button>
          <button type="submit" class="btn-primary text-sm" :disabled="saving">
            {{ saving ? prefs.t('common.saving') : prefs.t('common.save') }}
          </button>
        </div>
      </form>
    </Modal>

    <!-- Preview Modal -->
    <Modal v-model="previewOpen" :title="previewData?.titleKh ?? ''">
      <div v-if="previewData" class="space-y-4">
        <div class="aspect-video w-full overflow-hidden rounded-lg bg-black">
          <iframe
            :src="toEmbedUrl(previewData.facebookUrl)"
            class="h-full w-full border-0"
            allowfullscreen
            allow="autoplay; encrypted-media"
          ></iframe>
        </div>
        <div class="space-y-1 text-sm">
          <p><span class="font-medium">{{ prefs.t('livestream.status') }}:</span> <span class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold" :class="statusClass(previewData.status)">{{ statusLabel(previewData.status) }}</span></p>
          <p v-if="previewData.titleEn"><span class="font-medium">{{ prefs.t('livestream.titleEn') }}:</span> {{ previewData.titleEn }}</p>
          <p v-if="previewData.descriptionKh" class="text-slate-500">{{ previewData.descriptionKh }}</p>
          <p v-if="previewData.descriptionEn" class="text-slate-500">{{ previewData.descriptionEn }}</p>
        </div>
      </div>
    </Modal>

    <!-- Delete Confirmation -->
    <ConfirmDialog v-model="confirmOpen" @confirm="doDelete" />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { Plus, Pencil, Trash2, Radio, Eye, Square } from "lucide-vue-next";
import { adminService } from "@/services/admin.service";
import { useToastStore } from "@/stores/toast";
import { usePreferencesStore } from "@/stores/preferences";
import Modal from "@/components/ui/Modal.vue";
import ConfirmDialog from "@/components/ui/ConfirmDialog.vue";
import type { LiveStream } from "@/types";

const toast = useToastStore();
const prefs = usePreferencesStore();

const items = ref<LiveStream[]>([]);
const loading = ref(false);
const error = ref("");
const modalOpen = ref(false);
const confirmOpen = ref(false);
const previewOpen = ref(false);
const editing = ref(false);
const saving = ref(false);
let target: LiveStream | null = null;
const previewData = ref<LiveStream | null>(null);

const form = reactive({
  titleKh: "",
  titleEn: "",
  descriptionKh: "",
  descriptionEn: "",
  facebookUrl: "",
  thumbnailUrl: "",
  status: "DRAFT" as string,
  visibility: "HOMEPAGE" as string,
  isHomepage: false,
  isFeatured: false,
  displayOrder: 0,
  startAt: "",
  endAt: "",
});

const previewUrl = computed(() => {
  if (!form.facebookUrl) return null;
  return toEmbedUrl(form.facebookUrl);
});

const stats = computed(() => {
  const all = items.value;
  return [
    { label: prefs.t("livestream.total"), value: all.length, color: "text-slate-700 dark:text-slate-200" },
    { label: prefs.t("livestream.statusLive"), value: all.filter((s) => s.status === "LIVE").length, color: "text-red-600" },
    { label: prefs.t("livestream.statusScheduled"), value: all.filter((s) => s.status === "SCHEDULED").length, color: "text-amber-600" },
    { label: prefs.t("livestream.onHomepage"), value: all.filter((s) => s.isHomepage).length, color: "text-blue-600" },
  ];
});

function toEmbedUrl(url: string): string {
  // Convert Facebook watch/video URLs to embeddable format
  const match = url.match(/facebook\.com\/.*\/videos\/(\d+)/);
  if (match) return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}`;
  const watchMatch = url.match(/fb\.watch\/(\w+)/);
  if (watchMatch) return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}`;
  // General Facebook embed
  return `https://www.facebook.com/plugins/post.php?href=${encodeURIComponent(url)}&show_text=true&width=500`;
}

function truncateUrl(url: string): string {
  try {
    const u = new URL(url);
    return u.pathname.length > 40 ? u.pathname.slice(0, 40) + "…" : u.pathname;
  } catch {
    return url.slice(0, 40);
  }
}

function statusClass(status: string): string {
  const map: Record<string, string> = {
    DRAFT: "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300",
    SCHEDULED: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400",
    LIVE: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400",
    ENDED: "bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400",
    DISABLED: "bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500",
  };
  return map[status] ?? map.DRAFT;
}

function statusLabel(status: string): string {
  const map: Record<string, string> = {
    DRAFT: "Draft",
    SCHEDULED: "Scheduled",
    LIVE: "🔴 LIVE",
    ENDED: "Ended",
    DISABLED: "Disabled",
  };
  return map[status] ?? status;
}

function visibilityLabel(vis: string): string {
  const map: Record<string, string> = {
    HOMEPAGE: "Homepage",
    PAGE_ONLY: "Page only",
    HIDDEN: "Hidden",
  };
  return map[vis] ?? vis;
}

function formatDate(v: string): string {
  try {
    return new Date(v).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  } catch {
    return v;
  }
}

function toLocalInput(v: string | null): string {
  if (!v) return "";
  try {
    const d = new Date(v);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch {
    return "";
  }
}

async function load() {
  loading.value = true;
  error.value = "";
  try {
    const res = await adminService.liveStreams({ pageSize: 100 });
    items.value = res.items;
  } catch (e) {
    error.value = e instanceof Error ? e.message : "Failed to load";
  } finally {
    loading.value = false;
  }
}

function openCreate() {
  editing.value = false;
  Object.assign(form, {
    titleKh: "",
    titleEn: "",
    descriptionKh: "",
    descriptionEn: "",
    facebookUrl: "",
    thumbnailUrl: "",
    status: "DRAFT",
    visibility: "HOMEPAGE",
    isHomepage: false,
    isFeatured: false,
    displayOrder: 0,
    startAt: "",
    endAt: "",
  });
  modalOpen.value = true;
}

function openEdit(s: LiveStream) {
  editing.value = true;
  target = s;
  Object.assign(form, {
    titleKh: s.titleKh,
    titleEn: s.titleEn ?? "",
    descriptionKh: s.descriptionKh ?? "",
    descriptionEn: s.descriptionEn ?? "",
    facebookUrl: s.facebookUrl,
    thumbnailUrl: s.thumbnailUrl ?? "",
    status: s.status,
    visibility: s.visibility,
    isHomepage: s.isHomepage,
    isFeatured: s.isFeatured,
    displayOrder: s.displayOrder,
    startAt: toLocalInput(s.startAt),
    endAt: toLocalInput(s.endAt),
  });
  modalOpen.value = true;
}

async function save() {
  saving.value = true;
  try {
    const payload: Record<string, unknown> = {
      titleKh: form.titleKh,
      titleEn: form.titleEn || null,
      descriptionKh: form.descriptionKh || null,
      descriptionEn: form.descriptionEn || null,
      facebookUrl: form.facebookUrl,
      thumbnailUrl: form.thumbnailUrl || null,
      status: form.status,
      visibility: form.visibility,
      isHomepage: form.isHomepage,
      isFeatured: form.isFeatured,
      displayOrder: form.displayOrder,
      startAt: form.startAt ? new Date(form.startAt).toISOString() : null,
      endAt: form.endAt ? new Date(form.endAt).toISOString() : null,
    };
    if (editing.value && target) {
      await adminService.updateLiveStream(target.id, payload);
      toast.success(prefs.t("livestream.updated"));
    } else {
      await adminService.createLiveStream(payload);
      toast.success(prefs.t("livestream.created"));
    }
    modalOpen.value = false;
    load();
  } catch (e) {
    toast.error(e instanceof Error ? e.message : prefs.t("toast.saveError"));
  } finally {
    saving.value = false;
  }
}

function askDelete(s: LiveStream) {
  target = s;
  confirmOpen.value = true;
}

async function doDelete() {
  if (!target) return;
  try {
    await adminService.deleteLiveStream(target.id);
    toast.success(prefs.t("livestream.deleted"));
    load();
  } catch (e) {
    toast.error(e instanceof Error ? e.message : prefs.t("toast.deleteError"));
  } finally {
    confirmOpen.value = false;
    target = null;
  }
}

async function toggleLive(s: LiveStream) {
  try {
    await adminService.updateLiveStreamStatus(s.id, "LIVE");
    toast.success(prefs.t("livestream.nowLive"));
    load();
  } catch (e) {
    toast.error(e instanceof Error ? e.message : prefs.t("toast.saveError"));
  }
}

async function endStream(s: LiveStream) {
  try {
    await adminService.updateLiveStreamStatus(s.id, "ENDED");
    toast.success(prefs.t("livestream.ended"));
    load();
  } catch (e) {
    toast.error(e instanceof Error ? e.message : prefs.t("toast.saveError"));
  }
}

function previewStream(s: LiveStream) {
  previewData.value = s;
  previewOpen.value = true;
}

onMounted(load);
</script>
