<template>
  <header class="g-header" :class="{ 'is-sticky': isSticky }">
    <!-- ─── Row 1: Utility bar (white, date + social + language) ─── -->
    <div class="g-utility">
      <div class="container g-utility-inner">
        <p class="g-utility-date">
          <span class="g-utility-dot" aria-hidden="true"></span>
          {{ todayLabel }}
        </p>
        <div class="g-utility-right">
          <LanguageSwitcher />
          <ul class="g-utility-social" aria-label="បណ្តាញសង្គម">
            <li v-if="settings?.facebook"><a :href="settings.facebook" target="_blank" rel="noopener" aria-label="Facebook"><i class="fab fa-facebook-f"></i></a></li>
            <li v-if="settings?.youtube"><a :href="settings.youtube" target="_blank" rel="noopener" aria-label="YouTube"><i class="fab fa-youtube"></i></a></li>
            <li v-if="settings?.tiktok"><a :href="settings.tiktok" target="_blank" rel="noopener" aria-label="TikTok"><i class="fab fa-tiktok"></i></a></li>
            <li v-if="settings?.instagram"><a :href="settings.instagram" target="_blank" rel="noopener" aria-label="Instagram"><i class="fab fa-instagram"></i></a></li>
            <li v-if="settings?.telegram"><a :href="settings.telegram" target="_blank" rel="noopener" aria-label="Telegram"><i class="fab fa-telegram-plane"></i></a></li>
          </ul>
        </div>
      </div>
    </div>

    <!-- ─── Row 2: Brand bar (deep navy, logo + ad banner) ─── -->
    <div class="g-brand">
      <div class="container g-brand-inner">
        <RouterLink to="/" class="g-brand-logo" :aria-label="`${siteName} — ទំព័រដើម`">
          <img :src="logoUrl" :alt="siteName" />
        </RouterLink>

        <!-- Admin-managed banner ad (position: header) -->
        <div class="g-brand-ad">
          <AdSlot position="header" />
        </div>

        <!-- Mobile burger — right side -->
        <button
          class="g-burger"
          :class="{ open: mobileOpen }"
          aria-label="បើកម៉ឺនុយ"
          :aria-expanded="mobileOpen"
          @click="mobileOpen = !mobileOpen"
        >
          <span></span><span></span><span></span>
        </button>
      </div>
    </div>

    <!-- ─── Row 3: Nav bar (white → dark on scroll, centered links) ─── -->
    <div class="g-navbar">
      <div class="container g-navbar-inner">
        <!-- Logo appears on left when sticky -->
        <RouterLink to="/" class="g-navbar-logo" :aria-label="`${siteName} — ទំព័រដើម`">
          <img :src="logoUrl" :alt="siteName" />
        </RouterLink>

        <nav class="g-nav" aria-label="ម៉ឺនុយចម្បង">
          <ul>
            <li v-for="item in navItems" :key="item.id">
              <RouterLink
                v-if="item.type === 'category'"
                :to="`/category/${item.value ?? ''}`"
                :class="{ 'is-active': isActive(`/category/${item.value}`) }"
              >
                {{ locale.pick(item.label, item.labelEn) }}
              </RouterLink>
              <a
                v-else-if="item.type === 'link'"
                :href="item.value ?? '#'"
                target="_blank"
                rel="noopener"
              >
                {{ locale.pick(item.label, item.labelEn) }}
              </a>
              <RouterLink
                v-else
                :to="navPath(item)"
                :class="{ 'is-active': isActive(navPath(item)) }"
              >
                {{ locale.pick(item.label, item.labelEn) }}
              </RouterLink>
            </li>
          </ul>
        </nav>
      </div>
    </div>

    <!-- ─── Mobile drawer ─── -->
    <Transition name="g-mobile-drop">
      <div v-if="mobileOpen" class="g-mobile">
        <form class="g-mobile-search" role="search" @submit.prevent="submitSearch">
          <input
            v-model="searchInput"
            type="text"
            :placeholder="locale.t.search.placeholder"
            :aria-label="locale.t.common.search"
          />
          <button type="submit" :aria-label="locale.t.common.search">
            <i class="fas fa-search"></i>
          </button>
        </form>
        <nav aria-label="ម៉ឺនុយទូរស័ព្ទ">
          <ul class="g-mobile-list">
            <li v-for="item in navItems" :key="item.id">
              <RouterLink
                v-if="item.type === 'category'"
                :to="`/category/${item.value ?? ''}`"
                @click="mobileOpen = false"
              >
                {{ locale.pick(item.label, item.labelEn) }}
              </RouterLink>
              <a
                v-else-if="item.type === 'link'"
                :href="item.value ?? '#'"
                target="_blank"
                rel="noopener"
                @click="mobileOpen = false"
              >
                {{ locale.pick(item.label, item.labelEn) }}
              </a>
              <RouterLink
                v-else
                :to="navPath(item)"
                @click="mobileOpen = false"
              >
                {{ locale.pick(item.label, item.labelEn) }}
              </RouterLink>
            </li>
          </ul>
        </nav>
      </div>
    </Transition>
  </header>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useSettingsStore } from "@/stores/settings";
