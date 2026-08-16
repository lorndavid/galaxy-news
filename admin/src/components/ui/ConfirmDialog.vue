<template>
  <Modal :model-value="modelValue" :title="title" @update:model-value="$emit('update:modelValue', $event)">
    <p class="text-sm text-slate-600">{{ message }}</p>
    <template #footer>
      <button class="btn-secondary" @click="$emit('update:modelValue', false)">បោះបង់</button>
      <button class="btn-danger" :disabled="busy" @click="$emit('confirm')">
        {{ busy ? "កំពុងដំណើរការ..." : confirmLabel }}
      </button>
    </template>
  </Modal>
</template>

<script setup lang="ts">
import Modal from "./Modal.vue";

withDefaults(
  defineProps<{
    modelValue: boolean;
    title?: string;
    message?: string;
    confirmLabel?: string;
    busy?: boolean;
  }>(),
  {
    title: "បញ្ជាក់ការលុប",
    message: "តើអ្នកប្រាកដថាចង់បន្តទេ? សកម្មភាពនេះមិនអាចត្រឡប់វិញបានទេ។",
    confirmLabel: "លុប",
    busy: false,
  }
);
defineEmits<{ "update:modelValue": [value: boolean]; confirm: [] }>();
</script>
