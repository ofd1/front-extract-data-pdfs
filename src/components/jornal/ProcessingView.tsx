import { useEffect, useRef } from "react";
import { Loader2, FileSearch, Sparkles, Cpu, Table2, AlertCircle, RotateCcw } from "lucide-react";
import type { Company } from "../../types";
import { useProcessing } from "../../hooks/useProcessing";

interface ProcessingViewProps {
  jobId: string;
  companies: Company[];
  onDone: () => void;
  onRetry: () => void;
}

function getIcon(message: string) {
  const lower = message.toLowerCase();
  if (lower.includes("crop") || lower.includes("recort")) return FileSearch;
  if (lower.includes("ia") || lower.includes("inteligência") || lower.includes("analis")) return Sparkles;
  if (lower.includes("classific")) return Cpu;
  if (lower.includes("geran") || lower.includes("planilha") || lower.includes("excel")) return Table2;
  return Loader2;
}

export default function ProcessingView({ jobId, companies, onDone, onRetry }: ProcessingViewProps) {
  const { progress, message, isProcessing, isDone, error, startProcess, reset } = useProcessing();
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    startProcess(jobId, companies);
  }, [jobId, companies, startProcess]);

  useEffect(() => {
    if (isDone) {
      const timer = setTimeout(onDone, 2000);
      return () => clearTimeout(timer);
    }
  }, [isDone, onDone]);

  const Icon = getIcon(message);

  if (error) {
    return (
      <div className="animate-slide-up text-center py-16">
        <AlertCircle size={48} className="text-error mx-auto mb-6" strokeWidth={1.5} />
        <h2 className="font-editorial text-2xl text-text-primary mb-2">Erro no processamento</h2>
        <p className="text-sm text-text-secondary mb-8">{error}</p>
        <button
          onClick={() => { reset(); startedRef.current = false; onRetry(); }}
          className="btn-primary"
        >
          <RotateCcw size={16} />
          Tentar Novamente
        </button>
      </div>
    );
  }

  return (
    <div className="animate-slide-up text-center py-16">
      <div className="relative w-32 h-32 mx-auto mb-8">
        {/* Progress ring */}
        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="52" fill="none" stroke="currentColor" strokeWidth="4" className="text-bg-secondary" />
          <circle
            cx="60" cy="60" r="52" fill="none" stroke="currentColor" strokeWidth="4"
            className="text-accent transition-all duration-500"
            strokeDasharray={`${2 * Math.PI * 52}`}
            strokeDashoffset={`${2 * Math.PI * 52 * (1 - progress / 100)}`}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <Icon size={20} className={`text-accent ${isProcessing && Icon === Loader2 ? "animate-spin" : ""}`} />
          <span className="text-lg font-medium text-text-primary mt-1 tabular-nums">
            {Math.round(progress)}%
          </span>
        </div>
      </div>

      <h2 className="font-editorial text-2xl text-text-primary mb-2">
        {isDone ? "Concluído!" : "Processando..."}
      </h2>
      <p className="text-sm text-text-secondary">{message || "Aguarde..."}</p>
      <p className="text-xs text-text-muted mt-3">
        Cada recorte é analisado via IA para extrair dados financeiros
      </p>
    </div>
  );
}
