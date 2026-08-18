<template>
  <footer class="g-footer">
    <!-- Main footer content -->
    <div class="container g-footer-top">
      <!-- Brand column -->
      <div class="g-footer-brand">
        <RouterLink to="/" class="g-footer-logo">
          <img :src="logoUrl" :alt="siteName" loading="lazy" decoding="async" />
        </RouterLink>
        <p class="g-footer-desc">{{ footerDescription }}</p>
        <ul class="g-footer-social" aria-label="បណ្តាញសង្គម">
          <li v-if="settings?.facebook"><a :href="settings.facebook" target="_blank" rel="noopener" aria-label="Facebook"><i class="fab fa-facebook-f"></i></a></li>
          <li v-if="settings?.youtube"><a :href="settings.youtube" target="_blank" rel="noopener" aria-label="YouTube"><i class="fab fa-youtube"></i></a></li>
          <li v-if="settings?.tiktok"><a :href="settings.tiktok" target="_blank" rel="noopener" aria-label="TikTok"><i class="fab fa-tiktok"></i></a></li>
          <li v-if="settings?.instagram"><a :href="settings.instagram" target="_blank" rel="noopener" aria-label="Instagram"><i class="fab fa-instagram"></i></a></li>
          <li v-if="settings?.telegram"><a :href="settings.telegram" target="_blank" rel="noopener" aria-label="Telegram"><i class="fab fa-telegram-plane"></i></a></li>
        </ul>
      </div>

      <!-- Latest news column -->
      <div class="g-footer-col">
        <h4>{{ t.footer.latest }}</h4>
        <ul class="g-footer-links">
          <li v-for="a in latestArticles.slice(0, 4)" :key="a.id">
            <RouterLink :to="`/article/${a.slug}`">{{ title(a) }}</RouterLink>
          </li>
        </ul>
      </div>

      <!-- Categories column -->
      <div class="g-footer-col">
        <h4>ប្រភេទ</h4>
        <ul class="g-footer-links">
          <li v-for="cat in footerCategories" :key="cat.id">
            <RouterLink :to="`/category/${cat.slug}`">{{ catNameOf(cat) }}</RouterLink>
          </li>
        </ul>
      </div>

      <!-- Newsletter column -->
      <div class="g-footer-col">
        <h4>{{ t.footer.newsletter }}</h4>
        <p class="g-footer-newsletter-desc">{{ t.footer.newsletterDesc }}</p>
        <form class="g-footer-newsletter" @submit.prevent="subscribe">
          <input
            v-model="newsletterEmail"
            type="email"
            :placeholder="t.footer.emailPlaceholder"
            required
            :disabled="subscribing"
            :aria-label="t.footer.emailPlaceholder"
          />
          <button type="submit" class="g-footer-newsletter-btn" :disabled="subscribing" :aria-label="t.footer.subscribe">
            <i v-if="!subscribing" class="fas fa-paper-plane" aria-hidden="true"></i>
            <span v-else class="g-spinner" aria-hidden="true"></span>
          </button>
        </form>
        <p v-if="newsletterMsg" class="g-footer-msg">{{ newsletterMsg }}</p>
        <p v-if="newsletterErr" class="g-footer-msg g-footer-msg--err">{{ newsletterErr }}</p>
      </div>
    </div>

    <!-- Bottom bar -->
    <div class="g-footer-bottom">
      <div class="container g-footer-bottom-inner">
        <p>&copy; {{ year }} {{ siteName }} · {{ t.footer.rights }}</p>
        <ul>
          <li><RouterLink to="/about">{{ t.footer.terms }}</RouterLink></li>
          <li><RouterLink to="/about">{{ t.footer.privacy }}</RouterLink></li>
          <li><RouterLink to="/contact">{{ t.footer.contact }}</RouterLink></li>
        </ul>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useSettingsStore } from "@/stores/settings";
import { useLocaleStore } from "@/stores/locale";
import { useCategoryStore } from "@/stores/categories";
import { articleService } from "@/services/article.service";
import { contentService } from "@/services/content.service";
import { toKhmerDigits } from "@/utils/format";
import type { Article } from "@/types";

const settingsStore = useSettingsStore();
const locale = useLocaleStore();
const categoryStore = useCategoryStore();
const settings = computed(() => settingsStore.settings);
const siteName = computed(() => locale.pick(settings.value?.siteName ?? "Galaxy TV 4K", settings.value?.siteNameEn));
const footerDescription = computed(() =>
  locale.pick(
    settings.value?.description ?? "Galaxy TV 4K ជាមជ្ឈមណ្ឌលព័ត៌មានឌីជីថលរបស់កម្ពុជា",
    settings.value?.descriptionEn ?? "Galaxy TV 4K — a digital news hub for Cambodia"
  )
);
const logoUrl = computed(() => settings.value?.logo ?? "/assets/img/logo/logo1.png");
const year = computed(() => toKhmerDigits(new Date().getFullYear()));
const t = computed(() => locale.t);

const catNameOf = (c: { name: string; nameEn: string | null }) => locale.pick(c.name, c.nameEn);
const title = (a: { title: string; titleEn: string | null }) => locale.pick(a.title, a.titleEn);

const latestArticles = ref<Article[]>([]);
const footerCategories = computed(() => categoryStore.categories.filter((c) => c.isActive).slice(0, 6));
const newsletterEmail = ref("");
const newsletterMsg = ref("");
const newsletterErr = ref("");
const subscribing = ref(false);

