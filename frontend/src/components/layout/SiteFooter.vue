<template>
  <footer class="editorial-footer">
    <div class="editorial-container editorial-footer-top">
      <div class="editorial-footer-col editorial-footer-brand">
        <RouterLink to="/" class="editorial-footer-logo">
          <img :src="logoUrl" alt="Navatra 4K TV" loading="lazy" decoding="async" />
        </RouterLink>
        <p class="editorial-footer-desc">
          {{ footerDescription }}
        </p>
        <ul class="editorial-footer-social" aria-label="បណ្តាញសង្គម">
          <li v-if="settings?.facebook"><a :href="settings.facebook" target="_blank" rel="noopener" aria-label="Facebook"><i class="fab fa-facebook-f"></i></a></li>
          <li v-if="settings?.twitter"><a :href="settings.twitter" target="_blank" rel="noopener" aria-label="Twitter"><i class="fab fa-twitter"></i></a></li>
          <li v-if="settings?.youtube"><a :href="settings.youtube" target="_blank" rel="noopener" aria-label="YouTube"><i class="fab fa-youtube"></i></a></li>
          <li v-if="settings?.tiktok"><a :href="settings.tiktok" target="_blank" rel="noopener" aria-label="TikTok"><i class="fab fa-tiktok"></i></a></li>
          <li v-if="settings?.instagram"><a :href="settings.instagram" target="_blank" rel="noopener" aria-label="Instagram"><i class="fab fa-instagram"></i></a></li>
        </ul>
      </div>

      <div class="editorial-footer-col">
        <h4>{{ locale.t.footer.latest }}</h4>
        <ul class="editorial-footer-links">
          <li v-for="a in galleryArticles.slice(0, 4)" :key="a.id">
            <RouterLink :to="`/article/${a.slug}`">{{ a.title }}</RouterLink>
          </li>
        </ul>
      </div>

      <div class="editorial-footer-col">
        <h4>{{ locale.t.footer.newsletter }}</h4>
        <p class="editorial-footer-desc">{{ locale.t.footer.newsletterDesc }}</p>
        <form class="editorial-newsletter" @submit.prevent="subscribe">
          <input v-model="newsletterEmail" type="email" :placeholder="locale.t.footer.emailPlaceholder" required :disabled="subscribing" :aria-label="locale.t.footer.emailPlaceholder" />
          <button type="submit" class="editorial-newsletter-btn" :disabled="subscribing" :aria-label="locale.t.footer.subscribe">
            <i v-if="!subscribing" class="fas fa-paper-plane" aria-hidden="true"></i>
            <span v-else class="newsletter-spinner" aria-hidden="true"></span>
          </button>
        </form>
        <p v-if="newsletterMsg" class="editorial-newsletter-msg">{{ newsletterMsg }}</p>
        <p v-if="newsletterErr" class="editorial-newsletter-msg editorial-newsletter-err">{{ newsletterErr }}</p>
      </div>
    </div>

    <div class="editorial-footer-bottom">
      <div class="editorial-container editorial-footer-bottom-inner">
        <p>&copy; {{ year }} {{ siteName }} · {{ locale.t.footer.rights }}</p>
        <ul>
          <li><RouterLink to="/about">{{ locale.t.footer.terms }}</RouterLink></li>
          <li><RouterLink to="/about">{{ locale.t.footer.privacy }}</RouterLink></li>
          <li><RouterLink to="/contact">{{ locale.t.footer.contact }}</RouterLink></li>
        </ul>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useSettingsStore } from "@/stores/settings";
import { useLocaleStore } from "@/stores/locale";
import { articleService } from "@/services/article.service";
import { contentService } from "@/services/content.service";
import { toKhmerDigits } from "@/utils/format";
import type { Article } from "@/types";

const settingsStore = useSettingsStore();
const locale = useLocaleStore();
const settings = computed(() => settingsStore.settings);
const siteName = computed(() => locale.pick(settings.value?.siteName ?? "Navatra 4K TV", settings.value?.siteNameEn));
const footerDescription = computed(() =>
  locale.pick(
    settings.value?.description ?? "Navatra 4K TV ជាមជ្ឈមណ្ឌលព័ត៌មានឌីជីថលរបស់កម្ពុជា",
    settings.value?.descriptionEn ?? "Navatra 4K TV — a digital news hub for Cambodia"
  )
);
const logoUrl = computed(
  () => settings.value?.logo ?? "/assets/img/logo/logo1.png"
);
const year = computed(() => toKhmerDigits(new Date().getFullYear()));

const galleryArticles = ref<Article[]>([]);
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
  try {
    const data = await articleService.latest(4);
    galleryArticles.value = data;
  } catch {
    galleryArticles.value = [];
  }
});
</script>

