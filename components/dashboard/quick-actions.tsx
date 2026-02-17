import Link from "next/link";
import { Upload, FilePlus, GitCompare } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

const actions = [
  {
    label: "Importer une liste de prix",
    href: "/laboratories",
    icon: Upload,
    variant: "default" as const,
  },
  {
    label: "Créer un devis",
    href: "/quotations/new",
    icon: FilePlus,
    variant: "default" as const,
  },
  {
    label: "Gérer les correspondances",
    href: "/tests",
    icon: GitCompare,
    variant: "outline" as const,
  },
];

export default function QuickActions() {
  return (
    <div className="flex flex-wrap gap-3">
      {actions.map((action) => (
        <Link key={action.href} href={action.href} className={buttonVariants({ variant: action.variant })}>
          <action.icon className="h-4 w-4 mr-2" />
          {action.label}
        </Link>
      ))}
    </div>
  );
}
