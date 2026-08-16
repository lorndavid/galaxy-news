<template>
  <div class="space-y-5">
    <!-- Tabs -->
    <div class="flex gap-1 border-b border-slate-200">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        class="border-b-2 px-4 py-2.5 text-sm font-medium transition-colors"
        :class="activeTab === tab.key ? 'border-brand-600 text-brand-600' : 'border-transparent text-slate-500 hover:text-slate-700'"
        @click="activeTab = tab.key"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- ============ GENERAL ============ -->
    <form v-if="activeTab === 'general'" class="card max-w-2xl space-y-4 p-6" @submit.prevent="save">
      <h3 class="text-sm font-semibold text-slate-700">ព័ត៌មានគេហទំព័រ</h3>
      <div class="grid gap-4 sm:grid-cols-2">
        <div>
          <label class="label">ឈ្មោះគេហទំព័រ</label>
          <input v-model="form.siteName" type="text" class="input" />
        </div>
        <div>
          <label class="label">Logo URL</label>
          <input v-model="form.logo" type="url" class="input" />
        </div>
        <div>
          <label class="label">Favicon URL</label>
          <input v-model="form.favicon" type="url" class="input" />
        </div>
        <div>
          <label class="label">អ៊ីមែលទំនាក់ទំនង</label>
          <input v-model="form.contactEmail" type="email" class="input" />
        </div>
        <div>
          <label class="label">ទូរស័ព្ទទំនាក់ទំនង</label>
          <input v-model="form.contactPhone" type="text" class="input" />
        </div>
        <div class="sm:col-span-2">
          <label class="label">អាសយដ្ឋាន</label>
          <input v-model="form.address" type="text" class="input" />
        </div>
        <div class="sm:col-span-2">
          <label class="label">ការពិពណ៌នា</label>
          <textarea v-model="form.description" rows="2" class="input"></textarea>
        </div>
      </div>

      <h3 class="pt-2 text-sm font-semibold text-slate-700">បណ្តាញសង្គម</h3>
      <div class="grid gap-4 sm:grid-cols-3">
        <div>
          <label class="label">Facebook</label>
          <input v-model="form.facebook" type="url" class="input" />
        </div>
        <div>
          <label class="label">Telegram</label>
          <input v-model="form.telegram" type="url" class="input" />
        </div>
        <div>
          <label class="label">YouTube</label>
          <input v-model="form.youtube" type="url" class="input" />
        </div>
        <div>
          <label class="label">TikTok</label>
          <input v-model="form.tiktok" type="url" class="input" />
        </div>
        <div>
          <label class="label">Instagram</label>
          <input v-model="form.instagram" type="url" class="input" />
        </div>
        <div>
          <label class="label">Twitter / X</label>
          <input v-model="form.twitter" type="url" class="input" />
        </div>
      </div>
      <button type="submit" class="btn-primary" :disabled="saving">រក្សាទុកការកំណត់</button>
    </form>

    <!-- ============ APPEARANCE ============ -->
    <form v-if="activeTab === 'appearance'" class="space-y-5" @submit.prevent="save">
      <div class="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <!-- Controls -->
        <div class="space-y-5">
          <div class="card space-y-4 p-5">
            <h3 class="text-sm font-semibold text-slate-700">ពណ៌រូបរាង</h3>
            <div class="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <div v-for="c in colorFields" :key="c.key">
                <label class="label">{{ c.label }}</label>
                <div class="flex items-center gap-2">
                  <input v-model="form[c.key]" type="color" class="h-9 w-10 shrink-0 cursor-pointer rounded border border-slate-300" />
                  <input v-model="form[c.key]" type="text" class="input font-mono text-xs" />
                </div>
              </div>
            </div>
          </div>

          <div class="card space-y-4 p-5">
            <h3 class="text-sm font-semibold text-slate-700">ពុម្ពអក្សរ</h3>
            <div class="grid gap-4 sm:grid-cols-2">
              <div v-for="f in fontFields" :key="f.key">
                <label class="label">{{ f.label }}</label>
                <select v-model="form[f.key]" class="input">
                  <option v-for="opt in fontChoices" :key="opt" :value="opt">{{ opt }}</option>
                </select>
              </div>
            </div>
          </div>

          <div class="card space-y-4 p-5">
            <h3 class="text-sm font-semibold text-slate-700">ទំហំពុម្ពអក្សរ (px)</h3>
            <div class="grid gap-4 sm:grid-cols-2">
              <div v-for="s in sizeFields" :key="s.key">
                <label class="label">{{ s.label }} ({{ s.min }}–{{ s.max }})</label>
                <input v-model.number="form[s.key]" type="number" class="input" :min="s.min" :max="s.max" />
              </div>
            </div>
          </div>

          <div class="card space-y-4 p-5">
            <h3 class="text-sm font-semibold text-slate-700">ជ្រុង និង ស្រមោល</h3>
            <div class="grid gap-4 sm:grid-cols-2">
              <div>
                <label class="label">ជ្រុងកាត</label>
                <select v-model="form.radiusPreset" class="input">
                  <option value="sharp">មុត (Sharp)</option>
                  <option value="minimal">តិចតួច (Minimal)</option>
                  <option value="medium">មធ្យម (Medium)</option>
                  <option value="rounded">មូល (Rounded)</option>
                </select>
              </div>
              <div>
                <label class="label">ស្រមោល</label>
                <select v-model="form.shadowPreset" class="input">
                  <option value="none">គ្មាន (None)</option>
                  <option value="subtle">ស្រាល (Subtle)</option>
                  <option value="medium">មធ្យម (Medium)</option>
                  <option value="strong">ខ្លាំង (Strong)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <!-- Live preview -->
        <div class="card overflow-hidden">
          <div class="border-b border-slate-200 px-5 py-3">
            <h3 class="text-sm font-semibold text-slate-700">ការមើលជាមុន</h3>
          </div>
          <div class="p-5" :style="previewStyle">
            <span class="inline-block rounded px-2 py-0.5 text-xs font-semibold text-white" :style="{ background: color('primaryColor') }">បន្ទាន់</span>
            <h2 class="mt-3 font-bold leading-snug" :style="{ color: color('textColor'), fontSize: Math.min(num('fontSizeHero'), 30) + 'px' }">
              ចំណងជើងព័ត៌មានសំខាន់ប្រចាំថ្ងៃ
            </h2>
            <p class="mt-2" :style="{ color: color('mutedTextColor'), fontSize: '14px' }">
              អត្ថបទពិពណ៌នាខ្លីសម្រាប់ការមើលជាមុននៃរូបរាងគេហទំព័រ។
            </p>
            <div class="mt-4" :style="{ borderRadius: color('radiusPreset') === 'rounded' ? '999px' : color('radiusPreset') === 'medium' ? '10px' : color('radiusPreset') === 'minimal' ? '4px' : '0', background: color('primaryColor'), color: '#fff', padding: '8px 16px', display: 'inline-block', fontSize: '13px', fontWeight: 600 }">
              ប៊ូតុងសាកល្បង
            </div>
            <div class="mt-5 grid grid-cols-3 gap-2">
              <div
                v-for="i in 3"
                :key="i"
                class="h-16"
                :style="{ borderRadius: color('radiusPreset') === 'rounded' ? '12px' : color('radiusPreset') === 'medium' ? '8px' : color('radiusPreset') === 'minimal' ? '3px' : '0', background: '#f1f5f9', border: '1px solid ' + color('borderColor') }"
              ></div>
            </div>
          </div>
        </div>
      </div>
      <button type="submit" class="btn-primary" :disabled="saving">រក្សាទុករូបរាង</button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { adminService } from "@/services/admin.service";
