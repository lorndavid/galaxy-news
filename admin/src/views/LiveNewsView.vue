<template>
  <div class="space-y-5">
    <div class="card max-w-2xl space-y-5 p-6">
      <!-- Enable/disable -->
      <div class="flex items-center justify-between rounded-lg border border-slate-200 p-4">
        <div>
          <p class="text-sm font-semibold text-slate-700">បន្ទាត់ព័ត៌មានផ្ទាល់ (Live News Ticker)</p>
          <p class="mt-0.5 text-xs text-slate-400">
            បង្ហាញចំណងជើងព័ត៌មានថ្មីៗនៅក្រោមក្បាលទំព័រ
          </p>
        </div>
        <label class="relative inline-flex cursor-pointer items-center">
          <input v-model="form.tickerEnabled" type="checkbox" class="peer sr-only" />
          <div class="h-6 w-11 rounded-full bg-slate-300 transition-colors peer-checked:bg-emerald-500 after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-transform peer-checked:after:translate-x-5"></div>
        </label>
      </div>

      <div class="grid gap-4 sm:grid-cols-2">
        <div>
          <label class="label">ចំណងជើង</label>
          <input v-model="form.tickerTitle" type="text" class="input" placeholder="LIVE NEWS" />
        </div>
        <div>
          <label class="label">ល្បឿន</label>
          <select v-model="form.tickerSpeed" class="input">
            <option value="slow">យឺត (Slow)</option>
            <option value="medium">មធ្យម (Medium)</option>
            <option value="fast">លឿន (Fast)</option>
          </select>
        </div>
        <div>
          <label class="label">ទិសដៅ</label>
          <select v-model="form.tickerDirection" class="input">
            <option value="left">ទៅឆ្វេង</option>
            <option value="right">ទៅស្តាំ</option>
          </select>
        </div>
        <div>
          <label class="label">ចំនួនអត្ថបទ (1–30)</label>
          <input v-model.number="form.tickerCount" type="number" class="input" min="1" max="30" />
        </div>
        <div>
          <label class="label">ធ្វើឱ្យស្រស់ (វិនាទី, 10–300)</label>
          <input v-model.number="form.tickerRefresh" type="number" class="input" min="10" max="300" />
        </div>
      </div>

      <h3 class="pt-2 text-sm font-semibold text-slate-700">ពណ៌</h3>
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div v-for="c in tickerColors" :key="c.key">
          <label class="label">{{ c.label }}</label>
          <div class="flex items-center gap-2">
            <input v-model="form[c.key]" type="color" class="h-9 w-10 shrink-0 cursor-pointer rounded border border-slate-300" />
            <input v-model="form[c.key]" type="text" class="input font-mono text-xs" />
          </div>
        </div>
      </div>

      <!-- Live preview -->
      <div class="overflow-hidden rounded-lg border border-slate-200">
        <div class="border-b border-slate-200 px-4 py-2.5">
          <h3 class="text-xs font-semibold text-slate-700">ការមើលជាមុន</h3>
        </div>
        <div class="flex items-center gap-3 overflow-hidden px-4 py-3" :style="{ background: String(form.tickerBgColor), color: String(form.tickerTextColor) }">
          <span class="shrink-0 rounded px-2 py-0.5 text-[11px] font-bold text-white" :style="{ background: String(form.tickerAccentColor) }">
            {{ form.tickerTitle || 'LIVE NEWS' }}
          </span>
          <span class="truncate text-[13px]">ចំណងជើងព័ត៌មានថ្មីៗបង្ហាញនៅទីនេះ…</span>
        </div>
      </div>

      <button type="button" class="btn-primary" :disabled="saving" @click="save">
        {{ saving ? 'កំពុងរក្សាទុក…' : 'រក្សាទុកការកំណត់' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { adminService } from "@/services/admin.service";
import { useToastStore } from "@/stores/toast";

const toast = useToastStore();
const saving = ref(false);

const tickerColors = [
  { key: "tickerBgColor", label: "ពណ៌ផ្ទៃខាងក្រោយ" },
  { key: "tickerTextColor", label: "ពណ៌អក្សរ" },
  { key: "tickerAccentColor", label: "ពណ៌សង្កត់" },
] as const;

const form = reactive({
  tickerEnabled: true,
  tickerTitle: "LIVE NEWS",
  tickerSpeed: "medium",
  tickerDirection: "left",
  tickerCount: 10,
  tickerRefresh: 60,
  tickerBgColor: "#000000",
  tickerTextColor: "#ffffff",
  tickerAccentColor: "#fc3f00",
} as Record<string, string | number | boolean>);

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
    toast.success("បានរក្សាទុកការកំណត់បន្ទាត់ព័ត៌មាន");
  } catch (e) {
    toast.error(e instanceof Error ? e.message : "រក្សាទុកបរាជ័យ");
  } finally {
    saving.value = false;
  }
}

onMounted(load);
</script>
