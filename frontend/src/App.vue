<template>
  <div ref="appRoot" class="news-app">
    <a href="#main-content" class="skip-link">{{ isZh ? "跳到内容" : isEn ? "Skip to content" : "រំលងទៅកាន់មាតិកា" }}</a>
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
import { computed, nextTick, onMounted, ref, watch } from "vue";
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
const isZh = computed(() => locale.isZh);
const currentLang = computed(() => {
  // Language-prefixed article URLs (/kh/news/*, /en/news/*) win; otherwise
  // the user's stored preference applies.
  const metaLocale = route.meta.locale as string | undefined;
  if (metaLocale === "kh") return "km";
  if (metaLocale === "en") return "en";
  if (metaLocale === "zh") return "zh";
  return isZh.value ? "zh" : isEn.value ? "en" : "km";
});
useTheme();

const appRoot = ref<HTMLElement | null>(null);

/** Apply lang-* class to the root div for per-language font CSS. */
function applyLangClass(lang: string) {
  if (!appRoot.value) return;
  appRoot.value.classList.remove("lang-kh", "lang-en", "lang-zh");
  if (lang === "zh") appRoot.value.classList.add("lang-zh");
  else if (lang === "en") appRoot.value.classList.add("lang-en");
  else appRoot.value.classList.add("lang-kh");
}

// Keep <html lang> (and dir) in sync with the active language so assistive
// tech and search engines always read the correct language (WCAG 3.1.1).
// Also apply lang-* CSS class to the root div for per-language font styling.
watch(
  currentLang,
  (lang) => {
    document.documentElement.lang = lang;
    document.documentElement.dir = "ltr";
    applyLangClass(lang);
  },
  { immediate: true }
);

// Update page title for Galaxy TV
onMounted(() => {
  settingsStore.load().then(() => locale.syncWithSettings());
  document.title = "Galaxy TV 4K | ព័ត៌មាន";
  // Ensure lang class is applied after mount (ref is now available)
  nextTick(() => applyLangClass(currentLang.value));
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
