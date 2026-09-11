-- CreateTable
CREATE TABLE `app_setting` (
    `id` VARCHAR(191) NOT NULL DEFAULT 'singleton',
    `financeSubmissionEnabled` BOOLEAN NOT NULL DEFAULT true,
    `financeSubmissionStartDate` DATETIME(3) NULL,
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
