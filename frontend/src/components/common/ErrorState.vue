<template>
  <div class="error-state text-center py-5">
    <i class="ti-alert" style="font-size: 40px; color: #e74c3c"></i>
    <h4 class="mt-3">មានបញ្ហាក្នុងការផ្ទុកទិន្នន័យ</h4>
    <p class="text-muted">{{ message }}</p>
    <button class="btn boxed-btn mt-3" @click="$emit('retry')">ព្យាយាមម្តងទៀត</button>
  </div>
</template>

<script setup lang="ts">
defineProps<{ message?: string }>();
defineEmits<{ retry: [] }>();
</script>
