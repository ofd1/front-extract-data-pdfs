import { FileText, X } from "lucide-react";

interface FileListProps {
  files: File[];
  onRemove: (index: number) => void;
}

export default function FileList({ files, onRemove }: FileListProps) {
  if (!files.length) return null;

  return (
    <div className="space-y-1 mt-4">
      <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-text-muted mb-2">
        {files.length} arquivo{files.length > 1 ? "s" : ""} selecionado{files.length > 1 ? "s" : ""}
      </p>
      {files.map((file, i) => (
        <div
          key={`${file.name}-${i}`}
          className="flex items-center justify-between py-2 px-3 border border-border bg-surface group hover:bg-bg-secondary/50 transition-colors"
        >
          <div className="flex items-center gap-3 min-w-0">
            <FileText size={16} className="text-text-muted shrink-0" />
            <span className="text-sm text-text-primary truncate">{file.name}</span>
            <span className="text-[11px] text-text-muted shrink-0">
              {(file.size / 1024).toFixed(0)} KB
            </span>
          </div>
          <button
            onClick={() => onRemove(i)}
            className="text-text-muted hover:text-error transition-colors opacity-0 group-hover:opacity-100"
            aria-label="Remover arquivo"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
