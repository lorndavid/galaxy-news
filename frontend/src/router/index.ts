import { createRouter, createWebHistory } from "vue-router";

export const router = createRouter({
  history: createWebHistory(),
  scrollBehavior(to, _from, savedPosition) {
    if (savedPosition) return savedPosition;
    if (to.hash) return { el: to.hash, behavior: "smooth" };
    return { top: 0 };
  },
  routes: [
    {
      path: "/",
      name: "home",
      component: () => import("@/views/HomeView.vue"),
      meta: { title: "Galaxy TV V4K | ព័ត៌មាន" },
    },
    {
      path: "/article/:slug",
      name: "article",
      component: () => import("@/views/ArticleView.vue"),
      meta: { title: "Galaxy TV V4K" },
    },
    // Language-prefixed article URLs — used by Telegram buttons and SEO.
    // The URL language always wins over the stored preference.
    {
      path: "/kh/news/:slug",
      name: "article-kh",
      component: () => import("@/views/ArticleView.vue"),
      meta: { title: "Galaxy TV V4K", locale: "kh" },
    },
    {
      path: "/en/news/:slug",
      name: "article-en",
      component: () => import("@/views/ArticleView.vue"),
      meta: { title: "Galaxy TV V4K", locale: "en" },
    },
    {
      path: "/zh/news/:slug",
      name: "article-zh",
      component: () => import("@/views/ArticleView.vue"),
      meta: { title: "Galaxy TV V4K", locale: "zh" },
    },
    {
      path: "/category/:slug",
      name: "category",
      component: () => import("@/views/CategoryView.vue"),
    },
    {
      path: "/author/:id",
      name: "author",
      component: () => import("@/views/AuthorView.vue"),
    },
    {
      path: "/search",
      name: "search",
      component: () => import("@/views/SearchView.vue"),
      meta: { title: "ស្វែងរក | Galaxy TV V4K" },
    },
    {
      path: "/news",
      name: "news",
      component: () => import("@/views/NewsListView.vue"),
      meta: { title: "បញ្ជីព័ត៌មាន | Galaxy TV V4K" },
    },
    {
      path: "/latest",
      name: "latest",
      component: () => import("@/views/NewsListView.vue"),
      meta: { title: "ព័ត៌មានថ្មីៗ | Galaxy TV V4K" },
    },
    {
      path: "/live",
      name: "live",
      component: () => import("@/views/LiveView.vue"),
      meta: { title: "ផ្សាយផ្ទាល់ | Galaxy TV V4K" },
    },
    {
      path: "/about",
      name: "about",
      component: () => import("@/views/AboutView.vue"),
      meta: { title: "អំពីយើង | Galaxy TV V4K" },
    },
    {
      path: "/contact",
      name: "contact",
      component: () => import("@/views/ContactView.vue"),
      meta: { title: "ទំនាក់ទំនង | Galaxy TV V4K" },
    },
    {
      path: "/:pathMatch(.*)*",
      name: "not-found",
      component: () => import("@/views/NotFoundView.vue"),
      meta: { title: "រកមិនឃើញ | Galaxy TV V4K" },
    },
  ],
});

router.afterEach((to) => {
  const t = (to.meta.title as string) || "Galaxy TV V4K";
  document.title = t;
});
