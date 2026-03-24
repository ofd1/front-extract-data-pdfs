import { useState, useRef, useCallback, useEffect } from "react";
import { CheckCircle, AlertCircle, Download, RotateCcw, ArrowLeft, Loader2 } from "lucide-react";
import type { BalanceteState } from "../../types";
import { extractBalancete } from "../../api/balancete";
import DropZone from "../shared/DropZone";
import FileList from "../shared/FileList";

const ETAPAS = [
  "Enviando arquivos ao servidor...",
  "Extraindo dados via IA — isso pode levar alguns minutos...",
  "Processando páginas e normalizando valores...",
  "Classificando contas contábeis...",
  "Gerando Excel consolidado...",
];

interface BalancetePageProps {
  onBack: () => void;
}

export default function BalancetePage({ onBack }: BalancetePageProps) {
  const [state, setState] = useState<BalanceteState>("upload");
  const [files, setFiles] = useState<File[]>([]);
  const [etapaIndex, setEtapaIndex] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");
  const blobRef = useRef<Blob | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearInterval_ = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  useEffect(() => () => clearInterval_(), []);

  const handleExtract = useCallback(async () => {
    if (!files.length) return;
    setState("processing");
    setEtapaIndex(0);

    intervalRef.current = setInterval(() => {
      setEtapaIndex((prev) => (prev + 1) % ETAPAS.length);
    }, 15000);

    try {
      const blob = await extractBalancete(files);
      clearInterval_();
      blobRef.current = blob;
      setTimeout(() => setState("done"), 400);
    } catch (err) {
      clearInterval_();
      setErrorMsg(err instanceof Error ? err.message : "Erro desconhecido");
      setState("error");
    }
  }, [files]);

  const handleDownload = () => {
    if (!blobRef.current) return;
    const url = URL.createObjectURL(blobRef.current);
    const a = document.createElement("a");
    a.href = url;
    a.download = "balancete_extraido.xlsx";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    setState("upload");
    setFiles([]);
    setEtapaIndex(0);
    setErrorMsg("");
    blobRef.current = null;
  };

  return (
    <section className="animate-fade-in max-w-2xl mx-auto px-6 md:px-8 py-16">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors mb-12"
      >
        <ArrowLeft size={16} />
        Voltar
      </button>

      <div className="mb-12">
        <h1 className="font-editorial text-4xl md:text-5xl text-text-primary tracking-tight" style={{ letterSpacing: "-0.02em" }}>
          Extração de Balancetes
        </h1>
        <p className="mt-3 text-text-secondary text-base md:text-lg">
          Envie PDFs ou ZIPs de balancetes contábeis e receba um Excel consolidado
        </p>
      </div>

      {state === "upload" && (
        <div className="animate-slide-up">
          <DropZone
            accept=".pdf,.zip"
            label="Arraste seus PDFs ou ZIPs aqui"
            sublabel="ou clique para selecionar"
            onFiles={(newFiles) => setFiles((prev) => [...prev, ...newFiles])}
          />
          <FileList files={files} onRemove={(i) => setFiles((prev) => prev.filter((_, idx) => idx !== i))} />
          {files.length > 0 && (
            <div className="mt-8">
              <button onClick={handleExtract} className="btn-primary">
                Extrair Dados
              </button>
            </div>
          )}
        </div>
      )}

      {state === "processing" && (
        <div className="animate-slide-up text-center py-12 space-y-6">
          <Loader2 size={48} className="text-accent animate-spin mx-auto" strokeWidth={1.5} />
          <div>
            <p className="text-base text-text-primary font-medium">{ETAPAS[etapaIndex]}</p>
            <p className="text-sm text-text-muted mt-3">
              Tempo estimado: ~3 minutos por PDF. Não feche esta página.
            </p>
          </div>
        </div>
      )}

      {state === "done" && (
        <div className="animate-slide-up text-center py-12">
          <CheckCircle size={48} className="text-success mx-auto mb-6" strokeWidth={1.5} />
          <h2 className="font-editorial text-2xl text-text-primary mb-2">Extração concluída</h2>
          <p className="text-sm text-text-secondary mb-8">Seu arquivo está pronto para download</p>
          <div className="flex items-center justify-center gap-4">
            <button onClick={handleDownload} className="btn-primary">
              <Download size={16} />
              Baixar Excel
            </button>
            <button onClick={handleReset} className="btn-secondary">
              <RotateCcw size={16} />
              Nova Extração
            </button>
          </div>
        </div>
      )}

      {state === "error" && (
        <div className="animate-slide-up text-center py-12">
          <AlertCircle size={48} className="text-error mx-auto mb-6" strokeWidth={1.5} />
          <h2 className="font-editorial text-2xl text-text-primary mb-2">Erro na extração</h2>
          <p className="text-sm text-text-secondary mb-4">{errorMsg}</p>
          <p className="text-xs text-text-muted mb-8">Se o erro persistir, tente com menos arquivos por vez.</p>
          <button onClick={handleReset} className="btn-primary">
            <RotateCcw size={16} />
            Tentar Novamente
          </button>
        </div>
      )}
    </section>
  );
}
