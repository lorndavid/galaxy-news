<template>
  <div class="news-poster d-none d-lg-block">
    <RouterLink to="/" class="navatra-poster">
      <span class="poster-badge">4K TV</span>
      <img class="poster-logo" loading="lazy" decoding="async" :src="logoUrl" alt="Galaxy TV V4K" />
      <h3>{{ siteName }}</h3>
      <p>{{ taglines[locale.locale] || taglines.kh }}</p>
      <span class="poster-btn">{{ btnLabels[locale.locale] || btnLabels.kh }}</span>
    </RouterLink>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useSettingsStore } from "@/stores/settings";
import { useLocaleStore } from "@/stores/locale";

const settings = useSettingsStore();
const locale = useLocaleStore();
const taglines: Record<string, string> = { kh: "មជ្ឈមណ្ឌលព័ត៌មានឌីជីថល ព័ត៌មានក្តៅៗ កម្សាន្ត និងបច្ចេកវិទ្យាប្រចាំថ្ងៃ", en: "Cambodia's digital news hub", zh: "柬埔寨数字新闻中心" };

const btnLabels: Record<string, string> = { kh: "ចូលមើលបន្ថែម", en: "View More", zh: "查看更多" };

const siteName = computed(() => settings.settings?.siteName ?? "Galaxy TV V4K");
const logoUrl = computed(
  () => settings.settings?.logo ?? "/assets/img/logo/logo1.png"
);
</script>
