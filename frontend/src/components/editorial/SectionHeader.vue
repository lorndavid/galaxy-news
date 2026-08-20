<template>
  <div class="ed-section-header">
    <div class="ed-section-accent" :style="{ background: accentColor || 'var(--color-accent)' }"></div>
    <h2 class="ed-section-title">{{ title }}</h2>
    <p v-if="description" class="ed-section-desc">{{ description }}</p>
    <RouterLink v-if="viewAllTo" :to="viewAllTo" class="ed-section-link">
      {{ linkText }} <i class="ti-angle-right"></i>
    </RouterLink>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title: string;
  accentColor?: string;
  description?: string;
  viewAllTo?: string;
  linkText?: string;
}>();
</script>

<style scoped>
.ed-section-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
  padding-bottom: 10px;
  border-bottom: 2px solid var(--color-text, #111827);
}
.ed-section-accent {
  width: 4px;
  height: 26px;
  flex-shrink: 0;
  border-radius: 2px;
}
.ed-section-title {
  font-family: var(--font-heading, "Noto Sans Khmer", sans-serif);
  font-size: clamp(18px, 0.8vw + 0.85rem, 22px);
  font-weight: 700;
  margin: 0;
  white-space: nowrap;
}
.ed-section-desc {
  margin: 0;
  font-size: 13px;
  color: var(--color-muted, #6b7280);
  display: none;
}
.ed-section-link {
  margin-left: auto;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  font-weight: 600;
  color: var(--color-muted, #6b7280);
  text-decoration: none;
  white-space: nowrap;
  transition: color 0.2s ease, transform 0.2s ease;
}
.ed-section-link:hover {
  color: var(--color-accent, #4f46e5);
  transform: translateX(2px);
}
@media (max-width: 640px) {
  .ed-section-header {
    margin-bottom: 16px;
  }
  .ed-section-title {
    font-size: 17px;
  }
}
</style>
