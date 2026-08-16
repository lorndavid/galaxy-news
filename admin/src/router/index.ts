import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { TOKEN_KEY } from "@/services/api";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: "/login",
      name: "login",
      component: () => import("@/views/LoginView.vue"),
      meta: { public: true, title: "ចូលប្រព័ន្ធ" },
    },
    {
      path: "/",
      component: () => import("@/layouts/AdminLayout.vue"),
      meta: { requiresAuth: true },
      children: [
        { path: "", name: "dashboard", component: () => import("@/views/DashboardView.vue"), meta: { title: "ផ្ទាំងគ្រប់គ្រង" } },
        { path: "articles", name: "articles", component: () => import("@/views/ArticlesView.vue"), meta: { title: "អត្ថបទ" } },
        { path: "articles/new", name: "article-new", component: () => import("@/views/ArticleEditorView.vue"), meta: { title: "អត្ថបទថ្មី" } },
        { path: "articles/:id/edit", name: "article-edit", component: () => import("@/views/ArticleEditorView.vue"), meta: { title: "កែសម្រួលអត្ថបទ" } },
        { path: "categories", name: "categories", component: () => import("@/views/CategoriesView.vue"), meta: { title: "ប្រភេទ" } },
        { path: "tags", name: "tags", component: () => import("@/views/TagsView.vue"), meta: { title: "ស្លាក" } },
        { path: "media", name: "media", component: () => import("@/views/MediaView.vue"), meta: { title: "បណ្ណាល័យមេឌា" } },
        { path: "users", name: "users", component: () => import("@/views/UsersView.vue"), meta: { title: "អ្នកប្រើប្រាស់", requiresAdmin: true } },
        { path: "comments", name: "comments", component: () => import("@/views/CommentsView.vue"), meta: { title: "មតិយោបល់" } },
        { path: "messages", name: "messages", component: () => import("@/views/MessagesView.vue"), meta: { title: "សារទំនាក់ទំនង", requiresAdmin: true } },
        { path: "newsletter", name: "newsletter", component: () => import("@/views/NewsletterView.vue"), meta: { title: "ព្រឹត្តិបត្រ", requiresAdmin: true } },
        { path: "ads", name: "ads", component: () => import("@/views/AdsView.vue"), meta: { title: "ផ្សាយពាណិជ្ជកម្ម" } },
        { path: "settings", name: "settings", component: () => import("@/views/SettingsView.vue"), meta: { title: "ការកំណត់គេហទំព័រ", requiresAdmin: true } },
        { path: "homepage-builder", name: "homepage-builder", component: () => import("@/views/HomepageBuilderView.vue"), meta: { title: "អ្នកបង្កើតទំព័រដើម", requiresAdmin: true } },
        { path: "navigation-builder", name: "navigation-builder", component: () => import("@/views/NavigationBuilderView.vue"), meta: { title: "អ្នកបង្កើតម៉ឺនុយ", requiresAdmin: true } },
        { path: "activity", name: "activity", component: () => import("@/views/ActivityView.vue"), meta: { title: "ប្រវត្តិសកម្មភាព", requiresAdmin: true } },
        { path: "profile", name: "profile", component: () => import("@/views/ProfileView.vue"), meta: { title: "ប្រវត្តិរូប" } },
      ],
    },
    { path: "/:pathMatch(.*)*", redirect: "/" },
  ],
});

router.beforeEach(async (to) => {
  const auth = useAuthStore();
  if (to.meta.public) {
    if (auth.isAuthenticated) return { name: "dashboard" };
    return true;
  }
  if (!localStorage.getItem(TOKEN_KEY)) {
    return { name: "login", query: { redirect: to.fullPath } };
  }
  if (!auth.user) {
    await auth.fetchMe();
    if (!auth.user) return { name: "login" };
  }
  if (to.meta.requiresAdmin && !auth.isAdmin) {
    return { name: "dashboard" };
  }
  return true;
});

router.afterEach((to) => {
  document.title = `${String(to.meta.title ?? "Admin")} | Navatra 4K TV`;
});

export { router };
