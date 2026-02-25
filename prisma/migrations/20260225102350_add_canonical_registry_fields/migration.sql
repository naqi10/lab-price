-- AlterTable
ALTER TABLE "test_mappings" ADD COLUMN     "aliases" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "tests" ADD COLUMN     "test_mapping_entry_id" TEXT;

-- CreateIndex
CREATE INDEX "tests_test_mapping_entry_id_idx" ON "tests"("test_mapping_entry_id");

-- AddForeignKey
ALTER TABLE "tests" ADD CONSTRAINT "tests_test_mapping_entry_id_fkey" FOREIGN KEY ("test_mapping_entry_id") REFERENCES "test_mapping_entries"("id") ON DELETE SET NULL ON UPDATE CASCADE;
