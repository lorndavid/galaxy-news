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
          <label class="label">ឈ្មោះគេហទំព័រ (ខ្មែរ)</label>
          <input v-model="form.siteName" type="text" class="input" />
        </div>
        <div>
          <label class="label">ឈ្មោះគេហទំព័រ (English)</label>
          <input v-model="form.siteNameEn" type="text" class="input" placeholder="Galaxy TV V4K" />
        </div>
        <div class="sm:col-span-2">
          <label class="label">ភាសាលំនាំដើម</label>
          <select v-model="form.defaultLanguage" class="input">
            <option value="kh">ខ្មែរ (Khmer)</option>
            <option value="en">English</option>
            <option value="zh">中文 (Chinese)</option>
          </select>
        </div>
        <div>
          <label class="label">Logo URL</label>
          <!-- text (not url): the seeded logo is a relative /assets path and the
               backend validator accepts it; type=url would block the submit -->
          <input v-model="form.logo" type="text" class="input" />
        </div>
        <div>
          <label class="label">Favicon URL</label>
          <input v-model="form.favicon" type="text" class="input" />
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
          <label class="label">ការពិពណ៌នា (ខ្មែរ)</label>
          <textarea v-model="form.description" rows="2" class="input"></textarea>
        </div>
        <div class="sm:col-span-2">
          <label class="label">ការពិពណ៌នា (English)</label>
          <textarea v-model="form.descriptionEn" rows="2" class="input" placeholder="Site description in English"></textarea>
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

      <h3 class="pt-2 text-sm font-semibold text-slate-700">ប៊ូតុងចែករំលែកអត្ថបទ</h3>
      <p class="text-xs text-slate-400">
        Template URL សម្រាប់បន្ទះចែករំលែកនៅខាងឆ្វេងទំព័រអត្ថបទ។ ប្រើ <code class="rounded bg-slate-100 px-1 font-mono text-[11px] text-slate-600">{url}</code>
        (តំណទំព័រ) និង <code class="rounded bg-slate-100 px-1 font-mono text-[11px] text-slate-600">{title}</code> (ចំណងជើង)។
      </p>
      <div class="grid gap-4 sm:grid-cols-2">
        <div>
          <label class="label">Facebook Share</label>
          <input v-model="form.shareFacebook" type="text" class="input font-mono text-xs" placeholder="https://www.facebook.com/sharer/sharer.php?u={url}" />
        </div>
        <div>
          <label class="label">TikTok Share</label>
          <input v-model="form.shareTikTok" type="text" class="input font-mono text-xs" placeholder="https://www.tiktok.com/share?url={url}" />
        </div>
        <div>
          <label class="label">Telegram Share</label>
          <input v-model="form.shareTelegram" type="text" class="input font-mono text-xs" placeholder="https://t.me/share/url?url={url}&text={title}" />
        </div>
        <div>
          <label class="label">WhatsApp Share</label>
          <input v-model="form.shareWhatsapp" type="text" class="input font-mono text-xs" placeholder="https://wa.me/?text={title} {url}" />
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
            <h3 class="text-sm font-semibold text-slate-700">ប្លង់ និង ក្រឡាចត្រង្គ</h3>
            <div class="grid gap-4 sm:grid-cols-2">
              <div>
                <label class="label">រចនាប័ទ្មប្លង់</label>
                <select v-model="form.layoutStyle" class="input">
                  <option value="boxed">Boxed (1240px)</option>
                  <option value="wide">Wide (1440px)</option>
                  <option value="fluid">Fluid (100%)</option>
                </select>
                <p class="mt-1 text-xs text-slate-400">ទទឹងកុងតឺន័ររបស់គេហទំព័រ</p>
              </div>
              <div class="grid grid-cols-2 gap-2">
                <div v-for="lay in layoutStyles" :key="lay.key" class="flex flex-col items-center gap-1.5 rounded border border-slate-200 p-2" :class="form.layoutStyle === lay.key ? 'border-brand-500 bg-brand-50' : ''">
                  <button type="button" class="w-full" @click="form.layoutStyle = lay.key" :aria-label="lay.label">
                    <div class="flex items-center justify-center gap-1 rounded-sm border border-slate-300 bg-white/60 p-1.5" :style="{ width: lay.width }">
                      <div class="h-6 flex-1 bg-slate-200"></div>
                    </div>
                  </button>
                  <span class="text-[10px] font-medium text-slate-500">{{ lay.label }}</span>
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
                  <option value="sharp">មុត (Sharp) — គ្មានជ្រុង</option>
                  <option value="minimal">តិចតួច (Minimal)</option>
                  <option value="medium">មធ្យម (Medium)</option>
                  <option value="rounded">មូល (Rounded)</option>
                </select>
              </div>
              <div>
                <label class="label">ស្រមោល</label>
                <select v-model="form.shadowPreset" class="input">
                  <option value="none">គ្មាន (None) — រាបស្មើ</option>
                  <option value="subtle">ស្រាល (Subtle)</option>
                  <option value="medium">មធ្យម (Medium)</option>
                  <option value="strong">ខ្លាំង (Strong)</option>
                </select>
              </div>
            </div>
            <p v-if="form.radiusPreset === 'sharp' && form.shadowPreset === 'none'" class="rounded bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700">
              របៀបរាបស្មើ (Flat) — គេហទំព័រទាំងមូលគ្មានជ្រុង និងស្រមោល
            </p>
          </div>
        </div>

        <!-- Live preview -->
        <div class="card overflow-hidden">
          <div class="flex items-center justify-between border-b border-slate-200 px-5 py-3">
            <h3 class="text-sm font-semibold text-slate-700">ការមើលជាមុន</h3>
            <span class="text-[11px] font-medium text-slate-400">{{ previewModeLabel }}</span>
          </div>

          <!-- Mini site mockup -->
          <div class="flex flex-col overflow-hidden" :style="{ background: color('bodyBgColor') }">
            <!-- Navbar -->
            <div :style="{ background: color('headerBgColor') }">
              <div class="mx-auto flex items-center justify-between px-3 py-2" :style="{ maxWidth: previewContainerWidth }">
                <div class="flex items-center gap-1.5">
                  <span class="text-xs font-bold" :style="{ color: color('headerTextColor') }">LOGO</span>
                </div>
                <div class="hidden gap-2 sm:flex">
                  <span v-for="n in 3" :key="n" class="text-[10px] font-medium" :style="{ color: color('headerTextColor') }">{{ n === 2 ? 'Navbar' : 'Menu' }}</span>
                </div>
                <span class="flex h-5 w-5 items-center justify-center text-[9px]" :style="{ background: color('primaryColor'), color: '#fff' }">
                  <span aria-hidden="true">⌕</span>
                </span>
              </div>
            </div>

            <!-- Body: cards -->
            <div class="mx-auto w-full flex-1 px-3 py-3" :style="{ maxWidth: previewContainerWidth }">
              <span class="inline-block px-2 py-0.5 text-[10px] font-semibold text-white" :style="{ background: color('primaryColor') }">បន្ទាន់</span>
              <h2 class="mt-2 font-bold leading-snug" :style="{ color: color('textColor'), fontSize: Math.min(num('fontSizeHero'), 26) + 'px' }">
                ចំណងជើងព័ត៌មានសំខាន់ប្រចាំថ្ងៃ
              </h2>
              <p class="mt-1" :style="{ color: color('mutedTextColor'), fontSize: '12px' }">
                អត្ថបទពិពណ៌នាខ្លីសម្រាប់ការមើលជាមុននៃរូបរាងគេហទំព័រ។
              </p>
              <div
                class="mt-3 inline-block py-1.5 pl-3 pr-3"
                :style="{
                  borderRadius: radiusNum(),
                  boxShadow: shadowValue(),
                  background: color('primaryColor'),
                  color: '#fff',
                  fontSize: '11px',
                  fontWeight: 600,
                }"
              >
                ប៊ូតុងសាកល្បង
              </div>
              <div class="mt-4 grid grid-cols-3 gap-2">
                <div
                  v-for="i in 3"
                  :key="i"
                  class="h-14"
                  :style="{
                    borderRadius: radiusNum(),
                    boxShadow: shadowValue(),
                    background: color('surfaceColor'),
                    border: '1px solid ' + color('borderColor'),
                  }"
                ></div>
              </div>
              <div class="mt-3 flex gap-2">
                <div
                  v-for="i in 4"
                  :key="'b' + i"
                  class="h-8 flex-1"
                  :style="{
                    borderRadius: radiusNum(),
                    boxShadow: shadowValue(),
                    background: color('surfaceColor'),
                    border: '1px solid ' + color('borderColor'),
                  }"
                ></div>
              </div>
            </div>

            <!-- Footer -->
            <div :style="{ background: color('footerBgColor') }">
              <div class="mx-auto flex items-center justify-between px-3 py-3" :style="{ maxWidth: previewContainerWidth }">
                <div class="flex flex-col gap-1">
                  <span class="text-[10px] font-bold" :style="{ color: color('footerTextColor') }">Footer</span>
                  <span class="flex gap-1.5">
                    <i v-for="s in 3" :key="s" class="h-3 w-3" :style="{ background: color('accentColor') }"></i>
                  </span>
                </div>
                <span class="text-[9px]" :style="{ color: mixFooter(color('footerTextColor'), 0.62) }">Link · Link · Link</span>
              </div>
            </div>
          </div>

          <div class="border-t border-slate-200 px-5 py-3">
            <p class="text-[11px] leading-relaxed text-slate-400">
              Navbar & Footer colors are controlled by header/footer settings above.
              Radius & shadow reflect the presets — "sharp + none" renders a fully flat site.
            </p>
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
  { key: "surfaceColor", label: "ផ្ទៃកាត" },
  { key: "textColor", label: "ពណ៌អក្សរ" },
  { key: "mutedTextColor", label: "អក្សរស្រអែម" },
  { key: "borderColor", label: "ពណ៌បន្ទាត់" },
  { key: "bodyBgColor", label: "ផ្ទៃខាងក្រោយទំព័រ" },
  { key: "headerBgColor", label: "ផ្ទៃ Navbar" },
  { key: "headerTextColor", label: "អក្សរ Navbar" },
  { key: "footerBgColor", label: "ផ្ទៃ Footer" },
  { key: "footerTextColor", label: "អក្សរ Footer" },
] as const;

