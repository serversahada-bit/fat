import { prisma } from './src/lib/prisma';

async function main() {
  // Clear existing tax data
  await prisma.master_pajak.deleteMany({});
  
  // Insert new tax data
  const pajaks = [
    { jenisPajak: "PPN 11%", persentase: 11 },
    { jenisPajak: "PPN 1,1%", persentase: 1.1 },
    { jenisPajak: "PPH 21", persentase: 2.5 },
    { jenisPajak: "UNIFIKASI PPH 23", persentase: 2 },
    { jenisPajak: "UNIFIKASI PPH 26", persentase: 20 },
    { jenisPajak: "UNIFIKASI PPH 4(2)", persentase: 10 },
    { jenisPajak: "PP 55", persentase: 0.5 },
    { jenisPajak: "SKB", persentase: 0 },
    { jenisPajak: "NON OBJEK", persentase: 0 }
  ];

  await prisma.master_pajak.createMany({
    data: pajaks
  });

  console.log("Data pajak berhasil diperbarui di database!");
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
