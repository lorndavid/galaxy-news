<template>
  <img
    :src="current"
    :alt="alt"
    loading="lazy"
    decoding="async"
    class="lazy-img"
    @error="onError"
  />
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { resolveImage } from "@/utils/format";

const props = withDefaults(
  defineProps<{
    src: string | null | undefined;
    alt?: string;
    width?: number;
  }>(),
  { width: 640 }
);

const fallback = "/assets/img/logo/logo1.png";
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
