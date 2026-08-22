<template>
  <Transition name="loader-fade">
    <div v-if="loading" class="g-page-loader" aria-live="polite" aria-busy="true">
      <div class="g-page-loader-inner">
        <!-- Logo -->
        <div class="g-page-loader-logo-wrap">
          <img :src="logoSrc" alt="Galaxy TV 4K" class="g-page-loader-logo" />
        </div>

        <!-- Loading text -->
        <p class="g-page-loader-text">Galaxy TV 4K</p>

        <!-- Progress bar -->
        <div class="g-page-loader-bar">
          <div class="g-page-loader-bar-fill"></div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from "vue";
import { useRoute } from "vue-router";

const route = useRoute();
const loading = ref(true);

const logoSrc = "/assets/img/loading/loading.png";

/* ─── Initial load (browser refresh / first visit) ─── */
onMounted(() => {
  // Wait for fonts + a frame so the UI is painted, then fade out
  requestAnimationFrame(() => {
    setTimeout(() => {
      loading.value = false;
    }, 800);
  });
});

/* ─── Subsequent route changes ─── */
let timer: ReturnType<typeof setTimeout> | undefined;

watch(
  () => route.fullPath,
  () => {
    loading.value = true;
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      loading.value = false;
    }, 500);
  }
);
</script>

<style scoped>
/* ─── Overlay ─── */
.g-page-loader {
  position: fixed;
  inset: 0;
  z-index: 99999;
  background: linear-gradient(145deg, #070e1f 0%, #0b1c39 40%, #0f2344 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

/* Subtle radial glow behind the logo */
.g-page-loader::before {
  content: "";
  position: absolute;
  width: 340px;
  height: 340px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(79, 70, 229, 0.18) 0%, transparent 70%);
  animation: g-loader-glow 2.4s ease-in-out infinite;
}

@keyframes g-loader-glow {
  0%, 100% { transform: scale(0.85); opacity: 0.5; }
  50% { transform: scale(1.15); opacity: 1; }
}

/* ─── Inner container ─── */
.g-page-loader-inner {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 18px;
  z-index: 1;
}

/* ─── Logo wrapper ─── */
.g-page-loader-logo-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
}

.g-page-loader-logo {
  width: 72px;
  height: 72px;
  object-fit: contain;
  animation: g-loader-breathe 2s ease-in-out infinite;
  filter: drop-shadow(0 0 18px rgba(79, 70, 229, 0.35));
}

@keyframes g-loader-breathe {
  0%, 100% { transform: scale(0.96); opacity: 0.85; }
  50% { transform: scale(1.04); opacity: 1; }
}

/* ─── Loading text ─── */
.g-page-loader-text {
  margin: 0;
  font-family: "Inter", "Noto Sans Khmer", sans-serif;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 2.5px;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.55);
  animation: g-loader-text-fade 2s ease-in-out infinite;
}

@keyframes g-loader-text-fade {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 0.8; }
}

/* ─── Progress bar ─── */
.g-page-loader-bar {
  width: 140px;
  height: 2px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 2px;
  overflow: hidden;
}

.g-page-loader-bar-fill {
  width: 35%;
  height: 100%;
  background: linear-gradient(90deg, #6366f1, #818cf8);
  border-radius: 2px;
  animation: g-loader-slide 0.9s ease-in-out infinite;
}

@keyframes g-loader-slide {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(400%); }
}

/* ─── Fade transitions ─── */
.loader-fade-enter-active {
  transition: opacity 0.3s ease;
}
.loader-fade-leave-active {
  transition: opacity 0.45s ease;
}
.loader-fade-enter-from,
.loader-fade-leave-to {
  opacity: 0;
}
</style>
