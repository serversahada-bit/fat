import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';

const globalForPrisma = global as unknown as { prisma8: PrismaClient };
const databaseUrl = process.env.DATABASE_URL || 'mysql://root@localhost:3306/fat_system';
const dbUrl = new URL(databaseUrl);

const adapter = new PrismaMariaDb({
  host: dbUrl.hostname,
  port: parseInt(dbUrl.port, 10) || 3306,
  user: dbUrl.username || 'root',
  password: dbUrl.password || undefined,
  database: dbUrl.pathname.substring(1),
});

export const prisma =
  globalForPrisma.prisma8 || new PrismaClient({ adapter });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma8 = prisma;