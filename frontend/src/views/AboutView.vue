<template>
  <div class="about-area">
    <div class="container">
      <div class="about-hero text-center">
        <h1>អំពី {{ siteName }}</h1>
        <p>មជ្ឈមណ្ឌលព័ត៌មានឌីជីថលរបស់កម្ពុជា</p>
      </div>

      <div class="row mt-5">
        <div class="col-lg-8">
          <div class="about-content">
            <h3>ស្វាគមន៍មកកាន់ {{ siteName }}</h3>
            <p>
              {{ siteName }} ជាមជ្ឈមណ្ឌលព័ត៌មានឌីជីថលរបស់កម្ពុជា ដែលផ្តល់ជូនអ្នកនូវព័ត៌មានក្តៅៗ
              កម្សាន្ត បច្ចេកវិទ្យា និងការផ្សាយបន្តផ្ទាល់គុណភាព 4K រាល់ថ្ងៃ។
            </p>
            <p>
              យើងខ្ញុំមានបេសកកម្មក្នុងការផ្តល់ព័ត៌មានត្រឹមត្រូវ រហ័ស និងគួរឱ្យទុកចិត្ត
              ដល់សាធារណជនទូទាំងប្រទេស និងជុំវិញពិភពលោក។
            </p>

            <div class="about-cards row">
              <div class="col-md-4">
                <div class="about-card">
                  <i class="ti-flag-alt"></i>
                  <h4>ព័ត៌មានជាតិ</h4>
                  <p>ព័ត៌មានក្តៅៗក្នុងស្រុក នយោបាយ សេដ្ឋកិច្ច និងសង្គម</p>
                </div>
              </div>
              <div class="col-md-4">
                <div class="about-card">
                  <i class="ti-world"></i>
                  <h4>ព័ត៌មានអន្តរជាតិ</h4>
                  <p>ព័ត៌មានជុំវិញពិភពលោក បច្ចេកវិទ្យា និងសុខភាព</p>
                </div>
              </div>
              <div class="col-md-4">
                <div class="about-card">
                  <i class="ti-video-camera"></i>
                  <h4>ការផ្សាយបន្តផ្ទាល់</h4>
                  <p>ការផ្សាយបន្តផ្ទាល់គុណភាព 4K រាល់ថ្ងៃ</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="col-lg-4">
          <div class="about-sidebar">
            <h3 class="side-title">ទំនាក់ទំនង</h3>
            <ul class="about-contact-list">
              <li v-if="settings?.contactEmail"><i class="ti-email"></i> {{ settings.contactEmail }}</li>
              <li v-if="settings?.contactPhone"><i class="ti-mobile"></i> {{ settings.contactPhone }}</li>
              <li v-if="settings?.address"><i class="ti-location-pin"></i> {{ settings.address }}</li>
            </ul>
            <NavatraPoster />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from "vue";
import { useSeo } from "@/composables/useSeo";
import { useSettingsStore } from "@/stores/settings";
import NavatraPoster from "@/components/article/NavatraPoster.vue";

const settingsStore = useSettingsStore();
const settings = computed(() => settingsStore.settings);
const siteName = computed(() => settings.value?.siteName ?? "Galaxy TV V4K");

useSeo({
  title: `អំពីយើង | ${siteName.value}`,
  description: "ស្វែងយល់ពី Galaxy TV V4K មជ្ឈមណ្ឌលព័ត៌មានឌីជីថលរបស់កម្ពុជា",
});

onMounted(() => settingsStore.load());
</script>

<style scoped>
.about-area {
  padding: 40px 0;
}
.about-hero {
  background: linear-gradient(120deg, #0b1c39 0%, #0d3fa9 100%);
  color: #fff;
  border-radius: 14px;
  padding: 48px 24px;
}
.about-hero h1 {
  color: #fff;
  font-size: 34px;
  margin-bottom: 6px;
}
.about-hero p {
  color: rgba(255, 255, 255, 0.85);
  margin: 0;
}
.about-content h3 {
  color: #0b1c39;
  margin-bottom: 14px;
}
.about-content p {
  font-size: 15.5px;
  line-height: 1.9;
  color: #444;
}
.about-cards {
  margin-top: 26px;
}
.about-card {
  text-align: center;
  background: #f8fafc;
  border-radius: 12px;
  padding: 26px 18px;
  margin-bottom: 16px;
  height: 100%;
}
.about-card i {
  font-size: 32px;
  color: #0d3fa9;
}
.about-card h4 {
  font-size: 16px;
  margin: 10px 0 6px;
  color: #0b1c39;
}
.about-card p {
  font-size: 13.5px;
  color: #6b7280;
  line-height: 1.6;
  margin: 0;
}
.about-contact-list li {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 0;
  border-bottom: 1px solid #f1f5f9;
  color: #444;
  font-size: 14.5px;
}
.about-contact-list i {
  color: #0d3fa9;
}
</style>