import { useToastStore } from "@/stores/toast";

const toast = useToastStore();
const saving = ref(false);
const activeTab = ref<"general" | "appearance">("general");

const tabs = [
  { key: "general", label: "ទូទៅ" },
  { key: "appearance", label: "រូបរាង" },
] as const;

const fontChoices = [
  "Noto Sans Khmer",
  "Kantumruy",
  "Roboto",
  "Inter",
  "Source Sans 3",
  "Lato",
  "Merriweather",
  "Playfair Display",
  "DM Sans",
  "Plus Jakarta Sans",
];

const colorFields = [
  { key: "primaryColor", label: "ពណ៌ចម្បង" },
  { key: "secondaryColor", label: "ពណ៌បន្ទាប់បន្សំ" },
  { key: "accentColor", label: "ពណ៌សង្កត់" },
  { key: "surfaceColor", label: "ផ្ទៃខាងក្រោយ" },
  { key: "textColor", label: "ពណ៌អក្សរ" },
  { key: "mutedTextColor", label: "អក្សរស្រអែម" },
  { key: "borderColor", label: "ពណ៌បន្ទាត់" },
] as const;

const fontFields = [
  { key: "fontHeading", label: "ពុម្ពចំណងជើង" },
  { key: "fontBody", label: "ពុម្ពអត្ថបទធម្មតា" },
  { key: "fontArticle", label: "ពុម្ពអត្ថបទអត្ថបទ" },
] as const;

const sizeFields = [
  { key: "fontSizeHero", label: "ចំណងជើង Hero", min: 20, max: 64 },
  { key: "fontSizeSection", label: "ចំណងជើងផ្នែក", min: 16, max: 40 },
  { key: "fontSizeCard", label: "ចំណងជើងកាត", min: 14, max: 28 },
  { key: "fontSizeBody", label: "អត្ថបទខ្លួន", min: 14, max: 22 },
] as const;

const form = reactive({
  // general
  siteName: "", logo: "", favicon: "", description: "",
  facebook: "", telegram: "", youtube: "", tiktok: "", instagram: "", twitter: "",
  contactEmail: "", contactPhone: "", address: "",
  // appearance
  primaryColor: "#0d3fa9", secondaryColor: "#0b1c39", accentColor: "#fc3f00",
  surfaceColor: "#ffffff", textColor: "#0b1c39", mutedTextColor: "#667085", borderColor: "#e5e7eb",
  fontHeading: "Noto Sans Khmer", fontBody: "Noto Sans Khmer", fontArticle: "Noto Sans Khmer",
  fontSizeHero: 36, fontSizeSection: 24, fontSizeCard: 18, fontSizeBody: 16,
  radiusPreset: "medium", shadowPreset: "subtle",
} as Record<string, string | number>);

const color = (k: string) => String(form[k]);
const num = (k: string) => Number(form[k]);

const previewStyle = computed(() => ({
  background: color("surfaceColor"),
  border: `1px solid ${color("borderColor")}`,
  borderRadius: "12px",
}));

async function load() {
  const s = await adminService.settings();
  const keys = Object.keys(form) as (keyof typeof form)[];
  for (const k of keys) {
    const v = s[k as keyof typeof s];
    if (v !== undefined && v !== null) form[k] = v as never;
  }
}

async function save() {
  saving.value = true;
  try {
    await adminService.updateSettings({ ...form });
    toast.success("បានរក្សាទុកការកំណត់");
  } catch (e) {
    toast.error(e instanceof Error ? e.message : "រក្សាទុកបរាជ័យ");
  } finally {
    saving.value = false;
  }
}

onMounted(load);
</script>
