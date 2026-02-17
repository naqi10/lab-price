import { z } from "zod";

/**
 * Quotation creation validation schema.
 *
 * A quotation is the result of a price comparison:
 * it references the selected laboratory, the list of tests,
 * and the total price.
 */
export const quotationSchema = z.object({
  /** Display title for the quotation */
  title: z
    .string()
    .min(2, "Le titre doit contenir au moins 2 caractères")
    .max(300, "Le titre ne peut pas dépasser 300 caractères"),
  /** ID of the laboratory selected for this quotation */
  laboratoryId: z
    .string()
    .min(1, "Le laboratoire est requis"),
  /** IDs of the test mappings included in the comparison */
  testMappingIds: z
    .array(z.string().min(1))
    .min(1, "Au moins un test doit être sélectionné"),
  /** Optional client name */
  clientName: z
    .string()
    .max(200, "Le nom du client ne peut pas dépasser 200 caractères")
    .optional()
    .nullable(),
  /** Optional client email */
  clientEmail: z
    .string()
    .email("Format d'email invalide")
    .max(200, "L'email ne peut pas dépasser 200 caractères")
    .optional()
    .nullable(),
  /** Tax rate in percent (0 = no tax) */
  taxRate: z
    .number()
    .min(0, "Le taux de TVA ne peut pas être négatif")
    .max(100, "Le taux de TVA ne peut pas dépasser 100 %")
    .default(20),
  /** Optional patient or client reference */
  clientReference: z
    .string()
    .max(200, "La référence client ne peut pas dépasser 200 caractères")
    .optional()
    .nullable(),
  /** Optional notes / remarks */
  notes: z
    .string()
    .max(2000, "Les notes ne peuvent pas dépasser 2000 caractères")
    .optional()
    .nullable(),
  /** Validity period in days (default: 30) */
  validityDays: z
    .number()
    .int()
    .min(1, "La durée de validité doit être d'au moins 1 jour")
    .max(365, "La durée de validité ne peut pas dépasser 365 jours")
    .default(30),
});

export type QuotationInput = z.infer<typeof quotationSchema>;

/**
 * Email sending validation schema.
 *
 * Used when sending a quotation PDF via email.
 */
export const emailSchema = z.object({
  /** Quotation ID to attach as PDF */
  quotationId: z
    .string()
    .min(1, "L'identifiant du devis est requis"),
  /** Recipient email addresses */
  to: z
    .array(
      z.string().email("Format d'email invalide")
    )
    .min(1, "Au moins un destinataire est requis")
    .max(10, "Maximum 10 destinataires"),
  /** Optional CC addresses */
  cc: z
    .array(z.string().email("Format d'email invalide"))
    .max(10, "Maximum 10 destinataires en copie")
    .optional()
    .default([]),
  /** Email subject line */
  subject: z
    .string()
    .min(1, "L'objet est requis")
    .max(200, "L'objet ne peut pas dépasser 200 caractères"),
  /** Email body message (plain text or HTML) */
  message: z
    .string()
    .max(5000, "Le message ne peut pas dépasser 5000 caractères")
    .optional()
    .default(""),
});

export type EmailInput = z.infer<typeof emailSchema>;
