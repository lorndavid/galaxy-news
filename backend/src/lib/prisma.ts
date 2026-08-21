import { PrismaClient } from "@prisma/client";
import { env } from "../config/env";
import { attachSlowQueryLogger } from "./prismaLogger";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: env.isProd ? ["error", "warn"] : ["warn", "error"],
  });

// Attach slow query logger (logs queries >200ms)
attachSlowQueryLogger(prisma as never);

if (!env.isProd) {
  globalForPrisma.prisma = prisma;
}
