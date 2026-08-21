<template>
  <div class="login-page flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-900 via-brand-800 to-brand-700 p-4">
    <!-- Animated background pattern -->
    <div class="login-bg absolute inset-0 overflow-hidden" aria-hidden="true">
      <div class="login-bg-circle absolute -right-32 -top-32 h-96 w-96 rounded-full bg-white/5"></div>
      <div class="login-bg-circle login-bg-circle--delay absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-white/[0.03]"></div>
    </div>

    <div class="relative z-10 w-full max-w-sm">
      <!-- Brand -->
      <div class="mb-8 text-center">
        <div class="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-lg shadow-brand-900/30">
          <img :src="'/assets/img/logo/logo1.png'" alt="Galaxy TV4K" class="h-10 w-auto" />
        </div>
        <h1 class="mt-4 text-xl font-bold text-white">Galaxy TV4K</h1>
        <p class="mt-1 text-sm text-white/60">{{ prefs.t('settings.siteInfo') }}</p>
      </div>

      <!-- Login form -->
      <form class="card p-6" @submit.prevent="submit">
        <div class="mb-4">
          <label class="label" for="email">{{ prefs.t('login.email') }}</label>
          <input
            id="email"
            v-model="email"
            type="email"
            class="input"
            placeholder="admin@galaxy.tv"
            required
            autocomplete="email"
            autofocus
          />
        </div>
        <div class="mb-5">
          <label class="label" for="password">{{ prefs.t('login.password') }}</label>
          <input
            id="password"
            v-model="password"
            type="password"
            class="input"
            placeholder="••••••••"
            required
            autocomplete="current-password"
          />
        </div>

        <!-- Error -->
        <Transition name="slide-fade">
          <div v-if="error" class="mb-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
            <AlertCircle class="mt-0.5 h-4 w-4 shrink-0" />
            <span>{{ error }}</span>
          </div>
        </Transition>

        <button type="submit" class="btn-primary w-full !py-2.5" :disabled="auth.loading">
          <Loader2 v-if="auth.loading" class="h-4 w-4 animate-spin" />
          {{ auth.loading ? "កំពុងចូល..." : "ចូលប្រព័ន្ធ" }}
        </button>
      </form>

      <!-- Footer -->
      <p class="mt-6 text-center text-xs text-white/30">© {{ new Date().getFullYear() }} Galaxy TV4K · Editorial CMS</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { Loader2, AlertCircle } from "lucide-vue-next";
import { useAuthStore } from "@/stores/auth";
import { usePreferencesStore } from "@/stores/preferences";

const auth = useAuthStore();
const prefs = usePreferencesStore();
const router = useRouter();
const route = useRoute();

const email = ref("");
const password = ref("");
const error = ref("");

async function submit() {
  error.value = "";
  try {
    await auth.login(email.value, password.value);
    router.push(String(route.query.redirect ?? "/"));
  } catch (e) {
    error.value = e instanceof Error ? e.message : "ចូលប្រព័ន្ធបរាជ័យ";
  }
}
</script>

<style scoped>
.login-bg-circle {
  animation: float 20s ease-in-out infinite;
}
.login-bg-circle--delay {
  animation-delay: -10s;
}

@keyframes float {
  0%, 100% { transform: translateY(0) scale(1); }
  50% { transform: translateY(-20px) scale(1.05); }
}

.slide-fade-enter-active {
  transition: all 0.25s ease;
}
.slide-fade-leave-active {
  transition: all 0.15s ease;
}
.slide-fade-enter-from {
  opacity: 0;
  transform: translateY(-4px);
}
.slide-fade-leave-to {
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .login-bg-circle { animation: none; }
  .slide-fade-enter-active, .slide-fade-leave-active { transition: none; }
}
</style>
