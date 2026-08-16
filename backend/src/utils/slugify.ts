export function slugify(input: string, fallbackPrefix = "item"): string {
  const base = input
    .toString()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");

  // Non-Latin text (e.g. Khmer) produces an empty slug — fall back to a
  // transliteration-safe id so URLs stay unique and clean.
  if (!base) {
    return `${fallbackPrefix}-${Date.now().toString(36)}`;
  }
  return base;
}
