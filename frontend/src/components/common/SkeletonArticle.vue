<template>
  <div class="skeleton-article" role="status" aria-label="Loading article...">
    <div class="skeleton skeleton-kicker"></div>
    <div class="skeleton skeleton-title"></div>
    <div class="skeleton skeleton-title short"></div>
    <div class="skeleton skeleton-meta"></div>
    <div class="skeleton skeleton-hero"></div>
    <div class="skeleton skeleton-line"></div>
    <div class="skeleton skeleton-line w-90"></div>
    <div class="skeleton skeleton-line w-95"></div>
    <span class="sr-only">Loading...</span>
  </div>
</template>

<style scoped>
.skeleton-article {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 20px 0;
}
.skeleton {
  background: linear-gradient(90deg, #eef1f5 25%, #e2e7ed 37%, #eef1f5 63%);
  background-size: 400% 100%;
  animation: shimmer 1.4s ease infinite;
  border-radius: 6px;
}
.skeleton-kicker { width: 90px; height: 20px; }
.skeleton-title { width: 100%; height: 26px; }
.skeleton-title.short { width: 70%; }
.skeleton-meta { width: 45%; height: 14px; }
.skeleton-hero { width: 100%; height: 0; padding-top: 52%; border-radius: 10px; }
.skeleton-line { width: 100%; height: 14px; }
.w-90 { width: 90%; }
.w-95 { width: 95%; }
@keyframes shimmer {
  0% { background-position: 100% 0; }
  100% { background-position: -100% 0; }
}
</style>