<style scoped>
/* ------------------------------------------------------------------
   Editorial footer — clean, aligned to the site container.
------------------------------------------------------------------- */
.editorial-container {
  width: 100%;
  max-width: 1200px;
  margin-inline: auto;
  padding-inline: 24px;
}
@media (max-width: 640px) {
  .editorial-container {
    padding-inline: 16px;
  }
}

.editorial-footer {
  background: var(--color-secondary, #0b1c39);
  color: rgba(255, 255, 255, 0.7);
  margin-top: 48px;
}

.editorial-footer-top {
  display: grid;
  grid-template-columns: 2fr 1.2fr 1.4fr;
  gap: 40px;
  padding-top: 48px;
  padding-bottom: 40px;
}
@media (max-width: 991px) {
  .editorial-footer-top {
    grid-template-columns: 1fr 1fr;
  }
}
@media (max-width: 640px) {
  .editorial-footer-top {
    grid-template-columns: 1fr;
    gap: 28px;
  }
}

.editorial-footer-logo img {
  height: 40px;
  width: auto;
  max-width: 220px;
  object-fit: contain;
  filter: brightness(0) invert(1);
  opacity: 0.95;
}

.editorial-footer-desc {
  margin: 14px 0 16px;
  font-size: 13.5px;
  line-height: 1.8;
  color: rgba(255, 255, 255, 0.6);
}

.editorial-footer-social {
  display: flex;
  gap: 10px;
  margin: 0;
  padding: 0;
  list-style: none;
}
.editorial-footer-social a {
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
.editorial-footer-social a:hover {
  background: var(--color-primary, #0d3fa9);
  color: #fff;
}

.editorial-footer-col h4 {
  color: #fff;
  font-size: 14.5px;
  font-weight: 700;
  margin: 0 0 16px;
}

.editorial-footer-links {
  margin: 0;
  padding: 0;
  list-style: none;
}
.editorial-footer-links li {
  margin-bottom: 10px;
}
.editorial-footer-links a {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  color: rgba(255, 255, 255, 0.7);
  font-size: 13.5px;
  line-height: 1.6;
  text-decoration: none;
  transition: color 0.2s ease;
}
.editorial-footer-links a:hover {
  color: #fff;
}

.editorial-newsletter {
  position: relative;
  display: flex;
  gap: 8px;
}
.editorial-newsletter input {
  flex: 1;
  min-width: 0;
  border: 1px solid rgba(255, 255, 255, 0.15);
  background: rgba(255, 255, 255, 0.06);
  color: #fff;
  border-radius: 8px;
  padding: 10px 14px;
  font-family: var(--font-body, "Noto Sans Khmer", sans-serif);
  font-size: 13.5px;
  outline: none;
  transition: border-color 0.2s ease;
}
.editorial-newsletter input::placeholder {
  color: rgba(255, 255, 255, 0.4);
}
.editorial-newsletter input:focus {
  border-color: var(--color-primary, #0d3fa9);
}
.editorial-newsletter-btn {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  border: none;
  border-radius: 8px;
  background: var(--color-primary, #0d3fa9);
  color: #fff;
  cursor: pointer;
  transition: background 0.2s ease;
}
.editorial-newsletter-btn:hover {
  background: var(--color-accent, #fc3f00);
}
.editorial-newsletter-msg {
  margin: 10px 0 0;
  font-size: 12.5px;
  color: #9ad6a0;
}
.editorial-newsletter-err {
  color: #f5b5b5;
}
.newsletter-spinner {
  display: inline-block;
  width: 13px;
  height: 13px;
  border: 2px solid rgba(255, 255, 255, 0.35);
  border-top-color: #fff;
  border-radius: 50%;
  animation: newsletter-spin 0.7s linear infinite;
}
@keyframes newsletter-spin {
  to { transform: rotate(360deg); }
}

.editorial-footer-bottom {
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(0, 0, 0, 0.22);
}
.editorial-footer-bottom-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: 52px;
  flex-wrap: wrap;
  padding-block: 12px;
}
.editorial-footer-bottom p {
  margin: 0;
  font-size: 12.5px;
  color: rgba(255, 255, 255, 0.55);
}
.editorial-footer-bottom ul {
  display: flex;
  gap: 18px;
  margin: 0;
  padding: 0;
  list-style: none;
}
.editorial-footer-bottom a {
  color: rgba(255, 255, 255, 0.65);
  font-size: 12.5px;
  text-decoration: none;
  transition: color 0.2s ease;
}
.editorial-footer-bottom a:hover {
  color: #fff;
}
</style>
