import { z } from "zod";

/**
 * Email template validation schemas.
 *
 * Used for CRUD operations on EmailTemplate records
 * and for rendering template previews.
 */

export const emailTemplateCreateSchema = z.object({
  type: z.enum(["QUOTATION", "COMPARISON", "GENERAL"], {
    message: "Le type doit être QUOTATION, COMPARISON ou GENERAL",
  }),
  name: z
    .string()
    .min(1, "Le nom est requis")
    .max(255, "Le nom ne peut pas dépasser 255 caractères"),
  subject: z
    .string()
    .min(1, "Le sujet est requis")
    .max(500, "Le sujet ne peut pas dépasser 500 caractères"),
  htmlBody: z
    .string()
    .min(1, "Le corps HTML est requis")
    .max(100000, "Le corps HTML ne peut pas dépasser 100 000 caractères"),
  isDefault: z.boolean().optional().default(false),
  variables: z
    .array(
      z.object({
        name: z.string(),
        label: z.string(),
        description: z.string().optional(),
        isHtml: z.boolean().optional(),
        sampleValue: z.string().optional(),
      }),
    )
    .optional()
    .nullable(),
});

export type EmailTemplateCreateInput = z.infer<typeof emailTemplateCreateSchema>;

export const emailTemplateUpdateSchema = z.object({
  type: z
    .enum(["QUOTATION", "COMPARISON", "GENERAL"], {
      message: "Le type doit être QUOTATION, COMPARISON ou GENERAL",
    })
    .optional(),
  name: z
    .string()
    .min(1, "Le nom est requis")
    .max(255, "Le nom ne peut pas dépasser 255 caractères")
    .optional(),
  subject: z
    .string()
    .min(1, "Le sujet est requis")
    .max(500, "Le sujet ne peut pas dépasser 500 caractères")
    .optional(),
  htmlBody: z
    .string()
    .min(1, "Le corps HTML est requis")
    .max(100000, "Le corps HTML ne peut pas dépasser 100 000 caractères")
    .optional(),
  isDefault: z.boolean().optional(),
  variables: z
    .array(
      z.object({
        name: z.string(),
        label: z.string(),
        description: z.string().optional(),
        isHtml: z.boolean().optional(),
        sampleValue: z.string().optional(),
      }),
    )
    .optional()
    .nullable(),
});

export type EmailTemplateUpdateInput = z.infer<typeof emailTemplateUpdateSchema>;

export const emailTemplatePreviewSchema = z.object({
  templateId: z.string().uuid("ID de template invalide").optional(),
  htmlBody: z
    .string()
    .max(100000, "Le corps HTML ne peut pas dépasser 100 000 caractères")
    .optional(),
  subject: z
    .string()
    .max(500, "Le sujet ne peut pas dépasser 500 caractères")
    .optional(),
  type: z
    .enum(["QUOTATION", "COMPARISON", "GENERAL"])
    .optional(),
  variables: z.record(z.string(), z.union([z.string(), z.number(), z.null()])).optional(),
}).refine(
  (data) => data.templateId || data.htmlBody,
  {
    message: "Fournissez soit un templateId, soit un htmlBody pour le rendu",
    path: ["templateId"],
  },
);

export type EmailTemplatePreviewInput = z.infer<typeof emailTemplatePreviewSchema>;