import { useLocaleStore } from "@/stores/locale";
import LanguageSwitcher from "@/components/common/LanguageSwitcher.vue";
import AdSlot from "@/components/ads/AdSlot.vue";
import type { NavigationItem } from "@/types";
import { contentService } from "@/services/content.service";
import { toKhmerDigits } from "@/utils/format";

const router = useRouter();
const route = useRoute();
const settingsStore = useSettingsStore();
const locale = useLocaleStore();

const searchInput = ref("");
const navItems = ref<NavigationItem[]>([]);
const mobileOpen = ref(false);
const isSticky = ref(false);
let scrollTimer: number | undefined;

const settings = computed(() => settingsStore.settings);
const logoUrl = computed(() => settings.value?.logo ?? "/assets/img/logo/logo1.png");
const siteName = computed(() => locale.pick(settings.value?.siteName ?? "Galaxy TV 4K", settings.value?.siteNameEn));

const todayLabel = computed(() => {
  const now = new Date();
  const days = ["អាទិត្យ", "ច័ន្ទ", "អង្គារ", "ពុធ", "ព្រហស្បតិ៍", "សុក្រ", "សៅរ៍"];
  const months = [
    "មករា", "កុម្ភៈ", "មីនា", "មេសា", "ឧសភា", "មិថុនា",
    "កក្កដា", "សីហា", "កញ្ញា", "តុលា", "វិច្ឆិកា", "ធ្នូ",
  ];
  return `ថ្ងៃ${days[now.getDay()]} ទី${toKhmerDigits(now.getDate())} ខែ${months[now.getMonth()]} ឆ្នាំ${toKhmerDigits(now.getFullYear())}`;
});

function isActive(path: string): boolean {
  if (path === "/") return route.path === "/";
  return route.path.startsWith(path);
}

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
    .then((items) => { navItems.value = items; })
    .catch(() => {
      navItems.value = [
        { id: 0, label: "ទំព័រដើម", labelEn: "Home", type: "home", value: "/", sortOrder: 1, isActive: true },
        { id: 0, label: "បញ្ជីព័ត៌មាន", labelEn: "News List", type: "page", value: "news", sortOrder: 2, isActive: true },
        { id: 0, label: "ប្រភេទ", labelEn: "Categories", type: "page", value: "categories", sortOrder: 3, isActive: true },
      ];
    });
  window.addEventListener("scroll", onScroll, { passive: true });
});

onUnmounted(() => {
  window.removeEventListener("scroll", onScroll);
  document.body.classList.remove("has-editorial-sticky");
  if (scrollTimer) window.clearTimeout(scrollTimer);
});
</script>

