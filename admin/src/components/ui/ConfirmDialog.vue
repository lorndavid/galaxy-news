<template>
  <Modal :model-value="modelValue" :title="title" @update:model-value="$emit('update:modelValue', $event)">
    <div class="flex items-start gap-3">
      <div v-if="danger" class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-950/40">
        <AlertTriangle class="h-5 w-5 text-red-600 dark:text-red-400" />
      </div>
      <div>
        <p class="text-sm text-slate-600">{{ message }}</p>
        <p v-if="hint" class="mt-2 text-xs text-slate-400">{{ hint }}</p>
      </div>
    </div>
    <template #footer>
      <button class="btn-secondary" @click="$emit('update:modelValue', false)">បោះបង់</button>
      <button class="btn-danger" :disabled="busy" @click="$emit('confirm')">
        <Loader2 v-if="busy" class="h-4 w-4 animate-spin" />
        {{ busy ? "កំពុងដំណើរការ..." : confirmLabel }}
      </button>
    </template>
  </Modal>
</template>

<script setup lang="ts">
import { AlertTriangle, Loader2 } from "lucide-vue-next";
import Modal from "./Modal.vue";

withDefaults(
  defineProps<{
    modelValue: boolean;
    title?: string;
    message?: string;
    hint?: string;
    confirmLabel?: string;
    busy?: boolean;
    danger?: boolean;
  }>(),
  {
    title: "បញ្ជាក់ការលុប",
    message: "តើអ្នកប្រាកដថាចង់បន្តទេ? សកម្មភាពនេះមិនអាចត្រឡប់វិញបានទេ។",
    hint: "",
    confirmLabel: "លុប",
    busy: false,
    danger: true,
  }
);
defineEmits<{ "update:modelValue": [value: boolean]; confirm: [] }>();
</script>
