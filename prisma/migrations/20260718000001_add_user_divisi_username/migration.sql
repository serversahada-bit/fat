-- AlterTable
-- `username` and `divisi` were added directly via `prisma db push` and were
-- never captured by a migration; this records their current state.
ALTER TABLE `user` ADD COLUMN `divisi` VARCHAR(191) NULL,
    ADD COLUMN `username` VARCHAR(191) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `User_username_key` ON `user`(`username`);
