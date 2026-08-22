<template>
  <div>
    <RouterView />
    <Toast />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from "vue";
import { useAuthStore } from "@/stores/auth";
import Toast from "@/components/ui/Toast.vue";

const auth = useAuthStore();
onMounted(() => {
  if (auth.isAuthenticated) auth.fetchMe();
});
</script>
