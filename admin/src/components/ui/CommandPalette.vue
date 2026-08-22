<template>
  <Teleport to="body">
    <Transition name="palette">
      <div
        v-if="open"
        class="fixed inset-0 z-[70] flex items-start justify-center px-4 pt-[12vh]"
        role="dialog"
        aria-modal="true"
        :aria-label="prefs.t('cmd.title')"
        @mousedown.self="close"
      >
        <div class="w-full max-w-xl overflow-hidden rounded-lg border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
          <div class="flex items-center gap-3 border-b border-slate-200 px-4 dark:border-slate-700">
            <Search class="h-4 w-4 shrink-0 text-slate-400" />
            <input
              ref="inputEl"
              v-model="query"
              type="text"
              class="h-12 w-full bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400 dark:text-slate-100"
              :placeholder="prefs.t('cmd.placeholder')"
              @keydown.down.prevent="move(1)"
              @keydown.up.prevent="move(-1)"
              @keydown.enter.prevent="run(selected)"
            />
            <kbd class="hidden shrink-0 rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 sm:block dark:border-slate-700 dark:bg-slate-800">
              ESC
            </kbd>
          </div>

          <div class="max-h-[50vh] overflow-y-auto py-2">
            <div v-if="results.length">
              <p v-if="filteredPages.length" class="px-4 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                {{ prefs.t("cmd.group.pages") }}
              </p>
              <button
                v-for="(r, i) in filteredPages"
                :key="'p' + r.to"
                class="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors"
                :class="i === selected ? 'bg-brand-50 text-brand-800 dark:bg-brand-900/40 dark:text-brand-100' : 'text-slate-700 dark:text-slate-200'"
                @mouseenter="selected = i"
                @click="run(i)"
              >
                <component :is="r.icon" class="h-4 w-4 shrink-0 text-slate-400" />
                {{ r.label }}
              </button>

              <p v-if="filteredActions.length" class="px-4 pb-1 pt-3 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                {{ prefs.t("cmd.group.actions") }}
              </p>
              <button
                v-for="(r, i) in filteredActions"
                :key="'a' + r.label"
                class="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors"
                :class="filteredPages.length + i === selected ? 'bg-brand-50 text-brand-800 dark:bg-brand-900/40 dark:text-brand-100' : 'text-slate-700 dark:text-slate-200'"
                @mouseenter="selected = filteredPages.length + i"
                @click="run(filteredPages.length + i)"
              >
                <component :is="r.icon" class="h-4 w-4 shrink-0 text-slate-400" />
                {{ r.label }}
              </button>
            </div>
            <p v-else class="px-4 py-8 text-center text-sm text-slate-400">{{ prefs.t("cmd.empty") }}</p>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from "vue";
import { useRouter } from "vue-router";
import {
  FileText,
  Folder,
  Tags,
  Image,
  Users,
  Settings,
  ImagePlus,
  SquarePen,
  Moon,
  Search,
  type LucideIcon,
} from "lucide-vue-next";
import { usePreferencesStore } from "@/stores/preferences";

interface PaletteItem {
  label: string;
  icon: LucideIcon;
  to?: string;
  run?: () => void;
}

const emit = defineEmits<{ open: []; close: [] }>();
const props = defineProps<{ open: boolean }>();

const router = useRouter();
const prefs = usePreferencesStore();
const query = ref("");
const selected = ref(0);
const inputEl = ref<HTMLInputElement | null>(null);

const pages = computed<PaletteItem[]>(() => [
  { label: prefs.t("nav.dashboard"), icon: SquarePen, to: "/" },
  { label: prefs.t("nav.articles"), icon: FileText, to: "/articles" },
  { label: prefs.t("nav.categories"), icon: Folder, to: "/categories" },
  { label: prefs.t("nav.tags"), icon: Tags, to: "/tags" },
  { label: prefs.t("nav.media"), icon: Image, to: "/media" },
  { label: prefs.t("nav.users"), icon: Users, to: "/users" },
  { label: prefs.t("nav.settings"), icon: Settings, to: "/settings" },
  { label: prefs.t("nav.systemHealth"), icon: Settings, to: "/system/health" },
]);

const actions = computed<PaletteItem[]>(() => [
  {
    label: prefs.t("cmd.newArticle"),
    icon: SquarePen,
    run: () => void router.push("/articles/new"),
  },
  {
    label: prefs.t("cmd.uploadMedia"),
    icon: ImagePlus,
    run: () => void router.push("/media"),
  },
  {
    label: prefs.t("cmd.toggleTheme"),
    icon: Moon,
    run: () => prefs.toggleTheme(),
  },
]);

const needle = computed(() => query.value.trim().toLowerCase());
const filteredPages = computed(() =>
  needle.value ? pages.value.filter((p) => p.label.toLowerCase().includes(needle.value)) : pages.value
);
const filteredActions = computed(() =>
  needle.value ? actions.value.filter((a) => a.label.toLowerCase().includes(needle.value)) : actions.value
);
const results = computed(() => [...filteredPages.value, ...filteredActions.value]);

function move(dir: 1 | -1) {
  const n = results.value.length;
  selected.value = (selected.value + dir + n) % n;
}

function run(index: number) {
  const item = results.value[index];
  if (!item) return;
  close();
  if (item.run) item.run();
  else if (item.to) void router.push(item.to);
}

function close() {
  query.value = "";
  selected.value = 0;
  emit("close");
}

function onKeydown(e: KeyboardEvent) {
  if (!props.open) return;
  if (e.key === "Escape") {
    e.preventDefault();
    close();
  } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
    e.preventDefault();
    close();
  }
}

watch(
  () => props.open,
  async (open) => {
    if (open) {
      selected.value = 0;
      await nextTick();
      inputEl.value?.focus();
    }
  }
);

onBeforeUnmount(() => window.removeEventListener("keydown", onKeydown));
</script>

<style scoped>
.palette-enter-active,
.palette-leave-active {
  transition: opacity 0.15s ease;
}
.palette-enter-active > div,
.palette-leave-active > div {
  transition: transform 0.15s ease;
}
.palette-enter-from,
.palette-leave-to {
  opacity: 0;
}
.palette-enter-from > div,
.palette-leave-to > div {
  transform: translateY(-8px) scale(0.99);
}
</style>