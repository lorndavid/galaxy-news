import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import { router } from "./router";
import { vReveal } from "./composables/useReveal";
import { vPrefetch, initPrefetch } from "./composables/usePrefetch";
import "./styles/app.css";

// Initialize route prefetch map from the router's lazy-loaded components
initPrefetch(router.getRoutes());

const app = createApp(App);
app.use(createPinia());
app.use(router);
app.directive("reveal", vReveal);
app.directive("prefetch", vPrefetch);
app.mount("#app");
