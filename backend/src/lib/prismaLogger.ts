import { Prisma } from "@prisma/client";
import { logger } from "./logger";

// ============================================================
// Prisma Slow Query Logger
// ============================================================
// Monitors all Prisma queries and logs warnings for slow ones.
// Attaches as a Prisma middleware via $use().
//
// Thresholds:
//   - < 50ms:   silent (normal)
//   - 50-200ms: debug (dev only)
//   - 200-500ms: info (notable)
//   - 500ms+:   warn  (slow query)
//   - 1000ms+:  error (very slow query)
//
// Usage:
//   import { attachSlowQueryLogger } from "./prismaLogger";
//   import { prisma } from "./prisma";
//   attachSlowQueryLogger(prisma);
// ============================================================

const SLOW_THRESHOLD_MS = 200;
const VERY_SLOW_THRESHOLD_MS = 500;
const CRITICAL_THRESHOLD_MS = 1000;

/** Extract a readable summary of the Prisma query action */
function summarizeQuery(params: Prisma.MiddlewareParams): string {
  const { model, action, args } = params;
  const modelStr = model ?? "Unknown";
  const actionStr = action;

  // Build a compact summary
  const parts = [`${modelStr}.${actionStr}`];

  // Add where clause summary if present
  if (args?.where) {
    const whereKeys = Object.keys(args.where);
    if (whereKeys.length <= 3) {
      parts.push(`where:{${whereKeys.join(",")}}`);
    } else {
      parts.push(`where:{${whereKeys.slice(0, 3).join(",")},+${whereKeys.length - 3}}`);
    }
  }

  // Add include/select summary
  if (args?.include) {
    const includeKeys = Object.keys(args.include);
    parts.push(`include:{${includeKeys.join(",")}}`);
  } else if (args?.select) {
    const selectKeys = Object.keys(args.select);
    parts.push(`select:{${selectKeys.join(",")}}`);
  }

  // Add pagination summary
  if (args?.skip !== undefined) parts.push(`skip:${args.skip}`);
  if (args?.take !== undefined) parts.push(`take:${args.take}`);

  // Add orderBy summary
  if (args?.orderBy) {
    const orderStr = Array.isArray(args.orderBy)
      ? args.orderBy.map((o: Record<string, string>) => Object.keys(o)[0]).join(",")
      : Object.keys(args.orderBy)[0];
    parts.push(`order:${orderStr}`);
  }

  return parts.join(" ");
}

export function attachSlowQueryLogger(prisma: PrismaClient): void {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  prisma.$use(async (params: Prisma.MiddlewareParams, next: (params: Prisma.MiddlewareParams) => Promise<unknown>) => {
    const start = performance.now();
    const querySummary = summarizeQuery(params);

    try {
      const result = await next(params);
      const duration = performance.now() - start;

      // Log slow queries
      if (duration >= CRITICAL_THRESHOLD_MS) {
        logger.error(
          {
            query: querySummary,
            duration: Math.round(duration),
            severity: "critical-query",
          },
          `[SLOW QUERY] ${querySummary} — ${Math.round(duration)}ms`
        );
      } else if (duration >= VERY_SLOW_THRESHOLD_MS) {
        logger.warn(
          {
            query: querySummary,
            duration: Math.round(duration),
            severity: "slow-query",
          },
          `[SLOW QUERY] ${querySummary} — ${Math.round(duration)}ms`
        );
      } else if (duration >= SLOW_THRESHOLD_MS) {
        logger.info(
          {
            query: querySummary,
            duration: Math.round(duration),
            severity: "notable-query",
          },
          `[QUERY] ${querySummary} — ${Math.round(duration)}ms`
        );
      }

      return result;
    } catch (error) {
      const duration = performance.now() - start;
      logger.error(
        {
          query: querySummary,
          duration: Math.round(duration),
          severity: "query-error",
          error: error instanceof Error ? error.message : String(error),
        },
        `[QUERY ERROR] ${querySummary} — failed after ${Math.round(duration)}ms`
      );
      throw error;
    }
  });
}

// Re-export PrismaClient type for convenience
type PrismaClient = {
  $use: (fn: (params: Prisma.MiddlewareParams, next: (params: Prisma.MiddlewareParams) => Promise<unknown>) => Promise<unknown>) => void;
};
