export interface ComponentTest {
  id: string;
  name: string;
  code: string | null;
  tubeType: string | null;
  turnaroundTime: string | null;
}

export interface Bundle {
  id: string;
  dealName: string;
  description: string;
  category: string;
  canonicalNames: string[];
  componentTests?: ComponentTest[];
  customRate: number;
  icon: string;
  popular?: boolean;
  testMappingIds?: string[];
  profileCode?: string | null;
  profileTube?: string | null;
  profileTurnaround?: string | null;
  profileNotes?: string | null;
}

/** Category → Tailwind color tokens used by the card UI. */
export const CATEGORY_COLORS: Record<string, { gradient: string; badge: string; accent: string }> = {
  Biochimie: {
    gradient: "from-blue-500/20 via-blue-500/5 to-transparent",
    badge: "bg-blue-100 text-blue-700 border-blue-300",
    accent: "bg-blue-500",
  },
  Hormonologie: {
    gradient: "from-purple-500/20 via-purple-500/5 to-transparent",
    badge: "bg-purple-100 text-purple-700 border-purple-300",
    accent: "bg-purple-500",
  },
  Hématologie: {
    gradient: "from-red-500/20 via-red-500/5 to-transparent",
    badge: "bg-red-100 text-red-700 border-red-300",
    accent: "bg-red-500",
  },
  Immunologie: {
    gradient: "from-orange-500/20 via-orange-500/5 to-transparent",
    badge: "bg-orange-100 text-orange-700 border-orange-300",
    accent: "bg-orange-500",
  },
  Microbiologie: {
    gradient: "from-green-500/20 via-green-500/5 to-transparent",
    badge: "bg-green-100 text-green-700 border-green-300",
    accent: "bg-green-500",
  },
  Mixte: {
    gradient: "from-teal-500/20 via-teal-500/5 to-transparent",
    badge: "bg-teal-100 text-teal-700 border-teal-300",
    accent: "bg-teal-500",
  },
  Coagulation: {
    gradient: "from-rose-500/20 via-rose-500/5 to-transparent",
    badge: "bg-rose-100 text-rose-700 border-rose-300",
    accent: "bg-rose-500",
  },
  Oncologie: {
    gradient: "from-violet-500/20 via-violet-500/5 to-transparent",
    badge: "bg-violet-100 text-violet-700 border-violet-300",
    accent: "bg-violet-500",
  },
  Métabolisme: {
    gradient: "from-amber-500/20 via-amber-500/5 to-transparent",
    badge: "bg-amber-100 text-amber-700 border-amber-300",
    accent: "bg-amber-500",
  },
  Hormones: {
    gradient: "from-purple-500/20 via-purple-500/5 to-transparent",
    badge: "bg-purple-100 text-purple-700 border-purple-300",
    accent: "bg-purple-500",
  },
};

export const DEFAULT_CATEGORY_COLOR = {
  gradient: "from-gray-500/20 via-gray-500/5 to-transparent",
  badge: "bg-gray-100 text-gray-700 border-gray-300",
  accent: "bg-gray-500",
};
