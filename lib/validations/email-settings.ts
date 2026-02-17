import { z } from "zod";

/**
 * Email settings validation schema.
 *
 * Used when saving SMTP / Brevo API configuration
 * from the Settings page.
 */
export const emailSettingsSchema = z
  .object({
    mode: z.enum(["API", "SMTP"], {
      message: "Le mode doit être API ou SMTP",
    }),

    // SMTP fields (required when mode is SMTP)
    smtpHost: z
      .string()
      .max(255, "L'hôte SMTP ne peut pas dépasser 255 caractères")
      .optional()
      .nullable(),
    smtpPort: z
      .number()
      .int("Le port doit être un entier")
      .min(1, "Le port doit être supérieur à 0")
      .max(65535, "Le port ne peut pas dépasser 65535")
      .optional()
      .nullable(),
    smtpUser: z
      .string()
      .max(255, "L'utilisateur SMTP ne peut pas dépasser 255 caractères")
      .optional()
      .nullable(),
    smtpPass: z
      .string()
      .max(500, "Le mot de passe SMTP ne peut pas dépasser 500 caractères")
      .optional()
      .nullable(),

    // Brevo API fields (required when mode is API)
    apiKey: z
      .string()
      .max(500, "La clé API ne peut pas dépasser 500 caractères")
      .optional()
      .nullable(),

    // Common fields
    fromEmail: z
      .string()
      .email("Format d'email invalide")
      .max(255, "L'email ne peut pas dépasser 255 caractères")
      .optional()
      .nullable(),
    fromName: z
      .string()
      .max(255, "Le nom d'expéditeur ne peut pas dépasser 255 caractères")
      .optional()
      .nullable(),
    companyLogoUrl: z
      .string()
      .url("L'URL du logo doit être une URL valide")
      .max(1000, "L'URL du logo ne peut pas dépasser 1000 caractères")
      .optional()
      .nullable()
      .or(z.literal("")),
    signatureHtml: z
      .string()
      .max(10000, "La signature ne peut pas dépasser 10000 caractères")
      .optional()
      .nullable(),
  })
  .superRefine((data, ctx) => {
    if (data.mode === "SMTP") {
      if (!data.smtpHost) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "L'hôte SMTP est requis en mode SMTP",
          path: ["smtpHost"],
        });
      }
      if (!data.smtpUser) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "L'utilisateur SMTP est requis en mode SMTP",
          path: ["smtpUser"],
        });
      }
      if (!data.smtpPass) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Le mot de passe SMTP est requis en mode SMTP",
          path: ["smtpPass"],
        });
      }
    }

    if (data.mode === "API") {
      if (!data.apiKey) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "La clé API est requise en mode API",
          path: ["apiKey"],
        });
      }
    }
  });

export type EmailSettingsInput = z.infer<typeof emailSettingsSchema>;

/**
 * Test email validation schema.
 *
 * Used when sending a test email from the Settings page.
 */
export const testEmailSchema = z.object({
  to: z
    .string()
    .min(1, "L'adresse email est requise")
    .email("Format d'email invalide"),
});

export type TestEmailInput = z.infer<typeof testEmailSchema>;
