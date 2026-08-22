<template>
  <div class="flex min-h-screen bg-slate-100">
    <!-- Backdrop (mobile drawer) -->
    <Transition name="drawer-fade">
      <div v-if="sidebarOpen" class="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm md:hidden" @click="sidebarOpen = false" />
    </Transition>

    <!-- Sidebar — fixed on all screens so the nav stays put while the
         main content scrolls (drawer on mobile, collapsible rail on desktop) -->
    <aside
      class="fixed inset-y-0 left-0 z-50 flex transform flex-col bg-brand-900 text-white transition-[width,transform] duration-200 ease-out md:translate-x-0"
      :class="[ 
        sidebarOpen ? 'translate-x-0' : '-translate-x-full',
        collapsed ? 'w-[68px]' : 'w-64',
      ]"
      role="navigation"
      aria-label="ម៉ឺនុយគ្រប់គ្រង"
    >
      <!-- Brand -->
      <div class="flex h-16 shrink-0 items-center gap-2.5 border-b border-white/10" :class="collapsed ? 'justify-center px-0' : 'px-5'">
        <img :src="'/assets/img/logo/logo1.png'" alt="" class="h-9 w-auto" :class="collapsed ? 'h-8' : ''" />
        <div v-if="!collapsed" class="min-w-0">
          <p class="truncate text-sm font-semibold leading-tight">Galaxy TV4K</p>
          <p class="text-[10px] uppercase tracking-wider text-white/50">Editorial CMS</p>
        </div>
      </div>

      <!-- Nav -->
      <nav class="flex-1 overflow-y-auto overflow-x-hidden px-3 pb-4 pt-3 text-[13px]">
        <template v-for="group in navGroups" :key="group.label">
          <p
            v-if="!collapsed"
            class="px-3 pb-1.5 pt-4 text-[10px] font-semibold uppercase tracking-wider text-white/40"
          >
            {{ group.label }}
          </p>
          <div :class="collapsed ? 'space-y-1' : 'space-y-0.5'">
            <RouterLink
              v-for="item in group.items"
              :key="item.to"
              :to="item.to"
              :aria-label="collapsed ? item.label : undefined"
              class="group relative flex items-center rounded-md py-2 transition-colors hover:bg-white/10"
              :class="collapsed ? 'justify-center px-0' : 'gap-2.5 pl-3 pr-2.5'"
              @click="sidebarOpen = false"
              @mouseenter="onNavHover($event, item.label)"
              @mouseleave="onNavLeave"
            >
              <!-- Active indicator -->
              <span
                class="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-r bg-brand-400 transition-opacity"
                :class="isActive(item.to) ? 'opacity-100' : 'opacity-0'"
              />
              <component :is="item.icon" class="h-4 w-4 shrink-0" :class="isActive(item.to) ? 'text-brand-300' : 'text-white/50 group-hover:text-white/80'" />
              <span v-if="!collapsed" class="min-w-0 flex-1 truncate">{{ item.label }}</span>
              <span v-if="item.badge && !collapsed" class="rounded-full bg-red-500/90 px-1.5 py-0.5 text-[10px] font-semibold text-white">{{ item.badge }}</span>
            </RouterLink>
          </div>
        </template>
      </nav>

      <!-- User footer -->
      <div class="shrink-0 border-t border-white/10 p-3">
        <div class="flex items-center" :class="collapsed ? 'justify-center' : 'gap-3'">
          <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-600 text-sm font-bold ring-2 ring-white/10" :title="auth.user?.name ?? ''">
            {{ auth.user?.name?.charAt(0) ?? "U" }}
          </div>
          <template v-if="!collapsed">
            <div class="min-w-0 flex-1">
              <p class="truncate text-[13px] font-medium">{{ auth.user?.name }}</p>
              <p class="truncate text-[11px] text-white/50">{{ roleLabel(auth.user?.role) }}</p>
            </div>
            <button class="rounded-md p-1.5 text-white/60 transition-colors hover:bg-white/10 hover:text-white" title="ចាកចេញ" @click="doLogout">
              <LogOut class="h-4 w-4" />
            </button>
          </template>
          <button
            v-else
            class="mt-1 rounded-md p-1.5 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
            title="ចាកចេញ"
            @click="doLogout"
          >
            <LogOut class="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>

    <!-- Flyout label for collapsed icons (hover) — teleported to body so
         it renders above the fixed sidebar and is never clipped by the
         nav's internal scroll. Positioned from the hovered item's rect. -->
    <Teleport to="body">
      <div
        v-if="flyout"
        class="pointer-events-none fixed z-[60] max-w-[220px] truncate rounded-md bg-brand-800 px-2.5 py-1.5 text-[12px] font-medium text-white shadow-lg ring-1 ring-black/10"
        :style="{ left: flyout.left + 'px', top: flyout.top + 'px' }"
        role="tooltip"
      >
        {{ flyout.label }}
      </div>
    </Teleport>

    <!-- Main — left padding makes room for the fixed sidebar on tablet+ -->
    <div class="flex min-w-0 flex-1 flex-col" :class="collapsed ? 'md:pl-[68px]' : 'md:pl-64'">
      <!-- Topbar -->
      <header class="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-slate-200 bg-white/95 px-4 backdrop-blur lg:px-6 dark:border-slate-800 dark:bg-slate-900/95">
        <button class="rounded-lg p-2 text-slate-600 transition-colors hover:bg-slate-100 md:hidden dark:text-slate-300 dark:hover:bg-slate-800" aria-label="បើកម៉ឺនុយ" @click="sidebarOpen = true">
          <Menu class="h-5 w-5" />
        </button>
        <!-- Collapse/expand toggle (tablet+) -->
        <button
          class="hidden rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 md:inline-flex dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          :aria-label="collapsed ? 'ពង្រីកម៉ឺនុយ' : 'បត់ម៉ឺនុយ'"
          :title="collapsed ? 'ពង្រីកម៉ឺនុយ' : 'បត់ម៉ឺនុយ'"
          @click="toggleCollapsed"
        >
          <PanelLeftClose v-if="!collapsed" class="h-5 w-5" />
          <PanelLeftOpen v-else class="h-5 w-5" />
        </button>

        <!-- Breadcrumb + page title -->
        <div class="min-w-0">
          <nav class="flex items-center gap-1 text-[11px] text-slate-400 dark:text-slate-500" aria-label="Breadcrumb">
            <span class="hidden sm:inline">Admin</span>
            <ChevronRight class="hidden h-3 w-3 sm:block" />
            <span class="truncate font-medium text-slate-500 dark:text-slate-400">{{ route.meta.title }}</span>
          </nav>
          <h1 class="truncate text-[15px] font-semibold text-slate-800 dark:text-slate-100">{{ route.meta.title }}</h1>
        </div>

        <div class="ml-auto flex items-center gap-2">
          <button
            class="hidden items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-500 transition-colors hover:bg-slate-50 md:inline-flex dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            :title="prefs.t('top.command')"
            :aria-label="prefs.t('top.command')"
            @click="paletteOpen = true"
          >
            <Search class="h-3.5 w-3.5" />
            <span class="hidden xl:inline">{{ prefs.t("top.command") }}</span>
          </button>
          <button
            class="rounded-lg border border-slate-300 bg-white p-2 text-slate-500 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            :title="prefs.t('top.theme.tooltip')"
            :aria-label="prefs.t('top.theme.tooltip')"
            @click="prefs.toggleTheme()"
          >
            <Sun v-if="prefs.resolvedTheme === 'light'" class="h-4 w-4" />
            <Moon v-else class="h-4 w-4" />
          </button>
          <button
            class="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            :title="prefs.t('top.lang.tooltip')"
            :aria-label="prefs.t('top.lang.tooltip')"
            @click="prefs.setAdminLang(prefs.adminLang === 'km' ? 'en' : 'km')"
          >
            {{ prefs.adminLang === "km" ? "EN" : "ខ្មែរ" }}
          </button>
          <RouterLink
            to="/preview"
            target="_blank"
            class="hidden items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 sm:inline-flex dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            <ExternalLink class="h-3.5 w-3.5" /> {{ prefs.t("top.viewSite") }}
          </RouterLink>
          <a
            :href="previewUrl"
            target="_blank"
            rel="noopener"
            class="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-brand-700"
          >
            <Eye class="h-3.5 w-3.5" /> {{ prefs.t("top.previewSite") }}
          </a>
        </div>
      </header>

      <a
        href="#admin-main"
        class="sr-only focus:not-sr-only focus:absolute focus:z-[80] focus:rounded focus:bg-brand-600 focus:px-3 focus:py-2 focus:text-white"
      >
        {{ prefs.t("top.skip") }}
      </a>
      <main id="admin-main" tabindex="-1" class="flex-1 p-4 lg:p-6">
        <RouterView v-slot="{ Component }">
          <Transition name="page" mode="out-in">
            <component :is="Component" />
          </Transition>
        </RouterView>
      </main>
    </div>

    <CommandPalette :open="paletteOpen" @close="paletteOpen = false" />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import {
  LayoutDashboard,
  FileText,
  Folder,
  Tags,
  Image,
  Users,
  Mail,
  Send,
  Megaphone,
  Radio,
  Settings,
  LayoutTemplate,
  MenuSquare,
  Activity,
  HeartPulse,
  UserCircle,
  LogOut,
  Menu,
  Eye,
  ExternalLink,
  Search,
  Sun,
  Moon,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
  type LucideIcon,
} from "lucide-vue-next";
import { useAuthStore } from "@/stores/auth";
import { usePreferencesStore } from "@/stores/preferences";
import CommandPalette from "@/components/ui/CommandPalette.vue";

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();
const prefs = usePreferencesStore();
const sidebarOpen = ref(false);
const flyout = ref<{ label: string; left: number; top: number } | null>(null);
const paletteOpen = ref(false);

