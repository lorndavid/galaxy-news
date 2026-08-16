<template>
  <header>
    <div class="header-area">
      <div class="main-header">
        <!-- Header top -->
        <div class="header-top black-bg d-none d-md-block">
          <div class="container">
            <div class="col-xl-12">
              <div class="row d-flex justify-content-between align-items-center">
                <div class="header-info-left">
                  <ul>
                    <li>
                      <img :src="'/assets/img/icon/header_icon1.png'" alt="" />
                      {{ todayLabel }}
                    </li>
                  </ul>
                </div>
                <div class="header-info-right">
                  <ul class="header-social">
                    <li v-if="settings?.facebook"><a :href="settings.facebook" target="_blank" rel="noopener" aria-label="Facebook"><i class="fab fa-facebook-f"></i></a></li>
                    <li v-if="settings?.youtube"><a :href="settings.youtube" target="_blank" rel="noopener" aria-label="YouTube"><i class="fab fa-youtube"></i></a></li>
                    <li v-if="settings?.tiktok"><a :href="settings.tiktok" target="_blank" rel="noopener" aria-label="TikTok"><i class="fab fa-tiktok"></i></a></li>
                    <li v-if="settings?.instagram"><a :href="settings.instagram" target="_blank" rel="noopener" aria-label="Instagram"><i class="fab fa-instagram"></i></a></li>
                    <li v-if="settings?.telegram"><a :href="settings.telegram" target="_blank" rel="noopener" aria-label="Telegram"><i class="fab fa-telegram-plane"></i></a></li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Header mid: logo + hero banner -->
        <div class="header-mid">
          <div class="container">
            <div class="row d-flex align-items-center">
              <div class="col-xl-3 col-lg-3 col-md-3">
                <div class="logo">
                  <RouterLink to="/">
                    <img loading="lazy" decoding="async" :src="logoUrl" alt="Navatra 4K TV logo" />
                  </RouterLink>
                </div>
              </div>
              <div class="col-xl-9 col-lg-9 col-md-9">
                <div class="header-banner f-right navatra-promo">
                  <RouterLink to="/" class="hero-banner-link" aria-label="Navatra 4K TV Hero Banner">
                    <img class="promo-banner hero-banner" loading="lazy" decoding="async" :src="'/assets/img/hero/banner4.png'" alt="Navatra 4K TV Hero Banner" />
                  </RouterLink>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Header bottom: black nav bar -->
        <div class="header-bottom header-sticky" :class="{ 'sticky-active': isSticky }">
          <div class="container">
            <div class="row align-items-center">
              <div class="col-xl-10 col-lg-10 col-md-12 header-flex">
                <div class="sticky-logo">
                  <RouterLink to="/">
                    <img loading="lazy" decoding="async" :src="logoUrl" alt="" />
                  </RouterLink>
                </div>
                <div class="main-menu d-none d-md-block">
                  <nav>
                    <ul id="navigation">
                      <li v-for="item in navItems" :key="item.id">
                        <RouterLink v-if="item.type === 'category'" :to="`/category/${item.value ?? ''}`">{{ item.label }}</RouterLink>
                        <a v-else-if="item.type === 'link'" :href="item.value ?? '#'" target="_blank" rel="noopener">{{ item.label }}</a>
                        <RouterLink v-else :to="navPath(item)">{{ item.label }}</RouterLink>
                      </li>
                    </ul>
                  </nav>
                </div>
              </div>
              <div class="col-xl-2 col-lg-2 col-md-4">
                <div class="header-right-btn f-right d-none d-lg-block">
                  <i class="fas fa-search special-tag"></i>
                  <div class="search-box" ref="searchBoxRef">
                    <form @submit.prevent="submitSearch">
                      <input v-model="searchInput" type="text" placeholder="ស្វែងរក" autocomplete="off" aria-label="ស្វែងរកព័ត៌មាន" @focus="openSuggestions" />
                    </form>
                    <!-- Typeahead suggestions -->
                    <Transition name="suggest">
                      <div v-if="showSuggestions && suggestions.length" class="search-suggestions" role="listbox" aria-label="សំណើរស្វែងរក">
                        <RouterLink
                          v-for="s in suggestions"
                          :key="s.id"
                          :to="`/article/${s.slug}`"
                          class="suggestion-item"
                          role="option"
                          @click="closeSuggestions"
                        >
                          <img loading="lazy" :src="resolveImage(s.featuredImage, undefined, 96)" :alt="''" class="suggestion-thumb" />
                          <span class="suggestion-title">{{ s.title }}</span>
                        </RouterLink>
                        <RouterLink :to="{ name: 'search', query: { q: searchInput } }" class="suggestion-all" @click="closeSuggestions">
                          ស្វែងរកទាំងអស់ «{{ searchInput }}»
                        </RouterLink>
                      </div>
                    </Transition>
                  </div>
                </div>
              </div>
              <!-- Mobile menu -->
              <div class="col-12">
                <div class="mobile_menu d-block d-md-none">
                  <div class="mobile-hamburger" :class="{ open: mobileOpen }" @click="mobileOpen = !mobileOpen" aria-label="បើកម៉ឺនុយ">
                    <span></span><span></span><span></span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Mobile dropdown menu -->
    <Transition name="mobile-drop">
      <div v-if="mobileOpen" class="mobile-dropdown d-md-none">
        <div class="mobile-dropdown-inner">
          <form class="mobile-search" @submit.prevent="submitSearch">
            <input v-model="searchInput" type="text" placeholder="ស្វែងរកព័ត៌មាន..." />
            <button type="submit" aria-label="ស្វែងរក"><i class="fas fa-search"></i></button>
          </form>
          <ul class="mobile-nav-list">
            <li v-for="item in navItems" :key="item.id">
              <RouterLink v-if="item.type === 'category'" :to="`/category/${item.value ?? ''}`" @click="mobileOpen = false">{{ item.label }}</RouterLink>
              <a v-else-if="item.type === 'link'" :href="item.value ?? '#'" target="_blank" rel="noopener" @click="mobileOpen = false">{{ item.label }}</a>
              <RouterLink v-else :to="navPath(item)" @click="mobileOpen = false">{{ item.label }}</RouterLink>
            </li>
          </ul>
        </div>
      </div>
    </Transition>
  </header>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { useSettingsStore } from "@/stores/settings";

