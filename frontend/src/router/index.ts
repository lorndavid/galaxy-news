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
      meta: { title: "Navatra 4K TV | ព័ត៌មាន" },
    },
    {
      path: "/article/:slug",
      name: "article",
      component: () => import("@/views/ArticleView.vue"),
      meta: { title: "Navatra 4K TV" },
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
      meta: { title: "ស្វែងរក | Navatra 4K TV" },
    },
    {
      path: "/news",
      name: "news",
      component: () => import("@/views/NewsListView.vue"),
      meta: { title: "បញ្ជីព័ត៌មាន | Navatra 4K TV" },
    },
    {
      path: "/latest",
      name: "latest",
      component: () => import("@/views/NewsListView.vue"),
      meta: { title: "ព័ត៌មានថ្មីៗ | Navatra 4K TV" },
    },
    {
      path: "/about",
      name: "about",
      component: () => import("@/views/AboutView.vue"),
      meta: { title: "អំពីយើង | Navatra 4K TV" },
    },
    {
      path: "/contact",
      name: "contact",
      component: () => import("@/views/ContactView.vue"),
      meta: { title: "ទំនាក់ទំនង | Navatra 4K TV" },
    },
    {
      path: "/:pathMatch(.*)*",
      name: "not-found",
      component: () => import("@/views/NotFoundView.vue"),
      meta: { title: "រកមិនឃើញ | Navatra 4K TV" },
    },
  ],
});

router.afterEach((to) => {
  const t = (to.meta.title as string) || "Navatra 4K TV";
  document.title = t;
});
