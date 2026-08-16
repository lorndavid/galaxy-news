<template>
  <span class="badge" :class="badgeClass">{{ label }}</span>
</template>

<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{ status: string }>();

const map: Record<string, { label: string; cls: string }> = {
  PUBLISHED: { label: "បានផ្សាយ", cls: "bg-emerald-100 text-emerald-700" },
  DRAFT: { label: "សេចក្តីព្រាង", cls: "bg-slate-100 text-slate-600" },
  SCHEDULED: { label: "បានកំណត់ពេល", cls: "bg-amber-100 text-amber-700" },
  ARCHIVED: { label: "បានទុកក្នុងប័ណ្ណសារ", cls: "bg-slate-200 text-slate-600" },
  PENDING: { label: "រង់ចាំ", cls: "bg-amber-100 text-amber-700" },
  APPROVED: { label: "បានអនុម័ត", cls: "bg-emerald-100 text-emerald-700" },
  REJECTED: { label: "បានបដិសេធ", cls: "bg-red-100 text-red-700" },
};

const badgeClass = computed(() => map[props.status]?.cls ?? "bg-slate-100 text-slate-600");
const label = computed(() => map[props.status]?.label ?? props.status);
</script>
