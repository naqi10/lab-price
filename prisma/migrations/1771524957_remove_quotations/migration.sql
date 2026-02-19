-- Update any QUOTATION templates to GENERAL before removing the enum value
UPDATE "email_templates" SET "type" = 'GENERAL' WHERE "type"::text = 'QUOTATION';

-- Drop quotation-related tables
DROP TABLE IF EXISTS "quotation_emails" CASCADE;
DROP TABLE IF EXISTS "quotation_items" CASCADE;
DROP TABLE IF EXISTS "quotations" CASCADE;

-- Drop QuotationStatus enum if it exists
DROP TYPE IF EXISTS "QuotationStatus" CASCADE;

-- Update EmailTemplateType enum to remove QUOTATION value
-- Create new enum without QUOTATION
CREATE TYPE "EmailTemplateType_new" AS ENUM ('COMPARISON', 'GENERAL');
ALTER TABLE "email_templates" ALTER COLUMN "type" TYPE "EmailTemplateType_new" USING "type"::text::"EmailTemplateType_new";
DROP TYPE "EmailTemplateType";
ALTER TYPE "EmailTemplateType_new" RENAME TO "EmailTemplateType";
