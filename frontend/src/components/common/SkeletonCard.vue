<template>
  <div class="skeleton-card" role="status" aria-label="កំពុងផ្ទុកអត្ថបទ">
    <div class="skeleton skeleton-thumb"></div>
    <div class="skeleton-body">
      <div class="skeleton skeleton-line w-40"></div>
      <div class="skeleton skeleton-line w-100"></div>
      <div class="skeleton skeleton-line w-90"></div>
      <div class="skeleton skeleton-line w-30"></div>
    </div>
    <span class="sr-only">កំពុងផ្ទុក...</span>
  </div>
</template>

<style scoped>
.skeleton-card {
  border-radius: 10px;
  overflow: hidden;
  background: #ffffff;
  border: 1px solid #f0f2f5;
}
.skeleton-thumb {
  width: 100%;
  height: 0;
  padding-top: 62%; /* same aspect as article thumbs */
  border-radius: 0;
}
.skeleton-body {
  padding: 14px 14px 18px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.skeleton {
  background: linear-gradient(90deg, #eef1f5 25%, #e2e7ed 37%, #eef1f5 63%);
  background-size: 400% 100%;
  animation: shimmer 1.4s ease infinite;
  border-radius: 6px;
}
.skeleton-line {
  height: 13px;
}
.w-30 { width: 30%; }
.w-40 { width: 40%; }
.w-90 { width: 90%; }
.w-100 { width: 100%; }
@keyframes shimmer {
  0% { background-position: 100% 0; }
  100% { background-position: -100% 0; }
}
</style>
