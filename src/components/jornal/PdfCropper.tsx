import { useState, useCallback, useRef, useEffect } from "react";
import { ZoomIn, ZoomOut, Maximize, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import type { Company, PdfFile, CropType, CropRegion } from "../../types";
import { usePdfRenderer } from "../../hooks/usePdfRenderer";
import CropList from "./CropList";

interface PdfCropperProps {
  pdfFiles: PdfFile[];
  companies: Company[];
  onDone: (companies: Company[]) => void;
  onBack: () => void;
}

const CROP_COLORS: Record<CropType, { border: string; bg: string; label: string }> = {
  BP: { border: "border-crop-bp", bg: "bg-crop-bp/15", label: "BP" },
  DRE: { border: "border-crop-dre", bg: "bg-crop-dre/15", label: "DRE" },
  DFC: { border: "border-crop-dfc", bg: "bg-crop-dfc/15", label: "DFC" },
};

const CROP_BUTTON_STYLES: Record<CropType, string> = {
  BP: "border-crop-bp text-crop-bp hover:bg-crop-bp/10",
  DRE: "border-crop-dre text-crop-dre hover:bg-crop-dre/10",
  DFC: "border-crop-dfc text-crop-dfc hover:bg-crop-dfc/10",
};

const CROP_BUTTON_ACTIVE: Record<CropType, string> = {
  BP: "bg-crop-bp text-white border-crop-bp",
  DRE: "bg-crop-dre text-white border-crop-dre",
  DFC: "bg-crop-dfc text-white border-crop-dfc",
};

export default function PdfCropper({ pdfFiles, companies: initialCompanies, onDone, onBack }: PdfCropperProps) {
  const [companies, setCompanies] = useState<Company[]>(initialCompanies);
  const [activeCompanyIdx, setActiveCompanyIdx] = useState(0);
  const [activePdfIdx, setActivePdfIdx] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(1);
  const [activeTool, setActiveTool] = useState<CropType | null>(null);
  const [selectedCropId, setSelectedCropId] = useState<string | null>(null);

  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(null);
  const [drawCurrent, setDrawCurrent] = useState<{ x: number; y: number } | null>(null);

  const overlayRef = useRef<HTMLDivElement>(null);

  const activeCompany = companies[activeCompanyIdx];
  const companyPdfs = pdfFiles.filter((p) => activeCompany?.pdfFilenames.includes(p.filename));
  const activePdf = companyPdfs[activePdfIdx] || null;

  const { canvasRef, pageSize, isLoading, totalPages } = usePdfRenderer(
    activePdf?.file || null,
    currentPage,
    scale
  );

  useEffect(() => {
    setCurrentPage(1);
    setActivePdfIdx(0);
  }, [activeCompanyIdx]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activePdfIdx]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setActiveTool(null);
        setSelectedCropId(null);
        setIsDrawing(false);
      }
      if ((e.key === "Delete" || e.key === "Backspace") && selectedCropId) {
        removeCrop(selectedCropId);
        setSelectedCropId(null);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [selectedCropId]);

  const getRelCoords = useCallback((e: React.MouseEvent): { x: number; y: number } | null => {
    const overlay = overlayRef.current;
    if (!overlay || !pageSize.width || !pageSize.height) return null;
    const rect = overlay.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)),
      y: Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height)),
    };
  }, [pageSize]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!activeTool) return;
    const coords = getRelCoords(e);
    if (!coords) return;
    setIsDrawing(true);
    setDrawStart(coords);
    setDrawCurrent(coords);
    setSelectedCropId(null);
  }, [activeTool, getRelCoords]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDrawing) return;
    const coords = getRelCoords(e);
    if (coords) setDrawCurrent(coords);
  }, [isDrawing, getRelCoords]);

  const handleMouseUp = useCallback(() => {
    if (!isDrawing || !drawStart || !drawCurrent || !activeTool || !activePdf) {
      setIsDrawing(false);
      return;
    }

    const xRel = Math.min(drawStart.x, drawCurrent.x);
    const yRel = Math.min(drawStart.y, drawCurrent.y);
    const wRel = Math.abs(drawCurrent.x - drawStart.x);
    const hRel = Math.abs(drawCurrent.y - drawStart.y);

    if (wRel > 0.01 && hRel > 0.01) {
      const crop: CropRegion = {
        cropId: Math.random().toString(36).slice(2, 10),
        type: activeTool,
        pdfFilename: activePdf.filename,
        page: currentPage,
        xRel, yRel, wRel, hRel,
      };
      setCompanies((prev) => prev.map((c, i) =>
        i === activeCompanyIdx ? { ...c, crops: [...c.crops, crop] } : c
      ));
    }

    setIsDrawing(false);
    setDrawStart(null);
    setDrawCurrent(null);
  }, [isDrawing, drawStart, drawCurrent, activeTool, activePdf, currentPage, activeCompanyIdx]);

  const removeCrop = useCallback((cropId: string) => {
    setCompanies((prev) => prev.map((c) => ({
      ...c,
      crops: c.crops.filter((cr) => cr.cropId !== cropId),
    })));
  }, []);

  const totalCrops = companies.reduce((sum, c) => sum + c.crops.length, 0);
  const currentPageCrops = activeCompany?.crops.filter(
    (c) => c.pdfFilename === activePdf?.filename && c.page === currentPage
  ) || [];

  const drawPreview = isDrawing && drawStart && drawCurrent ? {
    left: `${Math.min(drawStart.x, drawCurrent.x) * 100}%`,
    top: `${Math.min(drawStart.y, drawCurrent.y) * 100}%`,
    width: `${Math.abs(drawCurrent.x - drawStart.x) * 100}%`,
    height: `${Math.abs(drawCurrent.y - drawStart.y) * 100}%`,
  } : null;

  return (
    <div className="flex h-[calc(100vh-64px)]">
      {/* Sidebar */}
      <div className="w-[280px] border-r border-border bg-surface flex flex-col shrink-0">
        <div className="flex-1 overflow-y-auto p-4">
          <CropList
            companies={companies}
            activeCompanyIdx={activeCompanyIdx}
            selectedCropId={selectedCropId}
            onSelectCompany={setActiveCompanyIdx}
            onSelectCrop={(cropId) => {
              setSelectedCropId(cropId);
              const crop = companies.flatMap((c) => c.crops).find((c) => c.cropId === cropId);
              if (crop && activePdf?.filename !== crop.pdfFilename) {
                const pdfIdx = companyPdfs.findIndex((p) => p.filename === crop.pdfFilename);
                if (pdfIdx >= 0) setActivePdfIdx(pdfIdx);
              }
              if (crop && crop.page !== currentPage) setCurrentPage(crop.page);
            }}
            onRemoveCrop={removeCrop}
          />
        </div>
        <div className="p-4 border-t border-border space-y-2">
          <button
            onClick={() => onDone(companies)}
            className="btn-primary w-full"
            disabled={totalCrops === 0}
          >
            Processar ({totalCrops})
          </button>
          <button onClick={onBack} className="btn-secondary w-full">
            Voltar
          </button>
        </div>
      </div>

      {/* Main area */}
      <div className="flex-1 flex flex-col bg-bg-secondary overflow-hidden">
        {/* Toolbar */}
        <div className="bg-surface border-b border-border px-4 py-2 flex items-center gap-2 flex-wrap">
          {/* Company tabs */}
          {companies.length > 1 && companies.map((c, i) => (
            <button
              key={c.id}
              onClick={() => setActiveCompanyIdx(i)}
              className={`px-3 py-1 text-xs font-medium border transition-colors ${
                i === activeCompanyIdx
                  ? "border-accent bg-accent text-white"
                  : "border-border text-text-secondary hover:bg-bg-secondary"
              }`}
            >
              {c.name || `Empresa ${i + 1}`}
            </button>
          ))}

          {companies.length > 1 && <div className="w-px h-6 bg-border mx-1" />}

          {/* PDF tabs */}
          {companyPdfs.map((pdf, i) => (
            <button
              key={pdf.filename}
              onClick={() => setActivePdfIdx(i)}
              className={`px-3 py-1 text-xs font-medium border transition-colors truncate max-w-[140px] ${
                i === activePdfIdx
                  ? "border-accent bg-accent/10 text-accent"
                  : "border-border text-text-secondary hover:bg-bg-secondary"
              }`}
            >
              {pdf.filename}
            </button>
          ))}

          <div className="w-px h-6 bg-border mx-1" />

          {/* Page navigation */}
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage <= 1}
            className="p-1 text-text-secondary hover:text-text-primary disabled:opacity-30 transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-xs text-text-secondary tabular-nums min-w-[60px] text-center">
            {currentPage} / {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage >= totalPages}
            className="p-1 text-text-secondary hover:text-text-primary disabled:opacity-30 transition-colors"
          >
            <ChevronRight size={16} />
          </button>

          <div className="w-px h-6 bg-border mx-1" />

          {/* Zoom */}
          <button onClick={() => setScale((s) => Math.max(0.5, s - 0.25))} className="p-1 text-text-secondary hover:text-text-primary transition-colors">
            <ZoomOut size={16} />
          </button>
          <span className="text-xs text-text-secondary tabular-nums min-w-[40px] text-center">
            {Math.round(scale * 100)}%
          </span>
          <button onClick={() => setScale((s) => Math.min(3, s + 0.25))} className="p-1 text-text-secondary hover:text-text-primary transition-colors">
            <ZoomIn size={16} />
          </button>
          <button onClick={() => setScale(1)} className="p-1 text-text-secondary hover:text-text-primary transition-colors">
            <Maximize size={16} />
          </button>

          <div className="flex-1" />

          {/* Crop tools */}
          {(["BP", "DRE", "DFC"] as CropType[]).map((type) => (
            <button
              key={type}
              onClick={() => setActiveTool(activeTool === type ? null : type)}
              className={`px-3 py-1 text-xs font-bold border transition-colors ${
                activeTool === type
                  ? CROP_BUTTON_ACTIVE[type]
                  : CROP_BUTTON_STYLES[type]
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        {/* Canvas area */}
        <div className="flex-1 overflow-auto flex items-start justify-center p-8">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center z-10">
              <Loader2 size={24} className="animate-spin text-accent" />
            </div>
          )}
          <div className="relative inline-block shadow-sm">
            <canvas ref={canvasRef} className="block" />
            {/* Overlay for mouse events */}
            <div
              ref={overlayRef}
              className={`absolute inset-0 ${activeTool ? "cursor-crosshair" : "cursor-default"}`}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={() => { if (isDrawing) handleMouseUp(); }}
            >
              {/* Existing crops */}
              {currentPageCrops.map((crop) => {
                const colors = CROP_COLORS[crop.type];
                return (
                  <div
                    key={crop.cropId}
                    onClick={(e) => { e.stopPropagation(); setSelectedCropId(crop.cropId); }}
                    className={`absolute border-2 ${colors.border} ${colors.bg} transition-shadow ${
                      selectedCropId === crop.cropId ? "shadow-md ring-2 ring-accent/30" : ""
                    }`}
                    style={{
                      left: `${crop.xRel * 100}%`,
                      top: `${crop.yRel * 100}%`,
                      width: `${crop.wRel * 100}%`,
                      height: `${crop.hRel * 100}%`,
                    }}
                  >
                    <span className={`absolute -top-5 left-0 text-[10px] font-bold px-1 ${
                      crop.type === "BP" ? "text-crop-bp" : crop.type === "DRE" ? "text-crop-dre" : "text-crop-dfc"
                    }`}>
                      {crop.type}
                    </span>
                  </div>
                );
              })}

              {/* Drawing preview */}
              {drawPreview && activeTool && (
                <div
                  className={`absolute border-2 border-dashed ${CROP_COLORS[activeTool].border} ${CROP_COLORS[activeTool].bg}`}
                  style={drawPreview}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
