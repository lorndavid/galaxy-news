<template>
  <div v-if="points.length" class="w-full">
    <svg
      :viewBox="`0 0 ${W} ${H}`"
      class="w-full"
      role="img"
      :aria-label="`Views over the last ${points.length} days`"
      preserveAspectRatio="none"
    >
      <!-- Horizontal gridlines -->
      <line
        v-for="y in gridYs"
        :key="y"
        :x1="0"
        :x2="W"
        :y1="y"
        :y2="y"
        class="stroke-slate-100"
        stroke-width="1"
        vector-effect="non-scaling-stroke"
      />

      <!-- Area fill -->
      <path :d="areaPath" :fill="`url(#${gradId})`" />

      <!-- Trend line -->
      <path
        :d="linePath"
        class="stroke-brand-500"
        stroke-width="2"
        fill="none"
        stroke-linecap="round"
        stroke-linejoin="round"
        vector-effect="non-scaling-stroke"
      />

      <!-- Data points with tooltips -->
      <g v-for="(p, i) in points" :key="i">
        <circle
          :cx="p.x"
          :cy="p.y"
          r="3"
          class="fill-brand-500"
          vector-effect="non-scaling-stroke"
        >
          <title>{{ dayLabel(p.date) }} — {{ p.count.toLocaleString() }} views</title>
        </circle>
      </g>
    </svg>

    <!-- X-axis labels -->
    <div class="mt-1.5 flex justify-between text-[10px] text-slate-400">
      <span>{{ dayLabel(points[0].date) }}</span>
      <span>{{ dayLabel(points[Math.floor(points.length / 2)].date) }}</span>
      <span>{{ dayLabel(points[points.length - 1].date) }}</span>
    </div>
  </div>

  <p v-else class="py-8 text-center text-[13px] text-slate-400">មិនទាន់មានទិន្នន័យទេ</p>
</template>

<script setup lang="ts">
import { computed, useId } from "vue";

const props = defineProps<{ data: { date: string; count: number }[] }>();

const W = 640;
const H = 200;
const PAD = 8;

const gradId = `views-grad-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;

const points = computed(() => {
  const n = props.data.length;
  if (!n) return [];
  const max = Math.max(1, ...props.data.map((d) => d.count));
  return props.data.map((d, i) => ({
    ...d,
    x: n === 1 ? W / 2 : PAD + (i / (n - 1)) * (W - PAD * 2),
    y: H - PAD - (d.count / max) * (H - PAD * 2),
  }));
});

const linePath = computed(() => {
  const pts = points.value;
  if (!pts.length) return "";
  return pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
});

const areaPath = computed(() => {
  const pts = points.value;
  if (!pts.length) return "";
  const first = pts[0];
  const last = pts[pts.length - 1];
  return `${linePath.value} L ${last.x} ${H} L ${first.x} ${H} Z`;
});

const gridYs = computed(() => {
  const out: number[] = [];
  for (let i = 0; i < 4; i++) out.push(PAD + (i / 3) * (H - PAD * 2));
  return out;
});

function dayLabel(iso: string) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
  });
}
</script>
