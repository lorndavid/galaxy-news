<template>
  <div class="space-y-5">
    <div class="flex items-center justify-between">
      <div>
        <h3 class="text-sm font-semibold text-slate-700">សុខភាពប្រព័ន្ធ</h3>
        <p class="mt-0.5 text-xs text-slate-400">
          ជួនកាលអាប់ដេតរាល់ 30 វិនាទី · ពេលត្រួតពិនិត្យចុងក្រោយ៖ {{ lastChecked }}
        </p>
      </div>
      <button class="btn-secondary !py-1.5 text-xs" :disabled="checking" @click="check">
        <RefreshCw class="h-3.5 w-3.5" :class="checking ? 'animate-spin' : ''" />
        ត្រួតពិនិត្យម្តងទៀត
      </button>
    </div>

    <div v-if="error" class="rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      {{ error }}
    </div>

    <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <div v-for="svc in services" :key="svc.key" class="card p-4">
        <div class="flex items-center justify-between gap-2">
          <span class="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <component :is="svc.icon" class="h-4 w-4" :class="svc.status === 'ok' ? 'text-emerald-500' : svc.status === 'down' ? 'text-red-500' : 'text-amber-500'" />
            {{ svc.label }}
          </span>
          <span
            class="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-semibold"
            :class="statusClass(svc.status)"
          >
            {{ statusText(svc.status) }}
          </span>
        </div>
        <p class="mt-3 flex items-center justify-between text-xs text-slate-400">
          <span>Latency</span>
          <span class="font-mono font-medium text-slate-600">{{ svc.latency !== null ? `${svc.latency} ms` : "—" }}</span>
        </p>
        <p class="mt-1 flex items-center justify-between text-xs text-slate-400">
          <span>ពេលត្រួតពិនិត្យ</span>
          <span class="font-medium text-slate-500">{{ svc.checkedAt ?? "—" }}</span>
        </p>
      </div>
    </div>

    <div class="card p-5">
      <h4 class="flex items-center gap-2 text-sm font-semibold text-slate-700">
        <Info class="h-4 w-4 text-brand-600" /> អត្ថន័យស្ថានភាព
      </h4>
      <ul class="mt-3 space-y-1.5 text-xs leading-relaxed text-slate-500">
        <li class="flex items-center gap-2"><CheckCircle2 class="h-3.5 w-3.5 text-emerald-500" /> Ok — សេវាកម្មដំណើរការធម្មតា</li>
        <li class="flex items-center gap-2"><AlertTriangle class="h-3.5 w-3.5 text-amber-500" /> Degraded — ប៉ុន្តែគេហទំព័រអាចដំណើរការបាន</li>
        <li class="flex items-center gap-2"><XCircle class="h-3.5 w-3.5 text-red-500" /> Down — ប្រភពមិនអាចទាក់ទងបាន</li>
      </ul>
      <p class="mt-3 border-t border-slate-100 pt-3 text-[11px] text-slate-400">
        ការពិនិត្យនេះគ្រាន់តែបង្ហាញស្ថានភាពបច្ចុប្បន្នប៉ុណ្ណោះ — មិនដាក់បង្ហាញសម្ងាត់ ឬរចនាសម្ព័ន្ធផ្ទៃក្នុងឡើយ។
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";
import {
  AlertTriangle,
  CheckCircle2,
  Database,
  HeartPulse,
  Info,
  RefreshCw,
  Server,
  XCircle,
} from "lucide-vue-next";

type DepStatus = "ok" | "down" | "unknown";
type ServiceStatus = "ok" | "down" | "degraded" | "unknown";

interface ServiceCard {
  key: string;
  label: string;
  icon: typeof Server;
  status: ServiceStatus;
  latency: number | null;
  checkedAt: string | null;
}

const checking = ref(false);
const error = ref("");
const lastChecked = ref("—");
const services = ref<ServiceCard[]>([
  { key: "api", label: "API", icon: HeartPulse, status: "unknown", latency: null, checkedAt: null },
  { key: "database", label: "SQLite / Database", icon: Database, status: "unknown", latency: null, checkedAt: null },
  { key: "redis", label: "Redis (Cache)", icon: Server, status: "unknown", latency: null, checkedAt: null },
  { key: "minio", label: "MinIO (Media)", icon: Server, status: "unknown", latency: null, checkedAt: null },
]);

function statusText(s: ServiceStatus): string {
  return { ok: "Ok", down: "Down", degraded: "Degraded", unknown: "…" }[s];
}
function statusClass(s: ServiceStatus): string {
  return {
    ok: "bg-emerald-50 text-emerald-700",
    down: "bg-red-50 text-red-700",
    degraded: "bg-amber-50 text-amber-700",
    unknown: "bg-slate-100 text-slate-500",
  }[s];
}

/** Dev serves the backend on :4000; in Docker nginx proxies /health. */
function healthUrl(): string {
  const port = window.location.port;
  if (port === "5174") return "http://localhost:4000/health";
  return "/health";
}

async function check() {
  if (checking.value) return;
  checking.value = true;
  error.value = "";
  const started = Date.now();
  try {
    const res = await fetch(healthUrl(), { headers: { Accept: "application/json" } });
    const total = Date.now() - started;
    const json = (await res.json()) as {
      success?: boolean;
      data?: { status?: string; dependencies?: Record<string, string> };
    };
    const ok = res.ok && json.success !== false;
    const deps = json.data?.dependencies ?? {};
    const mark = (key: string, status: DepStatus, latency: number | null) => {
      const card = services.value.find((s) => s.key === key);
      if (!card) return;
      card.status = status === "ok" ? "ok" : status === "down" ? "down" : "degraded";
      card.latency = latency;
      card.checkedAt = new Date().toLocaleTimeString();
    };
    mark("api", ok ? "ok" : "down", total);
    mark("database", (deps.database as DepStatus) ?? "unknown", total);
    mark("redis", (deps.redis as DepStatus) ?? "unknown", total);
    mark("minio", (deps.minio as DepStatus) ?? "unknown", total);
    lastChecked.value = new Date().toLocaleTimeString();
  } catch {
    error.value = "មិនអាចទាក់ទង backend បានទេ — សូមពិនិត្យសវេន API ។";
    services.value.forEach((s) => {
      s.status = "down";
      s.latency = null;
      s.checkedAt = new Date().toLocaleTimeString();
    });
  } finally {
    checking.value = false;
  }
}

let pollTimer: ReturnType<typeof setInterval> | null = null;

onMounted(() => {
  check();
  pollTimer = setInterval(() => void check(), 30_000);
});

onUnmounted(() => {
  if (pollTimer) clearInterval(pollTimer);
});
</script>

<style scoped>
.nav-fade-enter-active,
.nav-fade-leave-active {
  transition: opacity 0.18s ease;
}
.nav-fade-enter-from,
.nav-fade-leave-to {
  opacity: 0;
}
</style>