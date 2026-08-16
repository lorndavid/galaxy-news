<template>
  <div class="news-poster d-none d-lg-block">
    <RouterLink to="/" class="navatra-poster">
      <span class="poster-badge">4K TV</span>
      <img class="poster-logo" loading="lazy" decoding="async" :src="logoUrl" alt="Navatra 4K TV" />
      <h3>{{ siteName }}</h3>
      <p>មជ្ឈមណ្ឌលព័ត៌មានឌីជីថល ព័ត៌មានក្តៅៗ កម្សាន្ត និងបច្ចេកវិទ្យាប្រចាំថ្ងៃ</p>
      <span class="poster-btn">ចូលមើលបន្ថែម</span>
    </RouterLink>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useSettingsStore } from "@/stores/settings";

const settings = useSettingsStore();
const siteName = computed(() => settings.settings?.siteName ?? "Navatra 4K TV");
const logoUrl = computed(
  () =>
    settings.settings?.logo ??
    "/assets/img/logo/Logo%20galaxy%20navatra%204k%20TV.ai%202026-06.png"
);
</script>
