<template>
  <div class="mx-auto grid max-w-5xl gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
    <!-- ─── Section list ─── -->
    <div class="card overflow-hidden">
      <div class="border-b border-slate-200 px-5 py-4">
        <h3 class="text-sm font-semibold text-slate-700">អ្នកបង្កើតទំព័រដើម</h3>
        <p class="mt-0.5 text-xs text-slate-400">
          បើក/បិទ រៀបតាមលំដាប់ និងកែប្លង់ក្រឡាចត្រង្គនៃផ្នែកនីមួយៗ។
        </p>
      </div>

      <div v-if="loading" class="p-8 text-center text-sm text-slate-400">កំពុងផ្ទុក...</div>
      <div v-else-if="error" class="p-8 text-center">
        <p class="text-sm text-red-600">{{ error }}</p>
        <button class="btn-secondary mt-3 !py-1.5 text-xs" @click="load">{{ prefs.t('common.retry') }}</button>
      </div>

      <template v-else>
        <div class="divide-y divide-slate-100">
          <div v-for="(s, i) in sections" :key="s.key" class="px-5 py-3" :class="{ 'opacity-50': !s.enabled }">
            <div class="flex items-center gap-3">
              <!-- drag handle -->
              <span class="cursor-grab text-slate-300" title="អូសដើម្បីផ្លាស់ទី" aria-hidden="true">
                <GripVertical class="h-4 w-4" />
              </span>
              <div class="min-w-0 flex-1">
                <p class="font-medium text-slate-700">{{ s.label }}</p>
                <p class="font-mono text-xs text-slate-400">{{ s.key }}</p>
              </div>
              <!-- layout preview chip -->
              <span v-if="s.config" class="hidden rounded bg-slate-100 px-2 py-1 text-[10px] font-medium text-slate-500 sm:inline-flex" :title="configSummary(s.config)">
                {{ layoutTypeOf(s.config) ? layoutLabel(layoutTypeOf(s.config)) : (columnsOf(s.config) ? `${columnsOf(s.config)} cols` : "") }}{{ s.config?.sidebar !== undefined ? `${columnsOf(s.config) || layoutTypeOf(s.config) ? " · " : ""}${s.config.sidebar ? "sidebar ✓" : "full ✓"}` : "" }}
              </span>
              <button class="btn-ghost !p-1.5" title="កែប្លង់" :class="{ 'text-brand-600': editing === s.key }" @click="toggleEdit(s.key)">
                <LayoutGrid class="h-4 w-4" />
              </button>
              <div class="flex items-center gap-1">
                <button class="btn-ghost !p-1.5" :disabled="i === 0" title="ផ្លាស់ទីឡើងលើ" @click="move(i, -1)">
                  <ChevronUp class="h-4 w-4" />
                </button>
                <button class="btn-ghost !p-1.5" :disabled="i === sections.length - 1" title="ផ្លាស់ទីចុះក្រោម" @click="move(i, 1)">
                  <ChevronDown class="h-4 w-4" />
                </button>
              </div>
              <!-- toggle -->
              <button
                role="switch"
                :aria-checked="s.enabled"
                :aria-label="`បើក/បិទ ${s.label}`"
                class="relative h-6 w-11 shrink-0 rounded-full transition-colors"
                :class="s.enabled ? 'bg-emerald-500' : 'bg-slate-300'"
                @click="toggle(s)"
              >
                <span
                  class="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all"
                  :class="s.enabled ? 'left-[22px]' : 'left-0.5'"
                ></span>
              </button>
            </div>

            <!-- Grid config editor -->
            <Transition name="builder-fade">
              <div v-if="editing === s.key" class="mt-3 rounded border border-slate-200 bg-slate-50 p-4">
                <div class="flex flex-wrap items-end gap-4">
                  <div v-if="supports(s.key, 'columns')">
                    <label class="label">ចំនួនជួរឈរ</label>
                    <div class="flex gap-1.5">
                      <button
                        v-for="n in [2, 3, 4, 5, 6]"
                        :key="n"
                        type="button"
                        class="h-8 w-8 rounded border text-xs font-semibold transition-colors"
                        :class="columnsOf(s.config) === n ? 'border-brand-600 bg-brand-600 text-white' : 'border-slate-300 bg-white text-slate-600 hover:border-brand-400'"
                        @click="setColumns(s, n)"
                      >
                        {{ n }}
                      </button>
                    </div>
                  </div>

                  <div v-if="supports(s.key, 'sidebar')">
                    <label class="label">របារចំហៀង</label>
                    <button
                      type="button"
                      class="flex items-center gap-2 rounded border px-3 py-1.5 text-xs font-medium transition-colors"
                      :class="sidebarOf(s.config!) ? 'border-brand-600 bg-brand-600 text-white' : 'border-slate-300 bg-white text-slate-600'"
                      @click="s.config = { ...s.config, sidebar: !sidebarOf(s.config) }"
                    >
                      <CheckSquare v-if="sidebarOf(s.config)" class="h-3.5 w-3.5" />
                      <Square v-else class="h-3.5 w-3.5" />
                      {{ sidebarOf(s.config) ? "បង្ហាញ" : "លាក់" }}
                    </button>
                  </div>

                  <div v-if="supports(s.key, 'left')">
                    <label class="label">ជួរឈរខាងឆ្វេង</label>
                    <button
                      type="button"
                      class="flex items-center gap-2 rounded border px-3 py-1.5 text-xs font-medium transition-colors"
                      :class="leftOf(s.config) ? 'border-brand-600 bg-brand-600 text-white' : 'border-slate-300 bg-white text-slate-600'"
                      @click="s.config = { ...s.config, left: !leftOf(s.config) }"
                    >
                      <CheckSquare v-if="leftOf(s.config)" class="h-3.5 w-3.5" />
                      <Square v-else class="h-3.5 w-3.5" />
                      {{ leftOf(s.config) ? "បង្ហាញ" : "លាក់" }}
                    </button>
                  </div>

                  <!-- Layout type selector (for category sections) -->
                  <div v-if="s.key.startsWith('cat-')" class="w-full">
                    <label class="label">ប្លង់បង្ហាញ (Editorial Layout)</label>
                    <select
                      class="input !py-1.5 text-xs"
                      :value="layoutTypeOf(s.config)"
                      @change="setLayoutType(s, ($event.target as HTMLSelectElement).value)"
                    >
                      <option value="">Auto (រៀបចំដោយស្វ័យប្រវត្តិ)</option>
                      <option value="editorial-hero">Hero — Large feature + sidebar</option>
                      <option value="editorial-split">Split — 50/50 layout</option>
                      <option value="editorial-mosaic">Mosaic — Creative grid</option>
                      <option value="editorial-three-col">3-Column — Standard grid</option>
                      <option value="editorial-compact">Compact — 4-column grid</option>
                      <option value="editorial-horizontal">Horizontal — Cards with text</option>
                      <option value="editorial-list">List — Clean editorial list</option>
                      <option value="editorial-feature-compact">Feature + Compact — Large + sidebar</option>
                      <option value="editorial-magazine">Magazine — Mosaic + stacked</option>
                      <option value="editorial-minimal">Minimal — Full-width cards</option>
                    </select>
                  </div>

                  <!-- Article limit selector -->
                  <div>
                    <label class="label">ចំនួនអត្ថបទ</label>
                    <div class="flex gap-1.5">
                      <button
                        v-for="n in [3, 4, 5, 6, 8, 10]"
                        :key="n"
                        type="button"
                        class="h-8 w-8 rounded border text-xs font-semibold transition-colors"
                        :class="articleLimitOf(s.config) === n ? 'border-brand-600 bg-brand-600 text-white' : 'border-slate-300 bg-white text-slate-600 hover:border-brand-400'"
                        @click="setArticleLimit(s, n)"
                      >
                        {{ n }}
                      </button>
                    </div>
                  </div>

                  <div class="ml-auto text-right">
                    <span class="label mb-1 block">ការមើលជាមុន</span>
                    <div class="flex h-12 items-center gap-1">
                      <template v-if="supports(s.key, 'sidebar')">
                        <div class="flex h-full flex-1 gap-1">
                          <div v-if="leftOf(s.config)" class="w-8 bg-slate-200"></div>
                          <div class="flex-1 bg-slate-300"></div>
                          <div v-if="sidebarOf(s.config)" class="w-8 bg-slate-200"></div>
                        </div>
                      </template>
                      <div v-else class="flex h-full flex-1 gap-1">
                        <div
                          v-for="n in Math.min(6, columnsOf(s.config) || 4)"
                          :key="n"
                          class="flex-1"
                          :class="n === 4 ? 'bg-brand-200' : 'bg-slate-300'"
                        ></div>
                      </div>
                    </div>
                    <p class="mt-1 text-[10px] text-slate-400">រូបភាពតូចនៃប្លង់</p>
                  </div>
                </div>
                <div class="mt-3 flex items-center justify-between border-t border-slate-200 pt-3">
                  <button type="button" class="text-xs font-medium text-slate-400 hover:text-slate-600" @click="resetConfig(s)">
                    កំណត់ស្តង់ដារ
                  </button>
                  <button type="button" class="btn-primary !py-1.5 text-xs" @click="editing = null">
                    រួចរាល់
                  </button>
                </div>
              </div>
            </Transition>
          </div>
        </div>

        <div class="flex items-center justify-between border-t border-slate-200 px-5 py-4">
          <p v-if="dirty" class="text-xs text-amber-600">មានការផ្លាស់ប្តូរមិនទាន់រក្សាទុក</p>
          <p v-else class="text-xs text-slate-400">បានរក្សាទុក</p>
          <button class="btn-primary !py-1.5 text-xs" :disabled="!dirty || saving" @click="save">
            {{ saving ? "កំពុងរក្សាទុក..." : "រក្សាទុកការផ្លាស់ប្តូរ" }}
          </button>
        </div>
      </template>
    </div>

    <!-- ─── Layout help ─── -->
    <div class="space-y-4">
      <div class="card p-5">
        <h3 class="flex items-center gap-2 text-sm font-semibold text-slate-700">
          <LayoutGrid class="h-4 w-4 text-brand-600" /> ប្លង់ Grid
        </h3>
        <p class="mt-2 text-xs leading-relaxed text-slate-500">
          ផ្នែកនីមួយៗអាចកំណត់ចំនួនជួរឈរ (2–6) សម្រាប់ក្រឡាចត្រង្គកាត។
          Hero អាចបើក/បិទរបារចំហៀង។ ការផ្លាស់ប្តូរមានប្រសិទ្ធភាពភ្លាមៗនៅលើទំព័រដើម។
        </p>
      </div>
      <div class="card p-5">
        <h3 class="flex items-center gap-2 text-sm font-semibold text-slate-700">
          <Info class="h-4 w-4 text-brand-600" /> គន្លឹះ
        </h3>
        <ul class="mt-2 space-y-1.5 text-xs leading-relaxed text-slate-500">
          <li class="flex gap-1.5"><PlusCircle class="h-3.5 w-3.5 shrink-0 text-emerald-500" /> បន្ថែមជួរឈរ = បង្ហាញកាតច្រើនទៀត</li>
          <li class="flex gap-1.5"><MinusCircle class="h-3.5 w-3.5 shrink-0 text-amber-500" /> កាត់បន្ថយជួរឈរ = កាតធំជាង</li>
          <li class="flex gap-1.5"><PanelLeft class="h-3.5 w-3.5 shrink-0 text-slate-400" /> Hero sidebar បង្ហាញអត្ថបទថ្មីៗ</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import {
  CheckSquare,
  ChevronDown,
  ChevronUp,
  GripVertical,
  Info,
  LayoutGrid,
  MinusCircle,
  PanelLeft,
  PlusCircle,
  Square,
} from "lucide-vue-next";
import { adminService } from "@/services/admin.service";
import { useToastStore } from "@/stores/toast";
import type { HomepageSection, HomepageSectionConfig } from "@/types";
import { usePreferencesStore } from "@/stores/preferences";

