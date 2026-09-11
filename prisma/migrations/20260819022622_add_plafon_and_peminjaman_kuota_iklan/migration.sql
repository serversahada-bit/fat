-- CreateTable
CREATE TABLE `plafon_iklan` (
    `id` VARCHAR(191) NOT NULL,
    `bulan` VARCHAR(191) NOT NULL,
    `totalPlafon` DOUBLE NOT NULL DEFAULT 0,
    `status` VARCHAR(191) NOT NULL DEFAULT 'DRAFT',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `plafon_iklan_bulan_key`(`bulan`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `peminjaman_kuota_iklan` (
    `id` VARCHAR(191) NOT NULL,
    `peminjamId` VARCHAR(191) NOT NULL,
    `pemberiPinjamanId` VARCHAR(191) NOT NULL,
    `nominal` DOUBLE NOT NULL,
    `alasan` TEXT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING_IZIN',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `peminjaman_kuota_iklan_peminjamId_idx`(`peminjamId`),
    INDEX `peminjaman_kuota_iklan_pemberiPinjamanId_idx`(`pemberiPinjamanId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AlterTable
ALTER TABLE `kebutuhan_iklan` ADD COLUMN `plafonId` VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `kebutuhan_iklan_plafonId_idx` ON `kebutuhan_iklan`(`plafonId`);

-- AddForeignKey
ALTER TABLE `kebutuhan_iklan` ADD CONSTRAINT `kebutuhan_iklan_plafonId_fkey` FOREIGN KEY (`plafonId`) REFERENCES `plafon_iklan`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `peminjaman_kuota_iklan` ADD CONSTRAINT `peminjaman_kuota_iklan_peminjamId_fkey` FOREIGN KEY (`peminjamId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `peminjaman_kuota_iklan` ADD CONSTRAINT `peminjaman_kuota_iklan_pemberiPinjamanId_fkey` FOREIGN KEY (`pemberiPinjamanId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