// Tablet range (md → lg, 768–1023px): the rail is always visible but
// auto-collapses to icons-only. On desktop the user's toggle preference
// is honored; on mobile (<md) it's a drawer. Entering/exiting the tablet
// range saves and restores the desktop preference.
const tabletQuery = window.matchMedia("(min-width: 768px) and (max-width: 1023.98px)");
const isTablet = ref(tabletQuery.matches);
const userCollapsed = ref(localStorage.getItem("navatra_admin_sidebar_collapsed") === "1");
const collapsed = ref(isTablet.value ? true : userCollapsed.value);
let savedPref = userCollapsed.value;

function applyTabletState() {
  if (isTablet.value) {
    savedPref = userCollapsed.value;
    collapsed.value = true; // auto-collapse on tablet
  } else {
    collapsed.value = savedPref;
  }
}

function onTabletChange(e: MediaQueryListEvent) {
  isTablet.value = e.matches;
  applyTabletState();
}

function toggleCollapsed() {
  // On tablet the rail is always collapsed; the toggle only matters on desktop.
  if (isTablet.value) return;
  collapsed.value = !collapsed.value;
  userCollapsed.value = collapsed.value;
  localStorage.setItem("navatra_admin_sidebar_collapsed", userCollapsed.value ? "1" : "0");
  flyout.value = null;
}

