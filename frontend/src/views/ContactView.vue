<template>
  <div class="contact-area">
    <div class="container">
      <div class="contact-hero text-center">
        <h1>ទំនាក់ទំនងយើង</h1>
        <p>សូមទំនាក់ទំនងមកកាន់យើងខ្ញុំ ប្រសិនបើមានសំណួរ ឬសំណូមពរ</p>
      </div>

      <div class="row mt-5">
        <div class="col-lg-5">
          <h3 class="side-title">ព័ត៌មានទំនាក់ទំនង</h3>
          <ul class="contact-info-list">
            <li v-if="settings?.contactEmail">
              <i class="ti-email"></i>
              <div><strong>អ៊ីមែល</strong><span>{{ settings.contactEmail }}</span></div>
            </li>
            <li v-if="settings?.contactPhone">
              <i class="ti-mobile"></i>
              <div><strong>ទូរស័ព្ទ</strong><span>{{ settings.contactPhone }}</span></div>
            </li>
            <li v-if="settings?.address">
              <i class="ti-location-pin"></i>
              <div><strong>អាសយដ្ឋាន</strong><span>{{ settings.address }}</span></div>
            </li>
          </ul>

          <div class="contact-social mt-4">
            <a v-if="settings?.facebook" :href="settings.facebook" target="_blank" rel="noopener" aria-label="Facebook"><i class="fab fa-facebook-f"></i></a>
            <a v-if="settings?.youtube" :href="settings.youtube" target="_blank" rel="noopener" aria-label="YouTube"><i class="fab fa-youtube"></i></a>
            <a v-if="settings?.tiktok" :href="settings.tiktok" target="_blank" rel="noopener" aria-label="TikTok"><i class="fab fa-tiktok"></i></a>
            <a v-if="settings?.instagram" :href="settings.instagram" target="_blank" rel="noopener" aria-label="Instagram"><i class="fab fa-instagram"></i></a>
            <a v-if="settings?.telegram" :href="settings.telegram" target="_blank" rel="noopener" aria-label="Telegram"><i class="fab fa-telegram-plane"></i></a>
          </div>
        </div>

        <div class="col-lg-7">
          <form class="contact-form-box" @submit.prevent="submit">
            <div class="row">
              <div class="col-md-6">
                <label for="c-name">ឈ្មោះ *</label>
                <input id="c-name" v-model="form.name" type="text" class="form-control" required placeholder="ឈ្មោះរបស់អ្នក" />
              </div>
              <div class="col-md-6">
                <label for="c-email">អ៊ីមែល *</label>
                <input id="c-email" v-model="form.email" type="email" class="form-control" required placeholder="អាសយដ្ឋានអ៊ីមែល" />
              </div>
              <div class="col-12">
                <label for="c-subject">ប្រធានបទ</label>
                <input id="c-subject" v-model="form.subject" type="text" class="form-control" placeholder="ប្រធានបទនៃសារ" />
              </div>
              <div class="col-12">
                <label for="c-message">សារ *</label>
                <textarea id="c-message" v-model="form.message" rows="5" class="form-control" required placeholder="សរសេរសាររបស់អ្នក..."></textarea>
              </div>
              <div class="col-12">
                <button type="submit" class="btn boxed-btn" :disabled="sending">
                  {{ sending ? "កំពុងផ្ញើ..." : "ផ្ញើសារ" }}
                </button>
              </div>
              <div v-if="msg" class="col-12">
                <p :class="msgType === 'ok' ? 'msg-ok' : 'msg-err'">{{ msg }}</p>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { useSeo } from "@/composables/useSeo";
import { contentService } from "@/services/content.service";
import { useSettingsStore } from "@/stores/settings";

useSeo({
  title: "ទំនាក់ទំនង | Navatra 4K TV",
  description: "ទំនាក់ទំនងមកកាន់ Navatra 4K TV",
});

const settingsStore = useSettingsStore();
const settings = computed(() => settingsStore.settings);

const form = reactive({ name: "", email: "", subject: "", message: "" });
const sending = ref(false);
const msg = ref("");
const msgType = ref<"ok" | "err">("ok");

async function submit() {
  sending.value = true;
  msg.value = "";
  try {
    await contentService.submitContact({
      name: form.name,
      email: form.email,
      subject: form.subject || undefined,
      message: form.message,
    });
    msgType.value = "ok";
    msg.value = "សូមអរគុណ! សាររបស់អ្នកត្រូវបានផ្ញើដោយជោគជ័យ។";
    form.name = "";
    form.email = "";
    form.subject = "";
    form.message = "";
  } catch (e) {
    msgType.value = "err";
    msg.value = e instanceof Error ? e.message : "មានបញ្ហាក្នុងការផ្ញើសារ";
  } finally {
    sending.value = false;
  }
}

onMounted(() => settingsStore.load());
</script>

<style scoped>
.contact-area {
  padding: 40px 0;
}
.contact-hero {
  background: linear-gradient(120deg, #0b1c39 0%, #0d3fa9 100%);
  color: #fff;
  border-radius: 14px;
  padding: 48px 24px;
}
.contact-hero h1 {
  color: #fff;
  font-size: 34px;
  margin-bottom: 6px;
}
.contact-hero p {
  color: rgba(255, 255, 255, 0.85);
  margin: 0;
}
.contact-info-list li {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 0;
  border-bottom: 1px solid #f1f5f9;
}
.contact-info-list i {
  font-size: 22px;
  color: #0d3fa9;
}
.contact-info-list strong {
  display: block;
  color: #0b1c39;
  font-size: 14px;
}
.contact-info-list span {
  color: #6b7280;
  font-size: 14.5px;
}
.contact-social {
  display: flex;
  gap: 10px;
}
.contact-social a {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #f1f5f9;
  color: #0b1c39;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}
.contact-social a:hover {
  background: #0d3fa9;
  color: #fff;
}
.contact-form-box {
  background: #f8fafc;
  border-radius: 12px;
  padding: 28px;
}
.contact-form-box label {
  font-size: 13.5px;
  color: #0b1c39;
  font-weight: 500;
  margin-bottom: 6px;
}
.contact-form-box .form-control {
  margin-bottom: 18px;
  font-family: "Noto Sans Khmer", "Kantumruy", sans-serif;
}
.msg-ok {
  color: #16a34a;
  font-size: 14px;
  margin-top: 6px;
}
.msg-err {
  color: #dc2626;
  font-size: 14px;
  margin-top: 6px;
}
</style>
