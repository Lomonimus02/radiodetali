import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

// Prisma Client with PrismaPg adapter
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
  });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

function getPrismaClient(): PrismaClient {
  const cached = globalForPrisma.prisma;

  // В dev Next.js кэширует Prisma Client в globalThis — после изменения schema
  // старый клиент не знает новые модели (prisma.review === undefined).
  if (cached && typeof cached.review?.findMany === "function") {
    return cached;
  }

  const client = createPrismaClient();
  globalForPrisma.prisma = client;
  return client;
}

export const prisma = getPrismaClient();

export default prisma;
