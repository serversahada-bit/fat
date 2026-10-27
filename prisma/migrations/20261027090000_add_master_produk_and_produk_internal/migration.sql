-- AlterTable
ALTER TABLE `kebutuhan_bulanan` ADD COLUMN `produkInternal` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `master_produk` (
    `id` VARCHAR(191) NOT NULL,
    `nama` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
