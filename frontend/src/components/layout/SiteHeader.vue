<template>
  <header class="editorial-header" :class="{ 'is-sticky': isSticky }">
    <!-- Header top — utility bar: date + social (unchanged) -->
    <div class="editorial-utility">
      <div class="editorial-container editorial-utility-inner">
        <p class="editorial-date">
          <span class="editorial-date-dot" aria-hidden="true"></span>
          {{ todayLabel }}
        </p>
        <div class="editorial-utility-right">
          <LanguageSwitcher />
          <ul class="editorial-social" aria-label="បណ្តាញសង្គម">
          <li v-if="settings?.facebook"><a :href="settings.facebook" target="_blank" rel="noopener" aria-label="Facebook"><i class="fab fa-facebook-f"></i></a></li>
          <li v-if="settings?.youtube"><a :href="settings.youtube" target="_blank" rel="noopener" aria-label="YouTube"><i class="fab fa-youtube"></i></a></li>
          <li v-if="settings?.tiktok"><a :href="settings.tiktok" target="_blank" rel="noopener" aria-label="TikTok"><i class="fab fa-tiktok"></i></a></li>
          <li v-if="settings?.instagram"><a :href="settings.instagram" target="_blank" rel="noopener" aria-label="Instagram"><i class="fab fa-instagram"></i></a></li>
          <li v-if="settings?.telegram"><a :href="settings.telegram" target="_blank" rel="noopener" aria-label="Telegram"><i class="fab fa-telegram-plane"></i></a></li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Header mid — black bar: logo (left) + admin banner ad (right) -->
    <div class="editorial-mainbar">
      <div class="editorial-container editorial-mainbar-inner">
        <RouterLink to="/" class="editorial-logo" aria-label="Navatra 4K TV — ទំព័រដើម">
          <img :src="logoUrl" alt="Navatra 4K TV logo" />
        </RouterLink>

        <!-- Banner ad managed from Admin → Publishing → Banner Ads (position: header) -->
        <div class="editorial-header-ad">
          <AdSlot position="header" />
        </div>

        <button
          class="editorial-burger"
          :class="{ open: mobileOpen }"
          aria-label="បើកម៉ឺនុយ"
          :aria-expanded="mobileOpen"
          @click="mobileOpen = !mobileOpen"
        >
          <span></span><span></span><span></span>
        </button>
      </div>
    </div>

    <!-- Header bottom — nav bar: white centered nav; on scroll it pins,
         turns black and shows the logo on the left with nav on the right -->
    <div class="editorial-navbar">
      <div class="editorial-container editorial-navbar-inner">
        <RouterLink to="/" class="editorial-navbar-logo" aria-label="Navatra 4K TV — ទំព័រដើម">
          <img :src="logoUrl" alt="Navatra 4K TV logo" />
        </RouterLink>
        <nav class="editorial-nav" aria-label="ម៉ឺនុយចម្បង">
          <ul>
            <li v-for="item in navItems" :key="item.id">
              <RouterLink v-if="item.type === 'category'" :to="`/category/${item.value ?? ''}`">{{ locale.pick(item.label, item.labelEn) }}</RouterLink>
              <a v-else-if="item.type === 'link'" :href="item.value ?? '#'" target="_blank" rel="noopener">{{ locale.pick(item.label, item.labelEn) }}</a>
              <RouterLink v-else :to="navPath(item)">{{ locale.pick(item.label, item.labelEn) }}</RouterLink>
            </li>
          </ul>
        </nav>
      </div>
    </div>

    <!-- Mobile drawer -->
    <Transition name="mobile-drop">
      <div v-if="mobileOpen" class="editorial-mobile">
        <form class="editorial-mobile-search" role="search" @submit.prevent="submitSearch">
          <input v-model="searchInput" type="text" :placeholder="locale.t.search.placeholder" :aria-label="locale.t.common.search" />
          <button type="submit" :aria-label="locale.t.common.search"><i class="fas fa-search"></i></button>
        </form>
        <nav aria-label="ម៉ឺនុយទូរស័ព្ទ">
          <ul class="editorial-mobile-list">
            <li v-for="item in navItems" :key="item.id">
              <RouterLink v-if="item.type === 'category'" :to="`/category/${item.value ?? ''}`" @click="mobileOpen = false">{{ locale.pick(item.label, item.labelEn) }}</RouterLink>
              <a v-else-if="item.type === 'link'" :href="item.value ?? '#'" target="_blank" rel="noopener" @click="mobileOpen = false">{{ locale.pick(item.label, item.labelEn) }}</a>
              <RouterLink v-else :to="navPath(item)" @click="mobileOpen = false">{{ locale.pick(item.label, item.labelEn) }}</RouterLink>
            </li>
          </ul>
        </nav>
      </div>
    </Transition>
  </header>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from "vue";
