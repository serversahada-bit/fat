ALTER TABLE `user`
ADD COLUMN `role` ENUM('ADMIN', 'KARYAWAN') NOT NULL DEFAULT 'KARYAWAN';

CREATE TABLE `pengajuan` (
  `id` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(191) NOT NULL,
  `judul` VARCHAR(191) NOT NULL,
  `deskripsi` TEXT NOT NULL,
  `status` ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
  `catatanAdmin` TEXT NULL,
  `diprosesPada` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `Pengajuan_status_idx`(`status`),
  INDEX `Pengajuan_userId_idx`(`userId`),
  CONSTRAINT `Pengajuan_userId_fkey`
    FOREIGN KEY (`userId`) REFERENCES `user`(`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
);
