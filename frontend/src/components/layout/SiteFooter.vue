<template>
  <footer>
    <div class="footer-area footer-padding fix">
      <div class="container">
        <div class="row d-flex justify-content-between">
          <div class="col-xl-5 col-lg-5 col-md-7 col-sm-12">
            <div class="single-footer-caption">
              <div class="single-footer-caption">
                <div class="footer-logo">
                  <RouterLink to="/">
                    <img loading="lazy" decoding="async" :src="logoUrl" alt="Navatra 4K TV" />
                  </RouterLink>
                </div>
                <div class="footer-tittle">
                  <div class="footer-pera">
                    <p>{{ settings?.description ?? "Navatra 4K TV ជាមជ្ឈមណ្ឌលព័ត៌មានឌីជីថលរបស់កម្ពុជា ដែលផ្តល់ជូនអ្នកនូវព័ត៌មានក្តៅៗ កម្សាន្ត បច្ចេកវិទ្យា និងការផ្សាយបន្តផ្ទាល់គុណភាព 4K រាល់ថ្ងៃ។" }}</p>
                  </div>
                </div>
                <div class="footer-social">
                  <a v-if="settings?.twitter" :href="settings.twitter" target="_blank" rel="noopener" aria-label="Twitter"><i class="fab fa-twitter"></i></a>
                  <a v-if="settings?.facebook" :href="settings.facebook" target="_blank" rel="noopener" aria-label="Facebook"><i class="fab fa-facebook-f"></i></a>
                  <a v-if="settings?.instagram" :href="settings.instagram" target="_blank" rel="noopener" aria-label="Instagram"><i class="fab fa-instagram"></i></a>
                  <a v-if="settings?.youtube" :href="settings.youtube" target="_blank" rel="noopener" aria-label="YouTube"><i class="fab fa-youtube"></i></a>
                  <a v-if="settings?.tiktok" :href="settings.tiktok" target="_blank" rel="noopener" aria-label="TikTok"><i class="fab fa-tiktok"></i></a>
                </div>
              </div>
            </div>
          </div>
          <div class="col-xl-3 col-lg-3 col-md-4 col-sm-6">
            <div class="single-footer-caption mt-60">
              <div class="footer-tittle">
                <h4>ព្រឹត្តិបត្រ</h4>
                <p>សូមចុះឈ្មោះដើម្បីទទួលបានព័ត៌មានថ្មីៗប្រចាំថ្ងៃ</p>
                <div class="footer-form">
                  <form class="subscribe_form relative" @submit.prevent="subscribe">
                    <input v-model="newsletterEmail" type="email" placeholder="អាសយដ្ឋានអ៊ីមែល" required :disabled="subscribing" />
                    <div class="form-icon">
                      <button type="submit" class="email_icon newsletter-submit button-contactForm" aria-label="ចុះឈ្មោះ" :disabled="subscribing">
                        <img v-if="!subscribing" loading="lazy" decoding="async" :src="'/assets/img/logo/form-iocn.png'" alt="" />
                        <span v-else class="newsletter-spinner" aria-hidden="true"></span>
                      </button>
                    </div>
                  </form>
                  <p v-if="newsletterMsg" class="newsletter-msg">{{ newsletterMsg }}</p>
                  <p v-if="newsletterErr" class="newsletter-msg newsletter-err">{{ newsletterErr }}</p>
                </div>
              </div>
            </div>
          </div>
          <div class="col-xl-3 col-lg-3 col-md-5 col-sm-6">
            <div class="single-footer-caption mb-50 mt-60">
              <div class="footer-tittle">
                <h4>រូបភាព Instagram</h4>
              </div>
              <div class="instagram-gellay">
                <ul class="insta-feed">
                  <li v-for="a in galleryArticles" :key="a.id">
                    <RouterLink :to="`/article/${a.slug}`">
                      <ArticleThumb :src="a.featuredImage" :alt="a.title" />
                    </RouterLink>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="footer-bottom-area">
      <div class="container">
        <div class="footer-border">
          <div class="row d-flex align-items-center justify-content-between">
            <div class="col-lg-6">
              <div class="footer-copy-right">
                <p>រក្សាសិទ្ធិ &copy; {{ year }} {{ siteName }} | ផលិតដោយ <i class="ti-heart" aria-hidden="true"></i> <RouterLink to="/">{{ siteName }}</RouterLink></p>
              </div>
            </div>
            <div class="col-lg-6">
              <div class="footer-menu f-right">
                <ul>
                  <li><RouterLink to="/about">លក្ខខណ្ឌប្រើប្រាស់</RouterLink></li>
                  <li><RouterLink to="/about">គោលការណ៍ឯកជនភាព</RouterLink></li>
                  <li><RouterLink to="/contact">ទំនាក់ទំនង</RouterLink></li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useSettingsStore } from "@/stores/settings";
import { articleService } from "@/services/article.service";
import { contentService } from "@/services/content.service";
import ArticleThumb from "@/components/common/ArticleThumb.vue";
import { toKhmerDigits } from "@/utils/format";
import type { Article } from "@/types";

const settingsStore = useSettingsStore();
const settings = computed(() => settingsStore.settings);
const siteName = computed(() => settings.value?.siteName ?? "Navatra 4K TV");
const logoUrl = computed(
  () =>
    settings.value?.logo ??
    "/assets/img/logo/Logo%20galaxy%20navatra%204k%20TV.ai%202026-06.png"
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
    const data = await articleService.latest(6);
    galleryArticles.value = data;
  } catch {
    galleryArticles.value = [];
  }
});
</script>

<style scoped>
.newsletter-msg {
  margin-top: 10px;
  font-size: 13px;
  color: #9ad6a0;
}
.newsletter-err {
  color: #f5b5b5;
}
.newsletter-spinner {
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.35);
  border-top-color: #fff;
  border-radius: 50%;
  animation: newsletter-spin 0.7s linear infinite;
  vertical-align: middle;
}
@keyframes newsletter-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
