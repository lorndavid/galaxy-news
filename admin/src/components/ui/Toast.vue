<template>
  <div class="pointer-events-none fixed inset-x-0 top-4 z-50 flex flex-col items-center gap-2 px-4">
    <TransitionGroup name="toast">
      <div
        v-for="t in store.toasts"
        :key="t.id"
        class="pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-lg px-4 py-3 text-sm text-white shadow-lg"
        :class="t.type === 'error' ? 'bg-red-600' : t.type === 'success' ? 'bg-emerald-600' : 'bg-slate-800'"
      >
        <CheckCircle v-if="t.type === 'success'" class="h-4 w-4 shrink-0" />
        <AlertCircle v-else-if="t.type === 'error'" class="h-4 w-4 shrink-0" />
        <Info v-else class="h-4 w-4 shrink-0" />
        <span class="flex-1">{{ t.message }}</span>
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup lang="ts">
import { CheckCircle, AlertCircle, Info } from "lucide-vue-next";
import { useToastStore } from "@/stores/toast";

const store = useToastStore();
</script>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.25s ease;
}
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