import { useRouter } from "vue-router";
import { useSettingsStore } from "@/stores/settings";
import { useLocaleStore } from "@/stores/locale";
import LanguageSwitcher from "@/components/common/LanguageSwitcher.vue";
import AdSlot from "@/components/ads/AdSlot.vue";
import type { NavigationItem } from "@/types";
import { contentService } from "@/services/content.service";
import { toKhmerDigits } from "@/utils/format";

const router = useRouter();
const settingsStore = useSettingsStore();
const locale = useLocaleStore();

const searchInput = ref("");
const navItems = ref<NavigationItem[]>([]);
const mobileOpen = ref(false);
const isSticky = ref(false);
let scrollTimer: number | undefined;

const settings = computed(() => settingsStore.settings);
const logoUrl = computed(
  () => settings.value?.logo ?? "/assets/img/logo/logo1.png"
);

const todayLabel = computed(() => {
  const now = new Date();
  const days = ["អាទិត្យ", "ច័ន្ទ", "អង្គារ", "ពុធ", "ព្រហស្បតិ៍", "សុក្រ", "សៅរ៍"];
  const months = [
    "មករា", "កុម្ភៈ", "មីនា", "មេសា", "ឧសភា", "មិថុនា",
    "កក្កដា", "សីហា", "កញ្ញា", "តុលា", "វិច្ឆិកា", "ធ្នូ",
  ];
  return `ថ្ងៃ${days[now.getDay()]} ទី${toKhmerDigits(now.getDate())} ខែ${months[now.getMonth()]} ឆ្នាំ${toKhmerDigits(now.getFullYear())}`;
});

function navPath(item: NavigationItem) {
  if (item.type === "home") return "/";
  if (item.type === "page") {
    const routeNames: Record<string, string> = {
      news: "/news",
      latest: "/latest",
      about: "/about",
      contact: "/contact",
      categories: "/news",
    };
    return routeNames[item.value ?? ""] ?? item.value ?? "/news";
  }
  return item.value ?? "/";
}

function onScroll() {
  if (scrollTimer) window.clearTimeout(scrollTimer);
  scrollTimer = window.setTimeout(() => {
    const sticky = window.scrollY > 90;
    if (sticky !== isSticky.value) {
      isSticky.value = sticky;
      // Compensate the pinned bar so the page doesn't jump when it sticks.
      document.body.classList.toggle("has-editorial-sticky", sticky);
    }
  }, 50);
}

function submitSearch() {
  const q = searchInput.value.trim();
  if (!q) return;
  mobileOpen.value = false;
  router.push({ name: "search", query: { q } });
}

onMounted(() => {
  settingsStore.load();
  contentService
    .navigation()
    .then((items) => {
      navItems.value = items;
    })
    .catch(() => {
      navItems.value = [
        { id: 0, label: "ទំព័រដើម", labelEn: "Home", type: "home", value: "/", sortOrder: 1, isActive: true },
        { id: 0, label: "បញ្ជីព័ត៌មាន", labelEn: "News List", type: "page", value: "news", sortOrder: 2, isActive: true },
        { id: 0, label: "ប្រភេទ", labelEn: "Categories", type: "page", value: "categories", sortOrder: 3, isActive: true },
      ];
    });
  window.addEventListener("scroll", onScroll);
});

onUnmounted(() => {
  window.removeEventListener("scroll", onScroll);
  document.body.classList.remove("has-editorial-sticky");
  if (scrollTimer) window.clearTimeout(scrollTimer);
});
</script>

<style scoped>
/* ------------------------------------------------------------------
   Editorial header — 3 rows:
     top    utility (white, date + social + language)
     mid    brand bar (black, logo + admin banner ad)
     bottom nav bar (white, centered links)
   All rows align to the same container as the rest of the site.
------------------------------------------------------------------- */
.editorial-container {
  width: 100%;
  max-width: 1200px;
  margin-inline: auto;
  padding-inline: 24px;
}
@media (max-width: 640px) {
  .editorial-container {
    padding-inline: 16px;
  }
}

