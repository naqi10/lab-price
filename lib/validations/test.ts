import { z } from "zod";

/**
 * Test search / filter validation schema.
 *
 * Used when querying available tests across laboratories.
 */
export const testSearchSchema = z.object({
  query: z
    .string()
    .min(1, "Le terme de recherche est requis")
    .max(200, "Le terme de recherche ne peut pas dépasser 200 caractères"),
  laboratoryId: z
    .string()
    .optional()
    .nullable(),
  category: z
    .string()
    .max(100, "La catégorie ne peut pas dépasser 100 caractères")
    .optional()
    .nullable(),
  minPrice: z
    .number()
    .min(0, "Le prix minimum ne peut pas être négatif")
    .optional()
    .nullable(),
  maxPrice: z
    .number()
    .min(0, "Le prix maximum ne peut pas être négatif")
    .optional()
    .nullable(),
  page: z
    .number()
    .int()
    .min(1, "La page doit être au moins 1")
    .default(1),
  pageSize: z
    .number()
    .int()
    .min(1, "La taille de page doit être au moins 1")
    .max(100, "La taille de page ne peut pas dépasser 100")
    .default(20),
});

export type TestSearchInput = z.infer<typeof testSearchSchema>;

/**
 * Test mapping validation schema.
 *
 * A "test mapping" links a canonical / reference test name
 * to the specific test entry in each laboratory's price list,
 * enabling cross-lab comparison even when naming differs.
 */
export const testMappingSchema = z.object({
  canonicalName: z
    .string()
    .min(1, "Le nom canonique du test est requis")
    .max(300, "Le nom du test ne peut pas dépasser 300 caractères"),
  category: z
    .string()
    .max(100, "La catégorie ne peut pas dépasser 100 caractères")
    .optional()
    .nullable(),
  entries: z
    .array(
      z.object({
        laboratoryId: z.string().min(1, "Le laboratoire est requis"),
        localTestName: z.string().min(1, "Le nom du test est requis"),
        matchType: z.enum(["EXACT", "FUZZY", "MANUAL", "NONE"]).default("MANUAL"),
        similarity: z.number().min(0).max(1).default(1),
        price: z.number().min(0).optional().nullable(),
      })
    )
    .min(1, "Au moins une correspondance de laboratoire est requise"),
});

export type TestMappingInput = z.infer<typeof testMappingSchema>;
