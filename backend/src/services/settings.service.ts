import { prisma } from "../lib/prisma";
import { logActivity } from "./activity.service";

const PUBLIC_FIELDS = [
  "siteName",
  "logo",
  "favicon",
  "description",
  "facebook",
  "telegram",
  "youtube",
  "tiktok",
  "instagram",
  "twitter",
  "contactEmail",
  "contactPhone",
  "address",
] as const;

export async function getPublic() {
  const settings = await prisma.siteSettings.findFirst();
  if (!settings) {
    return { siteName: "Navatra 4K TV" };
  }
  const out: Record<string, unknown> = {};
  for (const field of PUBLIC_FIELDS) {
    out[field] = settings[field];
  }
  return out;
}

export async function getAdmin() {
  const settings = await prisma.siteSettings.findFirst();
  if (settings) return settings;
  return prisma.siteSettings.create({ data: {} });
}

export async function updateSettings(input: Record<string, unknown>, userId: number, ip?: string | null) {
  const current = await prisma.siteSettings.findFirst();
  const data: Record<string, unknown> = {};
  for (const field of PUBLIC_FIELDS) {
    if (input[field] !== undefined) data[field] = input[field];
  }

  const settings = current
    ? await prisma.siteSettings.update({ where: { id: current.id }, data })
    : await prisma.siteSettings.create({ data: data as never });

  await logActivity({ userId, action: "SETTINGS_UPDATED", ip });
  return settings;
}
