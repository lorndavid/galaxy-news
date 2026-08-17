<template>
  <div v-if="ad" class="ad-slot" :data-position="position">
    <p v-if="ad.title" class="ad-slot-label">{{ ad.title }}</p>
    <a
      v-if="ad.link"
      :href="safeLink(ad.link)"
      :target="ad.target === '_self' ? '_self' : '_blank'"
      :rel="ad.target === '_self' ? undefined : 'noopener sponsored'"
    >
      <img :src="ad.image" :alt="ad.name" class="ad-img" loading="lazy" decoding="async" />
    </a>
    <img v-else :src="ad.image" :alt="ad.name" class="ad-img" loading="lazy" decoding="async" />
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

// Highest priority wins; backend already returns them ordered by priority.
const ad = computed(() => ads.value[0] ?? null);

/** Never allow unsafe schemes even if data is somehow malformed. */
function safeLink(link: string): string {
  return /^(https?:)?\/\//i.test(link) || link.startsWith("/") ? link : "#";
}
</script>

<style scoped>
.ad-slot {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 16px 0 24px;
  overflow: hidden;
}
.ad-slot-label {
  margin: 0 0 6px;
  font-size: 10.5px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--color-muted, #667085);
}
.ad-img {
  max-width: 100%;
  height: auto;
  display: block;
  border-radius: var(--radius-card, 10px);
}
</style>
