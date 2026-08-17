<template>
  <div class="language-switcher" role="group" aria-label="ភាសា / Language">
    <button
      type="button"
      class="lang-btn"
      :class="{ active: store.locale === 'kh' }"
      :aria-pressed="store.locale === 'kh'"
      @click="store.setLocale('kh')"
    >
      ខ្មែរ
    </button>
    <span class="lang-sep" aria-hidden="true"></span>
    <button
      type="button"
      class="lang-btn"
      :class="{ active: store.locale === 'en' }"
      :aria-pressed="store.locale === 'en'"
      @click="store.setLocale('en')"
    >
      EN
    </button>
  </div>
</template>

<script setup lang="ts">
import { useLocaleStore } from "@/stores/locale";

const store = useLocaleStore();
</script>

<style scoped>
.language-switcher {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  flex-shrink: 0;
}
.lang-btn {
  border: none;
  background: transparent;
  padding: 4px 8px;
  border-radius: 6px;
  font-family: var(--font-body, "Noto Sans Khmer", sans-serif);
  font-size: 12.5px;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.65);
  cursor: pointer;
  transition: color 0.2s ease, background 0.2s ease;
}
.lang-btn:hover {
  color: #111;
  background: rgba(0, 0, 0, 0.06);
}
.lang-btn.active {
  color: #111;
  background: rgba(0, 0, 0, 0.1);
}
.lang-sep {
  width: 1px;
  height: 14px;
  background: rgba(0, 0, 0, 0.2);
}
</style>
