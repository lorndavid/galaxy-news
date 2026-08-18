<template>
  <div class="g-section-header">
    <div class="g-section-accent" aria-hidden="true"></div>
    <h3>{{ title }}</h3>
    <RouterLink v-if="to" :to="to" class="g-section-link">
      {{ viewAllText }} <i class="ti-angle-right"></i>
    </RouterLink>
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    title: string;
    to?: string;
    viewAllText?: string;
  }>(),
  { viewAllText: "មើលទាំងអស់" }
);
</script>

<style scoped>
.g-section-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
}
.g-section-accent {
  width: 4px;
  height: 24px;
  border-radius: 3px;
  background: linear-gradient(180deg, #4f46e5, #7c3aed);
  flex-shrink: 0;
}
.g-section-header h3 {
  margin: 0;
  font-family: var(--font-heading, "Kantumruy Pro", "Noto Sans Khmer", sans-serif);
  font-size: clamp(18px, 0.8vw + 0.85rem, 22px);
  font-weight: 700;
  color: var(--color-text, #111827);
}
.g-section-link {
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
.g-section-link i {
  transition: transform 0.2s ease;
  font-size: 12px;
}
.g-section-link:hover {
  color: var(--color-accent, #4f46e5);
}
.g-section-link:hover i {
  transform: translateX(3px);
}
@media (max-width: 575px) {
  .g-section-header h3 {
    font-size: 18px;
  }
}
</style>
