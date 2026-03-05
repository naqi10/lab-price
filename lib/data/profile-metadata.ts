/**
 * Lightweight profile metadata extracted from CDL & QC seed data.
 * Used to enrich bundle deal cards with tube type, turnaround, and notes.
 * Source: prisma/seed1.ts — CDL Répertoire des Services 2026
 */

export interface ProfileMeta {
  /** Human-readable tube type label(s) */
  tube: string;
  /** Turnaround time in days (string for ranges like "2-3") */
  turnaroundDays: string;
  /** Special collection/handling notes */
  notes?: string;
}

/** CDL profile code → metadata */
export const CDL_PROFILE_META: Record<string, ProfileMeta> = {
  "URC+":   { tube: "Contenant vert pois + jaune", turnaroundDays: "2", notes: "Le contenant d'urine avec orifice de transfert n'est pas conçu pour le transport." },
  "FA12":   { tube: "Tube doré (SST)", turnaroundDays: "1", notes: "Les suppléments de vitamines peuvent affecter les résultats." },
  "IRN2":   { tube: "Tube doré (SST) + Tube lavande", turnaroundDays: "1" },
  "IRON":   { tube: "Tube doré (SST)", turnaroundDays: "1", notes: "Éviter les suppléments de fer 24 heures avant le prélèvement." },
  "IRN6":   { tube: "Tube doré (SST)", turnaroundDays: "1", notes: "Éviter les suppléments de fer 24 heures avant le prélèvement." },
  "IRN1":   { tube: "Tube doré (SST) + Tube lavande", turnaroundDays: "1" },
  "ANE1":   { tube: "Tube doré (SST) + Tube lavande", turnaroundDays: "1" },
  "ANE4":   { tube: "Tube doré (SST) + Tube lavande", turnaroundDays: "1" },
  "ANE3":   { tube: "Tube doré (SST) + Tube lavande", turnaroundDays: "1", notes: "Les suppléments de vitamines peuvent affecter les résultats." },
  "IRN3":   { tube: "Tube doré (SST) + Tube lavande", turnaroundDays: "1", notes: "Les suppléments de vitamines peuvent affecter les résultats." },
  "B2GP":   { tube: "Tube doré (SST)", turnaroundDays: "9" },
  "DIAB":   { tube: "Tube doré (SST) + Tube lavande", turnaroundDays: "1" },
  "LIV1":   { tube: "Tube doré (SST)", turnaroundDays: "1" },
  "PANC":   { tube: "Tube doré (SST)", turnaroundDays: "1" },
  "REN2":   { tube: "Tube doré (SST)", turnaroundDays: "1" },
  "BIO1":   { tube: "Tube doré (SST)", turnaroundDays: "1" },
  "CHM1":   { tube: "Tube doré (SST)", turnaroundDays: "1" },
  "CHM2":   { tube: "Tube doré (SST)", turnaroundDays: "1" },
  "CHM5":   { tube: "Tube doré (SST)", turnaroundDays: "1" },
  "CHL3":   { tube: "Tube doré (SST)", turnaroundDays: "1" },
  "CHP3":   { tube: "Tube doré (SST) + Tube lavande", turnaroundDays: "1" },
  "BIO3":   { tube: "Tube doré (SST)", turnaroundDays: "1" },
  "CHM4":   { tube: "Tube doré (SST)", turnaroundDays: "1" },
  "CHL4":   { tube: "Tube doré (SST)", turnaroundDays: "1" },
  "BIO4":   { tube: "Tube doré (SST)", turnaroundDays: "1" },
  "CH4U":   { tube: "Tube doré (SST) + Tube lavande", turnaroundDays: "1" },
  "CHP4":   { tube: "Tube doré (SST) + Tube lavande", turnaroundDays: "1" },
  "CHP4T":  { tube: "Tube doré (SST) + Tube lavande", turnaroundDays: "1" },
  "CHP4A":  { tube: "Tube doré (SST) + Tube lavande", turnaroundDays: "1" },
  "COAG":   { tube: "Tube lavande", turnaroundDays: "1" },
  "PTPT":   { tube: "Tube bleu pâle", turnaroundDays: "1" },
  "PAPTHPV":{ tube: "Contenant ThinPrep", turnaroundDays: "6", notes: "Ne pas laisser la brosse à l'intérieur du contenant. Utiliser la requête désignée (RR-10-RQ-010)." },
  "PREN":   { tube: "Tube doré (SST) + Tube lavande + Tube rose", turnaroundDays: "1" },
  "PRENG":  { tube: "Tube doré (SST) + Tube lavande + Tube rose", turnaroundDays: "1" },
  "DAL2":   { tube: "Tube doré (SST) + Tube lavande + Tube rose", turnaroundDays: "2" },
  "DAL2G":  { tube: "Tube doré (SST) + Tube lavande + Tube rose", turnaroundDays: "2" },
  "PANO":   { tube: "Trousse spéciale", turnaroundDays: "10", notes: "Lire les instructions à l'intérieur de la trousse. Remplir et joindre le formulaire de consentement Panorama." },
  "PANOE":  { tube: "Trousse spéciale", turnaroundDays: "10", notes: "Lire les instructions à l'intérieur de la trousse. Remplir et joindre le formulaire de consentement Panorama." },
  "HARMP":  { tube: "Trousse spéciale", turnaroundDays: "10", notes: "Lire les instructions à l'intérieur de la trousse. Remplir et joindre le formulaire de consentement Harmony." },
  "DRUGH":  { tube: "Échantillon de cheveux", turnaroundDays: "6", notes: "Offert au siège social CDL sur rendez-vous seulement, appelez le 514 344-8022, poste 265." },
  "DAU450": { tube: "Trousse spéciale", turnaroundDays: "1" },
  "DAUP":   { tube: "Trousse spéciale", turnaroundDays: "1" },
  "DAUB50": { tube: "Trousse spéciale", turnaroundDays: "1" },
  "ENDPE":  { tube: "Procédure spéciale", turnaroundDays: "5" },
  "ENDV":   { tube: "Procédure spéciale", turnaroundDays: "5" },
  "1TRI":   { tube: "Procédure spéciale", turnaroundDays: "5" },
  "2TRI":   { tube: "Procédure spéciale", turnaroundDays: "3" },
  "3TRI":   { tube: "Procédure spéciale", turnaroundDays: "3" },
  "VIAB":   { tube: "Procédure spéciale", turnaroundDays: "3" },
  "FERT":   { tube: "Tube doré (SST)", turnaroundDays: "1" },
  "MEN1":   { tube: "Tube doré (SST)", turnaroundDays: "1" },
  "MEN3":   { tube: "Tube doré (SST)", turnaroundDays: "1" },
  "MEN2":   { tube: "Tube doré (SST)", turnaroundDays: "1" },
  "MEN4":   { tube: "Tube doré (SST) + Tube rouge", turnaroundDays: "7", notes: "Pour les femmes : ce test doit être effectué 7 jours avant ou après les menstruations." },
  "THY1R":  { tube: "Tube doré (SST)", turnaroundDays: "1" },
  "THY2R":  { tube: "Tube doré (SST)", turnaroundDays: "1" },
  "THY1":   { tube: "Tube doré (SST)", turnaroundDays: "1" },
  "THY3":   { tube: "Tube doré (SST)", turnaroundDays: "1" },
  "THY4":   { tube: "Tube doré (SST)", turnaroundDays: "6" },
  "CH3U":   { tube: "Tube doré (SST) + Tube lavande", turnaroundDays: "1" },
  "CHP1":   { tube: "Tube doré (SST) + Tube lavande", turnaroundDays: "1" },
  "FIN1":   { tube: "Tube doré (SST) + Tube lavande", turnaroundDays: "1" },
  "CHP2":   { tube: "Tube doré (SST) + Tube lavande", turnaroundDays: "1" },
  "CH4SC":  { tube: "Tube doré (SST) + Tube lavande", turnaroundDays: "1" },
  "GN5":    { tube: "Tube doré (SST) + Tube lavande", turnaroundDays: "1" },
  "PNL6":   { tube: "Tube doré (SST) + Tube lavande", turnaroundDays: "1" },
  "CBCS":   { tube: "Tube lavande", turnaroundDays: "1" },
  "MON+":   { tube: "Tube doré (SST) + Tube lavande", turnaroundDays: "1" },
  "CELP":   { tube: "Tube doré (SST)", turnaroundDays: "6", notes: "Le patient ne doit pas suivre une diète sans gluten." },
  "CVRK":   { tube: "Tube doré (SST)", turnaroundDays: "1" },
  "CVK2":   { tube: "Tube doré (SST)", turnaroundDays: "1" },
  "CCL4":   { tube: "Tube doré (SST)", turnaroundDays: "1" },
  "HPBA":   { tube: "Tube doré (SST)", turnaroundDays: "1", notes: "Compléter et joindre le formulaire de consentement RR-05-FM-001." },
  "STD2":   { tube: "Écouvillon + Tube PCR", turnaroundDays: "4" },
  "STDMH":  { tube: "Tube doré (SST) + Tube PCR", turnaroundDays: "2", notes: "Compléter et joindre le formulaire de consentement RR-05-FM-001." },
};

