import { logger } from "../lib/logger";
import { popTelegramJob } from "../lib/telegramQueue";
import { processTelegramJob } from "../services/telegram.service";

// ============================================================
// Telegram publishing worker.
//
// Runs inside the backend process (single container), polling the
// Redis-backed queue. Article publishing never waits on it — the
// HTTP request enqueues a job and returns immediately.
//
// Job payloads contain only { articleId }; the worker loads the
// bot token from the protected SiteSettings row at processing time.
// ============================================================

let running = false;

/** Start the worker loop (idempotent). */
export function startTelegramWorker(): void {
  if (running) return;
  running = true;
  logger.info("Telegram worker started");
  void loop();
}

/** Stop the loop gracefully (used on shutdown). */
export function stopTelegramWorker(): void {
  running = false;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function loop(): Promise<void> {
  while (running) {
    let job;
    try {
      job = await popTelegramJob(2);
    } catch (error) {
      logger.error({ error }, "Telegram worker pop failed");
      await sleep(1_000);
      continue;
    }
    if (!job) {
      // popTelegramJob resolves immediately when Redis is not ready yet —
      // always yield the event loop so the HTTP server stays responsive
      // (a hot loop here starves I/O and hangs the API).
      await sleep(300);
      continue;
    }
    try {
      await processTelegramJob(job);
    } catch (error) {
      logger.error({ error, articleId: job.articleId }, "Telegram job crashed");
    }
  }
}
