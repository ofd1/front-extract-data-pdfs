import { ArrowLeft } from "lucide-react";
import type { ActivePage } from "../../types";

interface HeaderProps {
  activePage: ActivePage;
  onNavigateHome: () => void;
}

export default function Header({ activePage, onNavigateHome }: HeaderProps) {
  const pageLabel: Record<string, string> = {
    balancete: "Balancetes",
    jornal: "Jornais",
  };

  return (
    <header className="border-b border-border bg-surface/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-6 md:px-12 h-16 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {activePage !== "landing" && (
            <button
              onClick={onNavigateHome}
              className="text-text-secondary hover:text-text-primary transition-colors"
              aria-label="Voltar"
            >
              <ArrowLeft size={20} />
            </button>
          )}
          <button
            onClick={onNavigateHome}
            className="font-editorial text-xl tracking-tight text-text-primary hover:text-accent transition-colors"
          >
            AF Extrator
          </button>
        </div>

        {activePage !== "landing" && (
          <span className="text-[11px] font-medium uppercase tracking-[0.1em] text-text-muted">
            {pageLabel[activePage]}
          </span>
        )}
      </div>
    </header>
  );
}
