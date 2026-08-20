<template>
  <div class="grid gap-5 lg:grid-cols-3">
    <!-- Main form -->
    <form class="card space-y-4 p-5 lg:col-span-2" @submit.prevent="save('PUBLISHED')">
      <div>
        <label class="label">ចំណងជើង *</label>
        <input v-model="form.title" type="text" class="input text-base" placeholder="ចំណងជើងអត្ថបទ" required />
      </div>

      <div>
        <label class="label">សេចក្តីសង្ខេប</label>
        <textarea v-model="form.excerpt" rows="3" class="input" placeholder="សេចក្តីសង្ខេបខ្លីនៃអត្ថបទ (លេចឡើងក្នុងបញ្ជី និង SEO)"></textarea>
      </div>

      <div>
        <label class="label">ខ្លឹមសារ (ខ្មែរ)</label>
        <RichTextEditor v-model="form.content" />
      </div>

      <!-- English version (optional) -->
      <div class="rounded-lg border border-slate-200 p-4">
        <div class="mb-3 flex items-center gap-2">
          <span class="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-500">EN</span>
          <h3 class="text-sm font-semibold text-slate-700">English version</h3>
          <span class="text-xs text-slate-400">(ស្រេចចិត្ត — បង្ហាញនៅពេលអ្នកប្រើជ្រើស English)</span>
        </div>
        <div class="space-y-4">
          <div>
            <label class="label">ចំណងជើង (English)</label>
            <input v-model="form.titleEn" type="text" class="input" placeholder="Article title in English" />
          </div>
          <div>
            <label class="label">សេចក្តីសង្ខេប (English)</label>
            <textarea v-model="form.excerptEn" rows="2" class="input" placeholder="Short excerpt in English"></textarea>
          </div>
          <div>
            <label class="label">ខ្លឹមសារ (English)</label>
            <RichTextEditor v-model="form.contentEn" />
          </div>
        </div>
      </div>

      <!-- Chinese version (optional) -->
      <div class="rounded-lg border border-slate-200 p-4">
        <div class="mb-3 flex items-center gap-2">
          <span class="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-500">ZH</span>
          <h3 class="text-sm font-semibold text-slate-700">中文版本</h3>
          <span class="text-xs text-slate-400">(可选 — 当用户选择中文时显示)</span>
        </div>
        <div class="space-y-4">
          <div>
            <label class="label">标题 (中文)</label>
            <input v-model="form.titleZh" type="text" class="input" placeholder="Article title in Chinese" />
          </div>
          <div>
            <label class="label">摘要 (中文)</label>
            <textarea v-model="form.excerptZh" rows="2" class="input" placeholder="Short excerpt in Chinese"></textarea>
          </div>
          <div>
            <label class="label">内容 (中文)</label>
            <RichTextEditor v-model="form.contentZh" />
          </div>
        </div>
      </div>

      <div class="flex gap-2">
        <button type="submit" class="btn-primary" :disabled="saving">
          <CheckCircle class="h-4 w-4" /> បោះពុម្ពផ្សាយ
        </button>
        <button type="button" class="btn-secondary" :disabled="saving" @click="save('DRAFT')">
          <Save class="h-4 w-4" /> រក្សាទុកជាសេចក្តីព្រាង
        </button>
      </div>
    </form>

    <!-- Sidebar settings -->
    <div class="space-y-5">
      <div class="card space-y-4 p-5">
        <h3 class="text-sm font-semibold text-slate-700">ការកំណត់អត្ថបទ</h3>
        <div>
          <label class="label">ប្រភេទ *</label>
          <select v-model="form.categoryId" class="input" required>
            <option value="" disabled>ជ្រើសរើសប្រភេទ</option>
            <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.name }}</option>
          </select>
        </div>
        <div>
          <label class="label">ស្លាក</label>
          <div class="flex flex-wrap gap-1.5">
            <button
              v-for="t in tags"
              :key="t.id"
              type="button"
              class="rounded-full px-3 py-1 text-xs font-medium transition-colors"
              :class="form.tagIds.includes(t.id) ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'"
              @click="toggleTag(t.id)"
            >{{ t.name }}</button>
          </div>
        </div>
        <div>
          <label class="label">រូបភាពចំណងជើង</label>
          <ImageUploader v-model="form.featuredImage" folder="articles" />
          <button type="button" class="btn-secondary mt-2 w-full !py-1.5 text-xs" @click="mediaOpen = true">
            <ImageIcon class="h-3.5 w-3.5" /> ជ្រើសរើសពីបណ្ណាល័យមេឌា
          </button>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <label class="flex items-center gap-2 text-sm text-slate-600">
            <input v-model="form.isFeatured" type="checkbox" class="h-4 w-4 rounded border-slate-300" />
            ពិសេស
          </label>
          <label class="flex items-center gap-2 text-sm text-slate-600">
            <input v-model="form.isBreaking" type="checkbox" class="h-4 w-4 rounded border-slate-300" />
            ព័ត៌មានក្តៅ
          </label>
        </div>

        <!-- Gallery Images -->
        <div v-if="isEdit">
          <label class="label">រូបភាពបន្ថែម (Gallery)</label>

          <!-- Gallery grid layout -->
          <div class="mb-2 flex items-center gap-2">
            <span class="text-xs font-medium text-slate-500">ប្លង់ Grid:</span>
            <div v-for="n in [2, 3, 4]" :key="n" class="flex items-center gap-1">
              <button
                type="button"
                class="flex h-8 w-8 items-center justify-center rounded border text-xs font-semibold transition-colors"
                :class="form.galleryColumns === n ? 'border-brand-600 bg-brand-600 text-white' : 'border-slate-300 bg-white text-slate-600 hover:border-brand-400'"
                @click="form.galleryColumns = n"
              >
                {{ n }}
              </button>
            </div>
            <span class="text-[11px] text-slate-400">ជួរឈរ</span>
          </div>

          <div class="space-y-3">
            <div v-for="(img, idx) in galleryImages" :key="img.id" class="rounded-lg border border-slate-200 p-3">
              <div class="flex items-start gap-3">
                <img :src="img.url" :alt="img.altText || ''" class="h-16 w-24 rounded object-cover" />
                <div class="min-w-0 flex-1 space-y-2">
                  <input v-model="img.title" class="input !py-1 !text-xs" placeholder="Title (ចំណងជើងរូបភាព)" @change="updateGalleryImage(img)" />
                  <textarea v-model="img.description" rows="2" class="input !py-1 !text-xs" placeholder="Description (ការពិពណ៌នារូបភាព)" @change="updateGalleryImage(img)"></textarea>
                  <div class="grid grid-cols-2 gap-2">
                    <input v-model="img.altText" class="input !py-1 !text-xs" placeholder="Alt text" @change="updateGalleryImage(img)" />
                    <input v-model="img.caption" class="input !py-1 !text-xs" placeholder="Caption (អក្ខរកម្ម)" @change="updateGalleryImage(img)" />
                  </div>
                  <div class="flex items-center gap-2">
                    <span class="text-[11px] font-medium text-slate-500">Crop:</span>                    <select v-model="img.cropPosition" class="input !py-0.5 !text-[11px] !h-7" @change="updateGalleryImage(img)">
                      <option value="center">Center</option>
                      <option value="top">Top</option>
                      <option value="bottom">Bottom</option>
                      <option value="left">Left</option>
                      <option value="right">Right</option>
                    </select>
                  </div>
                </div>
                <div class="flex flex-col items-center gap-0.5">
                  <button type="button" class="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30" :disabled="idx === 0" title="ផ្លាស់ទីឡើងលើ" @click="moveGalleryImage(idx, -1)">
                    <ChevronUp class="h-4 w-4" />
                  </button>
                  <button type="button" class="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30" :disabled="idx === galleryImages.length - 1" title="ផ្លាស់ទីចុះក្រោម" @click="moveGalleryImage(idx, 1)">
                    <ChevronDown class="h-4 w-4" />
                  </button>
                </div>
                <button type="button" class="p-1 text-red-500 hover:text-red-700" @click="removeGalleryImage(img.id)">
                  <XCircle class="h-4 w-4" />
                </button>
              </div>
            </div>
            <div class="flex gap-2">
              <button type="button" class="btn-secondary flex-1 !py-1.5 text-xs" @click="mediaGalleryOpen = true">
                <ImageIcon class="h-3.5 w-3.5" /> បន្ថែមរូបភាព
              </button>
            </div>
            <p class="text-[11px] text-slate-400">
              រូបភាពនីមួយៗអាចមានចំណងជើង ការពិពណ៌នា និង Crop Position ដាច់ដោយឡែក។
            </p>
          </div>
        </div>

        <div>
          <label class="label">ផ្សាយនៅថ្ងៃ</label>
          <input v-model="form.publishedAt" type="datetime-local" class="input" />
        </div>
        <div>
          <label class="label">ស្ថានភាព</label>
          <select v-model="form.status" class="input">
            <option value="DRAFT">សេចក្តីព្រាង</option>
            <option value="PUBLISHED">បានផ្សាយ</option>
            <option value="SCHEDULED">បានកំណត់ពេល</option>
            <option value="ARCHIVED">ប័ណ្ណសារ</option>
          </select>
        </div>
      </div>

      <!-- Telegram publishing panel (edit mode only) -->
      <div v-if="isEdit" class="card space-y-3 p-5">
        <h3 class="flex items-center gap-2 text-sm font-semibold text-slate-700">
          <Send class="h-4 w-4 text-sky-600" /> Telegram Publishing
        </h3>

        <!-- Not sent -->
        <div v-if="!pubs.length" class="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
          <span class="h-2 w-2 rounded-full bg-slate-400"></span>
          <span class="text-sm text-slate-500">មិនទាន់បានផ្សាយ</span>
        </div>

        <!-- In flight (any) -->
        <div v-if="inFlight" class="flex items-center gap-2 rounded-lg border border-sky-200 bg-sky-50 px-3 py-2.5">
          <Loader2 class="h-4 w-4 animate-spin text-sky-600" />
          <span class="text-sm font-medium text-sky-700">កំពុងផ្សាយទៅ Telegram…</span>
        </div>

        <!-- Per-destination status rows -->
        <div v-if="pubs.length" class="space-y-1.5">
          <div
            v-for="(p, idx) in pubs"
            :key="p.id || p.chatId || idx"
            class="rounded-lg border px-3 py-2"
            :class="statusRowClass(p.status)"
          >
            <p class="flex items-center justify-between gap-2 text-sm">
              <span class="flex items-center gap-2 font-medium" :class="statusTextClass(p.status)">
                <CheckCircle v-if="p.status === 'PUBLISHED'" class="h-4 w-4" />
                <XCircle v-else-if="p.status === 'FAILED'" class="h-4 w-4" />
                <Loader2 v-else class="h-4 w-4 animate-spin" />
                {{ statusLabel(p.status) }}
              </span>
              <span class="font-mono text-[11px] text-slate-500">{{ p.chatId }}</span>
            </p>
            <p v-if="p.status === 'FAILED' && p.errorMessage" class="mt-1 text-xs leading-relaxed text-red-700/80">
              {{ p.errorMessage }}
            </p>
            <p v-if="p.status === 'FAILED'" class="mt-0.5 text-[11px] text-red-500">ការព្យាយាម៖ {{ p.attempts }} / 3</p>
            <div v-if="p.status === 'PUBLISHED'" class="mt-1 flex items-center gap-3 text-xs text-emerald-700/80">
              <span v-if="p.telegramMessageId">ID: {{ p.telegramMessageId }}</span>
              <a
                v-if="p.telegramMessageId"
                :href="telegramMessageUrl(p.chatId, p.telegramMessageId)"
                target="_blank"
                rel="noopener"
                class="inline-flex items-center gap-1 font-medium underline hover:text-emerald-800"
              >
                <ExternalLink class="h-3 w-3" /> បើកក្នុង Telegram
              </a>
            </div>
          </div>
        </div>

        <div class="flex gap-2">
          <button
            v-if="!pubs.length || allFailed"
            type="button"
            class="btn-primary !py-1.5 text-xs"
            :disabled="sending"
            @click="openSendConfirm(false)"
          >
            <Send v-if="!sending" class="h-3.5 w-3.5" />
            <Loader2 v-else class="h-3.5 w-3.5 animate-spin" />
            {{ allFailed ? 'ព្យាយាមម្តងទៀត' : 'ផ្ញើទៅ Telegram' }}
          </button>
          <button
            v-else-if="allPublished"
            type="button"
            class="btn-secondary !py-1.5 text-xs"
            :disabled="sending"
            @click="openSendConfirm(true)"
          >
            <RefreshCw class="h-3.5 w-3.5" /> ផ្ញើម្តងទៀត
          </button>
        </div>
        <p class="text-[11px] text-slate-400">
          ប្រសិនបើ «ផ្សាយដោយស្វ័យប្រវត្តិ» ត្រូវបានបើក អត្ថបទនឹងត្រូវផ្ញើដោយស្វ័យប្រវត្តិទៅគ្រប់ destination នៅពេលបោះពុម្ពផ្សាយ។
        </p>
      </div>
    </div>

    <!-- Media picker (featured image) -->
    <Modal v-model="mediaOpen" title="ជ្រើសរើសរូបភាព">
      <div class="grid grid-cols-3 gap-2">
        <button
          v-for="m in mediaItems"
          :key="m.id"
          class="overflow-hidden rounded-lg border-2 border-transparent hover:border-brand-500"
          @click="pickImage(m.secureUrl)"
        >
          <img :src="m.secureUrl" :alt="m.altText ?? m.fileName" class="h-20 w-full object-cover" />
        </button>
      </div>
      <button v-if="!mediaItems.length" class="btn-secondary mt-3 w-full" type="button" @click="loadMedia">ផ្ទុកមេឌា</button>
      <button class="btn-secondary mt-3 w-full" type="button" @click="loadMoreMedia">ផ្ទុកបន្ថែម</button>
    </Modal>

    <!-- Media picker (gallery) — multi-select -->
    <Modal v-model="mediaGalleryOpen" title="បន្ថែមរូបភាពទៅ Gallery">
      <div class="grid grid-cols-3 gap-2">
        <button
          v-for="m in mediaItems"
          :key="m.id"
          type="button"
          class="relative overflow-hidden rounded-lg border-2 transition-colors"
          :class="gallerySelected.has(m.id) ? 'border-brand-600' : 'border-transparent hover:border-emerald-500'"
          @click="toggleGallerySelect(m.id)"
        >
          <img :src="m.secureUrl" :alt="m.altText ?? m.fileName" class="h-20 w-full object-cover" />
          <span
            v-if="gallerySelected.has(m.id)"
            class="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-brand-600 text-white"
          >
            <Check class="h-3.5 w-3.5" />
          </span>
        </button>
      </div>
      <p v-if="!mediaItems.length" class="mt-3 text-center text-sm text-slate-400">
        គ្មានមេឌា — ផ្ទុកពីបណ្ណាល័យ
      </p>
      <div class="mt-3 flex items-center justify-between gap-2">
        <button class="btn-secondary !py-1.5 text-xs" type="button" @click="loadMoreMedia">ផ្ទុកបន្ថែម</button>
        <div class="flex items-center gap-2">
          <span v-if="gallerySelected.size" class="text-xs font-medium text-slate-500">បានជ្រើសរើស {{ gallerySelected.size }}</span>
          <button
            class="btn-primary !py-1.5 text-xs"
            type="button"
            :disabled="!gallerySelected.size || galleryAdding"
            @click="addGalleryImages"
          >
            {{ galleryAdding ? "កំពុងបន្ថែម..." : "បន្ថែមចូល Gallery" }}
          </button>
        </div>
      </div>
    </Modal>

    <!-- Telegram send confirmation -->
    <ConfirmDialog
      v-model="confirmOpen"
      :title="resend ? 'ផ្ញើម្តងទៀតទៅ Telegram?' : 'ផ្ញើអត្ថបទទៅ Telegram?'"
      :message="resend
        ? 'អត្ថបទនេះបានផ្សាយទៅ Telegram រួចហើយ។ តើអ្នកចង់ផ្ញើសារថ្មីម្តងទៀតទេ?'
        : 'អត្ថបទនឹងត្រូវបានផ្ញើទៅកាន់ឆានែល/ក្រុម Telegram ដែលបានកំណត់។'"
      confirm-label="ផ្ញើ"
      :busy="sending"
      @confirm="doSend"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref, watch } from "vue";
