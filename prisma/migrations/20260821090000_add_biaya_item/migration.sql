-- CreateTable
CREATE TABLE `biaya_item` (
    `id` VARCHAR(191) NOT NULL,
    `semuaPengajuanId` VARCHAR(191) NOT NULL,
    `keterangan` TEXT NOT NULL,
    `nominal` DOUBLE NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `biaya_item_semuaPengajuanId_idx`(`semuaPengajuanId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `biaya_item` ADD CONSTRAINT `biaya_item_semuaPengajuanId_fkey` FOREIGN KEY (`semuaPengajuanId`) REFERENCES `semua_pengajuan`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