const layoutStyles = [
  { key: "boxed", label: "Boxed", width: "100%" },
  { key: "wide", label: "Wide", width: "92%" },
  { key: "fluid", label: "Fluid", width: "100%" },
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
  siteName: "", siteNameEn: "", logo: "", favicon: "", description: "", descriptionEn: "", defaultLanguage: "kh",
  facebook: "", telegram: "", youtube: "", tiktok: "", instagram: "", twitter: "",
  contactEmail: "", contactPhone: "", address: "",
  shareFacebook: "https://www.facebook.com/sharer/sharer.php?u={url}",
  shareTikTok: "https://www.tiktok.com/share?url={url}",
  shareTelegram: "https://t.me/share/url?url={url}&text={title}",
  shareWhatsapp: "https://wa.me/?text={title} {url}",
  // appearance
  primaryColor: "#0d3fa9", secondaryColor: "#0b1c39", accentColor: "#fc3f00",
  surfaceColor: "#ffffff", textColor: "#0b1c39", mutedTextColor: "#667085", borderColor: "#e5e7eb",
  bodyBgColor: "#f8f7f4", headerBgColor: "#ffffff", headerTextColor: "#0b1c39",
  footerBgColor: "#0b1c39", footerTextColor: "#ffffff",
  layoutStyle: "boxed",
  fontHeading: "Noto Sans Khmer", fontBody: "Noto Sans Khmer", fontArticle: "Noto Sans Khmer",
  fontSizeHero: 36, fontSizeSection: 24, fontSizeCard: 18, fontSizeBody: 16,
  radiusPreset: "sharp", shadowPreset: "none",
} as Record<string, string | number>);

