require("dotenv").config();

const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");
const { PrismaMariaDb } = require("@prisma/adapter-mariadb");

const dbUrl = new URL(process.env.DATABASE_URL);
const adapter = new PrismaMariaDb({
  host: dbUrl.hostname,
  port: parseInt(dbUrl.port, 10) || 3306,
  user: dbUrl.username || "root",
  password: dbUrl.password || undefined,
  database: dbUrl.pathname.substring(1),
});

const prisma = new PrismaClient({ adapter });

async function main() {
  const hashedPassword = await bcrypt.hash("admin", 10);

  const user = await prisma.user.upsert({
    where: { username: "admin" },
    update: {
      name: "Administrator",
      email: "admin@example.com",
      password: hashedPassword,
      role: "SUPER_ADMIN",
      updatedAt: new Date(),
    },
    create: {
      id: "user_admin",
      name: "Administrator",
      email: "admin@example.com",
      username: "admin",
      password: hashedPassword,
      role: "SUPER_ADMIN",
      updatedAt: new Date(),
    },
  });

  console.log(`Admin ready: ${user.username} / admin`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });