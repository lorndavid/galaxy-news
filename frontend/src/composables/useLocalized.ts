import { useLocaleStore } from "@/stores/locale";
import { formatKhmerDate, formatKhmerDateFull, formatEnglishDate, formatChineseDate } from "@/utils/format";

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

  return { locale, isEn: locale.isEn, isZh: locale.isZh, t: locale.t, title, excerpt, content, catName, catDescription, formatDate, formatDateFull };
}
