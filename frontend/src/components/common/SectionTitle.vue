<template>
  <div class="row">
    <div class="col-lg-12">
      <div class="section-tittle mb-30">
        <h3>{{ title }}</h3>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ title: string }>();
</script>
