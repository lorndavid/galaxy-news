<template>
  <div class="card max-w-2xl overflow-hidden">
    <div class="border-b border-slate-200 px-5 py-4">
      <h3 class="text-sm font-semibold text-slate-700">អ្នកបង្កើតទំព័រដើម</h3>
      <p class="mt-0.5 text-xs text-slate-400">
        បើក/បិទ និងរៀបតាមលំដាប់ផ្នែកនៃទំព័រដើម។ ការផ្លាស់ប្តូរមានប្រសិទ្ធភាពភ្លាមៗលើគេហទំព័រ។
      </p>
    </div>

    <div v-if="loading" class="p-8 text-center text-sm text-slate-400">កំពុងផ្ទុក...</div>
    <div v-else-if="error" class="p-8 text-center">
      <p class="text-sm text-red-600">{{ error }}</p>
      <button class="btn-secondary mt-3 !py-1.5 text-xs" @click="load">ព្យាយាមម្តងទៀត</button>
    </div>

    <template v-else>
      <div class="divide-y divide-slate-100">
        <div
          v-for="(s, i) in sections"
          :key="s.key"
          class="flex items-center gap-3 px-5 py-3.5"
          :class="{ 'opacity-50': !s.enabled }"
        >
          <!-- drag handle -->
          <span class="cursor-grab text-slate-300" title="អូសដើម្បីផ្លាស់ទី" aria-hidden="true">
            <GripVertical class="h-4 w-4" />
          </span>
          <div class="min-w-0 flex-1">
            <p class="font-medium text-slate-700">{{ s.label }}</p>
            <p class="font-mono text-xs text-slate-400">{{ s.key }}</p>
          </div>
          <div class="flex items-center gap-1">
            <button
              class="btn-ghost !p-1.5"
              :disabled="i === 0"
              title="ផ្លាស់ទីឡើងលើ"
              @click="move(i, -1)"
            >
              <ChevronUp class="h-4 w-4" />
            </button>
            <button
              class="btn-ghost !p-1.5"
              :disabled="i === sections.length - 1"
              title="ផ្លាស់ទីចុះក្រោម"
              @click="move(i, 1)"
            >
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
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { ChevronDown, ChevronUp, GripVertical } from "lucide-vue-next";
import { adminService } from "@/services/admin.service";
import { useToastStore } from "@/stores/toast";
import type { HomepageSection } from "@/types";

const toast = useToastStore();
const sections = ref<HomepageSection[]>([]);
const loading = ref(false);
const error = ref("");
const saving = ref(false);
const dirty = ref(false);

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
      sections.value.map((s) => ({ key: s.key, enabled: s.enabled, label: s.label }))
    );
    await adminService.reorderHomepageSections(
      sections.value.map((s) => ({ key: s.key, sortOrder: s.sortOrder }))
    );
    toast.success("បានរក្សាទុកការរៀបចំទំព័រដើម");
    dirty.value = false;
  } catch (e) {
    toast.error(e instanceof Error ? e.message : "រក្សាទុកបរាជ័យ");
  } finally {
    saving.value = false;
  }
}

onMounted(load);
</script>
