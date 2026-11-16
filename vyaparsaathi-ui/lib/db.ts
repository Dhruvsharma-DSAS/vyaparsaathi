import "server-only";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is not set. Copy .env.example to .env and fill it in.");
  return new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
}

/**
 * One Prisma client per server process (survives Next.js hot reloads in dev).
 * Created on first use, so pages that never touch the database still build and run without DATABASE_URL.
 */
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, property) {
    globalForPrisma.prisma ??= createClient();
    const value = Reflect.get(globalForPrisma.prisma, property);
    return typeof value === "function" ? value.bind(globalForPrisma.prisma) : value;
  },
});