/** Position the flyout label next to the hovered collapsed icon. */
function onNavHover(e: MouseEvent, label: string) {
  if (!collapsed.value) return;
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
  // 68px rail + 8px gap; vertically centered on the icon, clamped to the
  // viewport so the popup never goes off-screen.
  const top = Math.min(
    Math.max(8, rect.top + rect.height / 2 - 14),
    window.innerHeight - 44
  );
  flyout.value = { label, left: 68 + 8, top };
}

function onNavLeave() {
  flyout.value = null;
}

function clearFlyout() {
  flyout.value = null;
}

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  badge?: string;
  adminOnly?: boolean;
}

const previewUrl = computed(() => {
  const host = window.location.hostname;
  const port = window.location.port;
  // Admin runs on :3001 (docker) / :5174 (dev); the public site is one port lower.
  const publicPort = port === "3001" ? "3000" : port === "5174" ? "5173" : "3000";
  return port ? `${window.location.protocol}//${host}:${publicPort}` : `${window.location.protocol}//${host}`;
});

const navGroups = computed(() => {
  const can = (adminOnly?: boolean) => !adminOnly || auth.isAdmin;
  const groups: { label: string; items: NavItem[] }[] = [
    {
      label: prefs.t("nav.manage"),
      items: [{ to: "/", label: prefs.t("nav.dashboard"), icon: LayoutDashboard }],
    },
    {
      label: prefs.t("nav.content"),
      items: [
        { to: "/articles", label: prefs.t("nav.articles"), icon: FileText },
        { to: "/categories", label: prefs.t("nav.categories"), icon: Folder },
        { to: "/tags", label: prefs.t("nav.tags"), icon: Tags },
        { to: "/media", label: prefs.t("nav.media"), icon: Image },
      ],
    },
    {
      label: prefs.t("nav.publishing"),
      items: [
        { to: "/homepage-builder", label: prefs.t("nav.homepage"), icon: LayoutTemplate, adminOnly: true },
        { to: "/live-news", label: prefs.t("nav.liveNews"), icon: Radio, adminOnly: true },
        { to: "/live-streams", label: prefs.t("nav.liveStreams"), icon: Radio, adminOnly: true },
        { to: "/navigation-builder", label: prefs.t("nav.navigation"), icon: MenuSquare, adminOnly: true },
        { to: "/ads", label: prefs.t("nav.ads"), icon: Megaphone },
      ],
    },
    {
      label: prefs.t("nav.interaction"),
      items: [
        { to: "/newsletter", label: prefs.t("nav.newsletter"), icon: Send, adminOnly: true },
        { to: "/messages", label: prefs.t("nav.messages"), icon: Mail, adminOnly: true },
      ],
    },
    {
      label: prefs.t("nav.system"),
      items: [
        { to: "/users", label: prefs.t("nav.users"), icon: Users, adminOnly: true },
        { to: "/settings", label: prefs.t("nav.settings"), icon: Settings, adminOnly: true },
        { to: "/settings/telegram", label: prefs.t("nav.telegram"), icon: Send, adminOnly: true },
        { to: "/activity", label: prefs.t("nav.activity"), icon: Activity, adminOnly: true },
        { to: "/system/health", label: prefs.t("nav.systemHealth"), icon: HeartPulse, adminOnly: true },
      ],
    },
    {
      label: prefs.t("nav.account"),
      items: [{ to: "/profile", label: prefs.t("nav.profile"), icon: UserCircle }],
    },
  ];
  return groups
    .map((g) => ({ ...g, items: g.items.filter((i) => can(i.adminOnly)) }))
    .filter((g) => g.items.length > 0);
});

