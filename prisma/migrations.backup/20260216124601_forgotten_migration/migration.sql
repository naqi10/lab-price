/*
  Warnings:

  - You are about to drop the column `client_email` on the `quotations` table. All the data in the column will be lost.
  - You are about to drop the column `client_name` on the `quotations` table. All the data in the column will be lost.
  - You are about to drop the column `client_phone` on the `quotations` table. All the data in the column will be lost.
  - You are about to drop the column `total_amount` on the `quotations` table. All the data in the column will be lost.
  - You are about to drop the `email_config` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `lab_test_name` to the `quotation_items` table without a default value. This is not possible if the table is not empty.
  - Added the required column `title` to the `quotations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `total_price` to the `quotations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `valid_until` to the `quotations` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
ALTER TYPE "QuotationStatus" ADD VALUE 'CANCELLED';

-- AlterTable
ALTER TABLE "quotation_items" ADD COLUMN     "lab_test_code" TEXT,
ADD COLUMN     "lab_test_name" TEXT NOT NULL,
ADD COLUMN     "position" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "test_code" TEXT;

-- AlterTable
ALTER TABLE "quotations" DROP COLUMN "client_email",
DROP COLUMN "client_name",
DROP COLUMN "client_phone",
DROP COLUMN "total_amount",
ADD COLUMN     "client_reference" TEXT,
ADD COLUMN     "sent_at" TIMESTAMP(3),
ADD COLUMN     "title" TEXT NOT NULL,
ADD COLUMN     "total_price" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "valid_until" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true;

-- DropTable
DROP TABLE "email_config";

-- CreateTable
CREATE TABLE "email_logs" (
    "id" TEXT NOT NULL,
    "to_email" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "status" "EmailStatus" NOT NULL DEFAULT 'SENT',
    "source" TEXT NOT NULL DEFAULT 'system',
    "error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_logs_pkey" PRIMARY KEY ("id")
);
