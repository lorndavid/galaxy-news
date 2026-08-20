<template>
  <header class="g-header" :class="{ 'is-sticky': isSticky }">
    <!-- ─── Row 1: Utility bar (date + social + language) ─── -->
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

    <!-- ─── Row 2: Brand bar — logo left, ad banner right ─── -->
    <div class="g-brand">
      <div class="container g-brand-inner">
        <RouterLink to="/" class="g-brand-logo" :aria-label="`${siteName} — ទំព័រដើម`">
          <img :src="logoUrl" :alt="siteName" />
        </RouterLink>

        <!-- Admin-managed banner ad (position: header) — right side -->
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

    <!-- ─── Row 3: Nav bar (centered links + search) ─── -->
    <div class="g-navbar">
      <div class="container g-navbar-inner">
        <!-- Logo appears on left when sticky -->
        <RouterLink to="/" class="g-navbar-logo" :aria-label="`${siteName} — ទំព័រដើម`">
          <img :src="logoUrl" :alt="siteName" />
        </RouterLink>

        <nav class="g-nav" aria-label="ម៉ឺនុយចម្បង">
          <ul>
            <!-- Home + main items (max 6 direct, 7th slot = "More") -->
            <li v-for="item in navBarItems" :key="item.id">
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

            <!-- Extra admin items collapse into a hover dropdown -->
            <li v-if="moreNavItems.length" class="g-nav-more">
              <a href="#" @click.prevent>
                {{ locale.t.nav.more }} <i class="ti-angle-down" aria-hidden="true"></i>
              </a>
              <ul class="g-nav-more-dropdown">
                <li v-for="item in moreNavItems" :key="item.id">
                  <a
                    v-if="item.type === 'link'"
                    :href="item.value ?? '#'"
                    target="_blank"
                    rel="noopener"
                  >
                    {{ locale.pick(item.label, item.labelEn) }}
                  </a>
                  <RouterLink v-else :to="navPath(item)">
                    {{ locale.pick(item.label, item.labelEn) }}
                  </RouterLink>
                </li>
              </ul>
            </li>
          </ul>
        </nav>

        <!-- Desktop search toggle -->
        <button
          class="g-search-toggle"
          type="button"
          :aria-label="locale.t.common.search"
          :aria-expanded="desktopSearchOpen"
          :class="{ 'is-open': desktopSearchOpen }"
          @click="desktopSearchOpen = !desktopSearchOpen"
        >
          <i class="fas fa-search" aria-hidden="true"></i>
        </button>
      </div>
    </div>

    <!-- ─── Desktop search bar (slide-down) ─── -->
    <Transition name="g-search-slide">
      <form v-if="desktopSearchOpen" class="g-search-bar" role="search" @submit.prevent="submitSearch">
        <div class="container g-search-bar-inner">
          <i class="fas fa-search g-search-bar-icon" aria-hidden="true"></i>
          <input
            ref="desktopSearchInput"
            v-model="searchInput"
            type="text"
            :placeholder="locale.t.search.placeholder"
            :aria-label="locale.t.common.search"
          />
          <button type="submit" class="g-search-go">
            <i class="fas fa-arrow-right" aria-hidden="true"></i>
            <span>{{ locale.t.common.search }}</span>
          </button>
          <button
            type="button"
            class="g-search-close"
            :aria-label="locale.t.common.close"
            @click="desktopSearchOpen = false"
          >
            <i class="fas fa-times" aria-hidden="true"></i>
          </button>
        </div>
      </form>
    </Transition>

    <!-- ─── Mobile drawer (slide-in from right) ─── -->
    <Teleport to="body">
      <Transition name="g-drawer-overlay">
        <div v-if="mobileOpen" class="g-mobile-overlay" @click="mobileOpen = false"></div>
      </Transition>
      <Transition name="g-drawer-slide">
        <div v-if="mobileOpen" class="g-mobile-drawer">
          <div class="g-drawer-header">
            <span class="g-drawer-title">{{ locale.pick(settings?.siteName ?? 'Galaxy TV', settings?.siteNameEn) }}</span>
            <button class="g-drawer-close" aria-label="បិទម៉ឺនុយ" @click="mobileOpen = false">
              <i class="fas fa-times" aria-hidden="true"></i>
            </button>
          </div>
          <form class="g-drawer-search" role="search" @submit.prevent="submitSearch">
            <i class="fas fa-search g-drawer-search-icon" aria-hidden="true"></i>
            <input
              v-model="searchInput"
              type="text"
              :placeholder="locale.t.search.placeholder"
              :aria-label="locale.t.common.search"
            />
            <button type="submit" :aria-label="locale.t.common.search">
              <i class="fas fa-arrow-right"></i>
            </button>
          </form>
          <nav aria-label="ម៉ឺនុយទូរស័ព្ទ">
            <ul class="g-drawer-nav">
              <li v-for="item in allNavItems" :key="item.id">
                <RouterLink
                  v-if="item.type === 'category'"
                  :to="`/category/${item.value ?? ''}`"
                  class="g-drawer-nav-item"
                  @click="mobileOpen = false"
                >
                  <span>{{ locale.pick(item.label, item.labelEn) }}</span>
                  <i class="fas fa-chevron-right g-drawer-arrow" aria-hidden="true"></i>
                </RouterLink>
                <a
                  v-else-if="item.type === 'link'"
                  :href="item.value ?? '#'"
                  target="_blank"
                  rel="noopener"
                  class="g-drawer-nav-item"
                  @click="mobileOpen = false"
                >
                  <span>{{ locale.pick(item.label, item.labelEn) }}</span>
                  <i class="fas fa-arrow-up-right-from-square g-drawer-arrow" aria-hidden="true"></i>
                </a>
                <RouterLink
                  v-else
                  :to="navPath(item)"
                  class="g-drawer-nav-item"
                  @click="mobileOpen = false"
                >
                  <span>{{ locale.pick(item.label, item.labelEn) }}</span>
                  <i class="fas fa-chevron-right g-drawer-arrow" aria-hidden="true"></i>
                </RouterLink>
              </li>
            </ul>
          </nav>
          <div class="g-drawer-footer">
            <LanguageSwitcher />
          </div>
        </div>
      </Transition>
    </Teleport>
  </header>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from "vue";
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
const desktopSearchOpen = ref(false);
const desktopSearchInput = ref<HTMLInputElement | null>(null);
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

