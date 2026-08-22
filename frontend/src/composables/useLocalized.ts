import { useLocaleStore } from "@/stores/locale";
import { formatKhmerDate, formatKhmerDateFull, formatEnglishDate, formatChineseDate } from "@/utils/format";

/**
 * Localized content helpers — every card/view should read titles,
 * excerpts, content and category names through these so the whole
 * public site switches language without per-component ifs.
 */
export function useLocalized() {
  const locale = useLocaleStore();

  /** Pick the right content based on locale, with zh → en → primary fallback chain. */
  function pickLocalized(
    primary: string | null | undefined,
    secondary: string | null | undefined,
    tertiary: string | null | undefined,
  ): string {
    if (locale.isZh && tertiary) return tertiary;
    if (locale.isEn && secondary) return secondary;
    return primary || secondary || tertiary || "";
  }

  const title = (a: { title: string; titleEn: string | null; titleZh?: string | null }) =>
    pickLocalized(a.title, a.titleEn, a.titleZh);

  const excerpt = (a: { excerpt: string | null; excerptEn: string | null; excerptZh?: string | null }) =>
    pickLocalized(a.excerpt, a.excerptEn, a.excerptZh);

  const content = (a: { content: string; contentEn: string | null; contentZh?: string | null }) =>
    pickLocalized(a.content, a.contentEn, a.contentZh);

  const catName = (a: { category?: { name: string; nameEn: string | null; nameZh?: string | null } | null }) =>
    pickLocalized(a.category?.name, a.category?.nameEn, a.category?.nameZh);

  const catDescription = (a: {
    category?: { description: string | null; descriptionEn: string | null; descriptionZh?: string | null } | null;
  }) => pickLocalized(a.category?.description, a.category?.descriptionEn, a.category?.descriptionZh);

  /** Locale-aware short date: "១២ សីហា ២០២៦" / "12 Aug 2026" / "2026年8月12日" */
  const formatDate = (value: string | Date | null): string => {
    if (locale.isEn) return formatEnglishDate(value);
    if (locale.isZh) return formatChineseDate(value);
    return formatKhmerDate(value);
  };

  /** Locale-aware full date: "ថ្ងៃទី១២ ខែសីហា ឆ្នាំ២០២៦" / "12 Aug 2026" / "2026年8月12日" */
  const formatDateFull = (value: string | Date | null): string => {
    if (locale.isEn) return formatEnglishDate(value);
    if (locale.isZh) return formatChineseDate(value);
    return formatKhmerDateFull(value);
  };

  const tagName = (t: { name: string; nameEn: string | null; nameZh?: string | null }) =>
    pickLocalized(t.name, t.nameEn, t.nameZh);

  const navLabel = (item: { label: string; labelEn: string | null; labelZh?: string | null }) =>
    pickLocalized(item.label, item.labelEn, item.labelZh);

  return { locale, isEn: locale.isEn, isZh: locale.isZh, t: locale.t, title, excerpt, content, catName, catDescription, tagName, navLabel, formatDate, formatDateFull };
}
