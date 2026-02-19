-- CreateTable
CREATE TABLE "estimate_emails" (
    "id" TEXT NOT NULL,
    "estimate_id" TEXT NOT NULL,
    "sent_by_id" TEXT NOT NULL,
    "to_email" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "message" TEXT,
    "status" "EmailStatus" NOT NULL DEFAULT 'PENDING',
    "sent_at" TIMESTAMP(3),
    "error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "estimate_emails_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "estimate_emails" ADD CONSTRAINT "estimate_emails_estimate_id_fkey" FOREIGN KEY ("estimate_id") REFERENCES "estimates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "estimate_emails" ADD CONSTRAINT "estimate_emails_sent_by_id_fkey" FOREIGN KEY ("sent_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
