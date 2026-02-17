import { z } from "zod";

export const customerSchema = z.object({
  name: z
    .string()
    .min(2, "Le nom doit contenir au moins 2 caractères")
    .max(200, "Le nom ne peut pas dépasser 200 caractères"),
  email: z
    .string()
    .email("Format d'email invalide"),
  phone: z
    .string()
    .max(20, "Le numéro ne peut pas dépasser 20 caractères")
    .regex(/^[+]?[\d\s()-]*$/, "Format de numéro invalide")
    .optional()
    .nullable(),
  company: z
    .string()
    .max(200, "Le nom de l'entreprise ne peut pas dépasser 200 caractères")
    .optional()
    .nullable(),
});

export type CustomerInput = z.infer<typeof customerSchema>;