.editorial-header {
  position: relative;
  z-index: 1000;
  background: #fff;
}

/* ---------- Header top — utility bar (white, black text/icons) ---------- */
.editorial-utility {
  background: #fff;
  color: #111;
  border-bottom: 1px solid var(--color-border, #e5e7eb);
  font-size: 12.5px;
}
.editorial-utility-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 36px;
  gap: 12px;
}
.editorial-date {
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: var(--font-body, "Noto Sans Khmer", sans-serif);
  color: #111;
}
.editorial-date-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--color-accent, #fc3f00);
}
.editorial-utility-right {
  display: flex;
  align-items: center;
  gap: 16px;
}
.editorial-social {
  display: flex;
  gap: 14px;
  margin: 0;
  padding: 0;
  list-style: none;
}
.editorial-social a {
  color: #111;
  font-size: 13px;
  transition: color 0.2s ease;
}
.editorial-social a:hover {
  color: var(--color-primary, #0d3fa9);
}
@media (max-width: 640px) {
  .editorial-utility {
    display: none;
  }
}

/* ---------- Header mid — brand bar (solid black) ---------- */
.editorial-mainbar {
  background: #000;
  border-bottom: 1px solid rgba(255, 255, 255, 0.14);
}
.editorial-mainbar-inner {
  display: flex;
  align-items: center;
  gap: 24px;
  min-height: 84px;
}
.editorial-logo {
  flex-shrink: 0;
  display: flex;
  align-items: center;
}
.editorial-logo img {
  height: 68px;
  width: auto;
  max-width: 320px;
  object-fit: contain;
  /* Keep the brand logo in its original colors */
}
@media (max-width: 640px) {
  .editorial-logo img {
    height: 50px;
    max-width: 240px;
  }
}

/* Banner ad (from Admin → Banner Ads, position "header") — right side */
.editorial-header-ad {
  margin-left: auto;
  flex-shrink: 0;
  min-width: 0;
  max-width: 100%;
}
/* Compact inside the black bar: no outer margins, contain the image */
.editorial-header-ad :deep(.ad-slot) {
  margin: 0;
  align-items: flex-end;
}
.editorial-header-ad :deep(.ad-img) {
  max-height: 62px;
  width: auto;
  border-radius: 6px;
}
.editorial-header-ad :deep(.ad-slot-label) {
  color: rgba(255, 255, 255, 0.45);
}

/* ---------- Header bottom — nav bar (white, centered) ---------- */
.editorial-navbar {
  background: #fff;
  border-bottom: 1px solid var(--color-border, #e5e7eb);
  transition: background 0.3s ease, border-color 0.3s ease;
}
.editorial-navbar-inner {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 50px;
  gap: 24px;
}

/* Compact logo inside the nav bar — hidden at the top, revealed when
   the bar pins on scroll (black transform with nav pushed right). */
.editorial-navbar-logo {
  display: none;
  flex-shrink: 0;
  align-items: center;
}
.editorial-navbar-logo img {
  height: 46px;
  width: auto;
  max-width: 220px;
  object-fit: contain;
}

.editorial-nav {
  transition: margin 0.3s ease;
}
.editorial-nav ul {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin: 0;
  padding: 0;
  list-style: none;
}
.editorial-nav li a {
  display: inline-block;
  padding: 12px 14px;
  color: #111;
  font-family: var(--font-body, "Noto Sans Khmer", sans-serif);
  font-size: 15px;
  font-weight: 500;
  letter-spacing: 0.01em;
  text-decoration: none;
  transition: color 0.2s ease, font-weight 0.2s ease;
}
.editorial-nav li a:hover {
  color: var(--color-primary, #0d3fa9);
}
/* Active page = bold text, no underline — stays bold while on the page */
.editorial-nav li a.router-link-exact-active,
.editorial-nav li a.router-link-active {
  color: var(--color-primary, #0d3fa9);
  font-weight: 700;
}

/* ---------- Sticky — the visible bar pins to the top on scroll ----------
   Desktop: the nav bar pins, turns black, reveals the logo and pushes the
   items to the right. Mobile: the black brand bar pins (already black). */
.is-sticky .editorial-mainbar,
.is-sticky .editorial-navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 9999;
}
.is-sticky .editorial-mainbar {
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.35);
}

/* White → black transform on scroll, logo appears left, nav moves right */
.is-sticky .editorial-navbar {
  background: #000;
  border-bottom-color: rgba(255, 255, 255, 0.14);
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.35);
}
.is-sticky .editorial-navbar-inner {
  justify-content: space-between;
  min-height: 72px;
}
.is-sticky .editorial-navbar-logo {
  display: flex;
}
/* Bigger logo + padding in the pinned bar */
.is-sticky .editorial-navbar-logo img {
  height: 58px;
  max-width: 260px;
}
.is-sticky .editorial-nav li a {
  padding: 14px 16px;
}
.is-sticky .editorial-nav {
  margin-left: auto;
}
.is-sticky .editorial-nav li a {
  color: rgba(255, 255, 255, 0.9);
}
.is-sticky .editorial-nav li a:hover {
  color: #fff;
}
.is-sticky .editorial-nav li a.router-link-exact-active,
.is-sticky .editorial-nav li a.router-link-active {
  color: #fff;
  font-weight: 700;
}

@media (min-width: 992px) {
  /* On desktop the utility + brand bars scroll away; the nav bar pins */
  .is-sticky .editorial-mainbar {
    position: static;
    box-shadow: none;
  }
}
@keyframes headerFadeDown {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: none; }
}

