import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import type { PdfFile, Company } from "../../types";

interface CompanySetupProps {
  pdfFiles: PdfFile[];
  onDone: (companies: Company[]) => void;
  onBack: () => void;
}

function genId() {
  return Math.random().toString(36).slice(2, 10);
}

export default function CompanySetup({ pdfFiles, onDone, onBack }: CompanySetupProps) {
  const [mode, setMode] = useState<"single" | "multiple">("single");
  const [singleName, setSingleName] = useState("");
  const [companies, setCompanies] = useState<{ id: string; name: string; selectedPdfs: string[] }[]>([
    { id: genId(), name: "", selectedPdfs: pdfFiles.map((p) => p.filename) },
  ]);

  const handleSubmit = () => {
    if (mode === "single") {
      if (!singleName.trim()) return;
      onDone([{
        id: genId(),
        name: singleName.trim(),
        pdfFilenames: pdfFiles.map((p) => p.filename),
        crops: [],
      }]);
    } else {
      const valid = companies.filter((c) => c.name.trim() && c.selectedPdfs.length > 0);
      if (!valid.length) return;
      onDone(valid.map((c) => ({
        id: c.id,
        name: c.name.trim(),
        pdfFilenames: c.selectedPdfs,
        crops: [],
      })));
    }
  };

  const addCompany = () => {
    setCompanies((prev) => [...prev, { id: genId(), name: "", selectedPdfs: [] }]);
  };

  const removeCompany = (id: string) => {
    setCompanies((prev) => prev.filter((c) => c.id !== id));
  };

  const updateCompany = (id: string, field: "name" | "selectedPdfs", value: string | string[]) => {
    setCompanies((prev) => prev.map((c) => c.id === id ? { ...c, [field]: value } : c));
  };

  const togglePdf = (companyId: string, filename: string) => {
    setCompanies((prev) => prev.map((c) => {
      if (c.id !== companyId) return c;
      const has = c.selectedPdfs.includes(filename);
      return { ...c, selectedPdfs: has ? c.selectedPdfs.filter((f) => f !== filename) : [...c.selectedPdfs, filename] };
    }));
  };

  const isValid = mode === "single"
    ? singleName.trim().length > 0
    : companies.some((c) => c.name.trim() && c.selectedPdfs.length > 0);

  return (
    <div className="animate-slide-up max-w-2xl">
      <div className="flex gap-3 mb-8">
        <button
          onClick={() => setMode("single")}
          className={`px-4 py-2 text-sm font-medium border transition-colors ${
            mode === "single"
              ? "border-accent bg-accent text-white"
              : "border-border-strong text-text-secondary hover:bg-bg-secondary"
          }`}
        >
          Uma empresa
        </button>
        <button
          onClick={() => setMode("multiple")}
          className={`px-4 py-2 text-sm font-medium border transition-colors ${
            mode === "multiple"
              ? "border-accent bg-accent text-white"
              : "border-border-strong text-text-secondary hover:bg-bg-secondary"
          }`}
        >
          Múltiplas empresas
        </button>
      </div>

      {mode === "single" ? (
        <div className="space-y-4">
          <div>
            <label className="text-[11px] font-medium uppercase tracking-[0.1em] text-text-muted block mb-2">
              Nome da empresa
            </label>
            <input
              type="text"
              value={singleName}
              onChange={(e) => setSingleName(e.target.value)}
              placeholder="Ex: Empresa ABC Ltda"
              className="w-full px-4 py-3 border border-border-strong bg-surface text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors"
            />
          </div>
          <p className="text-xs text-text-muted">
            Todos os {pdfFiles.length} PDFs serão associados a esta empresa
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {companies.map((company, idx) => (
            <div key={company.id} className="card p-6 space-y-4">
              <div className="flex items-start justify-between">
                <label className="text-[11px] font-medium uppercase tracking-[0.1em] text-text-muted">
                  Empresa {idx + 1}
                </label>
                {companies.length > 1 && (
                  <button onClick={() => removeCompany(company.id)} className="text-text-muted hover:text-error transition-colors">
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
              <input
                type="text"
                value={company.name}
                onChange={(e) => updateCompany(company.id, "name", e.target.value)}
                placeholder="Nome da empresa"
                className="w-full px-4 py-3 border border-border-strong bg-surface text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors"
              />
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-text-muted mb-2">
                  PDFs associados
                </p>
                <div className="space-y-1">
                  {pdfFiles.map((pdf) => (
                    <label key={pdf.filename} className="flex items-center gap-3 py-1.5 px-3 hover:bg-bg-secondary/50 transition-colors cursor-pointer text-sm">
                      <input
                        type="checkbox"
                        checked={company.selectedPdfs.includes(pdf.filename)}
                        onChange={() => togglePdf(company.id, pdf.filename)}
                        className="accent-accent"
                      />
                      <span className="truncate text-text-primary">{pdf.filename}</span>
                      <span className="text-[11px] text-text-muted ml-auto shrink-0">{pdf.pageCount} pág.</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          ))}
          <button onClick={addCompany} className="btn-secondary text-sm">
            <Plus size={14} />
            Adicionar empresa
          </button>
        </div>
      )}

      <div className="flex items-center gap-4 mt-8">
        <button onClick={handleSubmit} className="btn-primary" disabled={!isValid}>
          Avançar
        </button>
        <button onClick={onBack} className="btn-secondary">
          Voltar
        </button>
      </div>
    </div>
  );
}
