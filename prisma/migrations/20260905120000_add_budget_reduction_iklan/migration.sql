-- AlterTable
ALTER TABLE `kebutuhan_iklan` ADD COLUMN `totalSebelumDikurangi` DOUBLE NULL,
    ADD COLUMN `alasanPengurangan` TEXT NULL,
    ADD COLUMN `waktuPengurangan` DATETIME(3) NULL;
