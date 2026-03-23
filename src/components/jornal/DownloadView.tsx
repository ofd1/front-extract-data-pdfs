import { CheckCircle, Download, RotateCcw } from "lucide-react";
import type { Company, PdfFile } from "../../types";
import { getDownloadUrl } from "../../api/jornal";

interface DownloadViewProps {
  jobId: string;
  companies: Company[];
  pdfFiles: PdfFile[];
  onReset: () => void;
}

export default function DownloadView({ jobId, companies, pdfFiles, onReset }: DownloadViewProps) {
  const totalCrops = companies.reduce((sum, c) => sum + c.crops.length, 0);

  return (
    <div className="animate-slide-up text-center py-16">
      <CheckCircle size={48} className="text-success mx-auto mb-6" strokeWidth={1.5} />
      <h2 className="font-editorial text-3xl text-text-primary mb-2">Tudo pronto!</h2>
      <p className="text-sm text-text-secondary mb-10">Seus dados foram extraídos com sucesso</p>

      <div className="flex items-center justify-center gap-8 mb-10">
        <div className="text-center">
          <p className="text-2xl font-medium text-text-primary tabular-nums">{companies.length}</p>
          <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-text-muted mt-1">
            Empresa{companies.length > 1 ? "s" : ""}
          </p>
        </div>
        <div className="w-px h-10 bg-border" />
        <div className="text-center">
          <p className="text-2xl font-medium text-text-primary tabular-nums">{totalCrops}</p>
          <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-text-muted mt-1">
            Recorte{totalCrops > 1 ? "s" : ""}
          </p>
        </div>
        <div className="w-px h-10 bg-border" />
        <div className="text-center">
          <p className="text-2xl font-medium text-text-primary tabular-nums">{pdfFiles.length}</p>
          <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-text-muted mt-1">
            PDF{pdfFiles.length > 1 ? "s" : ""}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-center gap-4">
        <a href={getDownloadUrl(jobId)} className="btn-primary" download>
          <Download size={16} />
          Baixar Excel
        </a>
        <button onClick={onReset} className="btn-secondary">
          <RotateCcw size={16} />
          Nova Extração
        </button>
      </div>
    </div>
  );
}
