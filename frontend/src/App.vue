<template>
  <div class="news-app">
    <a href="#main-content" class="skip-link">{{ isEn ? "Skip to content" : "រំលងទៅកាន់មាតិកា" }}</a>
    <PageLoader />
    <SiteHeader v-if="!route.meta.bare" />
    <LiveNewsTicker v-if="!route.meta.bare" />
    <main id="main-content" tabindex="-1">
      <RouterView v-slot="{ Component }">
        <Transition name="fade" mode="out-in">
          <component :is="Component" :key="route.fullPath" />
        </Transition>
      </RouterView>
    </main>
    <SiteFooter v-if="!route.meta.bare" />
    <BackToTop v-if="!route.meta.bare" />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from "vue";
import { useRoute } from "vue-router";
import SiteHeader from "@/components/layout/SiteHeader.vue";
import SiteFooter from "@/components/layout/SiteFooter.vue";
import LiveNewsTicker from "@/components/common/LiveNewsTicker.vue";
import BackToTop from "@/components/common/BackToTop.vue";
import PageLoader from "@/components/common/PageLoader.vue";
import { useSettingsStore } from "@/stores/settings";
import { useLocaleStore } from "@/stores/locale";
import { useTheme } from "@/composables/useTheme";

const route = useRoute();
const settingsStore = useSettingsStore();
const locale = useLocaleStore();
const isEn = computed(() => locale.isEn);
useTheme();

// Apply the persisted language to <html lang> on boot.
document.documentElement.lang = locale.isEn ? "en" : "km";

// Update page title for Galaxy TV
onMounted(() => {
  settingsStore.load().then(() => locale.syncWithSettings());
  document.title = "Galaxy TV 4K | ព័ត៌មាន";
});
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
