<template>
  <Transition name="backtop">
    <button
      v-if="visible"
      type="button"
      class="back-to-top"
      :aria-label="isEn ? 'Back to top' : 'ត្រឡប់ទៅកំពូល'"
      :title="isEn ? 'Back to top' : 'ត្រឡប់ទៅកំពូល'"
      @click="scrollTop"
    >
      <i class="ti-angle-up" aria-hidden="true"></i>
    </button>
  </Transition>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";
import { useLocaleStore } from "@/stores/locale";

const locale = useLocaleStore();
const isEn = locale.isEn;
const visible = ref(false);
let timer: number | undefined;

function onScroll() {
  if (timer) window.clearTimeout(timer);
  timer = window.setTimeout(() => {
    visible.value = window.scrollY > 400;
  }, 60);
}

function scrollTop() {
  // Respect users who prefer reduced motion.
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
}

onMounted(() => {
  window.addEventListener("scroll", onScroll, { passive: true });
});

onUnmounted(() => {
  window.removeEventListener("scroll", onScroll);
  if (timer) window.clearTimeout(timer);
});
</script>

<style scoped>
.back-to-top {
  position: fixed;
  right: 22px;
  bottom: 24px;
  z-index: 950;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border: none;
  border-radius: 12px;
  background: var(--color-primary, #0d3fa9);
  color: #fff;
  font-size: 20px;
  line-height: 1;
  cursor: pointer;
  box-shadow: 0 6px 18px rgba(11, 28, 57, 0.28);
  transition: background 0.2s ease, transform 0.2s ease;
}
.back-to-top:hover {
  background: var(--color-secondary, #0b1c39);
  transform: translateY(-2px);
}
.back-to-top i {
  font-weight: 700;
}

.backtop-enter-active,
.backtop-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}
.backtop-enter-from,
.backtop-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

@media (max-width: 640px) {
  .back-to-top {
    right: 14px;
    bottom: 16px;
    width: 40px;
    height: 40px;
    font-size: 18px;
    border-radius: 10px;
  }
}
</style>
