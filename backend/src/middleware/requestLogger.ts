import type { NextFunction, Request, Response } from "express";
import { randomUUID } from "crypto";
import { logger } from "../lib/logger";

// ============================================================
// Request Logger Middleware
// ============================================================
// Logs every HTTP request with:
//   - Unique request ID (for tracing across services)
//   - Method, URL, status code
//   - Response time in ms
//   - Slow request flag (>500ms)
//   - User agent (abbreviated)
//   - Client IP (from trust proxy)
//
// Usage:
//   app.use(requestLogger);
//
// The request ID is attached to req.id and returned in the
// X-Request-Id response header for client-side debugging.
//
// Log levels:
//   - < 100ms:  debug  (only in development)
//   - 100-500ms: info
//   - 500ms+:   warn   (slow request)
//   - 1000ms+:  error  (very slow request)
// ============================================================

/** Thresholds in milliseconds */
const SLOW_THRESHOLD = 500;
const VERY_SLOW_THRESHOLD = 1000;

/** Paths to exclude from logging (health checks, static assets) */
const SKIP_PATHS = new Set(["/health", "/api/live", "/api/ready"]);

/** Abbreviate user agent for logs (keep first 80 chars) */
function abbreviateUA(ua: string | undefined): string {
  if (!ua) return "-";
  // Strip common noise
  return ua.length > 80 ? ua.substring(0, 80) + "..." : ua;
}

/** Format response time for human readability */
function formatDuration(ms: number): string {
  if (ms < 1) return "<1ms";
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  // Skip health checks and static assets
  if (SKIP_PATHS.has(req.path) || req.path.startsWith("/uploads/")) {
    return next();
  }

  // Assign unique request ID
  const requestId = randomUUID();
  req.id = requestId;
  res.setHeader("X-Request-Id", requestId);

  const start = performance.now();
  const startTime = Date.now();

  // Capture the original end method to log after response is sent
  const originalEnd = res.end;
  res.end = function (this: Response, ...args: Parameters<typeof originalEnd>) {
    const duration = performance.now() - start;
    const status = res.statusCode;
    const method = req.method;
    const url = req.originalUrl || req.url;
    const contentLength = res.getHeader("content-length");
    const ip = req.ip || req.socket.remoteAddress || "-";
    const userAgent = abbreviateUA(req.get("user-agent"));

    // Base log fields
    const logFields = {
      requestId,
      method,
      url,
      status,
      duration: Math.round(duration),
      durationHuman: formatDuration(duration),
      contentLength: contentLength ? Number(contentLength) : undefined,
      ip,
      userAgent,
      contentEncoding: res.getHeader("content-encoding") || undefined,
    };

    // Determine log level based on response time and status
    if (duration >= VERY_SLOW_THRESHOLD) {
      logger.error(
        {
          ...logFields,
          slow: true,
          severity: "very-slow",
        },
        `[SLOW] ${method} ${url} → ${status} in ${formatDuration(duration)}`
      );
    } else if (duration >= SLOW_THRESHOLD) {
      logger.warn(
        {
          ...logFields,
          slow: true,
          severity: "slow",
        },
        `[SLOW] ${method} ${url} → ${status} in ${formatDuration(duration)}`
      );
    } else if (status >= 500) {
      logger.error(
        { ...logFields, severity: "server-error" },
        `[ERROR] ${method} ${url} → ${status} in ${formatDuration(duration)}`
      );
    } else if (status >= 400) {
      logger.info(
        { ...logFields, severity: "client-error" },
        `${method} ${url} → ${status} in ${formatDuration(duration)}`
      );
    } else if (duration < 100 && !env?.isProd) {
      // Only log fast requests in development
      logger.debug(
        { ...logFields, severity: "fast" },
        `${method} ${url} → ${status} in ${formatDuration(duration)}`
      );
    } else {
      logger.info(
        { ...logFields, severity: "normal" },
        `${method} ${url} → ${status} in ${formatDuration(duration)}`
      );
    }

    // Return original end
    return originalEnd.apply(this, args);
  } as typeof originalEnd;

  next();
}

// Import env for isProd check (lazy to avoid circular dependency)
let env: { isProd?: boolean } | undefined;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  env = require("../config/env").env;
} catch {
  // If env import fails, we just skip the debug logging filter
}
