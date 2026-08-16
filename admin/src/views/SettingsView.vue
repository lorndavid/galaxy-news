<template>
  <form class="card max-w-2xl space-y-4 p-6" @submit.prevent="save">
    <h3 class="text-sm font-semibold text-slate-700">ការកំណត់គេហទំព័រ</h3>

    <div class="grid gap-4 sm:grid-cols-2">
      <div>
        <label class="label">ឈ្មោះគេហទំព័រ</label>
        <input v-model="form.siteName" type="text" class="input" />
      </div>
      <div>
        <label class="label">Logo URL</label>
        <input v-model="form.logo" type="url" class="input" />
      </div>
      <div>
        <label class="label">Favicon URL</label>
        <input v-model="form.favicon" type="url" class="input" />
      </div>
      <div>
        <label class="label">អ៊ីមែលទំនាក់ទំនង</label>
        <input v-model="form.contactEmail" type="email" class="input" />
      </div>
      <div>
        <label class="label">ទូរស័ព្ទទំនាក់ទំនង</label>
        <input v-model="form.contactPhone" type="text" class="input" />
      </div>
      <div class="sm:col-span-2">
        <label class="label">អាសយដ្ឋាន</label>
        <input v-model="form.address" type="text" class="input" />
      </div>
      <div class="sm:col-span-2">
        <label class="label">ការពិពណ៌នា</label>
        <textarea v-model="form.description" rows="2" class="input"></textarea>
      </div>
    </div>

    <div class="grid gap-4 sm:grid-cols-3">
      <div>
        <label class="label">Facebook</label>
        <input v-model="form.facebook" type="url" class="input" />
      </div>
      <div>
        <label class="label">Telegram</label>
        <input v-model="form.telegram" type="url" class="input" />
      </div>
      <div>
        <label class="label">YouTube</label>
        <input v-model="form.youtube" type="url" class="input" />
      </div>
      <div>
        <label class="label">TikTok</label>
        <input v-model="form.tiktok" type="url" class="input" />
      </div>
      <div>
        <label class="label">Instagram</label>
        <input v-model="form.instagram" type="url" class="input" />
      </div>
      <div>
        <label class="label">Twitter / X</label>
        <input v-model="form.twitter" type="url" class="input" />
      </div>
    </div>

    <button type="submit" class="btn-primary" :disabled="saving">រក្សាទុកការកំណត់</button>
  </form>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { adminService } from "@/services/admin.service";
import { useToastStore } from "@/stores/toast";

const toast = useToastStore();
const saving = ref(false);
const form = reactive({
  siteName: "",
  logo: "",
  favicon: "",
  description: "",
  facebook: "",
  telegram: "",
  youtube: "",
  tiktok: "",
  instagram: "",
  twitter: "",
  contactEmail: "",
  contactPhone: "",
  address: "",
});

async function load() {
  const s = await adminService.settings();
  Object.assign(form, {
    siteName: s.siteName ?? "",
    logo: s.logo ?? "",
    favicon: s.favicon ?? "",
    description: s.description ?? "",
    facebook: s.facebook ?? "",
    telegram: s.telegram ?? "",
    youtube: s.youtube ?? "",
    tiktok: s.tiktok ?? "",
    instagram: s.instagram ?? "",
    twitter: s.twitter ?? "",
    contactEmail: s.contactEmail ?? "",
    contactPhone: s.contactPhone ?? "",
    address: s.address ?? "",
  });
}

async function save() {
  saving.value = true;
  try {
    await adminService.updateSettings({ ...form });
    toast.success("បានរក្សាទុកការកំណត់");
  } catch (e) {
    toast.error(e instanceof Error ? e.message : "រក្សាទុកបរាជ័យ");
  } finally {
    saving.value = false;
  }
}

onMounted(load);
</script>
