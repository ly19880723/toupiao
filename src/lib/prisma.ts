import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Helper to safely disconnect in serverless environments
export async function disconnectPrisma() {
  try {
    await prisma.$disconnect();
  } catch (e) {
    // ignore disconnect errors
  }
}