import { onBeforeRouteLeave, useRoute, useRouter } from "vue-router";
import { CheckCircle, Save, Image as ImageIcon, Send, Loader2, RefreshCw, XCircle, ExternalLink, ChevronUp, ChevronDown, Check } from "lucide-vue-next";
import { adminService } from "@/services/admin.service";
import { useToastStore } from "@/stores/toast";
import RichTextEditor from "@/components/editor/RichTextEditor.vue";
import Modal from "@/components/ui/Modal.vue";
import ConfirmDialog from "@/components/ui/ConfirmDialog.vue";
import ImageUploader from "@/components/media/ImageUploader.vue";
import type { Category, Media, Tag, TelegramPublication } from "@/types";

const route = useRoute();
const router = useRouter();
const toast = useToastStore();

const isEdit = computed(() => !!route.params.id);

const categories = ref<Category[]>([]);
const tags = ref<Tag[]>([]);
const mediaItems = ref<Media[]>([]);
const mediaPage = ref(1);
const mediaOpen = ref(false);
const mediaGalleryOpen = ref(false);
const gallerySelected = ref<Set<number>>(new Set());
const galleryAdding = ref(false);
const galleryImages = ref<{ id: number; mediaId: number; url: string; altText: string | null; caption: string | null; title: string | null; description: string | null; cropPosition: string | null; sortOrder: number }[]>([]);
const saving = ref(false);
const sending = ref(false);
const dirty = ref(false);
const confirmOpen = ref(false);
const resend = ref(false);
const pubs = ref<TelegramPublication[]>([]);
let pollTimer: ReturnType<typeof setInterval> | null = null;

