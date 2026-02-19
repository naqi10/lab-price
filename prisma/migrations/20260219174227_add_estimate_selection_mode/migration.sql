-- CreateEnum
CREATE TYPE "EstimateSelectionMode" AS ENUM ('CHEAPEST', 'FASTEST', 'CUSTOM');

-- AlterTable
ALTER TABLE "estimates" ADD COLUMN     "selection_mode" "EstimateSelectionMode";
