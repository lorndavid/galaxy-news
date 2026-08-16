import { defineStore } from "pinia";
import { ref } from "vue";

export interface ToastItem {
  id: number;
  message: string;
  type: "success" | "error" | "info";
}

export const useToastStore = defineStore("toast", () => {
  const toasts = ref<ToastItem[]>([]);
  let counter = 0;

  function show(message: string, type: "success" | "error" | "info" = "success") {
    const id = ++counter;
    toasts.value.push({ id, message, type });
    setTimeout(() => {
      toasts.value = toasts.value.filter((t) => t.id !== id);
    }, 3500);
  }

  const success = (m: string) => show(m, "success");
  const error = (m: string) => show(m, "error");
  const info = (m: string) => show(m, "info");

  return { toasts, show, success, error, info };
});
