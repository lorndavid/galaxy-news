<template>
  <div class="carousel-scroll">
    <div ref="track" class="carousel-track" @scroll="updateArrows">
      <slot />
    </div>
    <button v-if="canPrev" class="carousel-arrow prev" aria-label="មុន" @click="scrollBy(-1)">
      <i class="ti-angle-left"></i>
    </button>
    <button v-if="canNext" class="carousel-arrow next" aria-label="បន្ទាប់" @click="scrollBy(1)">
      <i class="ti-angle-right"></i>
    </button>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";

const track = ref<HTMLElement | null>(null);
const canPrev = ref(false);
const canNext = ref(false);
let raf = 0;

function updateArrows() {
  const el = track.value;
  if (!el) return;
  canPrev.value = el.scrollLeft > 4;
  canNext.value = el.scrollLeft < el.scrollWidth - el.clientWidth - 4;
}

function scrollBy(dir: 1 | -1) {
  const el = track.value;
  if (!el) return;
  el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: "smooth" });
}

function onResize() {
  cancelAnimationFrame(raf);
  raf = requestAnimationFrame(updateArrows);
}

onMounted(() => {
  updateArrows();
  window.addEventListener("resize", onResize);
});
onUnmounted(() => {
  window.removeEventListener("resize", onResize);
  cancelAnimationFrame(raf);
});
</script>

<style scoped>
.carousel-scroll {
  position: relative;
}
.carousel-track {
  display: flex;
  gap: 24px;
  overflow-x: auto;
  scroll-behavior: smooth;
  scrollbar-width: none;
  -ms-overflow-style: none;
  padding: 4px 2px;
}
.carousel-track::-webkit-scrollbar {
  display: none;
}
.carousel-track > :deep(*) {
  flex: 0 0 auto;
}
.carousel-arrow {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 38px;
  height: 38px;
  border: none;
  border-radius: 50%;
  background: rgba(11, 28, 57, 0.82);
  color: #fff;
  font-size: 16px;
  cursor: pointer;
  z-index: 5;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s ease;
}
.carousel-arrow:hover {
  background: #0d3fa9;
}
.carousel-arrow.prev {
  left: -8px;
}
.carousel-arrow.next {
  right: -8px;
}
</style>