async function subscribe() {
  const email = newsletterEmail.value.trim();
  if (!email || subscribing.value) return;
  subscribing.value = true;
  newsletterMsg.value = "";
  newsletterErr.value = "";
  try {
    await contentService.subscribeNewsletter(email);
    newsletterMsg.value = "សូមអរគុណ! អ្នកបានចុះឈ្មោះទទួលព័ត៌មានដោយជោគជ័យ។";
    newsletterEmail.value = "";
  } catch (e) {
    newsletterErr.value =
      e instanceof Error && e.message
        ? e.message
        : "មិនអាចចុះឈ្មោះបានទេ សូមព្យាយាមម្តងទៀត។";
  } finally {
    subscribing.value = false;
  }
}

onMounted(async () => {
  settingsStore.load();
  categoryStore.load();
  try {
    latestArticles.value = await articleService.latest(4);
  } catch {
    latestArticles.value = [];
  }
});
</script>

<style scoped>
/* ==================================================================
   Galaxy TV Footer — clean professional editorial footer
=================================================================== */
.g-footer {
  background: var(--color-primary, #0b1c39);
  color: rgba(255, 255, 255, 0.7);
  margin-top: 56px;
}

/* Main grid */
.g-footer-top {
  display: grid;
  grid-template-columns: 1.5fr 1fr 1fr 1.2fr;
  gap: 40px;
  padding-top: 48px;
  padding-bottom: 40px;
}
@media (max-width: 991px) {
  .g-footer-top {
    grid-template-columns: 1fr 1fr;
  }
}
@media (max-width: 640px) {
  .g-footer-top {
    grid-template-columns: 1fr;
    gap: 28px;
  }
}

/* Brand */
.g-footer-logo img {
  height: 40px;
  width: auto;
  max-width: 200px;
  object-fit: contain;
  filter: brightness(0) invert(1);
  opacity: 0.95;
}
.g-footer-desc {
  margin: 14px 0 16px;
  font-size: 13.5px;
  line-height: 1.8;
  color: rgba(255, 255, 255, 0.55);
}
.g-footer-social {
  display: flex;
  gap: 10px;
  margin: 0;
  padding: 0;
  list-style: none;
}
.g-footer-social a {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.8);
  font-size: 13px;
  transition: background 0.2s ease, color 0.2s ease;
}
.g-footer-social a:hover {
  background: var(--color-accent, #4f46e5);
  color: #fff;
}

/* Columns */
.g-footer-col h4 {
  color: #fff;
  font-size: 14.5px;
  font-weight: 700;
  margin: 0 0 16px;
  font-family: var(--font-heading);
}
.g-footer-links {
  margin: 0;
  padding: 0;
  list-style: none;
}
.g-footer-links li {
  margin-bottom: 10px;
}
.g-footer-links a {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  color: rgba(255, 255, 255, 0.65);
  font-size: 13.5px;
  line-height: 1.6;
  text-decoration: none;
  transition: color 0.2s ease;
}
.g-footer-links a:hover {
  color: #fff;
}

/* Newsletter */
.g-footer-newsletter-desc {
  font-size: 13.5px;
  line-height: 1.7;
  color: rgba(255, 255, 255, 0.5);
  margin: 0 0 14px;
}
.g-footer-newsletter {
  display: flex;
  gap: 8px;
}
.g-footer-newsletter input {
  flex: 1;
  min-width: 0;
  border: 1px solid rgba(255, 255, 255, 0.15);
  background: rgba(255, 255, 255, 0.06);
  color: #fff;
  border-radius: var(--radius-button);
  padding: 10px 14px;
  font-family: var(--font-body);
  font-size: 13.5px;
  outline: none;
  transition: border-color 0.2s ease;
}
.g-footer-newsletter input::placeholder {
  color: rgba(255, 255, 255, 0.35);
}
.g-footer-newsletter input:focus {
  border-color: var(--color-accent, #4f46e5);
}
.g-footer-newsletter-btn {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  border: none;
  border-radius: var(--radius-button);
  background: var(--color-accent, #4f46e5);
  color: #fff;
  cursor: pointer;
  transition: background 0.2s ease;
}
.g-footer-newsletter-btn:hover {
  background: #7c3aed;
}
.g-footer-msg {
  margin: 10px 0 0;
  font-size: 12.5px;
  color: #9ad6a0;
}
.g-footer-msg--err {
  color: #f5b5b5;
}
.g-spinner {
  display: inline-block;
  width: 13px;
  height: 13px;
  border: 2px solid rgba(255, 255, 255, 0.35);
  border-top-color: #fff;
  border-radius: 50%;
  animation: g-spin 0.7s linear infinite;
}
@keyframes g-spin {
  to { transform: rotate(360deg); }
}

/* Bottom bar */
.g-footer-bottom {
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(0, 0, 0, 0.2);
}
.g-footer-bottom-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: 52px;
  flex-wrap: wrap;
  padding-block: 12px;
}
.g-footer-bottom p {
  margin: 0;
  font-size: 12.5px;
  color: rgba(255, 255, 255, 0.5);
}
.g-footer-bottom ul {
  display: flex;
  gap: 18px;
  margin: 0;
  padding: 0;
  list-style: none;
}
.g-footer-bottom a {
  color: rgba(255, 255, 255, 0.6);
  font-size: 12.5px;
  text-decoration: none;
  transition: color 0.2s ease;
}
.g-footer-bottom a:hover {
  color: #fff;
}
</style>
