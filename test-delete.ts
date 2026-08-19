import { prisma } from './src/lib/prisma';

async function main() {
  try {
    await prisma.$transaction([
      prisma.pengajuan.deleteMany(),
      prisma.kebutuhan_bulanan.deleteMany(),
      prisma.kebutuhan_iklan.deleteMany(),
      prisma.peminjaman_kuota_iklan.deleteMany(),
      prisma.plafon_iklan.deleteMany(),
      prisma.semua_pengajuan.deleteMany(),
    ]);
    console.log("Database deletion success");
  } catch (err) {
    console.error("Database deletion error:", err);
  } finally {
    await prisma.$disconnect();
  }
}
main();
