import { z } from "zod";

/**
 * Laboratory creation / update validation schema.
 */
export const laboratorySchema = z.object({
  name: z
    .string()
    .min(2, "Le nom du laboratoire doit contenir au moins 2 caractères")
    .max(200, "Le nom du laboratoire ne peut pas dépasser 200 caractères"),
  code: z
    .string()
    .min(2, "Le code doit contenir au moins 2 caractères")
    .max(20, "Le code ne peut pas dépasser 20 caractères")
    .regex(
      /^[A-Z0-9_-]+$/,
      "Le code ne peut contenir que des lettres majuscules, chiffres, tirets et underscores"
    ),
  address: z
    .string()
    .max(500, "L'adresse ne peut pas dépasser 500 caractères")
    .optional()
    .nullable(),
  city: z
    .string()
    .max(100, "La ville ne peut pas dépasser 100 caractères")
    .optional()
    .nullable(),
  phone: z
    .string()
    .max(20, "Le numéro de téléphone ne peut pas dépasser 20 caractères")
    .regex(
      /^[+]?[\d\s()-]*$/,
      "Format de numéro de téléphone invalide"
    )
    .optional()
    .nullable(),
  email: z
    .string()
    .email("Format d'email invalide")
    .optional()
    .nullable(),
  contactName: z
    .string()
    .max(200, "Le nom du contact ne peut pas dépasser 200 caractères")
    .optional()
    .nullable(),
});

export type LaboratoryInput = z.infer<typeof laboratorySchema>;

/**
 * Price list file upload validation schema.
 *
 * Validates the metadata submitted alongside the uploaded file.
 * The file itself is validated separately (size, type) in the upload handler.
 */
export const priceListUploadSchema = z.object({
  laboratoryId: z
    .string()
    .min(1, "Le laboratoire est requis"),
  name: z
    .string()
    .min(2, "Le nom de la liste doit contenir au moins 2 caractères")
    .max(200, "Le nom de la liste ne peut pas dépasser 200 caractères"),
  effectiveDate: z
    .string()
    .or(z.date())
    .transform((val) => (typeof val === "string" ? new Date(val) : val))
    .refine((date) => !isNaN(date.getTime()), "Date invalide"),
  fileType: z.enum(["EXCEL", "PDF"], {
    message: "Le type de fichier doit être EXCEL ou PDF",
  }),
  setAsActive: z.boolean().default(false),
});

export type PriceListUploadInput = z.infer<typeof priceListUploadSchema>;