const toast = useToastStore();
const prefs = usePreferencesStore();
const sections = ref<HomepageSection[]>([]);
const loading = ref(false);
const error = ref("");
const saving = ref(false);
const dirty = ref(false);
const editing = ref<string | null>(null);

/** Sections that accept a `columns` grid option. */
const COLUMN_KEYS = new Set(["weekly", "whats-new", "video", "recent"]);
/** Sections that accept a `sidebar` toggle. */
const SIDEBAR_KEYS = new Set(["hero"]);
/** Sections that accept a `left` rail toggle. */
const LEFT_KEYS = new Set(["hero"]);

function supports(key: string, option: "columns" | "sidebar" | "left"): boolean {
  if (option === "columns") return COLUMN_KEYS.has(key);
  if (option === "sidebar") return SIDEBAR_KEYS.has(key);
  return LEFT_KEYS.has(key);
}

function columnsOf(c: HomepageSectionConfig | null | undefined): number | undefined {
  return c?.columns;
}

function sidebarOf(c: HomepageSectionConfig | null | undefined): boolean {
  return c?.sidebar ?? true;
}

function leftOf(c: HomepageSectionConfig | null | undefined): boolean {
  return c?.left ?? true;
}

function configSummary(c: HomepageSectionConfig | null): string {
  if (!c) return "";
  const parts: string[] = [];
  if (c.layoutType) parts.push(c.layoutType);
  if (c.columns) parts.push(`${c.columns} ជួរ`);
  if (c.sidebar !== undefined) parts.push(c.sidebar ? "sidebar" : "full");
  if (c.left !== undefined) parts.push(c.left ? "left" : "no-left");
  if (c.articleLimit) parts.push(`${c.articleLimit} articles`);
  return parts.join(" · ");
}

