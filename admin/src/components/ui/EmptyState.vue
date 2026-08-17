<template>
  <div class="empty-state">
    <div class="empty-icon">
      <component :is="icon" class="h-6 w-6" />
    </div>
    <h3>{{ title }}</h3>
    <p v-if="message">{{ message }}</p>
    <slot />
  </div>
</template>

<script setup lang="ts">
import { Inbox } from "lucide-vue-next";
import type { LucideIcon } from "lucide-vue-next";

withDefaults(
  defineProps<{
    title?: string;
    message?: string;
    icon?: LucideIcon;
  }>(),
  {
    title: "គ្មានទិន្នន័យ",
    message: "",
    icon: () => Inbox,
  }
);
</script>
