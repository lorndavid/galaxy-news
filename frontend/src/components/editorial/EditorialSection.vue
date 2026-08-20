<template>
  <section v-if="visible && articles.length" v-reveal class="ed-section" :style="sectionStyle">
    <div class="container">
      <SectionHeader
        :title="title"
        :accent-color="accentColor"
        :view-all-to="viewAllTo"
        :link-text="t.common.viewAll"
      />
      <!-- Layout switching with smart fallback -->
      <component :is="layoutComponent" :articles="articles" :accent-color="accentColor" />
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, type Component } from "vue";
import type { Article, EditorialLayoutType } from "@/types";
import { useLocalized } from "@/composables/useLocalized";
import SectionHeader from "./SectionHeader.vue";

// Layout components
import EditorialHeroLayout from "./layouts/EditorialHeroLayout.vue";
import EditorialSplitLayout from "./layouts/EditorialSplitLayout.vue";
import EditorialMosaicLayout from "./layouts/EditorialMosaicLayout.vue";
import EditorialThreeColLayout from "./layouts/EditorialThreeColLayout.vue";
import EditorialCompactLayout from "./layouts/EditorialCompactLayout.vue";
import EditorialHorizontalLayout from "./layouts/EditorialHorizontalLayout.vue";
import EditorialListLayout from "./layouts/EditorialListLayout.vue";
import EditorialFeatureCompactLayout from "./layouts/EditorialFeatureCompactLayout.vue";
import EditorialMagazineLayout from "./layouts/EditorialMagazineLayout.vue";
import EditorialMinimalLayout from "./layouts/EditorialMinimalLayout.vue";

const { t } = useLocalized();

const props = withDefaults(
  defineProps<{
    title: string;
    articles: Article[];
    layoutType?: EditorialLayoutType;
    accentColor?: string;
    viewAllTo?: string;
    visible?: boolean;
    articleLimit?: number;
  }>(),
  {
    layoutType: "editorial-compact",
    visible: true,
    articleLimit: 6,
  }
);

/** Minimum articles required per layout before fallback kicks in */
const MIN_ARTICLES: Record<EditorialLayoutType, number> = {
  "editorial-hero": 4,
  "editorial-split": 4,
  "editorial-mosaic": 5,
  "editorial-three-col": 3,
  "editorial-compact": 4,
  "editorial-horizontal": 3,
  "editorial-list": 3,
  "editorial-feature-compact": 4,
  "editorial-magazine": 5,
  "editorial-minimal": 1,
};

/** Fallback layout when article count is too low */
const FALLBACK_MAP: Record<EditorialLayoutType, EditorialLayoutType> = {
  "editorial-hero": "editorial-horizontal",
  "editorial-split": "editorial-three-col",
  "editorial-mosaic": "editorial-three-col",
  "editorial-three-col": "editorial-compact",
  "editorial-compact": "editorial-horizontal",
  "editorial-horizontal": "editorial-list",
  "editorial-list": "editorial-minimal",
  "editorial-feature-compact": "editorial-horizontal",
  "editorial-magazine": "editorial-three-col",
  "editorial-minimal": "editorial-minimal",
};

/** Resolve the actual layout, falling back if not enough articles */
const resolvedLayout = computed<EditorialLayoutType>(() => {
  const count = props.articles.length;
  const min = MIN_ARTICLES[props.layoutType];
  if (count >= min) return props.layoutType;
  // Walk the fallback chain (max 3 hops)
  let layout = props.layoutType;
  for (let i = 0; i < 3; i++) {
    const next = FALLBACK_MAP[layout];
    if (next === layout) break; // terminal
    layout = next;
    if (count >= MIN_ARTICLES[layout]) return layout;
  }
  return layout;
});

const LAYOUT_MAP: Record<EditorialLayoutType, Component> = {
  "editorial-hero": EditorialHeroLayout,
  "editorial-split": EditorialSplitLayout,
  "editorial-mosaic": EditorialMosaicLayout,
  "editorial-three-col": EditorialThreeColLayout,
  "editorial-compact": EditorialCompactLayout,
  "editorial-horizontal": EditorialHorizontalLayout,
  "editorial-list": EditorialListLayout,
  "editorial-feature-compact": EditorialFeatureCompactLayout,
  "editorial-magazine": EditorialMagazineLayout,
  "editorial-minimal": EditorialMinimalLayout,
};

const layoutComponent = computed(() => LAYOUT_MAP[resolvedLayout.value]);

const sectionStyle = computed(() => {
  const bg = props.accentColor ? `color-mix(in srgb, ${props.accentColor} 3%, transparent)` : undefined;
  return bg ? { background: bg } : {};
});
</script>

<style scoped>
.ed-section {
  padding: 40px 0 0;
}
@media (max-width: 640px) {
  .ed-section {
    padding: 28px 0 0;
  }
}
</style>