const LAYOUT_LABELS: Record<string, string> = {
  "editorial-hero": "Hero",
  "editorial-split": "Split",
  "editorial-mosaic": "Mosaic",
  "editorial-three-col": "3-Col",
  "editorial-compact": "Compact",
  "editorial-horizontal": "Horizontal",
  "editorial-list": "List",
  "editorial-feature-compact": "Feature+List",
  "editorial-magazine": "Magazine",
  "editorial-minimal": "Minimal",
};
function layoutLabel(key: string): string {
  return LAYOUT_LABELS[key] ?? key;
}

function toggleEdit(key: string) {
  editing.value = editing.value === key ? null : key;
}

function setColumns(s: HomepageSection, n: number) {
  s.config = { ...(s.config ?? {}), columns: n };
  dirty.value = true;
}

function layoutTypeOf(c: HomepageSectionConfig | null | undefined): string {
  return c?.layoutType ?? "";
}

function setLayoutType(s: HomepageSection, value: string) {
  s.config = { ...(s.config ?? {}), layoutType: value || undefined } as HomepageSectionConfig;
  dirty.value = true;
}

function articleLimitOf(c: HomepageSectionConfig | null | undefined): number {
  return c?.articleLimit ?? 6;
}

function setArticleLimit(s: HomepageSection, n: number) {
  s.config = { ...(s.config ?? {}), articleLimit: n };
  dirty.value = true;
}

