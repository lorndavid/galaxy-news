<template>
  <div class="loading-state text-center py-5">
    <div class="spinner-border" role="status" aria-label="Loading...">
      <span class="sr-only">{{ locale.t.common.loading || 'Loading...' }}</span>
    </div>
    <p class="mt-3 text-muted">{{ locale.t.common.loading || 'Loading...' }}</p>
  </div>
</template>

<script setup lang="ts">
import { useLocaleStore } from "@/stores/locale";
const locale = useLocaleStore();
defineProps<{ label?: string }>();
</script>
