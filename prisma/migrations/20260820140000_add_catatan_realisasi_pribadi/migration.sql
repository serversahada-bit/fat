-- CreateTable
CREATE TABLE `catatan_realisasi_pribadi` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `divisi` VARCHAR(191) NULL,
    `tipeBiaya` VARCHAR(191) NULL,
    `uraian` VARCHAR(191) NULL,
    `qty` DOUBLE NULL,
    `satuan` VARCHAR(191) NULL,
    `hargaSatuan` DOUBLE NULL,
    `total` DOUBLE NULL,
    `realisasi` DOUBLE NULL,
    `catatan` TEXT NULL,
    `urutan` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `catatan_realisasi_pribadi_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `catatan_realisasi_pribadi` ADD CONSTRAINT `catatan_realisasi_pribadi_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
