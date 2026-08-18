import { getRedis } from "./redis";
import { logger } from "./logger";

// ============================================================
// Redis-backed job queue for Telegram publishing.
//   - Jobs are `{ articleId }` only — the bot token is retrieved
//     from settings by the worker at processing time, never stored
//     in the queue.
//   - Key prefix is intentionally OUTSIDE the `navatra:` cache
//     namespace so cache flushes never drop queued jobs.
//   - If Redis is unavailable the queue degrades to an in-memory
//     list (same process), so article publishing never blocks on
//     the queue infrastructure.
// ============================================================

const QUEUE_KEY = "tgq:telegram";

export interface TelegramJob {
  articleId: number;
}

const memoryQueue: TelegramJob[] = [];

function parse(raw: string): TelegramJob | null {
  try {
    const parsed = JSON.parse(raw) as { articleId?: unknown };
    if (typeof parsed.articleId === "number" && Number.isInteger(parsed.articleId)) {
      return { articleId: parsed.articleId };
    }
  } catch {
    /* malformed job — drop it */
  }
  logger.warn({ raw }, "Dropped malformed Telegram queue job");
  return null;
}

/** Enqueue an article for Telegram publishing. Never throws. */
export async function enqueueTelegramJob(articleId: number): Promise<void> {
  const payload = JSON.stringify({ articleId });
  const redis = getRedis();
  if (redis && redis.status === "ready") {
    try {
      await redis.lpush(QUEUE_KEY, payload);
      return;
    } catch (error) {
      logger.warn({ error, articleId }, "Telegram enqueue failed (Redis) — using in-memory queue");
    }
  }
  memoryQueue.push({ articleId });
}

/** Pop the next job, blocking up to `timeoutSeconds` when using Redis. */
export async function popTelegramJob(timeoutSeconds = 2): Promise<TelegramJob | null> {
  const redis = getRedis();
  if (redis && redis.status === "ready") {
    try {
      const res = await redis.brpop(QUEUE_KEY, timeoutSeconds);
      if (!res) return null;
      return parse(res[1]);
    } catch (error) {
      logger.warn({ error }, "Telegram BRPOP failed — using in-memory queue");
    }
  }
  return memoryQueue.shift() ?? null;
}

/** Number of jobs waiting (used by tests / diagnostics). */
export async function telegramQueueLength(): Promise<number> {
  const redis = getRedis();
  if (redis && redis.status === "ready") {
    try {
      return await redis.llen(QUEUE_KEY);
    } catch {
      /* fall through */
    }
  }
  return memoryQueue.length;
}
