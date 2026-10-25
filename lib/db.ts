import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@/generated/prisma/client';

const g = globalThis as unknown as { prisma?: PrismaClient };

export function makePrisma(url = process.env.DATABASE_URL) {
  if (!url) throw new Error('DATABASE_URL is not set. Copy .env.example to .env.');
  return new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });
}

function client(): PrismaClient {
  return (g.prisma ??= makePrisma());
}

// Lazy: the connection is only created on first use, so `next build` works without a database.
export const db = new Proxy({} as PrismaClient, { get: (_t, prop) => Reflect.get(client(), prop) });