import { articleService } from "@/services/article.service";
import type { Article } from "@/types";
import { contentService } from "@/services/content.service";
import type { NavigationItem } from "@/types";
import { resolveImage, toKhmerDigits } from "@/utils/format";

const router = useRouter();
const settingsStore = useSettingsStore();

const searchInput = ref("");
const navItems = ref<NavigationItem[]>([]);

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
const mobileOpen = ref(false);
const isSticky = ref(false);
const suggestions = ref<Article[]>([]);
const showSuggestions = ref(false);
const searchBoxRef = ref<HTMLElement | null>(null);
let scrollTimer: number | undefined;
let suggestTimer: number | undefined;
let suggestSeq = 0;

const settings = computed(() => settingsStore.settings);
const logoUrl = computed(
  () =>
    settings.value?.logo ??
    "/assets/img/logo/Logo%20galaxy%20navatra%204k%20TV.ai%202026-06.png"
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

function onScroll() {
  if (scrollTimer) window.clearTimeout(scrollTimer);
  scrollTimer = window.setTimeout(() => {
    const sticky = window.scrollY > 80;
    if (sticky !== isSticky.value) {
      isSticky.value = sticky;
      // Compensate the fixed bar so the page doesn't jump when it pins.
      document.body.classList.toggle("has-sticky-nav", sticky);
    }
  }, 50);
}

function submitSearch() {
  const q = searchInput.value.trim();
  if (!q) return;
  mobileOpen.value = false;
  closeSuggestions();
  router.push({ name: "search", query: { q } });
}

function openSuggestions() {
  if (searchInput.value.trim().length >= 1) showSuggestions.value = true;
}

function closeSuggestions() {
  showSuggestions.value = false;
}

function onDocumentClick(e: MouseEvent) {
  if (searchBoxRef.value && !searchBoxRef.value.contains(e.target as Node)) {
    closeSuggestions();
  }
}

// Debounced typeahead: only fetch once the user pauses typing
watch(searchInput, (val) => {
  if (suggestTimer) window.clearTimeout(suggestTimer);
  const q = val.trim();
  if (q.length < 1) {
    suggestions.value = [];
    showSuggestions.value = false;
    return;
  }
  suggestTimer = window.setTimeout(async () => {
    const seq = ++suggestSeq;
    try {
      const data = await articleService.list({ q, pageSize: 5 });
      if (seq !== suggestSeq) return; // stale response
      suggestions.value = data.items;
      showSuggestions.value = data.items.length > 0;
    } catch {
      suggestions.value = [];
    }
  }, 300);
});

onMounted(() => {
  settingsStore.load();
  contentService.navigation().then((items) => {
    navItems.value = items;
  }).catch(() => {
    // Fallback to the default menu if the API is unavailable.
    navItems.value = [
      { id: 0, label: "ទំព័រដើម", type: "home", value: "/", sortOrder: 1, isActive: true },
      { id: 0, label: "បញ្ជីព័ត៌មាន", type: "page", value: "news", sortOrder: 2, isActive: true },
      { id: 0, label: "អំពីយើង", type: "page", value: "about", sortOrder: 3, isActive: true },
      { id: 0, label: "ទំនាក់ទំនង", type: "page", value: "contact", sortOrder: 4, isActive: true },
    ];
  });
  window.addEventListener("scroll", onScroll);
  document.addEventListener("click", onDocumentClick);
});
onUnmounted(() => {
  window.removeEventListener("scroll", onScroll);
  document.removeEventListener("click", onDocumentClick);
  document.body.classList.remove("has-sticky-nav");
  if (scrollTimer) window.clearTimeout(scrollTimer);
  if (suggestTimer) window.clearTimeout(suggestTimer);
});
</script>

<style scoped>
/* Mobile hamburger (clean 3-line button on the black bar) */
.mobile-hamburger {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 5px;
  width: 44px;
  height: 40px;
  padding: 0 10px;
  border-radius: 8px;
  cursor: pointer;
  background: rgba(255, 255, 255, 0.12);
  margin: 10px 0 10px auto;
}
.mobile-hamburger span {
  display: block;
  height: 2px;
  width: 100%;
  background: #ffffff;
  border-radius: 2px;
  transition: transform 0.25s ease, opacity 0.25s ease;
}
.mobile-hamburger.open span:nth-child(1) {
  transform: translateY(7px) rotate(45deg);
}
.mobile-hamburger.open span:nth-child(2) {
  opacity: 0;
}
.mobile-hamburger.open span:nth-child(3) {
  transform: translateY(-7px) rotate(-45deg);
}

/* Mobile dropdown panel */
.mobile-dropdown {
  background: #ffffff;
  border-radius: 0 0 14px 14px;
  box-shadow: 0 14px 30px rgba(0, 0, 0, 0.18);
  margin: 0 12px 12px;
  overflow: hidden;
  max-height: calc(100vh - 140px);
  overflow-y: auto;
}
.mobile-dropdown-inner {
  padding: 14px;
}
.mobile-search {
  display: flex;
  gap: 8px;
  margin-bottom: 10px;
}
.mobile-search input {
  flex: 1;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 10px 14px;
  font-size: 14px;
  font-family: "Noto Sans Khmer", "Kantumruy", sans-serif;
  outline: none;
}
.mobile-search input:focus {
  border-color: #0d3fa9;
}
.mobile-search button {
  border: none;
  background: #0d3fa9;
  color: #fff;
  border-radius: 8px;
  padding: 0 16px;
  cursor: pointer;
}
.mobile-nav-list li {
  border-bottom: 1px solid #f1f5f9;
}
.mobile-nav-list li:last-child {
  border-bottom: none;
}
.mobile-nav-list a {
  display: block;
  padding: 13px 6px;
  color: #0b1c39;
  font-size: 15px;
  font-family: "Noto Sans Khmer", "Kantumruy", sans-serif;
  font-weight: 500;
}
.mobile-nav-list a.router-link-active {
  color: #0d3fa9;
}
.mobile-nav-list a:active {
  color: #0d3fa9;
  transform: translateX(4px);
}

.mobile-drop-enter-active,
.mobile-drop-leave-active {
  transition: all 0.25s ease;
}
.mobile-drop-enter-from,
.mobile-drop-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

/* Search typeahead suggestions */
.search-box {
  position: relative;
}
.search-suggestions {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  width: 340px;
  max-height: 380px;
  overflow-y: auto;
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.22);
  border: 1px solid #eef2f7;
  z-index: 1200;
  padding: 6px;
}
.suggestion-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 8px;
  color: #0b1c39;
  text-decoration: none;
}
.suggestion-item:hover {
  background: #f1f5f9;
  color: #0d3fa9;
}
.suggestion-thumb {
  width: 46px;
  height: 34px;
  object-fit: cover;
  border-radius: 6px;
  flex-shrink: 0;
  background: #eef2f7;
}
.suggestion-title {
  font-size: 13px;
  line-height: 1.35;
  font-family: "Noto Sans Khmer", "Kantumruy", sans-serif;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}
.suggestion-all {
  display: block;
  text-align: center;
  padding: 9px;
  margin-top: 4px;
  border-top: 1px solid #f1f5f9;
  color: #0d3fa9;
  font-size: 13px;
  font-weight: 600;
  text-decoration: none;
  font-family: "Noto Sans Khmer", "Kantumruy", sans-serif;
}
.suggestion-all:hover {
  color: #0b1c39;
}
.suggest-enter-active,
.suggest-leave-active {
  transition: all 0.18s ease;
}
.suggest-enter-from,
.suggest-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>
