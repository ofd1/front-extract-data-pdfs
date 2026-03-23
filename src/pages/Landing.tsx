import { Table2, Newspaper } from "lucide-react";
import type { ActivePage } from "../types";

interface LandingProps {
  onSelect: (page: ActivePage) => void;
}

const cards = [
  {
    page: "balancete" as ActivePage,
    icon: Table2,
    title: "Balancetes",
    description: "Envie PDFs de balancetes contábeis e receba um Excel consolidado",
  },
  {
    page: "jornal" as ActivePage,
    icon: Newspaper,
    title: "Jornais",
    description: "Extraia dados de demonstrações financeiras publicadas em jornais",
  },
];

export default function Landing({ onSelect }: LandingProps) {
  return (
    <section className="animate-fade-in max-w-5xl mx-auto px-6 md:px-12 py-24">
      <div className="mb-16">
        <h1 className="font-editorial text-4xl md:text-5xl text-text-primary tracking-tight leading-tight" style={{ letterSpacing: "-0.02em" }}>
          Extraia dados de<br />seus documentos
        </h1>
        <p className="mt-4 text-text-secondary text-base md:text-lg max-w-lg">
          Selecione o tipo de documento para iniciar
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {cards.map((card) => (
          <button
            key={card.page}
            onClick={() => onSelect(card.page)}
            className="card text-left p-8 md:p-10 group hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
          >
            <div className="flex items-start justify-between mb-6">
              <card.icon size={28} className="text-accent" strokeWidth={1.5} />
              <span className="text-[10px] font-medium uppercase tracking-[0.1em] text-success bg-success-light px-2 py-0.5">
                Disponível
              </span>
            </div>
            <h2 className="font-editorial text-2xl text-text-primary mb-2 group-hover:text-accent transition-colors">
              {card.title}
            </h2>
            <p className="text-sm text-text-secondary leading-relaxed">
              {card.description}
            </p>
          </button>
        ))}
      </div>
    </section>
  );
}
