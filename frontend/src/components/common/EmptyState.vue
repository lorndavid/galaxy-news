<template>
  <div class="empty-state text-center py-5">
    <i class="ti-info-alt" style="font-size: 40px; color: #ccc"></i>
    <h4 class="mt-3">{{ message }}</h4>
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ message?: string }>(), {
  message: "មិនមានទិន្នន័យសម្រាប់បង្ហាញទេ",
});
</script>
