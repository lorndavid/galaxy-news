<template>
  <div class="flex min-h-screen bg-slate-100">
    <!-- Backdrop (mobile drawer) -->
    <Transition name="drawer-fade">
      <div v-if="sidebarOpen" class="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden" @click="sidebarOpen = false" />
    </Transition>

    <!-- Sidebar -->
    <aside
      class="fixed inset-y-0 left-0 z-50 flex w-64 transform flex-col bg-brand-900 text-white transition-transform duration-200 ease-out lg:static lg:translate-x-0"
      :class="sidebarOpen ? 'translate-x-0' : '-translate-x-full'"
      role="navigation"
      aria-label="ម៉ឺនុយគ្រប់គ្រង"
    >
      <!-- Brand -->
      <div class="flex h-16 shrink-0 items-center gap-2.5 border-b border-white/10 px-5">
        <img :src="'/assets/img/logo/logo1.png'" alt="" class="h-9 w-auto" />
        <div class="min-w-0">
          <p class="truncate text-sm font-semibold leading-tight">Galaxy TV4K</p>
          <p class="text-[10px] uppercase tracking-wider text-white/50">Editorial CMS</p>
        </div>
      </div>

      <!-- Nav -->
      <nav class="flex-1 overflow-y-auto px-3 pb-4 pt-3 text-[13px]">
        <template v-for="group in navGroups" :key="group.label">
          <p class="px-3 pb-1.5 pt-4 text-[10px] font-semibold uppercase tracking-wider text-white/40">
            {{ group.label }}
          </p>
          <div class="space-y-0.5">
            <RouterLink
              v-for="item in group.items"
              :key="item.to"
              :to="item.to"
              class="group relative flex items-center gap-2.5 rounded-md py-2 pl-3 pr-2.5 transition-colors hover:bg-white/10"
              :class="{ 'bg-white/10 font-medium text-white': isActive(item.to), 'text-white/75': !isActive(item.to) }"
              @click="sidebarOpen = false"
            >
              <!-- Active indicator -->
              <span
                class="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-r bg-brand-400 transition-opacity"
                :class="isActive(item.to) ? 'opacity-100' : 'opacity-0'"
              />
              <component :is="item.icon" class="h-4 w-4 shrink-0" :class="isActive(item.to) ? 'text-brand-300' : 'text-white/50 group-hover:text-white/80'" />
              <span class="min-w-0 flex-1 truncate">{{ item.label }}</span>
              <span v-if="item.badge" class="rounded-full bg-red-500/90 px-1.5 py-0.5 text-[10px] font-semibold text-white">{{ item.badge }}</span>
            </RouterLink>
          </div>
        </template>
      </nav>

      <!-- User footer -->
      <div class="shrink-0 border-t border-white/10 p-4">
        <div class="flex items-center gap-3">
          <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-600 text-sm font-bold ring-2 ring-white/10">
            {{ auth.user?.name?.charAt(0) ?? "U" }}
          </div>
          <div class="min-w-0 flex-1">
            <p class="truncate text-[13px] font-medium">{{ auth.user?.name }}</p>
            <p class="truncate text-[11px] text-white/50">{{ roleLabel(auth.user?.role) }}</p>
          </div>
          <button class="rounded-md p-1.5 text-white/60 transition-colors hover:bg-white/10 hover:text-white" title="ចាកចេញ" @click="doLogout">
            <LogOut class="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>

    <!-- Main -->
    <div class="flex min-w-0 flex-1 flex-col">
      <!-- Topbar -->
      <header class="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-slate-200 bg-white/95 px-4 backdrop-blur lg:px-6">
        <button class="rounded-lg p-2 text-slate-600 transition-colors hover:bg-slate-100 lg:hidden" aria-label="បើកម៉ឺនុយ" @click="sidebarOpen = true">
          <Menu class="h-5 w-5" />
        </button>

        <div class="min-w-0">
          <h1 class="truncate text-[15px] font-semibold text-slate-800">{{ route.meta.title }}</h1>
          <p class="hidden text-[11px] text-slate-400 sm:block">{{ route.name }}</p>
        </div>

        <div class="ml-auto flex items-center gap-2">
          <RouterLink
            to="/preview"
            target="_blank"
            class="hidden items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 sm:inline-flex"
          >
            <ExternalLink class="h-3.5 w-3.5" /> មើលគេហទំព័រ
          </RouterLink>
          <a
            :href="previewUrl"
            target="_blank"
            rel="noopener"
            class="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-brand-700"
          >
            <Eye class="h-3.5 w-3.5" /> មើលជាសាធារណៈ
          </a>
        </div>
      </header>

      <main class="flex-1 p-4 lg:p-6">
        <RouterView />
      </main>
    </div>
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
  MessageSquare,
  Mail,
  Send,
  Megaphone,
  Radio,
  Settings,
  LayoutTemplate,
  MenuSquare,
  Activity,
  UserCircle,
  LogOut,
  Menu,
  Eye,
  ExternalLink,
  type LucideIcon,
} from "lucide-vue-next";
import { useAuthStore } from "@/stores/auth";

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();
const sidebarOpen = ref(false);

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
      label: "គ្រប់គ្រង",
      items: [{ to: "/", label: "ផ្ទាំងគ្រប់គ្រង", icon: LayoutDashboard }],
    },
    {
      label: "មាតិកា",
      items: [
        { to: "/articles", label: "អត្ថបទ", icon: FileText },
        { to: "/categories", label: "ប្រភេទ", icon: Folder },
        { to: "/tags", label: "ស្លាក", icon: Tags },
        { to: "/media", label: "បណ្ណាល័យមេឌា", icon: Image },
      ],
    },
    {
      label: "ការផ្សាយ",
      items: [
        { to: "/homepage-builder", label: "ផ្ទាំងដើម", icon: LayoutTemplate, adminOnly: true },
        { to: "/live-news", label: "បន្ទាត់ព័ត៌មានផ្ទាល់", icon: Radio, adminOnly: true },
        { to: "/navigation-builder", label: "ម៉ឺនុយ", icon: MenuSquare, adminOnly: true },
        { to: "/ads", label: "ផ្សាយពាណិជ្ជកម្ម", icon: Megaphone },
      ],
    },
    {
      label: "អន្តរកម្ម",
      items: [
        { to: "/comments", label: "មតិយោបល់", icon: MessageSquare },
        { to: "/newsletter", label: "ព្រឹត្តិបត្រ", icon: Send, adminOnly: true },
        { to: "/messages", label: "សារទំនាក់ទំនង", icon: Mail, adminOnly: true },
      ],
    },
    {
      label: "ប្រព័ន្ធ",
      items: [
        { to: "/users", label: "អ្នកប្រើប្រាស់", icon: Users, adminOnly: true },
        { to: "/settings", label: "ការកំណត់", icon: Settings, adminOnly: true },
        { to: "/activity", label: "ប្រវត្តិសកម្មភាព", icon: Activity, adminOnly: true },
      ],
    },
    {
      label: "គណនី",
      items: [{ to: "/profile", label: "ប្រវត្តិរូប", icon: UserCircle }],
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
    SUPER_ADMIN: "Super Admin",
    ADMIN: "Admin",
    EDITOR: "អ្នកនិពន្ធ",
    AUTHOR: "អ្នកសរសេរ",
  };
  return role ? map[role] ?? role : "";
}

async function doLogout() {
  await auth.logout();
  router.push({ name: "login" });
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === "Escape") sidebarOpen.value = false;
}

onMounted(() => window.addEventListener("keydown", onKeydown));
onUnmounted(() => window.removeEventListener("keydown", onKeydown));
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
</style>
