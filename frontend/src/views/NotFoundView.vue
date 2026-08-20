<template>
  <div class="not-found-area">
    <div class="container text-center">
      <div class="nf-code">404</div>
      <h1>រកមិនឃើញទំព័រ</h1>
      <p>សូមទោស ទំព័រដែលអ្នកកំពុងស្វែងរកមិនមានទេ។</p>
      <RouterLink to="/" class="btn boxed-btn mt-3">ត្រឡប់ទៅទំព័រដើម</RouterLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useSeo } from "@/composables/useSeo";

useSeo({ title: "រកមិនឃើញ | Galaxy TV V4K" });
</script>

<style scoped>
.not-found-area {
  padding: 90px 0;
}
.nf-code {
  font-size: 110px;
  font-weight: 900;
  color: #0d3fa9;
  line-height: 1;
  margin-bottom: 10px;
}
.not-found-area h1 {
  color: #0b1c39;
  font-size: 30px;
  margin-bottom: 8px;
}
.not-found-area p {
  color: #6b7280;
  font-size: 16px;
}
</style>