function isActive(to: string) {
  if (to === "/") return route.path === "/";
  return route.path.startsWith(to);
}

function roleLabel(role?: string) {
  const map: Record<string, string> = {
    SUPER_ADMIN: prefs.t("top.roleLabel.super"),
    ADMIN: prefs.t("top.roleLabel.admin"),
    EDITOR: prefs.t("top.roleLabel.editor"),
    AUTHOR: prefs.t("top.roleLabel.author"),
  };
  return role ? map[role] ?? role : "";
}

async function doLogout() {
  await auth.logout();
  router.push({ name: "login" });
}

function onKeydown(e: KeyboardEvent) {
  // Ctrl/Cmd + K opens the command palette from anywhere in the admin.
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
    e.preventDefault();
    paletteOpen.value = !paletteOpen.value;
    return;
  }
  // Escape closes the mobile drawer.
  if (e.key === "Escape") {
    if (paletteOpen.value) paletteOpen.value = false;
    else sidebarOpen.value = false;
  }
}

onMounted(() => {
  window.addEventListener("keydown", onKeydown);
  // Hide the flyout on any scroll (nav scrolls internally; window capture
  // catches both) so it never drifts away from its icon.
  window.addEventListener("scroll", clearFlyout, true);
  applyTabletState();
  tabletQuery.addEventListener("change", onTabletChange);
});
onUnmounted(() => {
  window.removeEventListener("keydown", onKeydown);
  window.removeEventListener("scroll", clearFlyout, true);
  tabletQuery.removeEventListener("change", onTabletChange);
});
</script>

<style scoped>
.drawer-fade-enter-active,
.drawer-fade-leave-active {
  transition: opacity 0.2s ease;
}
.drawer-fade-enter-from,
.drawer-fade-leave-to {
  opacity: 0;
}

/* Page transition */
.page-enter-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.page-leave-active {
  transition: opacity 0.15s ease;
}
.page-enter-from {
  opacity: 0;
  transform: translateY(6px);
}
.page-leave-to {
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .page-enter-active,
  .page-leave-active {
    transition: none;
  }
  .page-enter-from {
    transform: none;
  }
}
</style>