watch(desktopSearchOpen, async (open) => {
  if (open) {
    await nextTick();
    desktopSearchInput.value?.focus();
  }
});

// Lock body scroll when mobile drawer is open
watch(mobileOpen, (open) => {
  if (open) {
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
  } else {
    document.body.style.overflow = '';
    document.body.style.position = '';
    document.body.style.width = '';
  }
});

// Clean up on unmount
import { onBeforeUnmount } from 'vue';
onBeforeUnmount(() => {
  document.body.style.overflow = '';
  document.body.style.position = '';
  document.body.style.width = '';
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

/** Bar capacity: 7 slots total — 6 direct items + "More". */
const MAX_BAR_ITEMS = 7;

/** Home is always the first item in the bar (unless the admin already added one). */
const homeItem = computed<NavigationItem>(() => ({
  id: -1,
  label: locale.t.nav.home,
  labelEn: "Home",
  type: "home",
  value: "/",
  config: null,
  sortOrder: 0,
  isActive: true,
}));

/** Home first, then admin items in their sort order (no duplicate Home). */
const allNavItems = computed(() => {
  const hasHome = navItems.value.some((i) => i.type === "home");
  return hasHome ? navItems.value : [homeItem.value, ...navItems.value];
});

/** Items rendered directly in the bar (max 6 when "More" is present). */
const navBarItems = computed(() =>
  allNavItems.value.length > MAX_BAR_ITEMS
    ? allNavItems.value.slice(0, MAX_BAR_ITEMS - 1)
    : allNavItems.value
);

/** Overflow items — shown in the clean one-column "More" dropdown. */
const moreNavItems = computed(() =>
  allNavItems.value.length > MAX_BAR_ITEMS ? allNavItems.value.slice(MAX_BAR_ITEMS - 1) : []
);

function submitSearch() {
  const q = searchInput.value.trim();
  if (!q) return;
  mobileOpen.value = false;
  desktopSearchOpen.value = false;
  searchInput.value = "";
  router.push({ name: "search", query: { q } });
}

function onScroll() {
  if (scrollTimer) window.clearTimeout(scrollTimer);
  scrollTimer = window.setTimeout(() => {
    const sticky = window.scrollY > 130;
    if (sticky !== isSticky.value) {
      isSticky.value = sticky;
      document.body.classList.toggle("has-sticky-nav", sticky);
    }
  }, 50);
}

onMounted(() => {
  settingsStore.load();
  contentService
    .navigation()
    .then((items) => { navItems.value = items; })
    .catch(() => {
      navItems.value = [
        { id: 0, label: "ទំព័រដើម", labelEn: "Home", type: "home", value: "/", config: null, sortOrder: 1, isActive: true },
        { id: 0, label: "បញ្ជីព័ត៌មាន", labelEn: "News List", type: "page", value: "news", config: null, sortOrder: 2, isActive: true },
        { id: 0, label: "ប្រភេទ", labelEn: "Categories", type: "page", value: "categories", config: null, sortOrder: 3, isActive: true },
      ];
    });
  window.addEventListener("scroll", onScroll, { passive: true });
});

onUnmounted(() => {
  window.removeEventListener("scroll", onScroll);
  document.body.classList.remove("has-sticky-nav");
  if (scrollTimer) window.clearTimeout(scrollTimer);
});
</script>

<style scoped>
/* ==================================================================
   Galaxy TV Header — 3-row editorial layout
   Row 1: Utility bar (header bg, date + social + language)
   Row 2: Brand bar (primary, logo + admin ad banner)
   Row 3: Nav bar (header bg centered → sticky with logo)
   All row colors come from the admin theme (--color-header-*).
=================================================================== */

/* ─── Shared ─── */
.g-header {
  position: relative;
  z-index: 1000;
  background: var(--color-header-bg);
  color: var(--color-header-text);
}

/* ─── Row 1: Utility bar ─── */
.g-utility {
  background: var(--color-header-bg);
  color: var(--color-header-text);
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
  color: var(--color-header-muted);
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
  color: var(--color-header-muted);
  font-size: 13px;
  transition: color 0.2s ease;
}
.g-utility-social a:hover {
  color: var(--color-accent);
}
@media (max-width: 640px) {
  .g-utility { display: none; }
}

/* ─── Row 2: Brand bar — logo left, ad banner right ─── */
.g-brand {
  background: var(--color-primary);
  border-bottom: 2px solid var(--color-header-bg);
}
.g-brand-inner {
  display: flex;
  align-items: center;
  min-height: 88px;
}
.g-brand-logo {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}
.g-brand-logo img {
  height: 125px;
  width: auto;
  max-width: 600px;
  object-fit: contain;
}

/* Ad banner (admin-managed, position: header) — right side */
.g-brand-ad {
  margin-left: auto;
  flex-shrink: 0;
  min-width: 0;
  display: flex;
  justify-content: flex-end;
}
.g-brand-ad :deep(.ad-slot) {
  margin: 0;
  align-items: flex-end;
}
.g-brand-ad :deep(.ad-img) {
  max-height: 64px;
  width: auto;
}

/* Burger (mobile) — right side */
.g-burger {
  display: none;
  flex-direction: column;
  justify-content: center;
  gap: 5px;
  width: 42px;
  height: 42px;
  padding: 0 10px;
  border: none;
  background: transparent;
  cursor: pointer;
  margin-left: auto;
  flex-shrink: 0;
  transition: background 0.2s ease;
}
@media (max-width: 640px) {
  .g-brand-logo img {
    height: 74px;
    max-width: 288px;
  }
  .g-brand-inner {
    min-height: 56px;
  }
  .g-burger {
    width: 38px;
    height: 38px;
  }
}
@media (max-width: 991px) {
  .g-brand-ad {
    display: none;
  }
}
.g-burger:hover {
  background: color-mix(in srgb, var(--color-header-text) 10%, transparent);
}
.g-burger span {
  display: block;
  height: 2px;
  width: 100%;
  background: var(--color-primary-contrast, #fff);
  transition: transform 0.25s ease, opacity 0.25s ease;
}
.g-burger.open span:nth-child(1) { transform: translateY(7px) rotate(45deg); }
.g-burger.open span:nth-child(2) { opacity: 0; }
.g-burger.open span:nth-child(3) { transform: translateY(-7px) rotate(-45deg); }

/* ─── Row 3: Nav bar ─── */
.g-navbar {
  background: var(--color-header-bg);
  transition: background 0.3s ease;
}
.g-navbar-inner {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 50px;
  gap: 16px;
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

.g-nav {
  flex: 1;
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
/* Vertical separators between top-level menu items */
.g-nav > ul > li + li {
  border-left: 1px solid var(--color-border);
}
.g-nav li a {
  display: inline-block;
  padding: 12px 16px;
  color: var(--color-header-text);
  font-family: var(--font-body);
  font-size: 15px;
  font-weight: 500;
  letter-spacing: 0.01em;
  text-decoration: none;
  transition: color 0.2s ease;
}
.g-nav li a:hover {
  color: var(--color-accent);
}
/* Active = bold + accent color */
.g-nav li a.is-active {
  color: var(--color-accent);
  font-weight: 700;
}

/* ─── "More" hover dropdown for admin-added items ─── */
.g-nav .g-nav-more {
  position: relative;
}
.g-nav-more > a {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding-right: 14px;
  padding-left: 14px;
}
.g-nav-more > a i {
  font-size: 11px;
  transition: transform 0.2s ease;
}
.g-nav-more:hover > a i {
  transform: rotate(180deg);
}
.g-nav-more-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  z-index: 1200;
  min-width: 230px;
  margin: 0;
  padding: 8px 0;
  list-style: none;
  background: var(--color-header-bg);
  border: 1px solid var(--color-border);
  border-top: 2px solid var(--color-accent);
  box-shadow: var(--shadow-elevated);
  opacity: 0;
  visibility: hidden;
  transform: translateY(8px);
  transition: opacity 0.18s ease, transform 0.18s ease, visibility 0.18s;
}
.g-nav-more:hover .g-nav-more-dropdown,
.g-nav-more:focus-within .g-nav-more-dropdown {
  opacity: 1;
  visibility: visible;
  transform: translateY(0);
}
.g-nav-more-dropdown li {
  border-left: 2px solid transparent;
  transition: border-color 0.15s ease, background 0.15s ease;
}
.g-nav-more-dropdown li:hover {
  border-left-color: var(--color-accent);
  background: var(--color-surface-alt);
}
.g-nav-more-dropdown a {
  display: block;
  padding: 10px 16px;
  color: var(--color-header-text);
  font-size: 14px;
  font-weight: 500;
  text-decoration: none;
  white-space: nowrap;
  transition: color 0.15s ease;
}
.g-nav-more-dropdown a:hover {
  color: var(--color-accent);
}
/* Sticky (dark) variant */
.is-sticky .g-nav-more-dropdown {
  background: #0b1c39;
  border-color: rgba(255, 255, 255, 0.15);
  border-top-color: var(--color-accent);
}
.is-sticky .g-nav-more-dropdown li:hover {
  background: rgba(255, 255, 255, 0.06);
}
.is-sticky .g-nav-more-dropdown a {
  color: #fff;
}
.is-sticky .g-nav-more-dropdown a:hover {
  color: var(--color-accent);
}

/* Desktop search toggle */
.g-search-toggle {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border: none;
  border-left: 1px solid var(--color-border);
  background: transparent;
  color: var(--color-header-text);
  font-size: 15px;
  cursor: pointer;
  transition: color 0.2s ease, background 0.2s ease;
}
.g-search-toggle:hover,
.g-search-toggle.is-open {
  color: var(--color-primary-contrast, #fff);
  background: var(--color-primary);
}

/* ─── Sticky state — pins a compact bar: logo left, nav items right ─── */
.is-sticky .g-navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 9999;
  background: #0b1c39;
  box-shadow: var(--shadow-header);
}
.is-sticky .g-navbar-inner {
  justify-content: space-between;
  min-height: 60px;
}
.is-sticky .g-navbar-logo {
  display: flex;
}
.is-sticky .g-navbar-logo img {
  height: 44px;
  max-width: 220px;
}
.is-sticky .g-nav {
  margin-left: auto;
}
.is-sticky .g-nav ul {
  justify-content: flex-end;
}
.is-sticky .g-nav > ul > li + li {
  border-left-color: rgba(255, 255, 255, 0.2);
}
.is-sticky .g-nav li a {
  padding: 18px 16px;
  color: #fff;
}
.is-sticky .g-nav li a:hover,
.is-sticky .g-nav li a.is-active {
  color: var(--color-accent);
}
.is-sticky .g-search-toggle {
  color: #fff;
  border-left-color: rgba(255, 255, 255, 0.2);
}
.is-sticky .g-search-toggle:hover,
.is-sticky .g-search-toggle.is-open {
  color: #fff;
  background: var(--color-accent);
}

/* Mobile: pin the brand bar (logo + burger) for quick access on scroll */
@media (max-width: 991px) {
  .is-sticky .g-brand {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 9999;
    box-shadow: var(--shadow-header);
  }
}

/* ─── Desktop search bar ─── */
.g-search-bar {
  background: var(--color-primary);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding: 14px 0;
}
.g-search-bar-inner {
  display: flex;
  align-items: center;
  gap: 14px;
}
.g-search-bar-icon {
  color: rgba(255, 255, 255, 0.6);
  font-size: 16px;
  flex-shrink: 0;
}
.g-search-bar-inner input {
  flex: 1;
  min-width: 0;
  border: none;
  border-bottom: 1px solid rgba(255, 255, 255, 0.35);
  background: transparent;
  color: #fff;
  font-family: var(--font-body);
  font-size: 15px;
  padding: 8px 2px;
  outline: none;
  transition: border-color 0.2s ease;
}
.g-search-bar-inner input::placeholder {
  color: rgba(255, 255, 255, 0.45);
}
.g-search-bar-inner input:focus {
  border-bottom-color: var(--color-accent);
}
.g-search-go {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border: none;
  background: var(--color-accent);
  color: #fff;
  font-family: var(--font-body);
  font-size: 13px;
  font-weight: 600;
  padding: 9px 18px;
  cursor: pointer;
  transition: filter 0.2s ease;
}
.g-search-go:hover {
  filter: brightness(1.1);
}
.g-search-close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: none;
  background: transparent;
  color: rgba(255, 255, 255, 0.7);
  font-size: 15px;
  cursor: pointer;
  transition: color 0.2s ease;
}
.g-search-close:hover {
  color: #fff;
}
.g-search-slide-enter-active,
.g-search-slide-leave-active {
  transition: all 0.22s ease;
}
.g-search-slide-enter-from,
.g-search-slide-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

/* ─── Mobile drawer (slide-in from right) ─── */
.g-mobile-overlay {
  position: fixed;
  inset: 0;
  z-index: 10000;
  background: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(2px);
}
.g-mobile-drawer {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  z-index: 10001;
  width: min(320px, 85vw);
  max-width: 320px;
  background: var(--color-header-bg);
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  overscroll-behavior: contain;
}
.g-drawer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--color-border);
  flex-shrink: 0;
}
.g-drawer-title {
  font-size: 15px;
  font-weight: 700;
  color: var(--color-header-text);
  font-family: var(--font-heading);
}
.g-drawer-close {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: var(--color-surface-alt);
  border-radius: 8px;
  color: var(--color-header-text);
  font-size: 16px;
  cursor: pointer;
  transition: background 0.15s ease;
}
.g-drawer-close:hover {
  background: var(--color-border);
}
.g-drawer-search {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 12px 16px;
  background: var(--color-surface-alt);
  border: 1px solid var(--color-border);
  border-radius: 10px;
  padding: 0 12px;
  flex-shrink: 0;
}
.g-drawer-search-icon {
  color: var(--color-muted);
  font-size: 14px;
  flex-shrink: 0;
}
.g-drawer-search input {
  flex: 1;
  border: none;
  background: transparent;
  padding: 12px 0;
  font-size: 14px;
  font-family: var(--font-body);
  color: var(--color-header-text);
  outline: none;
  min-width: 0;
}
.g-drawer-search input::placeholder {
  color: var(--color-muted);
}
.g-drawer-search button {
  border: none;
  background: var(--color-accent);
  color: #fff;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 12px;
  flex-shrink: 0;
  transition: filter 0.15s ease;
}
.g-drawer-search button:hover {
  filter: brightness(1.1);
}

/* Drawer nav list */
.g-drawer-nav {
  margin: 0;
  padding: 8px 0;
  list-style: none;
  flex: 1;
  overflow-y: auto;
}
.g-drawer-nav-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
  color: var(--color-header-text);
  font-size: 15px;
  font-family: var(--font-body);
  font-weight: 500;
  text-decoration: none;
  transition: background 0.15s ease, color 0.15s ease;
  min-height: 48px;
}
.g-drawer-nav-item:hover,
.g-drawer-nav-item.router-link-active {
  background: var(--color-surface-alt);
  color: var(--color-accent);
}
.g-drawer-nav-item.router-link-active {
  font-weight: 700;
  border-left: 3px solid var(--color-accent);
  padding-left: 17px;
}
.g-drawer-arrow {
  font-size: 11px;
  color: var(--color-muted);
  flex-shrink: 0;
  transition: transform 0.15s ease;
}
.g-drawer-nav-item:hover .g-drawer-arrow {
  transform: translateX(2px);
  color: var(--color-accent);
}

/* Drawer footer */
.g-drawer-footer {
  padding: 12px 20px;
  border-top: 1px solid var(--color-border);
  flex-shrink: 0;
}

/* ─── Responsive ─── */
@media (max-width: 991px) {
  .g-navbar { display: none; }
  .g-burger { display: flex; }
  .g-brand-ad { display: none; }
}

/* ─── Drawer transitions ─── */
.g-drawer-overlay-enter-active,
.g-drawer-overlay-leave-active {
  transition: opacity 0.25s ease;
}
.g-drawer-overlay-enter-from,
.g-drawer-overlay-leave-to {
  opacity: 0;
}
.g-drawer-slide-enter-active {
  transition: transform 0.28s cubic-bezier(0.16, 1, 0.3, 1);
}
.g-drawer-slide-leave-active {
  transition: transform 0.22s ease-in;
}
.g-drawer-slide-enter-from,
.g-drawer-slide-leave-to {
  transform: translateX(100%);
}
</style>