/** Look up profile metadata by code. Works for CDL profiles. */
export function getProfileMeta(profileCode: string | null | undefined): ProfileMeta | null {
  if (!profileCode) return null;
  return CDL_PROFILE_META[profileCode.toUpperCase()] ?? null;
}

/** Map tube label to a CSS color class for visual indicator */
export function getTubeColor(tubeLabel: string): string {
  const t = tubeLabel.toLowerCase();
  if (t.includes("doré") || t.includes("sst") || t.includes("gold")) return "bg-yellow-400";
  if (t.includes("lavande") || t.includes("violet") || t.includes("purple")) return "bg-purple-400";
  if (t.includes("bleu pâle") || t.includes("blue")) return "bg-blue-300";
  if (t.includes("bleu foncé") || t.includes("royal")) return "bg-blue-600";
  if (t.includes("rouge") || t.includes("red")) return "bg-red-500";
  if (t.includes("vert") || t.includes("green")) return "bg-green-400";
  if (t.includes("gris") || t.includes("gray")) return "bg-gray-400";
  if (t.includes("rose") || t.includes("pink")) return "bg-pink-400";
  if (t.includes("trousse") || t.includes("spéciale")) return "bg-orange-400";
  if (t.includes("contenant") || t.includes("écouvillon")) return "bg-teal-400";
  return "bg-slate-400";
}