const inFlight = computed(() => pubs.value.some((p) => p.status === "PENDING" || p.status === "PROCESSING"));
const allPublished = computed(() => pubs.value.length > 0 && pubs.value.every((p) => p.status === "PUBLISHED"));
const allFailed = computed(() => pubs.value.length > 0 && pubs.value.every((p) => p.status === "FAILED"));

function statusLabel(status: string): string {
  const map: Record<string, string> = { PENDING: "កំពុងរង់ចាំ", PROCESSING: "កំពុងផ្សាយ…", PUBLISHED: "បានផ្សាយ", FAILED: "បរាជ័យ" };
  return map[status] ?? status;
}

function statusRowClass(status: string): string {
  const map: Record<string, string> = {
    PUBLISHED: "border-emerald-200 bg-emerald-50",
    FAILED: "border-red-200 bg-red-50",
    PENDING: "border-amber-200 bg-amber-50",
    PROCESSING: "border-sky-200 bg-sky-50",
  };
  return map[status] ?? "border-slate-200 bg-slate-50";
}

function statusTextClass(status: string): string {
  const map: Record<string, string> = {
    PUBLISHED: "text-emerald-700",
    FAILED: "text-red-700",
    PENDING: "text-amber-700",
    PROCESSING: "text-sky-700",
  };
  return map[status] ?? "text-slate-600";
}

