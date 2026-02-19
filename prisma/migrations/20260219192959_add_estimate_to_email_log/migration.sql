-- AlterTable
ALTER TABLE "email_logs" ADD COLUMN     "estimate_id" TEXT;

-- AddForeignKey
ALTER TABLE "email_logs" ADD CONSTRAINT "email_logs_estimate_id_fkey" FOREIGN KEY ("estimate_id") REFERENCES "estimates"("id") ON DELETE CASCADE ON UPDATE CASCADE;
