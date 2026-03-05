-- AlterTable
ALTER TABLE "bundle_deals" ADD COLUMN     "is_auto_generated" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "profile_code" TEXT,
ADD COLUMN     "profile_price" DOUBLE PRECISION,
ADD COLUMN     "source_lab_code" TEXT;
