export interface Bundle {
  id: string;
  dealName: string;
  description: string;
  category: string;
  canonicalNames: string[];
  customRate: number;
  icon: string;
  popular?: boolean;
  testMappingIds?: string[];
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
