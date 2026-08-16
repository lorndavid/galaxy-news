<template>
  <div v-if="totalPages > 1" class="flex items-center justify-between pt-4">
    <p class="text-xs text-slate-500">
      ទំព័រ {{ page }} / {{ totalPages }} · សរុប {{ total }}
    </p>
    <div class="flex gap-1">
      <button class="btn-secondary !px-3 !py-1.5 text-xs" :disabled="page <= 1" @click="$emit('change', page - 1)">មុន</button>
      <button
        v-for="p in pages"
        :key="p"
        class="btn !px-3 !py-1.5 text-xs"
        :class="p === page ? 'bg-brand-600 text-white' : 'bg-white text-slate-600 border border-slate-300'"
        @click="$emit('change', p)"
      >{{ p }}</button>
      <button class="btn-secondary !px-3 !py-1.5 text-xs" :disabled="page >= totalPages" @click="$emit('change', page + 1)">បន្ទាប់</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{ page: number; totalPages: number; total: number }>();
defineEmits<{ change: [page: number] }>();

const pages = computed(() => {
  const total = Math.max(1, props.totalPages);
  const current = Math.min(Math.max(1, props.page), total);
  const out: number[] = [];
  const start = Math.max(1, current - 2);
  const end = Math.min(total, start + 4);
  for (let p = start; p <= end; p++) out.push(p);
  return out;
});
</script>
