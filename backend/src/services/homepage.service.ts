import { prisma } from "../lib/prisma";
import { logActivity } from "./activity.service";

/** Default section order (used when the table is empty). */
const DEFAULT_SECTIONS = [
  { key: "breaking", label: "បន្ទាត់ព័ត៌មានក្តៅ", enabled: true, sortOrder: 1 },
  { key: "hero", label: "ព័ត៌មានកំពូល (Hero)", enabled: true, sortOrder: 2 },
  { key: "weekly", label: "ព័ត៌មានប្រចាំសប្តាហ៍", enabled: true, sortOrder: 3 },
  { key: "whats-new", label: "អ្វីដែលថ្មី", enabled: true, sortOrder: 4 },
  { key: "latest", label: "ព័ត៌មានថ្មីៗ", enabled: true, sortOrder: 5 },
  { key: "video", label: "វីដេអូ", enabled: true, sortOrder: 6 },
  { key: "recent", label: "អត្ថបទថ្មីៗ", enabled: true, sortOrder: 7 },
];

const ALLOWED_KEYS = new Set(DEFAULT_SECTIONS.map((s) => s.key));

/**
 * Ensure the builder has a row for every known section so the admin list
 * always shows the full set, even before the first visit.
 */
async function ensureDefaults() {
  const existing = await prisma.homepageSection.findMany();
  const seen = new Set(existing.map((s) => s.key));
  for (const d of DEFAULT_SECTIONS) {
    if (!seen.has(d.key)) {
      await prisma.homepageSection.create({ data: d });
    }
  }
}

/** Public: only enabled sections, in order. */
export async function getPublicSections() {
  await ensureDefaults();
  const rows = await prisma.homepageSection.findMany({
    where: { enabled: true },
    orderBy: { sortOrder: "asc" },
    select: { key: true, label: true },
  });
  return rows.map((r) => r.key);
}

/** Admin: full list with enabled + order. */
export async function listSections() {
  await ensureDefaults();
  return prisma.homepageSection.findMany({
    orderBy: { sortOrder: "asc" },
  });
}

export interface SectionUpdate {
  key: string;
  enabled?: boolean;
  label?: string;
}

export async function updateSections(input: SectionUpdate[], userId: number, ip?: string | null) {
  await ensureDefaults();
  const updates = input.filter((s) => ALLOWED_KEYS.has(s.key));
  if (!updates.length) return prisma.homepageSection.findMany({ orderBy: { sortOrder: "asc" } });

  await prisma.$transaction(
    updates.map((u) =>
      prisma.homepageSection.update({
        where: { key: u.key },
        data: {
          ...(u.enabled !== undefined ? { enabled: u.enabled } : {}),
          ...(u.label !== undefined ? { label: u.label } : {}),
        },
      })
    )
  );

  await logActivity({ userId, action: "HOMEPAGE_SECTIONS_UPDATED", entity: "HomepageSection", ip });
  return prisma.homepageSection.findMany({ orderBy: { sortOrder: "asc" } });
}

export interface SectionOrder {
  key: string;
  sortOrder: number;
}

export async function reorderSections(order: SectionOrder[], userId: number, ip?: string | null) {
  await ensureDefaults();
  const updates = order.filter((s) => ALLOWED_KEYS.has(s.key));
  if (updates.length) {
    await prisma.$transaction(
      updates.map((u) =>
        prisma.homepageSection.update({
          where: { key: u.key },
          data: { sortOrder: Math.max(0, u.sortOrder) },
        })
      )
    );
  }
  await logActivity({ userId, action: "HOMEPAGE_REORDERED", entity: "HomepageSection", ip });
  return prisma.homepageSection.findMany({ orderBy: { sortOrder: "asc" } });
}
