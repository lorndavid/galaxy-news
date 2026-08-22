<template>
  <div class="error-state text-center py-5">
    <i class="ti-alert" style="font-size: 40px; color: #e74c3c"></i>
    <h4 class="mt-3">{{ locale.t.error.loadDataFailed || 'Load failed' }}</h4>
    <p class="text-muted">{{ message }}</p>
    <button class="btn boxed-btn mt-3" @click="$emit('retry')">{{ locale.t.error.tryAgain || 'Retry' }}</button>
  </div>
</template>

<script setup lang="ts">
import { useLocaleStore } from "@/stores/locale";
const locale = useLocaleStore();
defineProps<{ message?: string }>();
defineEmits<{ retry: [] }>();
</script>
