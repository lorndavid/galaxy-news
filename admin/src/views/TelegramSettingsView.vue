<template>
  <div class="space-y-5">
    <!-- Stats overview -->
    <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <div class="card p-4">
        <p class="text-xs font-medium text-slate-400">បានផ្សាយ</p>
        <p class="mt-1 text-2xl font-bold text-slate-800">{{ stats.published }}</p>
      </div>
      <div class="card p-4">
        <p class="text-xs font-medium text-slate-400">កំពុងរង់ចាំ</p>
        <p class="mt-1 text-2xl font-bold text-amber-600">{{ stats.pending }}</p>
      </div>
      <div class="card p-4">
        <p class="text-xs font-medium text-slate-400">កំពុងដំណើរការ</p>
        <p class="mt-1 text-2xl font-bold text-sky-600">{{ stats.processing }}</p>
      </div>
      <div class="card p-4">
        <p class="text-xs font-medium text-slate-400">បរាជ័យ</p>
        <p class="mt-1 text-2xl font-bold text-red-600">{{ stats.failed }}</p>
      </div>
    </div>

    <div class="card max-w-3xl space-y-5 p-6">
      <!-- Header + status -->
      <div class="flex items-start justify-between gap-4">
        <div>
          <h3 class="text-sm font-semibold text-slate-700">Telegram Integration</h3>
          <p class="mt-0.5 text-xs text-slate-400">
            ផ្សាយអត្ថបទដោយស្វ័យប្រវត្តិទៅកាន់ឆានែល ក្រុម ក្រុមធំ និងជជែកផ្ទាល់ខ្លួន។
          </p>
        </div>
        <span
          class="inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold"
          :class="form.connected ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200' : 'bg-slate-100 text-slate-500 ring-1 ring-slate-200'"
        >
          <span class="h-1.5 w-1.5 rounded-full" :class="form.connected ? 'bg-emerald-500' : 'bg-slate-400'"></span>
          {{ form.connected ? "បានភ្ជាប់" : "មិនទាន់ភ្ជាប់" }}
        </span>
      </div>

      <!-- Result panel -->
      <div
        v-if="result"
        class="rounded-lg border p-4 text-sm"
        :class="result.success ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-red-200 bg-red-50 text-red-800'"
      >
        <p class="flex items-center gap-2 font-semibold">
          <span v-if="result.success" class="text-emerald-600">✓</span>
          <span v-else class="text-red-600">✕</span>
          {{ result.message }}
        </p>
        <p v-if="result.success && result.bot" class="mt-1.5 text-xs opacity-80">
          Bot: {{ result.bot.name }} ({{ result.bot.username }})
        </p>
        <p v-for="c in result.chats ?? []" :key="c.chatId" class="text-xs opacity-80">
          Chat: {{ c.title }} ({{ chatTypeLabel(c.type) }}) — {{ c.chatId }}
        </p>
        <p v-if="result.warning" class="mt-1.5 text-xs font-medium text-amber-700">
          ⚠ {{ result.warning }}
        </p>
      </div>

      <!-- Form -->
      <div class="space-y-4">
        <div>
          <label class="label">Bot Token</label>
          <input v-model="form.botToken" type="password" class="input font-mono" :placeholder="form.botTokenMasked || '123456789:ABC...'" autocomplete="off" />
          <p class="mt-1 text-[11px] text-slate-400">
            ទទួលបានពី @BotFather — រក្សាទុកដោយសម្ងាត់ មិនបង្ហាញសាធារណៈឡើយ។
          </p>
        </div>

        <!-- Site URL (button links) -->
        <div>
          <label class="label">Site URL (សម្រាប់ប៊ូតុងភ្ជាប់)</label>
          <input v-model="form.siteUrl" type="url" class="input font-mono" placeholder="https://news.example.com" />
          <p class="mt-1 text-[11px] text-slate-400">
            URL សាធារណៈរបស់គេហទំព័រ ប្រើសម្រាប់ប៊ូតុង «អានអត្ថបទ» ក្នុង Telegram។
            Telegram បដិសេធ localhost/private IP — ត្រូវប្រើដែនសាធារណៈ (https)។
          </p>
          <!-- Localhost warning banner -->
          <div v-if="isLocalUrl(form.siteUrl)" class="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5">
            <p class="text-xs font-semibold text-amber-800">⚠ Site URL ជា Localhost / Private IP</p>
            <p class="mt-1 text-[11px] text-amber-700">
              Telegram នឹងបដិសេធ link ប៊ូតុង ព្រោះ URL មិនសាធារណៈ។<br/>
              អត្ថបទនឹងបង្ហាញ URL ជា text ក្នុង caption ជំនួសប៊ូតុង។<br/>
              សម្រាប់ប៊ូតុង link សូមប្រើ ngrok / cloudflare tunnel ឬដែនសាធារណៈ (https://yourdomain.com)។
            </p>
          </div>
        </div>

        <!-- Destinations -->
        <div>
          <div class="mb-2 flex items-center justify-between">
            <label class="label !mb-0">Chat Destinations (ឆានែល / ក្រុម / ផ្ទាល់ខ្លួន)</label>
            <div class="flex gap-2">
              <button type="button" class="btn-secondary !py-1 !px-2.5 text-xs" :disabled="busy" @click="openDiscover">
                <Radar class="h-3.5 w-3.5" /> ស្វែងរក Chats
              </button>
              <button type="button" class="btn-secondary !py-1 !px-2.5 text-xs" @click="addDestination">
                <Plus class="h-3.5 w-3.5" /> {{ prefs.t('categories.add') }}
              </button>
            </div>
          </div>

          <div v-if="!form.destinations.length" class="rounded-lg border border-dashed border-slate-300 px-4 py-6 text-center text-sm text-slate-400">
            មិនទាន់មាន destination ទេ — បន្ថែមឆានែល ក្រុម ក្រុមធំ ឬជជែកផ្ទាល់ខ្លួន (ប៊ូតុង «បន្ថែម») ឬស្វែងរក chats ពីប៊ូតុង «ស្វែងរក Chats»។
          </div>

          <div v-else class="space-y-2">
            <div
              v-for="(d, i) in form.destinations"
              :key="d.id"
              class="flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-slate-50/60 px-3 py-2.5"
            >
              <span
                class="inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
                :class="typeBadgeClass(d.type)"
              >
                {{ typeLabel(d.type) }}
              </span>
              <input v-model="d.chatId" type="text" class="input !py-1.5 font-mono text-xs min-w-[140px] flex-1" placeholder="@channel ឬ -1001234567890" />
              <select v-model="d.type" class="input !w-auto !py-1.5 text-xs">
                <option value="channel">Channel</option>
                <option value="supergroup">Supergroup</option>
                <option value="group">Group</option>
                <option value="private">Personal</option>
              </select>
              <label class="flex cursor-pointer items-center gap-1.5 text-xs text-slate-600" :title="d.enabled ? 'បើកដំណើរការ' : 'បិទ'">
                <input v-model="d.enabled" type="checkbox" class="h-4 w-4 rounded border-slate-300" />
                {{ d.enabled ? "បើក" : "បិទ" }}
              </label>
              <button type="button" class="text-slate-400 transition-colors hover:text-red-600" :title="`លុប ${i + 1}`" @click="removeDestination(i)">
                <Trash2 class="h-4 w-4" />
              </button>
            </div>
          </div>
          <p class="mt-1 text-[11px] text-slate-400">
            គ្រប់ destination ដែលបើក នឹងទទួលអត្ថបទពេលផ្សាយ។ Personal = អ្នកប្រើដែលបានចុច Start ប៊ូតុង bot (ប្រើ chat id របស់ពួកគេ)។
          </p>
        </div>

        <div class="flex items-center justify-between rounded-lg border border-slate-200 p-4">
          <div>
            <p class="text-sm font-semibold text-slate-700">ផ្សាយដោយស្វ័យប្រវត្តិ</p>
            <p class="mt-0.5 text-xs text-slate-400">ផ្សាយដោយស្វ័យប្រវត្តិនៅពេលអត្ថបទត្រូវបានបោះពុម្ពផ្សាយ</p>
          </div>
          <label class="relative inline-flex cursor-pointer items-center">
            <input v-model="form.enabled" type="checkbox" class="peer sr-only" />
            <div class="h-6 w-11 rounded-full bg-slate-300 transition-colors peer-checked:bg-emerald-500 after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-transform peer-checked:after:translate-x-5"></div>
          </label>
        </div>

        <div class="grid gap-4 sm:grid-cols-2">
          <div>
            <label class="label">ភាសាប៊ូតុង</label>
            <select v-model="form.languageMode" class="input">
              <option value="both">ភាសាទាំងពីរ (Khmer + English)</option>
              <option value="kh">ខ្មែរតែប៉ុណ្ណោះ</option>
              <option value="en">English only</option>
            </select>
          </div>
        </div>

        <div class="grid gap-4 sm:grid-cols-2">
          <div>
            <label class="label">អត្ថបទប៊ូតុងខ្មែរ</label>
            <input v-model="form.buttonKh" type="text" class="input" placeholder="🇰🇭 អានជាភាសាខ្មែរ" maxlength="40" />
          </div>
          <div>
            <label class="label">អត្ថបទប៊ូតុងអង់គ្លេស</label>
            <input v-model="form.buttonEn" type="text" class="input" placeholder="🇬🇧 Read in English" maxlength="40" />
          </div>
        </div>
      </div>

      <!-- Social Footer -->
      <div class="space-y-4">
        <div class="flex items-center justify-between rounded-lg border border-slate-200 p-4">
          <div>
            <p class="text-sm font-semibold text-slate-700">Social Footer (បណ្តាញសង្គម)</p>
            <p class="mt-0.5 text-xs text-slate-400">បង្ហាញតំណភ្ជាប់សង្គមនៅក្រោមចំណងជើងអត្ថបទក្នុង Telegram</p>
          </div>
          <label class="relative inline-flex cursor-pointer items-center">
            <input v-model="form.footerEnabled" type="checkbox" class="peer sr-only" />
            <div class="h-6 w-11 rounded-full bg-slate-300 transition-colors peer-checked:bg-emerald-500 after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-transform peer-checked:after:translate-x-5"></div>
          </label>
        </div>

        <div v-if="form.footerEnabled" class="space-y-3 rounded-lg border border-slate-100 p-4">
          <div>
            <label class="label">JOIN US Label</label>
            <input v-model="form.footerJoinUs" type="text" class="input" placeholder="JOIN US" />
            <p class="mt-1 text-[11px] text-slate-400">អត្ថបទបង្ហាញនៅលើតំណ Telegram group (ឧ. JOIN US ឬ ចូលរួមជាមួយពួកយើង)</p>
          </div>
          <div>
            <label class="label">🌐 Facebook</label>
            <input v-model="form.footerFacebook" type="url" class="input font-mono text-xs" placeholder="https://www.facebook.com/YourPage" />
          </div>
          <div>
            <label class="label">🌐 TikTok</label>
            <input v-model="form.footerTiktok" type="url" class="input font-mono text-xs" placeholder="https://www.tiktok.com/@yourusername" />
          </div>
          <div>
            <label class="label">🌐 YouTube</label>
            <input v-model="form.footerYoutube" type="url" class="input font-mono text-xs" placeholder="https://www.youtube.com/@YourChannel" />
          </div>
          <div>
            <label class="label">🌐 Instagram</label>
            <input v-model="form.footerInstagram" type="url" class="input font-mono text-xs" placeholder="https://www.instagram.com/yourusername" />
          </div>
          <div>
            <label class="label">🌐 Website</label>
            <input v-model="form.footerWebsite" type="url" class="input font-mono text-xs" placeholder="https://www.yourwebsite.com" />
          </div>
          <div class="rounded-lg bg-slate-50 p-3">
            <p class="text-xs font-medium text-slate-500 mb-1">Preview:</p>
            <div class="rounded border border-slate-200 bg-white p-3 text-xs leading-relaxed text-slate-600">
              <b>ចំណងជើងអត្ថបទ</b>
              <br/><br/>
              <template v-if="form.footerJoinUs"><b>{{ form.footerJoinUs }}</b><br/><br/></template>
              <template v-if="form.footerFacebook">🌐 | FACEBOOK<br/>{{ form.footerFacebook }}<br/><br/></template>
              <template v-if="form.footerTiktok">🌐 | TIKTOK<br/>{{ form.footerTiktok }}<br/><br/></template>
              <template v-if="form.footerYoutube">🌐 | YOUTUBE<br/>{{ form.footerYoutube }}<br/><br/></template>
              <template v-if="form.footerInstagram">🌐 | INSTAGRAM<br/>{{ form.footerInstagram }}<br/><br/></template>
              <template v-if="form.footerWebsite">🌐 | WEBSITE<br/>{{ form.footerWebsite }}</template>
            </div>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="flex flex-wrap gap-2 border-t border-slate-100 pt-4">
        <button type="button" class="btn-primary" :disabled="busy" @click="saveAndTest">
          <Loader2 v-if="busy" class="h-4 w-4 animate-spin" />
          {{ busy ? "កំពុងសាកល្បង…" : "រក្សាទុក និងសាកល្បងការតភ្ជាប់" }}
        </button>
        <button type="button" class="btn-secondary" :disabled="busy" @click="testOnly">
          {{ testing ? "កំពុងសាកល្បង…" : "សាកល្បងការតភ្ជាប់" }}
        </button>
      </div>
    </div>

    <!-- Discover chats modal -->
    <Modal v-model="discoverOpen" title="ស្វែងរក Chats ពី Bot">
      <p class="mb-3 text-xs text-slate-500">
        Chats ដែល bot បានឃើញ (អ្នកប្រើចុច Start ក្រុម/ឆានែលដែលបានបន្ថែម bot)។ ជ្រើសរើសដើម្បីបន្ថែមជា destination។
      </p>
      <div v-if="discovering" class="flex items-center justify-center py-8">
        <Loader2 class="h-5 w-5 animate-spin text-brand-600" />
      </div>
      <div v-else-if="!discovered.length" class="rounded-lg border border-dashed border-slate-300 px-4 py-6 text-center text-sm text-slate-400">
        មិនមាន chat ទេ។ សាកល្បងចុច Start លើ bot របស់អ្នក ឬបន្ថែម bot ទៅក្នុងក្រុម/ឆានែល រួចសាកល្បងម្តងទៀត។
      </div>
      <div v-else class="max-h-80 space-y-2 overflow-y-auto pr-1">
        <button
          v-for="c in discovered"
          :key="c.chatId"
          type="button"
          class="flex w-full items-center gap-3 rounded-lg border border-slate-200 px-3 py-2.5 text-left transition-colors hover:border-brand-400 hover:bg-brand-50/50"
          :class="alreadyHas(c.chatId) ? 'opacity-50' : ''"
          :disabled="alreadyHas(c.chatId)"
          @click="addDiscovered(c)"
        >
          <span class="inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide" :class="typeBadgeClass(c.type)">
            {{ typeLabel(c.type) }}
          </span>
          <span class="min-w-0 flex-1">
            <span class="block truncate text-sm font-medium text-slate-700">{{ c.title }}</span>
            <span class="block truncate font-mono text-xs text-slate-400">{{ c.chatId }}</span>
          </span>
          <span v-if="alreadyHas(c.chatId)" class="text-xs text-slate-400">មានរួចហើយ</span>
        </button>
      </div>
      <div class="mt-4 flex justify-end gap-2 border-t border-slate-100 pt-3">
        <button type="button" class="btn-secondary" @click="discoverOpen = false">បិទ</button>
        <button type="button" class="btn-secondary" :disabled="discovering" @click="loadDiscovered">
          <RefreshCw class="h-3.5 w-3.5" /> ផ្ទុកម្តងទៀត
        </button>
      </div>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { Loader2, Plus, Radar, RefreshCw, Trash2 } from "lucide-vue-next";
import { adminService } from "@/services/admin.service";
import { useToastStore } from "@/stores/toast";
import Modal from "@/components/ui/Modal.vue";
import type {
  TelegramDestination,
  TelegramDestinationType,
  TelegramDiscoveredChat,
  TelegramSettings,
  TelegramStats,
  TelegramTestResult,
} from "@/types";
import { usePreferencesStore } from "@/stores/preferences";

const toast = useToastStore();
const prefs = usePreferencesStore();
const busy = ref(false);
const testing = ref(false);
const result = ref<TelegramTestResult | null>(null);
const stats = reactive<TelegramStats>({ published: 0, pending: 0, processing: 0, failed: 0 });

const discoverOpen = ref(false);
const discovering = ref(false);
const discovered = ref<TelegramDiscoveredChat[]>([]);

const form = reactive({
  botToken: "",
  botTokenMasked: "",
  siteUrl: "",
  destinations: [] as TelegramDestination[],
  enabled: false,
  languageMode: "both",
  buttonKh: "🇰🇭 អានជាភាសាខ្មែរ",
  buttonEn: "🇬🇧 Read in English",
  connected: false,
  footerEnabled: true,
  footerJoinUs: "",
  footerFacebook: "",
  footerTiktok: "",
  footerYoutube: "",
  footerInstagram: "",
  footerWebsite: "",
} as TelegramSettings & { botToken: string });

function typeLabel(type: string): string {
  const map: Record<string, string> = { channel: "Channel", group: "Group", supergroup: "Supergroup", channel2: "Channel", private: "Personal" };
  return map[type] ?? type;
}

function chatTypeLabel(type: string): string {
  const map: Record<string, string> = { channel: "ឆានែល", group: "ក្រុម", supergroup: "ក្រុមធំ", private: "ឯកជន" };
  return map[type] ?? type;
}

function typeBadgeClass(type: string): string {
  const map: Record<string, string> = {
    channel: "bg-sky-50 text-sky-700 ring-1 ring-sky-200",
    supergroup: "bg-violet-50 text-violet-700 ring-1 ring-violet-200",
    group: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
    private: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  };
  return map[type] ?? "bg-slate-100 text-slate-600 ring-1 ring-slate-200";
}

function isLocalUrl(raw: string): boolean {
  if (!raw) return false;
  try {
    const u = new URL(raw);
    const h = u.hostname.toLowerCase();
    if (h === "localhost" || h === "127.0.0.1") return true;
    if (/^(10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.)/.test(h)) return true;
    return false;
  } catch {
    return false;
  }
}

function addDestination() {
  form.destinations.push({ id: crypto.randomUUID?.() ?? String(Date.now()), chatId: "", type: "channel", label: "", enabled: true });
}

function removeDestination(i: number) {
  form.destinations.splice(i, 1);
}

function alreadyHas(chatId: string): boolean {
  return form.destinations.some((d) => d.chatId === chatId);
}

async function load() {
  try {
    const [settings, s] = await Promise.all([adminService.telegramSettings(), adminService.telegramStats()]);
    form.botTokenMasked = settings.botTokenMasked;
    form.siteUrl = settings.siteUrl;
    form.destinations = settings.destinations.map((d) => ({ ...d }));
    form.enabled = settings.enabled;
    form.languageMode = settings.languageMode;
    form.buttonKh = settings.buttonKh;
    form.buttonEn = settings.buttonEn;
    form.connected = settings.connected;
    form.footerEnabled = settings.footerEnabled ?? true;
    form.footerJoinUs = settings.footerJoinUs ?? "";
    form.footerFacebook = settings.footerFacebook ?? "";
    form.footerTiktok = settings.footerTiktok ?? "";
    form.footerYoutube = settings.footerYoutube ?? "";
    form.footerInstagram = settings.footerInstagram ?? "";
    form.footerWebsite = settings.footerWebsite ?? "";
    Object.assign(stats, s);
  } catch (e) {
    toast.error(e instanceof Error ? e.message : "ផ្ទុកការកំណត់ Telegram បរាជ័យ");
  }
}

function destinationInputs() {
  return form.destinations.map((d) => ({
    id: d.id,
    chatId: d.chatId,
    type: d.type,
    label: d.label || undefined,
    enabled: d.enabled,
  }));
}

async function saveAndTest() {
  busy.value = true;
  result.value = null;
  try {
    const res = await adminService.saveTelegramSettings({
      botToken: form.botToken || undefined,
      destinations: destinationInputs(),
      siteUrl: form.siteUrl,
      enabled: form.enabled,
      languageMode: form.languageMode,
      buttonKh: form.buttonKh,
      buttonEn: form.buttonEn,
      footerEnabled: form.footerEnabled,
      footerJoinUs: form.footerJoinUs,
      footerFacebook: form.footerFacebook,
      footerTiktok: form.footerTiktok,
      footerYoutube: form.footerYoutube,
      footerInstagram: form.footerInstagram,
      footerWebsite: form.footerWebsite,
    });
    result.value = res.test;
    form.botTokenMasked = res.settings.botTokenMasked;
    form.siteUrl = res.settings.siteUrl;
    form.destinations = res.settings.destinations.map((d) => ({ ...d }));
    form.connected = res.settings.connected;
    form.botToken = "";
    toast.success("បានភ្ជាប់ Telegram ដោយជោគជ័យ");
  } catch (e) {
    result.value = { success: false, message: e instanceof Error ? e.message : "ការតភ្ជាប់បរាជ័យ" };
  } finally {
    busy.value = false;
  }
}

async function testOnly() {
  testing.value = true;
  result.value = null;
  try {
    const res = await adminService.testTelegramConnection({
      botToken: form.botToken || undefined,
      destinations: destinationInputs(),
    });
    result.value = res;
  } catch (e) {
    result.value = { success: false, message: e instanceof Error ? e.message : "ការតភ្ជាប់បរាជ័យ" };
  } finally {
    testing.value = false;
  }
}

async function openDiscover() {
  discoverOpen.value = true;
  await loadDiscovered();
}

async function loadDiscovered() {
  discovering.value = true;
  try {
    discovered.value = await adminService.discoverTelegramChats();
  } catch (e) {
    toast.error(e instanceof Error ? e.message : "ស្វែងរក chats បរាជ័យ");
  } finally {
    discovering.value = false;
  }
}

function addDiscovered(c: TelegramDiscoveredChat) {
  form.destinations.push({
    id: crypto.randomUUID?.() ?? String(Date.now()),
    chatId: c.chatId,
    type: (c.type as TelegramDestinationType) || "channel",
    label: c.title,
    enabled: true,
  });
}

onMounted(load);
</script>
