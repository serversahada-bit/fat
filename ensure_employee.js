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
  const hashedPassword = await bcrypt.hash("karyawan", 10);

  const user = await prisma.user.upsert({
    where: { username: "karyawan" },
    update: {
      name: "Karyawan Demo",
      email: "karyawan@example.com",
      password: hashedPassword,
      role: "KARYAWAN",
      updatedAt: new Date(),
    },
    create: {
      id: "user_karyawan_demo",
      name: "Karyawan Demo",
      email: "karyawan@example.com",
      username: "karyawan",
      password: hashedPassword,
      role: "KARYAWAN",
      updatedAt: new Date(),
    },
  });

  console.log(`Karyawan ready: ${user.username} / karyawan`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
