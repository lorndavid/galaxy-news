import { defineStore } from "pinia";
import { computed, ref } from "vue";
import { api, TOKEN_KEY, unwrap } from "@/services/api";
import type { User } from "@/types";

export const useAuthStore = defineStore("auth", () => {
  const user = ref<User | null>(null);
  const token = ref<string | null>(localStorage.getItem(TOKEN_KEY));
  const loading = ref(false);

  const isAuthenticated = computed(() => !!token.value);
  const isAdmin = computed(() => user.value?.role === "ADMIN" || user.value?.role === "SUPER_ADMIN");
  const isEditor = computed(
    () => user.value?.role === "ADMIN" || user.value?.role === "SUPER_ADMIN" || user.value?.role === "EDITOR"
  );

  async function login(email: string, password: string) {
    loading.value = true;
    try {
      const data = await unwrap<{ user: User; accessToken: string }>(
        api.post("/auth/login", { email, password })
      );
      user.value = data.user;
      token.value = data.accessToken;
      localStorage.setItem(TOKEN_KEY, data.accessToken);
      return data.user;
    } finally {
      loading.value = false;
    }
  }

  async function fetchMe() {
    try {
      user.value = await unwrap<User>(api.get("/auth/me"));
      return user.value;
    } catch {
      logout();
      return null;
    }
  }

  async function logout() {
    try {
      await api.post("/auth/logout");
    } catch {
      // ignore
    }
    user.value = null;
    token.value = null;
    localStorage.removeItem(TOKEN_KEY);
  }

  return {
    user,
    token,
    loading,
    isAuthenticated,
    isAdmin,
    isEditor,
    login,
    fetchMe,
    logout,
  };
});