const form = reactive({
  title: "",
  titleEn: "",
  titleZh: "",
  excerpt: "",
  excerptEn: "",
  excerptZh: "",
  content: "",
  contentEn: "",
  contentZh: "",
  categoryId: "" as number | "",
  tagIds: [] as number[],
  featuredImage: "",
  isFeatured: false,
  isBreaking: false,
  galleryColumns: 3,
  publishedAt: "",
  status: "DRAFT",
});

function markDirty() { dirty.value = true; }

async function save(status: string) {
  saving.value = true;
  try {
    const payload = {
      title: form.title,
      titleEn: form.titleEn || null,
      titleZh: form.titleZh || null,
      excerpt: form.excerpt || null,
      excerptEn: form.excerptEn || null,
      excerptZh: form.excerptZh || null,
      content: form.content,
      contentEn: form.contentEn || null,
      contentZh: form.contentZh || null,
      categoryId: form.categoryId,
      tagIds: form.tagIds,
      featuredImage: form.featuredImage || null,
      isFeatured: form.isFeatured,
      isBreaking: form.isBreaking,
      galleryColumns: form.galleryColumns,
      publishedAt: form.publishedAt ? new Date(form.publishedAt).toISOString() : null,
      status,
    };
    if (isEdit.value) {
      await adminService.updateArticle(Number(route.params.id), payload);
      toast.success("បានរក្សាទុកអត្ថបទ");
      dirty.value = false;
      // Refresh the Telegram status — a publish may have enqueued a job.
      await refreshPublication();
    } else {
      const created = await adminService.createArticle(payload);
      toast.success("បានបង្កើតអត្ថបទ");
      dirty.value = false;
      router.replace(`/articles/${created.id}/edit`);
      await refreshPublication();
    }
  } catch (e) {
    toast.error(e instanceof Error ? e.message : "រក្សាទុកបរាជ័យ");
  } finally {
    saving.value = false;
  }
}

