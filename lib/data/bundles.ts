export interface Bundle {
  id: string;
  dealName: string;
  description: string;
  category: string;
  canonicalNames: string[];
  customRate: number;
  icon: string;
  popular?: boolean;
}

/** Category → Tailwind color tokens used by the card UI. */
export const CATEGORY_COLORS: Record<string, { gradient: string; badge: string; accent: string }> = {
  Biochimie: {
    gradient: "from-blue-500/20 via-blue-500/5 to-transparent",
    badge: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    accent: "bg-blue-500",
  },
  Hormonologie: {
    gradient: "from-purple-500/20 via-purple-500/5 to-transparent",
    badge: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    accent: "bg-purple-500",
  },
  Mixte: {
    gradient: "from-teal-500/20 via-teal-500/5 to-transparent",
    badge: "bg-teal-500/10 text-teal-400 border-teal-500/20",
    accent: "bg-teal-500",
  },
};

export const DEFAULT_CATEGORY_COLOR = {
  gradient: "from-gray-500/20 via-gray-500/5 to-transparent",
  badge: "bg-gray-500/10 text-gray-400 border-gray-500/20",
  accent: "bg-gray-500",
};

export const BUNDLES: Bundle[] = [
  {
    id: "bilan-lipidique",
    dealName: "Bilan Lipidique",
    description: "Exploration complète du profil lipidique",
    category: "Biochimie",
    icon: "\u{1FA78}",
    popular: true,
    canonicalNames: [
      "CHOLESTÉROL, TOTAL",
      "CHOLESTÉROL HDL",
      "CHOLESTÉROL LDL",
      "TRIGLYCÉRIDES",
    ],
    customRate: 163,
  },
  {
    id: "bilan-hepatique",
    dealName: "Bilan Hépatique",
    description: "Évaluation de la fonction hépatique",
    category: "Biochimie",
    icon: "\u{1FAC1}",
    canonicalNames: [
      "AST (GOT, SGOT)",
      "ALT",
      "GGT",
      "BILIRUBINE, TOTALE",
    ],
    customRate: 155,
  },
  {
    id: "bilan-renal",
    dealName: "Bilan Rénal",
    description: "Exploration de la fonction rénale",
    category: "Biochimie",
    icon: "\u{1FAC0}",
    canonicalNames: [
      "CRÉATININE, SÉRUM",
      "URÉE",
      "ACIDE URIQUE",
    ],
    customRate: 105,
  },
  {
    id: "bilan-thyroidien",
    dealName: "Bilan Thyroïdien",
    description: "Exploration complète de la thyroïde",
    category: "Hormonologie",
    icon: "\u{1F9EC}",
    canonicalNames: [
      "HORMONE DE STIMULATION THYROIDIENNE",
      "T3 LIBRE",
      "T4 LIBRE",
    ],
    customRate: 185,
  },
  {
    id: "bilan-prenatal",
    dealName: "Bilan Prénatal",
    description: "Bilan de suivi de grossesse",
    category: "Mixte",
    icon: "\u{1F930}",
    canonicalNames: [
      "GROUPE SANGUIN & RH",
      "FORMULE SANGUINE COMPLÈTE (FSC)",
      "TOXOPLASMOSE IgG, IgM",
      "RUBÉOLE IGG",
      "VIH (VIRUS DE L\u2019IMMUNODÉFICIENCE HUMAINE)",
    ],
    customRate: 340,
  },
];
