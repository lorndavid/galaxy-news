<template>
  <div class="loading-state text-center py-5">
    <div class="spinner-border" role="status" aria-label="កំពុងផ្ទុក...">
      <span class="sr-only">កំពុងផ្ទុក...</span>
    </div>
    <p class="mt-3 text-muted">កំពុងផ្ទុកទិន្នន័យ...</p>
  </div>
</template>

<script setup lang="ts">
defineProps<{ label?: string }>();
</script>
