<template>
  <img
    :src="srcValue"
    :alt="alt"
    loading="lazy"
    decoding="async"
    class="lazy-img"
    @error="onError"
  />
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { resolveImage } from "@/utils/format";

const props = withDefaults(
  defineProps<{
    src: string | null | undefined;
    alt?: string;
    width?: number;
  }>(),
  { width: 640 }
);

const srcValue = computed(() => props.src ?? undefined);

const fallback = "/assets/img/news/KH.jpg";
const current = ref(resolveImage(props.src, fallback, props.width));

watch(
  () => props.src,
  (v) => {
    current.value = resolveImage(v, fallback, props.width);
  }
);

function onError() {
  if (current.value !== fallback) current.value = fallback;
}
</script>
