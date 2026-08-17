import { useLocaleStore } from "@/stores/locale";

/**
 * Localized content helpers — every card/view should read titles,
 * excerpts, content and category names through these so the whole
 * public site switches language without per-component ifs.
 */
export function useLocalized() {
  const locale = useLocaleStore();

  const title = (a: { title: string; titleEn: string | null }) =>
    locale.pick(a.title, a.titleEn);

  const excerpt = (a: { excerpt: string | null; excerptEn: string | null }) =>
    locale.pick(a.excerpt, a.excerptEn);

  const content = (a: { content: string; contentEn: string | null }) =>
    locale.pick(a.content, a.contentEn);

  const catName = (a: { category?: { name: string; nameEn: string | null } | null }) =>
    locale.pick(a.category?.name, a.category?.nameEn);

  const catDescription = (a: {
    category?: { description: string | null; descriptionEn: string | null } | null;
  }) => locale.pick(a.category?.description, a.category?.descriptionEn);

  return { locale, isEn: locale.isEn, t: locale.t, title, excerpt, content, catName, catDescription };
}
