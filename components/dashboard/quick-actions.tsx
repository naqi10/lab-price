import Link from "next/link";
import { Upload, FilePlus, GitCompare, ArrowRight } from "lucide-react";

const actions = [
  {
    label: "Importer une liste de prix",
    description: "Ajouter les tarifs d'un laboratoire",
    href: "/laboratories",
    icon: Upload,
    primary: true,
  },
  {
    label: "Créer une estimation",
    description: "Générer une estimation pour un client",
    href: "/comparison",
    icon: FilePlus,
    primary: true,
  },
  {
    label: "Gérer les correspondances",
    description: "Lier les noms de tests entre labs",
    href: "/tests",
    icon: GitCompare,
    primary: false,
  },
];

export default function QuickActions() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {actions.map((action) => (
        <Link
          key={action.href}
          href={action.href}
          className="group flex items-center gap-3 rounded-xl border border-border/50 bg-card px-4 py-3.5 hover:border-border hover:bg-accent/40 transition-all duration-150"
        >
          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border transition-colors ${
            action.primary
              ? "bg-primary/10 border-primary/20 text-primary group-hover:bg-primary/20"
              : "bg-muted/30 border-border/50 text-muted-foreground group-hover:text-foreground"
          }`}>
            <action.icon className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium leading-tight truncate">{action.label}</p>
            <p className="text-xs text-muted-foreground mt-0.5 truncate">{action.description}</p>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground/50 shrink-0 group-hover:text-muted-foreground group-hover:translate-x-0.5 transition-all" />
        </Link>
      ))}
    </div>
  );
}
