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
          <div class="flex items-center gap-3">
            <img
              :src="form.featuredImage ?? '/assets/img/news/KH.jpg'"
              alt=""
              class="h-16 w-24 rounded-lg border border-slate-200 object-cover"
            />
            <div class="space-y-2">
              <button type="button" class="btn-secondary !py-1.5 text-xs" @click="mediaOpen = true">
                <ImageIcon class="h-3.5 w-3.5" /> ជ្រើសរើសរូបភាព
              </button>
              <button
                v-if="form.featuredImage"
                type="button"
                class="btn-ghost !py-1.5 text-xs text-red-600"
                @click="form.featuredImage = ''"
              >លុប</button>
            </div>
          </div>
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
    </div>

    <!-- Media picker -->
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
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { CheckCircle, Save, Image as ImageIcon } from "lucide-vue-next";
import { adminService } from "@/services/admin.service";
import { useToastStore } from "@/stores/toast";
import RichTextEditor from "@/components/editor/RichTextEditor.vue";
import Modal from "@/components/ui/Modal.vue";
import type { Category, Media, Tag } from "@/types";

const route = useRoute();
const router = useRouter();
const toast = useToastStore();

const isEdit = computed(() => !!route.params.id);

// (computed imported above)
const categories = ref<Category[]>([]);
const tags = ref<Tag[]>([]);
const mediaItems = ref<Media[]>([]);
const mediaPage = ref(1);
const mediaOpen = ref(false);
const saving = ref(false);

const form = reactive({
  title: "",
  titleEn: "",
  excerpt: "",
  excerptEn: "",
  content: "",
  contentEn: "",
  categoryId: "" as number | "",
  tagIds: [] as number[],
  featuredImage: "",
  isFeatured: false,
  isBreaking: false,
  publishedAt: "",
  status: "DRAFT",
});

async function save(status: string) {
  saving.value = true;
  try {
    const payload = {
      title: form.title,
      titleEn: form.titleEn || null,
      excerpt: form.excerpt || null,
      excerptEn: form.excerptEn || null,
      content: form.content,
      contentEn: form.contentEn || null,
      categoryId: form.categoryId,
      tagIds: form.tagIds,
      featuredImage: form.featuredImage || null,
      isFeatured: form.isFeatured,
      isBreaking: form.isBreaking,
      publishedAt: form.publishedAt ? new Date(form.publishedAt).toISOString() : null,
      status,
    };
    if (isEdit.value) {
      await adminService.updateArticle(Number(route.params.id), payload);
      toast.success("បានរក្សាទុកអត្ថបទ");
    } else {
      const created = await adminService.createArticle(payload);
      toast.success("បានបង្កើតអត្ថបទ");
      router.replace(`/articles/${created.id}/edit`);
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

onMounted(async () => {
  categories.value = await adminService.categories().catch(() => []);
  tags.value = await adminService.tags().catch(() => []);
  if (isEdit.value) {
    const a = await adminService.article(Number(route.params.id));
    form.title = a.title;
    form.titleEn = a.titleEn ?? "";
    form.excerpt = a.excerpt ?? "";
    form.excerptEn = a.excerptEn ?? "";
    form.content = a.content;
    form.contentEn = a.contentEn ?? "";
    form.categoryId = a.categoryId;
    form.tagIds = a.tags.map((t) => t.id);
    form.featuredImage = a.featuredImage ?? "";
    form.isFeatured = a.isFeatured;
    form.isBreaking = a.isBreaking;
    form.status = a.status;
    form.publishedAt = a.publishedAt ? new Date(a.publishedAt).toISOString().slice(0, 16) : "";
  }
});
</script>
