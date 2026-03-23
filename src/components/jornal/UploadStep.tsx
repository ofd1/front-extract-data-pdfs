import { useState } from "react";
import { FileSpreadsheet, Loader2 } from "lucide-react";
import type { PdfFile } from "../../types";
import { uploadPdfs, uploadTemplate } from "../../api/jornal";
import { usePdfRenderer } from "../../hooks/usePdfRenderer";
import DropZone from "../shared/DropZone";
import FileList from "../shared/FileList";

interface UploadStepProps {
  onDone: (jobId: string, files: PdfFile[]) => void;
}

export default function UploadStep({ onDone }: UploadStepProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [templateFile, setTemplateFile] = useState<File | null>(null);
  const [showTemplate, setShowTemplate] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");
  const { getPageCount } = usePdfRenderer(null, 1);

  const handleSubmit = async () => {
    if (!files.length) return;
    setIsUploading(true);
    setError("");
    try {
      if (templateFile) {
        await uploadTemplate(templateFile);
      }
      const result = await uploadPdfs(files);

      const pdfFiles: PdfFile[] = await Promise.all(
        files.map(async (file) => {
          const serverFile = result.files.find((f) => f.filename === file.name);
          const pageCount = serverFile?.pages || (await getPageCount(file));
          return { file, filename: file.name, pageCount };
        })
      );

      onDone(result.jobId, pdfFiles);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro no upload");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="animate-slide-up max-w-2xl">
      <DropZone
        accept=".pdf"
        label="Arraste seus PDFs de jornais aqui"
        sublabel="ou clique para selecionar"
        onFiles={(newFiles) => setFiles((prev) => [...prev, ...newFiles])}
      />
      <FileList files={files} onRemove={(i) => setFiles((prev) => prev.filter((_, idx) => idx !== i))} />

      <div className="mt-6">
        <button
          onClick={() => setShowTemplate(!showTemplate)}
          className="text-sm text-text-secondary hover:text-text-primary transition-colors flex items-center gap-2"
        >
          <FileSpreadsheet size={14} />
          {showTemplate ? "Ocultar" : "Planilha padrão (opcional)"}
        </button>

        {showTemplate && (
          <div className="mt-3">
            {templateFile ? (
              <div className="flex items-center gap-3 py-2 px-3 border border-border bg-surface text-sm">
                <FileSpreadsheet size={16} className="text-text-muted" />
                <span className="truncate">{templateFile.name}</span>
                <button
                  onClick={() => setTemplateFile(null)}
                  className="text-text-muted hover:text-error text-xs ml-auto"
                >
                  Remover
                </button>
              </div>
            ) : (
              <DropZone
                accept=".xlsx,.xls"
                multiple={false}
                label="Arraste a planilha padrão"
                sublabel=".xlsx ou .xls"
                onFiles={(f) => setTemplateFile(f[0])}
              />
            )}
          </div>
        )}
      </div>

      {error && (
        <p className="mt-4 text-sm text-error">{error}</p>
      )}

      {files.length > 0 && (
        <div className="mt-8">
          <button onClick={handleSubmit} className="btn-primary" disabled={isUploading}>
            {isUploading && <Loader2 size={16} className="animate-spin" />}
            {isUploading ? "Enviando..." : "Avançar"}
          </button>
        </div>
      )}
    </div>
  );
}
