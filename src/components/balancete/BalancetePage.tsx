import { useState, useRef, useCallback, useEffect } from "react";
import { CheckCircle, AlertCircle, Download, RotateCcw, ArrowLeft, Loader2 } from "lucide-react";
import type { BalanceteState } from "../../types";
import { startExtraction, pollJobStatus, downloadResult } from "../../api/balancete";
import DropZone from "../shared/DropZone";
import FileList from "../shared/FileList";

interface BalancetePageProps {
  onBack: () => void;
}

export default function BalancetePage({ onBack }: BalancetePageProps) {
  const [state, setState] = useState<BalanceteState>("upload");
  const [files, setFiles] = useState<File[]>([]);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const blobRef = useRef<Blob | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const jobIdRef = useRef<string | null>(null);

  const clearPolling = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  useEffect(() => () => clearPolling(), []);

  const handleExtract = useCallback(async () => {
    if (!files.length) return;
    setState("processing");
    setProgress(0);
    setMessage("Enviando arquivos...");

    try {
      const jobId = await startExtraction(files);
      jobIdRef.current = jobId;

      intervalRef.current = setInterval(async () => {
        try {
          const status = await pollJobStatus(jobId);
          setProgress(status.progress);
          setMessage(status.message);

          if (status.status === "done") {
            clearPolling();
            const blob = await downloadResult(jobId);
            blobRef.current = blob;
            setState("done");
          } else if (status.status === "error") {
            clearPolling();
            setErrorMsg(status.error || "Erro desconhecido");
            setState("error");
          }
        } catch {
          // Polling failure is not fatal — retries on next cycle
        }
      }, 3000);
    } catch (err) {
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
    clearPolling();
    setState("upload");
    setFiles([]);
    setProgress(0);
    setMessage("");
    setErrorMsg("");
    blobRef.current = null;
    jobIdRef.current = null;
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
            <p className="text-base text-text-primary font-medium">{message}</p>
            <div className="mt-4 mx-auto max-w-xs">
              <div className="w-full bg-bg-secondary rounded-full h-2 overflow-hidden">
                <div
                  className="bg-accent h-2 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${Math.round(progress * 100)}%` }}
                />
              </div>
              <p className="text-sm text-text-muted mt-2">{Math.round(progress * 100)}%</p>
            </div>
            <p className="text-sm text-text-muted mt-3">
              Não feche esta página.
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