function toggleTag(id: number) {
  const i = form.tagIds.indexOf(id);
  if (i >= 0) form.tagIds.splice(i, 1);
  else form.tagIds.push(id);
}

async function loadMedia() {
  mediaPage.value = 1;
  const data = await adminService.media({ page: 1, pageSize: 24 });
  mediaItems.value = data.items;
}

async function loadMoreMedia() {
  mediaPage.value += 1;
  const data = await adminService.media({ page: mediaPage.value, pageSize: 24 });
  mediaItems.value = [...mediaItems.value, ...data.items];
}

function pickImage(url: string) {
  form.featuredImage = url;
  mediaOpen.value = false;
}

// ---------- Gallery Images ----------

const articleId = computed(() => Number(route.params.id) || 0);

async function loadGallery() {
  if (!articleId.value) return;
  try {
    galleryImages.value = await adminService.getArticleImages(articleId.value);
  } catch {
    /* ignore */
  }
}

function toggleGallerySelect(mediaId: number) {
  if (gallerySelected.value.has(mediaId)) {
    gallerySelected.value.delete(mediaId);
  } else {
    gallerySelected.value.add(mediaId);
  }
}

async function addGalleryImages() {
  if (!articleId.value || !gallerySelected.value.size) return;
  galleryAdding.value = true;
  try {
    for (const mediaId of [...gallerySelected.value]) {
      await adminService.addArticleImage(articleId.value, mediaId, galleryImages.value.length);
    }
    gallerySelected.value = new Set();
    await loadGallery();
  } catch {
    /* ignore */
  } finally {
    galleryAdding.value = false;
    mediaGalleryOpen.value = false;
  }
}

