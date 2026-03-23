import { useState } from "react";
import { ChevronDown, ChevronRight, Trash2, FileText } from "lucide-react";
import type { Company } from "../../types";

interface CropListProps {
  companies: Company[];
  activeCompanyIdx: number;
  selectedCropId: string | null;
  onSelectCompany: (idx: number) => void;
  onSelectCrop: (cropId: string) => void;
  onRemoveCrop: (cropId: string) => void;
}

const CROP_TYPE_COLOR: Record<string, string> = {
  BP: "text-crop-bp",
  DRE: "text-crop-dre",
  DFC: "text-crop-dfc",
};

export default function CropList({
  companies,
  activeCompanyIdx,
  selectedCropId,
  onSelectCompany,
  onSelectCrop,
  onRemoveCrop,
}: CropListProps) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const toggle = (key: string) => {
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="space-y-1">
      <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-text-muted mb-3">
        Recortes
      </p>
      {companies.map((company, compIdx) => {
        const compKey = company.id;
        const isExpanded = expanded[compKey] !== false;
        const pdfGroups: Record<string, typeof company.crops> = {};
        company.crops.forEach((crop) => {
          if (!pdfGroups[crop.pdfFilename]) pdfGroups[crop.pdfFilename] = [];
          pdfGroups[crop.pdfFilename].push(crop);
        });

        return (
          <div key={compKey}>
            <button
              onClick={() => { toggle(compKey); onSelectCompany(compIdx); }}
              className={`w-full flex items-center gap-2 px-2 py-1.5 text-sm hover:bg-bg-secondary/50 transition-colors ${
                compIdx === activeCompanyIdx ? "text-accent font-medium" : "text-text-primary"
              }`}
            >
              {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
              <span className="truncate">{company.name || `Empresa ${compIdx + 1}`}</span>
              <span className="text-[10px] text-text-muted ml-auto">{company.crops.length}</span>
            </button>

            {isExpanded && (
              <div className="ml-4">
                {Object.entries(pdfGroups).map(([filename, crops]) => {
                  const pdfKey = `${compKey}-${filename}`;
                  const pdfExpanded = expanded[pdfKey] !== false;
                  return (
                    <div key={pdfKey}>
                      <button
                        onClick={() => toggle(pdfKey)}
                        className="w-full flex items-center gap-2 px-2 py-1 text-xs text-text-secondary hover:bg-bg-secondary/50 transition-colors"
                      >
                        {pdfExpanded ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
                        <FileText size={10} />
                        <span className="truncate">{filename}</span>
                      </button>

                      {pdfExpanded && (
                        <div className="ml-6 space-y-0.5">
                          {crops.map((crop) => (
                            <div
                              key={crop.cropId}
                              onClick={() => onSelectCrop(crop.cropId)}
                              className={`flex items-center justify-between px-2 py-1 text-xs cursor-pointer hover:bg-bg-secondary/50 transition-colors group ${
                                selectedCropId === crop.cropId ? "bg-bg-secondary" : ""
                              }`}
                            >
                              <span className="flex items-center gap-2">
                                <span className={`font-bold ${CROP_TYPE_COLOR[crop.type]}`}>{crop.type}</span>
                                <span className="text-text-muted">p.{crop.page}</span>
                              </span>
                              <button
                                onClick={(e) => { e.stopPropagation(); onRemoveCrop(crop.cropId); }}
                                className="text-text-muted hover:text-error transition-colors opacity-0 group-hover:opacity-100"
                              >
                                <Trash2 size={10} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
                {company.crops.length === 0 && (
                  <p className="px-2 py-1 text-[11px] text-text-muted italic">Nenhum recorte</p>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