function resetConfig(s: HomepageSection) {
  s.config = null;
  dirty.value = true;
}

async function load() {
  loading.value = true;
  error.value = "";
  try {
    sections.value = await adminService.homepageSections();
    dirty.value = false;
  } catch (e) {
    error.value = e instanceof Error ? e.message : "ផ្ទុកទិន្នន័យបរាជ័យ";
  } finally {
    loading.value = false;
  }
}

function toggle(s: HomepageSection) {
  s.enabled = !s.enabled;
  dirty.value = true;
}

function move(i: number, dir: -1 | 1) {
  const j = i + dir;
  if (j < 0 || j >= sections.value.length) return;
  const arr = sections.value;
  [arr[i], arr[j]] = [arr[j], arr[i]];
  arr.forEach((s, idx) => (s.sortOrder = idx + 1));
  dirty.value = true;
}

async function save() {
  saving.value = true;
  try {
    await adminService.updateHomepageSections(
      sections.value.map((s) => ({ key: s.key, enabled: s.enabled, label: s.label, config: s.config ?? null }))
    );
    await adminService.reorderHomepageSections(
      sections.value.map((s) => ({ key: s.key, sortOrder: s.sortOrder }))
    );
    toast.success("បានរក្សាទុកការរៀបចំទំព័រដើម");
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
.builder-fade-enter-active,
.builder-fade-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}
.builder-fade-enter-from,
.builder-fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>