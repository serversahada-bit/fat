import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import mariadb from 'mariadb';

const globalForPrisma = global as unknown as { prisma6: PrismaClient };

const dbUrl = new URL(process.env.DATABASE_URL as string);
const adapter = new PrismaMariaDb({
  host: dbUrl.hostname,
  port: parseInt(dbUrl.port, 10) || 3306,
  user: dbUrl.username || 'root',
  password: dbUrl.password || undefined,
  database: dbUrl.pathname.substring(1),
});

export const prisma =
  globalForPrisma.prisma6 || new PrismaClient({ adapter });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma6 = prisma;
