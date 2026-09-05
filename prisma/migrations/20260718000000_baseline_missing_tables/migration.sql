-- Baseline migration: these tables were created directly against the dev
-- database (via `prisma db push`) early in the project and were never
-- captured by a migration, so a fresh shadow database replay had no table
-- for later migrations to ALTER. This records their state as of just before
-- `20260819022622_add_plafon_and_peminjaman_kuota_iklan` (the first migration
-- that touches kebutuhan_iklan) and `20260821090000_add_biaya_item` (the
-- first that touches semua_pengajuan).

-- CreateTable
CREATE TABLE `kebutuhan_bulanan` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `bulan` VARCHAR(191) NOT NULL,
    `kategori` VARCHAR(191) NOT NULL DEFAULT 'OPS RT',
    `divisi` VARCHAR(191) NOT NULL,
    `pic` VARCHAR(191) NOT NULL,
    `rincian` TEXT NOT NULL,
    `qty` INTEGER NOT NULL,
    `satuan` VARCHAR(191) NOT NULL,
    `hargaSatuan` DOUBLE NOT NULL,
    `total` DOUBLE NOT NULL,
    `status` ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    `catatanTambahan` TEXT NULL,
    `catatanAdmin` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `kebutuhan_bulanan_status_idx`(`status`),
    INDEX `kebutuhan_bulanan_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `kebutuhan_iklan` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `bulan` VARCHAR(191) NOT NULL,
    `platform` VARCHAR(191) NOT NULL DEFAULT 'Meta Ads',
    `divisi` VARCHAR(191) NOT NULL,
    `pic` VARCHAR(191) NOT NULL,
    `rincian` TEXT NOT NULL,
    `qty` INTEGER NOT NULL,
    `satuan` VARCHAR(191) NOT NULL,
    `hargaSatuan` DOUBLE NOT NULL,
    `total` DOUBLE NOT NULL,
    `status` ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    `catatanTambahan` TEXT NULL,
    `catatanAdmin` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `kebutuhan_iklan_status_idx`(`status`),
    INDEX `kebutuhan_iklan_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `semua_pengajuan` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `timestamp` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `email` VARCHAR(191) NULL,
    `tanggalPermohonan` DATETIME(3) NULL,
    `tipeTransaksi` VARCHAR(191) NULL,
    `namaPemohon` VARCHAR(191) NULL,
    `emailVendor` VARCHAR(191) NULL,
    `tipePembayaran` VARCHAR(191) NULL,
    `informasiPenerima` VARCHAR(191) NULL,
    `namaPenerima` VARCHAR(191) NULL,
    `detailBankPenerima` VARCHAR(191) NULL,
    `nomorRekeningHp` VARCHAR(191) NULL,
    `nominalTransaksi` DOUBLE NULL,
    `keterangan` TEXT NULL,
    `lampiranFinance` TEXT NULL,
    `column17` VARCHAR(191) NULL,
    `score` VARCHAR(191) NULL,
    `lampiranTax` TEXT NULL,
    `tipePengajuan` VARCHAR(191) NULL,
    `bankPengirim` VARCHAR(191) NULL,
    `alokasi` VARCHAR(191) NULL,
    `printPendukung` VARCHAR(191) NULL,
    `printForm` VARCHAR(191) NULL,
    `nomorCetakForm` VARCHAR(191) NULL,
    `verifiedFinance` VARCHAR(191) NULL,
    `timestampVerifyFinance` DATETIME(3) NULL,
    `jenisPajak` VARCHAR(191) NULL,
    `nilaiPajakTerutang` DOUBLE NULL,
    `bankOut` VARCHAR(191) NULL,
    `adaPpn` VARCHAR(191) NULL,
    `verifiedTax` VARCHAR(191) NULL,
    `timestampVerifyTax` DATETIME(3) NULL,
    `verifiedManager` VARCHAR(191) NULL,
    `timestampVerifyManager` DATETIME(3) NULL,
    `catatanManager` TEXT NULL,
    `tanggalRealisasi` DATETIME(3) NULL,
    `nominalRealisasi` DOUBLE NULL,
    `invoice` TEXT NULL,
    `nomorBukti` VARCHAR(191) NULL,
    `adminBank` VARCHAR(191) NULL,
    `pic` VARCHAR(191) NULL,
    `status` ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `semua_pengajuan_status_idx`(`status`),
    INDEX `semua_pengajuan_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `master_bank` (
    `id` VARCHAR(191) NOT NULL,
    `nama` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `master_pajak` (
    `id` VARCHAR(191) NOT NULL,
    `jenisPajak` VARCHAR(191) NOT NULL,
    `persentase` DOUBLE NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `master_nama` (
    `id` VARCHAR(191) NOT NULL,
    `nama` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `master_canvas` (
    `id` VARCHAR(191) NOT NULL,
    `kategori` VARCHAR(191) NOT NULL DEFAULT 'Default',
    `posisi` VARCHAR(191) NOT NULL,
    `nama` VARCHAR(191) NOT NULL,
    `jabatan` VARCHAR(191) NOT NULL,
    `x` DOUBLE NOT NULL DEFAULT 0,
    `y` DOUBLE NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `kebutuhan_bulanan` ADD CONSTRAINT `kebutuhan_bulanan_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `kebutuhan_iklan` ADD CONSTRAINT `kebutuhan_iklan_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `semua_pengajuan` ADD CONSTRAINT `semua_pengajuan_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
