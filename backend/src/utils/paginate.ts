export interface Pagination {
  page: number;
  pageSize: number;
  skip: number;
  take: number;
}

export function parsePagination(
  pageRaw?: unknown,
  pageSizeRaw?: unknown,
  maxPageSize = 50
): Pagination {
  const page = Math.max(1, parseInt(String(pageRaw ?? "1"), 10) || 1);
  const pageSize = Math.min(
    maxPageSize,
    Math.max(1, parseInt(String(pageSizeRaw ?? "12"), 10) || 12)
  );
  return { page, pageSize, skip: (page - 1) * pageSize, take: pageSize };
}

export function qs(value: unknown): string | undefined {
  if (value === undefined || value === null) return undefined;
  if (Array.isArray(value)) return String(value[0]);
  return String(value);
}

export interface Paginated<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export function buildPagination<T>(
  items: T[],
  total: number,
  { page, pageSize }: Pagination
): Paginated<T> {
  return {
    items,
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}
