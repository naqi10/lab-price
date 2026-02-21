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
      "Cholestérol total",
      "HDL-Cholestérol",
      "LDL-Cholestérol",
      "Triglycérides",
    ],
    customRate: 150,
  },
  {
    id: "bilan-hepatique",
    dealName: "Bilan Hépatique",
    description: "Évaluation de la fonction hépatique",
    category: "Biochimie",
    icon: "\u{1FAC1}",
    canonicalNames: [
      "ASAT (TGO)",
      "ALAT (TGP)",
      "Gamma GT",
      "Bilirubine totale",
    ],
    customRate: 130,
  },
  {
    id: "bilan-renal",
    dealName: "Bilan Rénal",
    description: "Exploration de la fonction rénale",
    category: "Biochimie",
    icon: "\u{1FAC0}",
    canonicalNames: ["Créatinine", "Urée", "Acide urique"],
    customRate: 80,
  },
  {
    id: "bilan-thyroidien",
    dealName: "Bilan Thyroïdien",
    description: "Exploration complète de la thyroïde",
    category: "Hormonologie",
    icon: "\u{1F9EC}",
    canonicalNames: ["TSH", "T3 libre", "T4 libre"],
    customRate: 230,
  },
  {
    id: "bilan-prenatal",
    dealName: "Bilan Prénatal",
    description: "Bilan de suivi de grossesse",
    category: "Mixte",
    icon: "\u{1F930}",
    canonicalNames: [
      "Groupage sanguin",
      "NFS",
      "Sérologie Toxoplasmose",
      "Sérologie Rubéole",
      "Sérologie HIV",
    ],
    customRate: 380,
  },
];