const color = (k: string) => String(form[k]);
const num = (k: string) => Number(form[k]);

const R = { sharp: "0px", minimal: "4px", medium: "10px", rounded: "16px" } as const;
const S = {
  none: "none",
  subtle: "0 2px 8px rgba(11, 28, 57, 0.06)",
  medium: "0 6px 20px rgba(11, 28, 57, 0.10)",
  strong: "0 12px 32px rgba(11, 28, 57, 0.16)",
} as const;

const radiusNum = () => R[color("radiusPreset") as keyof typeof R] ?? "0px";
const shadowValue = () => S[color("shadowPreset") as keyof typeof S] ?? "none";

function hexToRgb(hex: string) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return { r: 0, g: 0, b: 0 };
  const n = parseInt(m[1], 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function mixFooter(hex: string, weight: number) {
  const c = hexToRgb(hex);
  return `rgba(${c.r}, ${c.g}, ${c.b}, ${weight})`;
}

const previewContainerWidth = computed(() => {
  const layout = color("layoutStyle");
  if (layout === "wide") return "560px";
  if (layout === "fluid") return "100%";
  return "480px";
});

const previewModeLabel = computed(() => {
  const layout = String(form.layoutStyle);
  const flat = form.radiusPreset === "sharp" && form.shadowPreset === "none";
  return `${layout} · ${flat ? "flat" : "styled"}`;
});

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