/* Burger (mobile only) */
.editorial-burger {
  display: none;
  flex-direction: column;
  justify-content: center;
  gap: 5px;
  width: 42px;
  height: 42px;
  padding: 0 10px;
  border: none;
  border-radius: 10px;
  background: transparent;
  cursor: pointer;
  transition: background 0.2s ease;
}
.editorial-burger:hover {
  background: rgba(255, 255, 255, 0.12);
}
.editorial-burger span {
  display: block;
  height: 2px;
  width: 100%;
  background: #fff;
  border-radius: 2px;
  transition: transform 0.25s ease, opacity 0.25s ease;
}
.editorial-burger.open span:nth-child(1) { transform: translateY(7px) rotate(45deg); }
.editorial-burger.open span:nth-child(2) { opacity: 0; }
.editorial-burger.open span:nth-child(3) { transform: translateY(-7px) rotate(-45deg); }

/* Mobile drawer */
.editorial-mobile {
  background: #fff;
  border-bottom: 1px solid var(--color-border, #e5e7eb);
  padding: 16px;
  max-height: calc(100vh - 120px);
  overflow-y: auto;
}
.editorial-mobile-search {
  display: flex;
  gap: 8px;
  margin-bottom: 10px;
}
.editorial-mobile-search input {
  flex: 1;
  border: 1px solid var(--color-border, #e5e7eb);
  border-radius: 8px;
  padding: 10px 14px;
  font-size: 14px;
  font-family: var(--font-body, "Noto Sans Khmer", sans-serif);
  outline: none;
}
.editorial-mobile-search input:focus { border-color: var(--color-primary, #0d3fa9); }
.editorial-mobile-search button {
  border: none;
  background: var(--color-primary, #0d3fa9);
  color: #fff;
  border-radius: 8px;
  padding: 0 16px;
  cursor: pointer;
}
.editorial-mobile-list {
  margin: 0;
  padding: 0;
  list-style: none;
}
.editorial-mobile-list li {
  border-bottom: 1px solid #f1f5f9;
}
.editorial-mobile-list li:last-child { border-bottom: none; }
.editorial-mobile-list a {
  display: block;
  padding: 13px 6px;
  color: var(--color-text, #0b1c39);
  font-size: 15px;
  font-family: var(--font-body, "Noto Sans Khmer", sans-serif);
  font-weight: 500;
  text-decoration: none;
}
.editorial-mobile-list a.router-link-active { color: var(--color-primary, #0d3fa9); }

/* Responsive */
@media (max-width: 991px) {
  .editorial-navbar { display: none; }
  .editorial-burger { display: flex; margin-left: auto; }
  .editorial-mainbar-inner { min-height: 68px; gap: 12px; }
  /* Keep the bar clean on phones: logo left, burger right — hide the ad */
  .editorial-header-ad { display: none; }
}

/* Transitions */
.mobile-drop-enter-active, .mobile-drop-leave-active { transition: all 0.22s ease; }
.mobile-drop-enter-from, .mobile-drop-leave-to { opacity: 0; transform: translateY(-8px); }
</style>
