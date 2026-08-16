const KHMER_DIGITS: Record<string, string> = {
  "0": "០", "1": "១", "2": "២", "3": "៣", "4": "៤",
  "5": "៥", "6": "៦", "7": "៧", "8": "៨", "9": "៩",
};

export function toKhmerDigits(input: string | number): string {
  return String(input).replace(/[0-9]/g, (d) => KHMER_DIGITS[d] ?? d);
}

const MONTHS_KM = [
  "មករា", "កុម្ភៈ", "មីនា", "មេសា", "ឧសភា", "មិថុនា",
  "កក្កដា", "សីហា", "កញ្ញា", "តុលា", "វិច្ឆិកា", "ធ្នូ",
];

/** "១២ សីហា ២០២៦" */
export function formatKhmerDate(value: string | Date | null): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return `${toKhmerDigits(d.getDate())} ${MONTHS_KM[d.getMonth()]} ${toKhmerDigits(d.getFullYear())}`;
}

/** "ថ្ងៃទី១២ ខែសីហា ឆ្នាំ២០២៦" (full form used in article meta) */
export function formatKhmerDateFull(value: string | Date | null): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return `ថ្ងៃទី${toKhmerDigits(d.getDate())} ខែ${MONTHS_KM[d.getMonth()]} ឆ្នាំ${toKhmerDigits(d.getFullYear())}`;
}

export function formatViews(views: number): string {
  if (views >= 1000) {
    const k = views / 1000;
    return `${toKhmerDigits(k % 1 === 0 ? k : k.toFixed(1))}ពាន់`;
  }
  return toKhmerDigits(views);
}

/**
 * Resolve an API image URL for display.
 * Cloudinary URLs get on-the-fly transformations (auto format + width cap)
 * so cards never download full-size originals. Local /uploads stay untouched.
 */
export function resolveImage(url: string | null | undefined, fallback = "/assets/img/news/KH.jpg", width?: number): string {
  if (!url) return fallback;
  if (url.startsWith("/uploads")) return url;
  if (/^https?:\/\/res\.cloudinary\.com\//.test(url)) {
    const w = width ?? 640;
    return url.replace("/image/upload/", `/image/upload/f_auto,q_auto,w_${w}/`);
  }
  return url.startsWith("http") ? url : fallback;
}

/**
 * Estimate reading time from HTML content.
 * Khmer script is character-dense, so we count characters (~350/min) rather than words.
 */
export function readingTime(html: string | null | undefined): number {
  if (!html) return 0;
  const text = html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  const minutes = Math.ceil(text.length / 350);
  return Math.max(1, minutes);
}
