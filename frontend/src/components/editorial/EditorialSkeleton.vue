<template>
  <div class="ed-skeleton" :class="`ed-skeleton--${layoutType}`">
    <!-- Hero skeleton -->
    <template v-if="layoutType === 'editorial-hero'">
      <div class="ed-skel-grid ed-skel-hero">
        <div class="ed-skel-card ed-skel-card--feature"><div class="ed-skel-img"></div><div class="ed-skel-text"><div class="ed-skel-line ed-skel-line--lg"></div><div class="ed-skel-line ed-skel-line--md"></div><div class="ed-skel-line ed-skel-line--sm"></div></div></div>
        <div class="ed-skel-sidebar">
          <div v-for="n in 4" :key="n" class="ed-skel-card ed-skel-card--row"><div class="ed-skel-img-sm"></div><div class="ed-skel-text"><div class="ed-skel-line ed-skel-line--md"></div><div class="ed-skel-line ed-skel-line--sm"></div></div></div>
        </div>
      </div>
    </template>

    <!-- Split skeleton -->
    <template v-else-if="layoutType === 'editorial-split'">
      <div class="ed-skel-grid ed-skel-split">
        <div class="ed-skel-card"><div class="ed-skel-img"></div><div class="ed-skel-text"><div class="ed-skel-line ed-skel-line--lg"></div><div class="ed-skel-line ed-skel-line--sm"></div></div></div>
        <div class="ed-skel-stack">
          <div v-for="n in 3" :key="n" class="ed-skel-card ed-skel-card--row"><div class="ed-skel-img-sm"></div><div class="ed-skel-text"><div class="ed-skel-line ed-skel-line--md"></div><div class="ed-skel-line ed-skel-line--sm"></div></div></div>
        </div>
      </div>
    </template>

    <!-- Mosaic skeleton -->
    <template v-else-if="layoutType === 'editorial-mosaic'">
      <div class="ed-skel-grid ed-skel-mosaic">
        <div class="ed-skel-card ed-skel-card--feature"><div class="ed-skel-img"></div><div class="ed-skel-text"><div class="ed-skel-line ed-skel-line--lg"></div><div class="ed-skel-line ed-skel-line--sm"></div></div></div>
        <div v-for="n in 4" :key="n" class="ed-skel-card"><div class="ed-skel-img"></div><div class="ed-skel-text"><div class="ed-skel-line ed-skel-line--md"></div></div></div>
      </div>
    </template>

    <!-- 3-column / compact skeleton -->
    <template v-else-if="layoutType === 'editorial-three-col' || layoutType === 'editorial-compact'">
      <div class="ed-skel-grid ed-skel-three-col">
        <div v-for="n in 6" :key="n" class="ed-skel-card"><div class="ed-skel-img"></div><div class="ed-skel-text"><div class="ed-skel-line ed-skel-line--md"></div><div class="ed-skel-line ed-skel-line--sm"></div></div></div>
      </div>
    </template>

    <!-- Horizontal skeleton -->
    <template v-else-if="layoutType === 'editorial-horizontal'">
      <div class="ed-skel-stack">
        <div v-for="n in 4" :key="n" class="ed-skel-card ed-skel-card--row"><div class="ed-skel-img-lg"></div><div class="ed-skel-text"><div class="ed-skel-line ed-skel-line--lg"></div><div class="ed-skel-line ed-skel-line--md"></div><div class="ed-skel-line ed-skel-line--sm"></div></div></div>
      </div>
    </template>

    <!-- List skeleton -->
    <template v-else-if="layoutType === 'editorial-list'">
      <div class="ed-skel-stack">
        <div v-for="n in 4" :key="n" class="ed-skel-card ed-skel-card--list"><div class="ed-skel-img-md"></div><div class="ed-skel-text"><div class="ed-skel-line ed-skel-line--lg"></div><div class="ed-skel-line ed-skel-line--md"></div><div class="ed-skel-line ed-skel-line--sm"></div></div></div>
      </div>
    </template>

    <!-- Default: compact grid skeleton -->
    <template v-else>
      <div class="ed-skel-grid ed-skel-three-col">
        <div v-for="n in 4" :key="n" class="ed-skel-card"><div class="ed-skel-img"></div><div class="ed-skel-text"><div class="ed-skel-line ed-skel-line--md"></div></div></div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { EditorialLayoutType } from "@/types";

