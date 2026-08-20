import http from "http";
import { createApp, logStartup } from "./app";
import { env } from "./config/env";
import { logger } from "./lib/logger";
import { prisma } from "./lib/prisma";
import { ensureBucket } from "./lib/r2";
import { startTelegramWorker, stopTelegramWorker } from "./jobs/telegram.worker";

async function bootstrap() {
  // Verify R2 bucket exists (safe when R2 is down).
  await ensureBucket();

  // Telegram auto-publish worker (Redis-backed queue; safe when Redis is down).
  startTelegramWorker();

  const app = createApp();
  const server = http.createServer(app);

  server.listen(env.port, () => {
    logStartup(env.port);
  });

  async function shutdown(signal: string) {
    logger.info({ signal }, "Shutting down gracefully");
    stopTelegramWorker();
    server.close(async () => {
      await prisma.$disconnect();
      process.exit(0);
    });
    // Force exit if connections linger.
    setTimeout(() => process.exit(1), 10_000).unref();
  }

  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
}

bootstrap().catch((error) => {
  logger.error({ error }, "Fatal bootstrap error");
  process.exit(1);
});
