<template>
  <div class="row">
    <div class="col-lg-12">
      <div class="section-tittle mb-30 section-title-modern">
        <div class="section-title-line" aria-hidden="true"></div>
        <h3>{{ title }}</h3>
        <RouterLink v-if="to" :to="to" class="section-title-viewall">
          {{ viewAllText }} <i class="ti-angle-right"></i>
        </RouterLink>
      </div>
    </div>
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
.section-title-modern {
  display: flex;
  align-items: center;
  gap: 12px;
  position: relative;
}
.section-title-line {
  width: 4px;
  height: 22px;
  border-radius: 3px;
  background: linear-gradient(180deg, #0d3fa9, #1e5fd6);
  flex-shrink: 0;
}
.section-title-modern h3 {
  margin: 0;
}
.section-title-viewall {
  margin-left: auto;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  font-weight: 600;
  color: #0b1c39;
  text-decoration: none;
  white-space: nowrap;
  transition: color 0.2s ease, transform 0.2s ease;
}
.section-title-viewall i {
  transition: transform 0.2s ease;
  font-size: 12px;
}
.section-title-viewall:hover {
  color: #0d3fa9;
}
.section-title-viewall:hover i {
  transform: translateX(3px);
}
@media (max-width: 575px) {
  .section-title-modern h3 {
    font-size: 18px;
  }
}
</style>