defineProps<{ layoutType: EditorialLayoutType }>();
</script>

<style scoped>
.ed-skeleton {
  padding: 8px 0;
}

/* Grid layouts */
.ed-skel-grid {
  display: grid;
  gap: 16px;
}
.ed-skel-hero {
  grid-template-columns: minmax(0, 1fr) 340px;
}
.ed-skel-split {
  grid-template-columns: 1fr 1fr;
}
.ed-skel-mosaic {
  grid-template-columns: 2fr 1fr 1fr;
}
.ed-skel-three-col {
  grid-template-columns: repeat(3, 1fr);
}
.ed-skel-stack {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

@media (max-width: 991px) {
  .ed-skel-hero,
  .ed-skel-split,
  .ed-skel-mosaic,
  .ed-skel-three-col {
    grid-template-columns: 1fr;
  }
  .ed-skel-sidebar {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }
}

@media (max-width: 640px) {
  .ed-skel-sidebar {
    grid-template-columns: 1fr;
  }
}

/* Card skeleton */
.ed-skel-card {
  background: var(--color-surface, #fff);
  border: 1px solid var(--color-border, #e5e7eb);
  border-radius: 8px;
  overflow: hidden;
}
.ed-skel-card--feature {
  grid-column: 1;
  grid-row: 1 / 3;
}
.ed-skel-card--row {
  display: flex;
  gap: 12px;
  padding: 12px;
  align-items: flex-start;
}
.ed-skel-card--list {
  display: flex;
  gap: 16px;
  padding: 16px 0;
  border-bottom: 1px solid var(--color-border, #e5e7eb);
  border-radius: 0;
  background: transparent;
}

/* Image placeholders */
.ed-skel-img {
  aspect-ratio: 16 / 9;
  width: 100%;
  background: var(--color-surface-alt, #f3f4f6);
}
.ed-skel-img-sm {
  flex-shrink: 0;
  width: 100px;
  aspect-ratio: 4 / 3;
  background: var(--color-surface-alt, #f3f4f6);
}
.ed-skel-img-md {
  flex-shrink: 0;
  width: 180px;
  aspect-ratio: 16 / 10;
  background: var(--color-surface-alt, #f3f4f6);
}
.ed-skel-img-lg {
  flex-shrink: 0;
  width: 200px;
  aspect-ratio: 16 / 10;
  background: var(--color-surface-alt, #f3f4f6);
  border-radius: 4px;
}

/* Text placeholders */
.ed-skel-text {
  padding: 14px 16px 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.ed-skel-card--row .ed-skel-text,
.ed-skel-card--list .ed-skel-text {
  padding: 4px 0;
  flex: 1;
}
.ed-skel-line {
  height: 12px;
  border-radius: 6px;
  background: var(--color-surface-alt, #f3f4f6);
}
.ed-skel-line--lg { width: 80%; height: 16px; }
.ed-skel-line--md { width: 60%; }
.ed-skel-line--sm { width: 40%; }

/* Shimmer animation */
.ed-skel-img,
.ed-skel-img-sm,
.ed-skel-img-md,
.ed-skel-img-lg,
.ed-skel-line {
  animation: skel-shimmer 1.8s ease-in-out infinite;
  background: linear-gradient(
    90deg,
    var(--color-surface-alt, #f3f4f6) 0%,
    color-mix(in srgb, var(--color-surface-alt, #f3f4f6) 60%, white) 50%,
    var(--color-surface-alt, #f3f4f6) 100%
  );
  background-size: 200% 100%;
}

@keyframes skel-shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

@media (prefers-reduced-motion: reduce) {
  .ed-skel-img,
  .ed-skel-img-sm,
  .ed-skel-img-md,
  .ed-skel-img-lg,
  .ed-skel-line {
    animation: none;
  }
}
</style>
