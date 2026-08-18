import { prisma } from "../lib/prisma";
import { logActivity } from "./activity.service";

/** Default section order (used when the table is empty). */
const DEFAULT_SECTIONS = [
  { key: "breaking", label: "បន្ទាត់ព័ត៌មានក្តៅ", enabled: true, sortOrder: 1, config: null },
  { key: "hero", label: "ព័ត៌មានកំពូល (Hero)", enabled: true, sortOrder: 2, config: JSON.stringify({ sidebar: true }) },
  { key: "weekly", label: "ព័ត៌មានប្រចាំសប្តាហ៍", enabled: true, sortOrder: 3, config: null },
  { key: "whats-new", label: "អ្វីដែលថ្មី", enabled: true, sortOrder: 4, config: JSON.stringify({ columns: 5 }) },
  { key: "latest", label: "ព័ត៌មានថ្មីៗ", enabled: true, sortOrder: 5, config: null },
  { key: "video", label: "វីដេអូ", enabled: true, sortOrder: 6, config: JSON.stringify({ columns: 5 }) },
  { key: "recent", label: "អត្ថបទថ្មីៗ", enabled: true, sortOrder: 7, config: null },
];

const ALLOWED_KEYS = new Set(DEFAULT_SECTIONS.map((s) => s.key));

/** Parse a section's JSON config into a typed object (missing/invalid → null). */
function parseConfig(raw: string | null): Record<string, unknown> | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

/**
 * Ensure the builder has a row for every known section so the admin list
 * always shows the full set, even before the first visit. Rows created by
 * older versions (no config) get the default layout options backfilled.
 */
async function ensureDefaults() {
  const existing = await prisma.homepageSection.findMany();
  const seen = new Set(existing.map((s) => s.key));
  for (const d of DEFAULT_SECTIONS) {
    if (!seen.has(d.key)) {
      await prisma.homepageSection.create({ data: { ...d, config: d.config } });
    } else {
      const row = existing.find((r) => r.key === d.key);
      if (row && row.config == null && d.config) {
        await prisma.homepageSection.update({
          where: { key: d.key },
          data: { config: d.config },
        });
      }
    }
  }
}

/** Public: only enabled sections, in order, with their layout config. */
export async function getPublicSections() {
  await ensureDefaults();
  const rows = await prisma.homepageSection.findMany({
    where: { enabled: true },
    orderBy: { sortOrder: "asc" },
    select: { key: true, label: true, config: true },
  });
  return rows.map((r) => ({ key: r.key, label: r.label, config: parseConfig(r.config) }));
}

/** Admin: full list with enabled + order + parsed config. */
export async function listSections() {
  await ensureDefaults();
  const rows = await prisma.homepageSection.findMany({
    orderBy: { sortOrder: "asc" },
  });
  return rows.map((r) => ({ ...r, config: parseConfig(r.config) }));
}

export interface SectionUpdate {
  key: string;
  enabled?: boolean;
  label?: string;
  config?: Record<string, unknown> | null;
}

export async function updateSections(input: SectionUpdate[], userId: number, ip?: string | null) {
  await ensureDefaults();
  const updates = input.filter((s) => ALLOWED_KEYS.has(s.key));
  if (!updates.length) return listSections();

  await prisma.$transaction(
    updates.map((u) =>
      prisma.homepageSection.update({
        where: { key: u.key },
        data: {
          ...(u.enabled !== undefined ? { enabled: u.enabled } : {}),
          ...(u.label !== undefined ? { label: u.label } : {}),
          ...(u.config !== undefined
            ? { config: u.config ? JSON.stringify(u.config) : null }
            : {}),
        },
      })
    )
  );

  await logActivity({ userId, action: "HOMEPAGE_SECTIONS_UPDATED", entity: "HomepageSection", ip });
  return listSections();
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
