<template>
  <div class="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-900 via-brand-700 to-brand-600 p-4">
    <div class="w-full max-w-md">
      <div class="mb-6 text-center">
        <img :src="'/assets/img/logo/logo1.png'" alt="Galaxy TV4K" class="mx-auto h-14 w-auto" />
        <h1 class="mt-3 text-xl font-semibold text-white">Galaxy TV4K</h1>
        <p class="text-sm text-white/70">ប្រព័ន្ធគ្រប់គ្រងមាតិកា (Editorial CMS)</p>
      </div>
      <form class="card p-6" @submit.prevent="submit">
        <div class="mb-4">
          <label class="label" for="email">អ៊ីមែល</label>
          <input id="email" v-model="email" type="email" class="input" placeholder="admin@navatra.tv" required autocomplete="email" />
        </div>
        <div class="mb-5">
          <label class="label" for="password">ពាក្យសម្ងាត់</label>
          <input id="password" v-model="password" type="password" class="input" placeholder="••••••••" required autocomplete="current-password" />
        </div>
        <p v-if="error" class="mb-3 text-sm text-red-600">{{ error }}</p>
        <button type="submit" class="btn-primary w-full" :disabled="auth.loading">
          <Loader2 v-if="auth.loading" class="h-4 w-4 animate-spin" />
          {{ auth.loading ? "កំពុងចូល..." : "ចូលប្រព័ន្ធ" }}
        </button>
        <div class="mt-4 rounded-lg bg-slate-50 p-3 text-xs text-slate-500">
          <p class="font-medium text-slate-600">គណនីសាកល្បង (seed data):</p>
          <p>Super Admin: <code>superadmin@navatra.tv / admin123</code></p>
          <p>Editor: <code>editor@navatra.tv / editor123</code></p>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { Loader2 } from "lucide-vue-next";
import { useAuthStore } from "@/stores/auth";

const auth = useAuthStore();
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
