<template>
  <div class="flex min-h-screen">
    <!-- Sidebar -->
    <aside
      class="fixed inset-y-0 left-0 z-40 w-64 transform bg-brand-900 text-white transition-transform lg:static lg:translate-x-0"
      :class="sidebarOpen ? 'translate-x-0' : '-translate-x-full'"
    >
      <div class="flex h-16 items-center gap-2 border-b border-white/10 px-5">
        <img :src="'/assets/img/logo/logo2_footer.png'" alt="" class="h-9 w-auto" />
        <span class="text-sm font-semibold">Navatra Admin</span>
      </div>
      <nav class="mt-2 space-y-0.5 px-3 text-sm">
        <RouterLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-white/10"
          :class="{ 'bg-brand-700 font-medium': route.path === item.to }"
        >
          <component :is="item.icon" class="h-4.5 w-4.5 h-5 w-5" />
          {{ item.label }}
        </RouterLink>
      </nav>
      <div class="absolute inset-x-0 bottom-0 border-t border-white/10 p-4">
        <div class="flex items-center gap-3">
          <div class="flex h-9 w-9 items-center justify-center rounded-full bg-brand-600 text-sm font-bold">
            {{ auth.user?.name?.charAt(0) ?? "U" }}
          </div>
          <div class="min-w-0 flex-1">
            <p class="truncate text-sm font-medium">{{ auth.user?.name }}</p>
            <p class="truncate text-xs text-white/60">{{ auth.user?.role }}</p>
          </div>
          <button class="text-white/60 hover:text-white" title="ចាកចេញ" @click="doLogout">
            <LogOut class="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>

    <!-- Main -->
    <div class="flex min-w-0 flex-1 flex-col">
      <!-- Topbar -->
      <header class="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-slate-200 bg-white px-4 lg:px-6">
        <button class="lg:hidden" @click="sidebarOpen = !sidebarOpen" aria-label="បើកម៉ឺនុយ">
          <Menu class="h-5 w-5" />
        </button>
        <h1 class="text-lg font-semibold text-slate-800">{{ route.meta.title }}</h1>
        <div class="ml-auto">
          <RouterLink to="http://localhost:5173" target="_blank" class="btn-secondary !py-1.5 text-xs">
            <ExternalLink class="h-3.5 w-3.5" /> មើលគេហទំព័រ
          </RouterLink>
        </div>
      </header>

      <main class="flex-1 p-4 lg:p-6">
        <RouterView />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
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
  Settings,
  LayoutTemplate,
  MenuSquare,
  Activity,
  UserCircle,
  LogOut,
  Menu,
  ExternalLink,
} from "lucide-vue-next";
import { useAuthStore } from "@/stores/auth";

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();
const sidebarOpen = ref(false);

const navItems = computed(() => {
  const items = [
    { to: "/", label: "ផ្ទាំងគ្រប់គ្រង", icon: LayoutDashboard },
    { to: "/articles", label: "អត្ថបទ", icon: FileText },
    { to: "/categories", label: "ប្រភេទ", icon: Folder },
    { to: "/tags", label: "ស្លាក", icon: Tags },
    { to: "/media", label: "បណ្ណាល័យមេឌា", icon: Image },
    { to: "/comments", label: "មតិយោបល់", icon: MessageSquare },
    { to: "/ads", label: "ផ្សាយពាណិជ្ជកម្ម", icon: Megaphone },
  ];
  if (auth.isAdmin) {
    items.push(
      { to: "/users", label: "អ្នកប្រើប្រាស់", icon: Users },
      { to: "/messages", label: "សារទំនាក់ទំនង", icon: Mail },
      { to: "/newsletter", label: "ព្រឹត្តិបត្រ", icon: Send },
      { to: "/homepage-builder", label: "ទំព័រដើម Builder", icon: LayoutTemplate },
      { to: "/navigation-builder", label: "ម៉ឺនុយ Builder", icon: MenuSquare },
      { to: "/settings", label: "ការកំណត់គេហទំព័រ", icon: Settings },
      { to: "/activity", label: "ប្រវត្តិសកម្មភាព", icon: Activity }
    );
  }
  items.push({ to: "/profile", label: "ប្រវត្តិរូប", icon: UserCircle });
  return items;
});

async function doLogout() {
  await auth.logout();
  router.push({ name: "login" });
}
</script>
