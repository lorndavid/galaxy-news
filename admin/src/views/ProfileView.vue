<template>
  <div class="card max-w-xl space-y-4 p-6">
    <h3 class="text-sm font-semibold text-slate-700">{{ prefs.t('profile.title') }}</h3>
    <div v-if="auth.user" class="flex items-center gap-4">
      <div class="flex h-14 w-14 items-center justify-center rounded-full bg-brand-100 text-xl font-bold text-brand-700">
        {{ auth.user.name.charAt(0) }}
      </div>
      <div>
        <p class="font-medium text-slate-800">{{ auth.user.name }}</p>
        <p class="text-sm text-slate-500">{{ auth.user.email }} · {{ auth.user.role }}</p>
      </div>
    </div>

    <form class="space-y-3" @submit.prevent="save">
      <div>
        <label class="label">{{ prefs.t('profile.name') }}</label>
        <input v-model="form.name" type="text" class="input" required />
      </div>
      <div class="grid gap-3 sm:grid-cols-2">
        <div>
          <label class="label">ពាក្យសម្ងាត់បច្ចុប្បន្ន</label>
          <input v-model="form.currentPassword" type="password" class="input" autocomplete="current-password" />
        </div>
        <div>
          <label class="label">ពាក្យសម្ងាត់ថ្មី</label>
          <input v-model="form.newPassword" type="password" class="input" autocomplete="new-password" />
        </div>
      </div>
      <button type="submit" class="btn-primary" :disabled="saving">{{ prefs.t('common.save') }}</button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { api, unwrap } from "@/services/api";
import { useAuthStore } from "@/stores/auth";
import { useToastStore } from "@/stores/toast";
import type { User } from "@/types";
import { usePreferencesStore } from "@/stores/preferences";

const auth = useAuthStore();
const prefs = usePreferencesStore();
const toast = useToastStore();
const saving = ref(false);
const form = reactive({ name: "", currentPassword: "", newPassword: "" });

onMounted(() => {
  if (auth.user) form.name = auth.user.name;
});

async function save() {
  saving.value = true;
  try {
    const user = await unwrap<User>(
      api.patch("/auth/me", {
        name: form.name,
        ...(form.currentPassword && form.newPassword
          ? { currentPassword: form.currentPassword, newPassword: form.newPassword }
          : {}),
      })
    );
    auth.user = user;
    form.currentPassword = "";
    form.newPassword = "";
    toast.success(prefs.t('toast.profileSaved'));
  } catch (e) {
    toast.error(e instanceof Error ? e.message : prefs.t('toast.saveError'));
  } finally {
    saving.value = false;
  }
}
</script>
