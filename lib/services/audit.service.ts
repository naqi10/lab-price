import { Prisma } from "@/app/generated/prisma";
import prisma from "@/lib/db";
import logger from "@/lib/logger";

export type AuditAction = "CREATE" | "UPDATE" | "DELETE";

export type AuditEntity =
  | "laboratory"
  | "price_list"
  | "test"
  | "test_mapping"
  | "test_mapping_entry"
  | "quotation"
  | "customer"
  | "user"
  | "email_settings"
  | "email_template"
  | "comparison_draft"
  | "estimate"
  | "bundle_deal";

/**
 * Create an audit log entry.
 *
 * Fire-and-forget: errors are logged but never thrown,
 * so audit logging never breaks the main business flow.
 */
export async function logAudit(params: {
  userId: string;
  action: AuditAction;
  entity: AuditEntity;
  entityId?: string | null;
  details?: Record<string, unknown> | null;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: params.userId,
        action: params.action,
        entity: params.entity,
        entityId: params.entityId ?? null,
        details: (params.details ?? undefined) as Prisma.InputJsonValue | undefined,
      },
    });
  } catch (err) {
    logger.error({ err }, "Failed to write audit log");
  }
}