<style scoped>
/* ==================================================================
   Galaxy TV Header — 3-row editorial layout
   Row 1: Utility bar (white, date + social + language)
   Row 2: Brand bar (deep navy, logo + admin ad banner)
   Row 3: Nav bar (white centered → dark sticky with logo)
=================================================================== */

/* ─── Shared ─── */
.g-header {
  position: relative;
  z-index: 1000;
  background: #fff;
}

/* ─── Row 1: Utility bar ─── */
.g-utility {
  background: #fff;
  color: var(--color-text);
  border-bottom: 1px solid var(--color-border);
  font-size: 12.5px;
}
.g-utility-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 36px;
  gap: 12px;
}
.g-utility-date {
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: var(--font-body);
  color: var(--color-text-secondary);
}
.g-utility-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--color-live);
}
.g-utility-right {
  display: flex;
  align-items: center;
  gap: 16px;
}
.g-utility-social {
  display: flex;
  gap: 14px;
  margin: 0;
  padding: 0;
  list-style: none;
}
.g-utility-social a {
  color: var(--color-text-secondary);
  font-size: 13px;
  transition: color 0.2s ease;
}
.g-utility-social a:hover {
  color: var(--color-accent);
}
@media (max-width: 640px) {
  .g-utility { display: none; }
}

/* ─── Row 2: Brand bar (deep navy) ─── */
.g-brand {
  background: var(--color-primary);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}
.g-brand-inner {
  display: flex;
  align-items: center;
  gap: 24px;
  min-height: 80px;
}
.g-brand-logo {
  flex-shrink: 0;
  display: flex;
  align-items: center;
}
.g-brand-logo img {
  height: 64px;
  width: auto;
  max-width: 320px;
  object-fit: contain;
}
@media (max-width: 640px) {
  .g-brand-logo img {
    height: 48px;
    max-width: 200px;
  }
  .g-brand-inner {
    min-height: 64px;
    gap: 12px;
  }
}

/* Ad banner (admin-managed, position: header) — right side */
.g-brand-ad {
  margin-left: auto;
  flex-shrink: 0;
  min-width: 0;
}
.g-brand-ad :deep(.ad-slot) {
  margin: 0;
  align-items: flex-end;
}
.g-brand-ad :deep(.ad-img) {
  max-height: 62px;
  width: auto;
  border-radius: 6px;
}

/* Burger (mobile) */
.g-burger {
  display: none;
  flex-direction: column;
  justify-content: center;
  gap: 5px;
  width: 42px;
  height: 42px;
  padding: 0 10px;
  border: none;
  border-radius: 8px;
  background: transparent;
  cursor: pointer;
  margin-left: auto;
  transition: background 0.2s ease;
}
.g-burger:hover {
  background: rgba(255, 255, 255, 0.12);
}
.g-burger span {
  display: block;
  height: 2px;
  width: 100%;
  background: #fff;
  border-radius: 2px;
  transition: transform 0.25s ease, opacity 0.25s ease;
}
.g-burger.open span:nth-child(1) { transform: translateY(7px) rotate(45deg); }
.g-burger.open span:nth-child(2) { opacity: 0; }
.g-burger.open span:nth-child(3) { transform: translateY(-7px) rotate(-45deg); }

/* ─── Row 3: Nav bar ─── */
.g-navbar {
  background: #fff;
  border-bottom: 1px solid var(--color-border);
  transition: background 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
}
.g-navbar-inner {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 50px;
  gap: 24px;
}

/* Logo inside nav — hidden at top, revealed when sticky */
.g-navbar-logo {
  display: none;
  flex-shrink: 0;
  align-items: center;
}
.g-navbar-logo img {
  height: 44px;
  width: auto;
  max-width: 200px;
  object-fit: contain;
}

