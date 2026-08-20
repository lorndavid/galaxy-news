<template>
  <div
    class="news-img-wrap"
    :class="[`news-img-wrap--${variant}`, { 'news-img-wrap--loaded': loaded, 'news-img-wrap--error': errored }]"
    :style="wrapStyle"
  >
    <img
      v-if="src"
      :src="currentSrc"
      :alt="alt"
      :loading="priority ? 'eager' : 'lazy'"
      :fetchpriority="priority ? 'high' : undefined"
      decoding="async"
      class="news-img"
      :style="imgStyle"
      @load="loaded = true"
      @error="onError"
    />
    <!-- Skeleton placeholder -->
    <div v-else class="news-img-skeleton" aria-hidden="true">
      <i class="fas fa-image news-img-skeleton-icon"></i>
    </div>
    <!-- Loading skeleton for lazy images -->
    <div v-if="!loaded && !errored && src" class="news-img-skeleton news-img-skeleton--overlay" aria-hidden="true">
      <i class="fas fa-image news-img-skeleton-icon"></i>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from "vue";
import { resolveImage } from "@/utils/format";

const props = withDefaults(
  defineProps<{
    /** Image URL (nullable for skeleton-only) */
    src: string | null | undefined;
    /** Accessible alt text */
    alt?: string;
    /** Aspect ratio (e.g. "16/9", "4/3", "1/1") */
    aspectRatio?: string;
    /** Crop / object-position (e.g. "center", "top", "bottom") */
    cropPosition?: string;
    /** Predefined size variant */
    variant?: "hero" | "standard" | "compact" | "thumbnail" | "full";
    /** Requested pixel width for resolution selection */
    width?: number;
    /** Loading priority — eager for above-the-fold images */
    priority?: boolean;
    /** Border radius override */
    radius?: string;
  }>(),
  {
    alt: "",
    aspectRatio: "16/9",
    cropPosition: "center",
    variant: "standard",
    width: 640,
    priority: false,
    radius: undefined,
  }
);

const loaded = ref(false);
const errored = ref(false);
const fallback = "/assets/img/logo/logo1.png";

const currentSrc = ref(resolveImage(props.src, fallback, props.width));

watch(
  () => props.src,
  (v) => {
    loaded.value = false;
    errored.value = false;
    currentSrc.value = resolveImage(v, fallback, props.width);
  }
);

function onError() {
  errored.value = true;
  if (currentSrc.value !== fallback) currentSrc.value = fallback;
}

const wrapStyle = computed(() => ({
  aspectRatio: props.aspectRatio,
  borderRadius: props.radius,
}));

const imgStyle = computed(() => ({
  objectPosition: props.cropPosition,
}));
</script>

<style scoped>
.news-img-wrap {
  position: relative;
  width: 100%;
  overflow: hidden;
  background: var(--color-surface-alt, #f3f4f6);
}

.news-img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.4s cubic-bezier(0.22, 0.61, 0.36, 1), opacity 0.3s ease;
  opacity: 0;
}

.news-img-wrap--loaded .news-img {
  opacity: 1;
}

.news-img-wrap:hover .news-img {
  transform: scale(1.04);
}

/* Skeleton */
.news-img-skeleton {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-surface-alt, #f3f4f6);
}
.news-img-skeleton--overlay {
  position: absolute;
  inset: 0;
  z-index: 1;
  transition: opacity 0.3s ease;
}
.news-img-wrap--loaded .news-img-skeleton--overlay {
  opacity: 0;
  pointer-events: none;
}
.news-img-skeleton-icon {
  color: var(--color-border, #e5e7eb);
  font-size: 1.5em;
}

/* Hover — disable on touch */
@media (hover: none) {
  .news-img-wrap:hover .news-img {
    transform: none;
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .news-img {
    transition: opacity 0.2s ease;
  }
  .news-img-wrap:hover .news-img {
    transform: none;
  }
}
</style>
