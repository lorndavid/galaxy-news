<template>
  <div class="news-poster d-none d-lg-block">
    <RouterLink to="/" class="navatra-poster">
      <span class="poster-badge">4K TV</span>
      <img class="poster-logo" loading="lazy" decoding="async" :src="logoUrl" alt="Navatra 4K TV" />
      <h3>{{ siteName }}</h3>
      <p>{{ isEn ? enTagline : khTagline }}</p>
      <span class="poster-btn">{{ isEn ? enBtn : khBtn }}</span>
    </RouterLink>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useSettingsStore } from "@/stores/settings";
import { useLocaleStore } from "@/stores/locale";

const settings = useSettingsStore();
const locale = useLocaleStore();
const isEn = computed(() => locale.isEn);
const khTagline = "មជ្ឈមណ្ឌលព័ត៌មានឌីជីថល ព័ត៌មានក្តៅៗ កម្សាន្ត និងបច្ចេកវិទ្យាប្រចាំថ្ងៃ";
const enTagline = "Digital news hub — breaking news, entertainment and technology every day";
const khBtn = "ចូលមើលបន្ថែម";
const enBtn = "Explore More";
const siteName = computed(() => settings.settings?.siteName ?? "Navatra 4K TV");
const logoUrl = computed(
  () => settings.settings?.logo ?? "/assets/img/logo/logo1.png"
);
</script>