.g-nav ul {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2px;
  margin: 0;
  padding: 0;
  list-style: none;
}
.g-nav li a {
  display: inline-block;
  padding: 12px 16px;
  color: var(--color-text);
  font-family: var(--font-body);
  font-size: 15px;
  font-weight: 500;
  letter-spacing: 0.01em;
  text-decoration: none;
  position: relative;
  transition: color 0.2s ease;
}
.g-nav li a::after {
  content: "";
  position: absolute;
  bottom: 0;
  left: 16px;
  right: 16px;
  height: 2px;
  background: var(--color-accent);
  border-radius: 2px;
  transform: scaleX(0);
  transition: transform 0.25s ease;
}
.g-nav li a:hover {
  color: var(--color-accent);
}
.g-nav li a:hover::after {
  transform: scaleX(1);
}
/* Active = bold + accent underline visible */
.g-nav li a.is-active {
  color: var(--color-accent);
  font-weight: 700;
}
.g-nav li a.is-active::after {
  transform: scaleX(1);
}

/* ─── Sticky state ─── */
.is-sticky .g-brand,
.is-sticky .g-navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 9999;
}
.is-sticky .g-brand {
  box-shadow: var(--shadow-header);
}
.is-sticky .g-navbar {
  background: var(--color-primary);
  border-bottom-color: rgba(255, 255, 255, 0.1);
  box-shadow: var(--shadow-header);
}
.is-sticky .g-navbar-inner {
  justify-content: space-between;
  min-height: 64px;
}
.is-sticky .g-navbar-logo {
  display: flex;
}
.is-sticky .g-navbar-logo img {
  height: 52px;
  max-width: 240px;
}
.is-sticky .g-nav li a {
  padding: 14px 18px;
  color: rgba(255, 255, 255, 0.88);
}
.is-sticky .g-nav li a::after {
  background: rgba(255, 255, 255, 0.8);
}
.is-sticky .g-nav li a:hover {
  color: #fff;
}
.is-sticky .g-nav li a.is-active {
  color: #fff;
  font-weight: 700;
}
.is-sticky .g-nav {
  margin-left: auto;
}

@media (min-width: 992px) {
  /* On desktop the utility + brand bars scroll away; only the nav pins */
  .is-sticky .g-brand {
    position: static;
    box-shadow: none;
  }
}

/* ─── Mobile drawer ─── */
.g-mobile {
  background: #fff;
  border-bottom: 1px solid var(--color-border);
  padding: 16px;
  max-height: calc(100vh - 120px);
  overflow-y: auto;
}
.g-mobile-search {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}
.g-mobile-search input {
  flex: 1;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-button);
  padding: 10px 14px;
  font-size: 14px;
  font-family: var(--font-body);
  outline: none;
  transition: border-color 0.2s ease;
}
.g-mobile-search input:focus {
  border-color: var(--color-accent);
}
.g-mobile-search button {
  border: none;
  background: var(--color-accent);
  color: #fff;
  border-radius: var(--radius-button);
  padding: 0 16px;
  cursor: pointer;
  transition: background 0.2s ease;
}
.g-mobile-search button:hover {
  background: #4338ca;
}
.g-mobile-list {
  margin: 0;
  padding: 0;
  list-style: none;
}
.g-mobile-list li {
  border-bottom: 1px solid #f1f5f9;
}
.g-mobile-list li:last-child {
  border-bottom: none;
}
.g-mobile-list a {
  display: block;
  padding: 14px 6px;
  color: var(--color-text);
  font-size: 15px;
  font-family: var(--font-body);
  font-weight: 500;
  text-decoration: none;
  transition: color 0.2s ease;
}
.g-mobile-list a.router-link-active {
  color: var(--color-accent);
  font-weight: 700;
}

/* ─── Responsive ─── */
@media (max-width: 991px) {
  .g-navbar { display: none; }
  .g-burger { display: flex; }
  .g-brand-ad { display: none; }
}

/* ─── Transitions ─── */
.g-mobile-drop-enter-active,
.g-mobile-drop-leave-active {
  transition: all 0.22s ease;
}
.g-mobile-drop-enter-from,
.g-mobile-drop-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