async function updateGalleryImage(img: { id: number; altText: string | null; caption: string | null; title: string | null; description: string | null; cropPosition: string | null }) {
  if (!articleId.value) return;
  try {
    await adminService.updateArticleImage(articleId.value, img.id, {
      altText: img.altText,
      caption: img.caption,
      title: img.title,
      description: img.description,
      cropPosition: img.cropPosition ?? "center",
    });
  } catch {
    /* ignore */
  }
}

async function moveGalleryImage(idx: number, dir: -1 | 1) {
  const arr = galleryImages.value;
  const j = idx + dir;
  if (j < 0 || j >= arr.length || !articleId.value) return;
  [arr[idx], arr[j]] = [arr[j], arr[idx]];
  const first = arr[idx];
  const second = arr[j];
  try {
    await Promise.all([
      adminService.updateArticleImage(articleId.value, first.id, { sortOrder: first.sortOrder }),
      adminService.updateArticleImage(articleId.value, second.id, { sortOrder: second.sortOrder }),
    ]);
  } catch {
    await loadGallery();
  }
}

async function removeGalleryImage(imageId: number) {
  if (!articleId.value) return;
  try {
    await adminService.removeArticleImage(articleId.value, imageId);
    galleryImages.value = galleryImages.value.filter((i) => i.id !== imageId);
  } catch {
    /* ignore */
  }
}

