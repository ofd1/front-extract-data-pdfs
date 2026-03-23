import { useEffect, useRef, useState, useCallback } from "react";
import * as pdfjsLib from "pdfjs-dist";

pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

export interface PageSize { width: number; height: number; }

export function usePdfRenderer(file: File | null, page: number, scale: number = 1) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pageSize, setPageSize] = useState<PageSize>({ width: 0, height: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [totalPages, setTotalPages] = useState(0);
  const pdfDocRef = useRef<pdfjsLib.PDFDocumentProxy | null>(null);
  const renderTaskRef = useRef<pdfjsLib.RenderTask | null>(null);
  const prevFileRef = useRef<File | null>(null);

  useEffect(() => {
    if (!file) {
      pdfDocRef.current = null;
      prevFileRef.current = null;
      setTotalPages(0);
      setPageSize({ width: 0, height: 0 });
      return;
    }
    if (prevFileRef.current === file && pdfDocRef.current) return;
    let cancelled = false;
    (async () => {
      setIsLoading(true);
      try {
        const ab = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: ab }).promise;
        if (!cancelled) {
          pdfDocRef.current = pdf;
          prevFileRef.current = file;
          setTotalPages(pdf.numPages);
        }
      } catch (err) {
        console.error("Failed to load PDF:", err);
        if (!cancelled) { pdfDocRef.current = null; setTotalPages(0); }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [file]);

  useEffect(() => {
    const pdf = pdfDocRef.current;
    const canvas = canvasRef.current;
    if (!pdf || !canvas || page < 1 || page > pdf.numPages) return;
    let cancelled = false;
    (async () => {
      setIsLoading(true);
      if (renderTaskRef.current) {
        try { renderTaskRef.current.cancel(); } catch { /* ignore */ }
      }
      try {
        const pdfPage = await pdf.getPage(page);
        if (cancelled) return;
        const viewport = pdfPage.getViewport({ scale });
        const ctx = canvas.getContext("2d")!;
        const dpr = window.devicePixelRatio || 1;
        canvas.width = viewport.width * dpr;
        canvas.height = viewport.height * dpr;
        canvas.style.width = `${viewport.width}px`;
        canvas.style.height = `${viewport.height}px`;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        setPageSize({ width: viewport.width, height: viewport.height });
        const task = pdfPage.render({ canvasContext: ctx, viewport, canvas } as Parameters<typeof pdfPage.render>[0]);
        renderTaskRef.current = task;
        await task.promise;
      } catch (err) {
        if ((err as Error)?.message !== "Rendering cancelled") console.error(err);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [page, scale, totalPages]);

  const getPageCount = useCallback(async (f: File): Promise<number> => {
    try {
      const ab = await f.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: ab }).promise;
      return pdf.numPages;
    } catch {
      return 0;
    }
  }, []);

  return { canvasRef, pageSize, isLoading, totalPages, getPageCount };
}
