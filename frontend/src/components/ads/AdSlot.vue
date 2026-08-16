<template>
  <div v-if="ad" class="ad-slot" :data-position="position">
    <a v-if="ad.link" :href="ad.link" target="_blank" rel="noopener sponsored">
      <img :src="ad.image" :alt="ad.name" class="ad-img" loading="lazy" />
    </a>
    <img v-else :src="ad.image" :alt="ad.name" class="ad-img" loading="lazy" />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import type { Advertisement } from "@/types";
import { contentService } from "@/services/content.service";

const props = defineProps<{ position: string }>();

const ads = ref<Advertisement[]>([]);

onMounted(async () => {
  try {
    ads.value = await contentService.ads(props.position);
  } catch {
    ads.value = [];
  }
});

// Simple rotation: pick a random active ad so multiple ads in one slot rotate
const ad = computed(() => {
  if (!ads.value.length) return null;
  return ads.value[Math.floor(Math.random() * ads.value.length)];
});
</script>

<style scoped>
.ad-slot {
  display: flex;
  justify-content: center;
  margin: 16px 0 24px;
  overflow: hidden;
}
.ad-img {
  max-width: 100%;
  height: auto;
  display: block;
  border-radius: var(--radius-card, 10px);
}
</style>