// ---------- Telegram ----------

async function refreshPublication() {
  if (!isEdit.value) return;
  try {
    pubs.value = await adminService.telegramPublication(Number(route.params.id));
    updatePolling();
  } catch {
    /* non-fatal — panel just stays as-is */
  }
}

function updatePolling() {
  const hasInflight = inFlight.value;
  if (hasInflight && !pollTimer) {
    pollTimer = setInterval(() => void refreshPublication(), 3000);
  } else if (!hasInflight && pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
}

function openSendConfirm(force: boolean) {
  resend.value = force;
  confirmOpen.value = true;
}

async function doSend() {
  if (!isEdit.value) return;
  sending.value = true;
  try {
    await adminService.sendToTelegram(Number(route.params.id), resend.value);
    toast.success("បានបញ្ចូលក្នុងជួរផ្សាយ Telegram");
    confirmOpen.value = false;
    await refreshPublication();
  } catch (e) {
    toast.error(e instanceof Error ? e.message : "ការផ្ញើបរាជ័យ");
  } finally {
    sending.value = false;
  }
}

function telegramMessageUrl(chatId: string | null, messageId: number): string {
  // @username chats resolve directly; numeric ids need the t.me/c/ form.
  if (chatId?.startsWith("@")) return `https://t.me/${chatId.slice(1)}/${messageId}`;
  return `https://t.me/c/${String(chatId ?? "").replace("-100", "")}/${messageId}`;
}

// Warn before leaving with unsaved changes
function onBeforeUnload(e: BeforeUnloadEvent) {
  if (dirty.value) {
    e.preventDefault();
  }
}

// Warn on in-app navigation via Vue Router's component guard
onBeforeRouteLeave((_to, _from, next) => {
  if (dirty.value) {
    if (confirm("អ្នកមានការកែសម្រួលមិនទាន់រក្សាទុក។ តើអ្នកប្រាកដថាចង់ចាកចេញទេ?")) {
      next();
    } else {
      next(false);
    }
  } else {
    next();
  }
});

// Track changes to form fields
watch(
  () => [form.title, form.titleEn, form.titleZh, form.excerpt, form.excerptEn, form.excerptZh, form.content, form.contentEn, form.contentZh, form.status, form.categoryId, form.isFeatured, form.isBreaking],
  () => { if (!dirty.value && isEdit.value) markDirty(); },
  { deep: true }
);

onMounted(async () => {
  categories.value = await adminService.categories().catch(() => []);
  tags.value = await adminService.tags().catch(() => []);
  if (isEdit.value) {
    const a = await adminService.article(Number(route.params.id));
    form.title = a.title;
    form.titleEn = a.titleEn ?? "";
    form.titleZh = a.titleZh ?? "";
    form.excerpt = a.excerpt ?? "";
    form.excerptEn = a.excerptEn ?? "";
    form.excerptZh = a.excerptZh ?? "";
    form.content = a.content;
    form.contentEn = a.contentEn ?? "";
    form.contentZh = a.contentZh ?? "";
    form.categoryId = a.categoryId;
    form.tagIds = a.tags.map((t) => t.id);
    form.featuredImage = a.featuredImage ?? "";
    form.isFeatured = a.isFeatured;
    form.isBreaking = a.isBreaking;
    form.galleryColumns = a.galleryColumns ?? 3;
    form.status = a.status;
    form.publishedAt = a.publishedAt ? new Date(a.publishedAt).toISOString().slice(0, 16) : "";
    await refreshPublication();
    await loadGallery();
  }
});

onMounted(() => {
  window.addEventListener("beforeunload", onBeforeUnload);
});

onUnmounted(() => {
  window.removeEventListener("beforeunload", onBeforeUnload);
  if (pollTimer) clearInterval(pollTimer);
});
</script>
