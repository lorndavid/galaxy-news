<template>
  <Transition name="loader-fade">
    <div v-if="loading" class="g-page-loader" aria-live="polite" aria-busy="true">
      <div class="g-page-loader-inner">
        <img :src="logoUrl" alt="Loading" class="g-page-loader-logo" />
        <div class="g-page-loader-bar">
          <div class="g-page-loader-bar-fill"></div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { useSettingsStore } from "@/stores/settings";

const route = useRoute();
const settingsStore = useSettingsStore();
const loading = ref(false);
const logoUrl = computed(() => settingsStore.settings?.logo ?? "/assets/img/logo/logo1.png");

let timer: ReturnType<typeof setTimeout> | undefined;

watch(
  () => route.fullPath,
  () => {
    loading.value = true;
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      loading.value = false;
    }, 600);
  }
);
</script>

<style scoped>
.g-page-loader {
  position: fixed;
  inset: 0;
  z-index: 99999;
  background: var(--color-bg, #f8f7f4);
  display: flex;
  align-items: center;
  justify-content: center;
}
.g-page-loader-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}
.g-page-loader-logo {
  height: 56px;
  width: auto;
  animation: g-loader-pulse 1s ease-in-out infinite;
}
@keyframes g-loader-pulse {
  0%, 100% { opacity: 0.6; transform: scale(0.98); }
  50% { opacity: 1; transform: scale(1.02); }
}
.g-page-loader-bar {
  width: 120px;
  height: 3px;
  background: var(--color-border, #e5e7eb);
  border-radius: 3px;
  overflow: hidden;
}
.g-page-loader-bar-fill {
  width: 40%;
  height: 100%;
  background: var(--color-accent, #4f46e5);
  border-radius: 3px;
  animation: g-loader-slide 0.8s ease-in-out infinite;
}
@keyframes g-loader-slide {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(350%); }
}

.loader-fade-enter-active,
.loader-fade-leave-active {
  transition: opacity 0.25s ease;
}
.loader-fade-enter-from,
.loader-fade-leave-to {
  opacity: 0;
}
</style>
