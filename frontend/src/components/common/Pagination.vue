<template>
  <div v-if="totalPages > 1" class="pagination-area pb-45 text-center">
    <div class="container">
      <div class="row">
        <div class="col-xl-12">
          <div class="single-wrap d-flex justify-content-center">
            <nav aria-label="Page navigation">
              <ul class="pagination justify-content-start">
                <li class="page-item" :class="{ disabled: page <= 1 }">
                  <button class="page-link" :disabled="page <= 1" @click="$emit('change', page - 1)" aria-label="Previous">
                    <span class="flaticon-arrow roted"></span>
                  </button>
                </li>
                <li v-for="p in pages" :key="p" class="page-item" :class="{ active: p === page }">
                  <button class="page-link" @click="$emit('change', p)">{{ String(p).padStart(2, "0") }}</button>
                </li>
                <li class="page-item" :class="{ disabled: page >= totalPages }">
                  <button class="page-link" :disabled="page >= totalPages" @click="$emit('change', page + 1)" aria-label="Next">
                    <span class="flaticon-arrow right-arrow"></span>
                  </button>
                </li>
              </ul>
            </nav>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{ page: number; totalPages: number }>();
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

<style scoped>
.page-link {
  cursor: pointer;
}
.page-item.disabled .page-link {
  pointer-events: none;
}
</style>
