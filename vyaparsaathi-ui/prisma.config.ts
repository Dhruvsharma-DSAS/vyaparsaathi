import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // Set in .env locally and in the Vercel project settings. Only `prisma migrate` and `db seed` need it;
    // `prisma generate` (run on install) works without it.
    url: process.env.DATABASE_URL ?? "",
  },
});
