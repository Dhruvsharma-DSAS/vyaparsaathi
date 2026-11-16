import "server-only";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "./generated/prisma/client";

export const databaseUrl = process.env.DATABASE_URL ?? "file:./prisma/map.db";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

/** One Prisma client per server process (survives Next.js hot reloads in dev). */
export const prisma = globalForPrisma.prisma ??
  new PrismaClient({ adapter: new PrismaBetterSqlite3({ url: databaseUrl }) });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
