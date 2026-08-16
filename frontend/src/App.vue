<template>
  <div class="news-app">
    <a href="#main-content" class="skip-link">រំលងទៅកាន់មាតិកា</a>
    <SiteHeader v-if="!route.meta.bare" />
    <main id="main-content" tabindex="-1">
      <RouterView v-slot="{ Component }">
        <Transition name="fade" mode="out-in">
          <component :is="Component" :key="route.fullPath" />
        </Transition>
      </RouterView>
    </main>
    <SiteFooter v-if="!route.meta.bare" />
  </div>
</template>

<script setup lang="ts">
import { useRoute } from "vue-router";
import SiteHeader from "@/components/layout/SiteHeader.vue";
import SiteFooter from "@/components/layout/SiteFooter.vue";

const route = useRoute();
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

/* Skip link: visible on keyboard focus only */
.skip-link {
  position: absolute;
  top: -48px;
  left: 12px;
  z-index: 2000;
  background: #0d3fa9;
  color: #ffffff;
  padding: 10px 18px;
  border-radius: 0 0 8px 8px;
  font-family: "Noto Sans Khmer", "Kantumruy", sans-serif;
  font-size: 14px;
  text-decoration: none;
  transition: top 0.2s ease;
}
.skip-link:focus-visible {
  top: 0;
}
</style>
