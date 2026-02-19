-- Add CASCADE delete constraint to EmailLog.customer relationship
ALTER TABLE "email_logs" DROP CONSTRAINT IF EXISTS "email_logs_customer_id_fkey";
ALTER TABLE "email_logs" ADD CONSTRAINT "email_logs_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Add CASCADE delete constraint to Estimate.customer relationship
ALTER TABLE "estimates" DROP CONSTRAINT IF EXISTS "estimates_customer_id_fkey";
ALTER TABLE "estimates" ADD CONSTRAINT "estimates_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
