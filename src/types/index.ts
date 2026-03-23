// ─── Navegação global ───
export type ActivePage = "landing" | "balancete" | "jornal";

// ─── Balancete ───
export type BalanceteState = "upload" | "processing" | "done" | "error";

// ─── Jornal (absorvido do af-extrator-frontend) ───
export type CropType = "BP" | "DRE" | "DFC";

export interface CropRegion {
  cropId: string;
  type: CropType;
  pdfFilename: string;
  page: number;
  xRel: number;
  yRel: number;
  wRel: number;
  hRel: number;
}

export interface PdfFile {
  file: File;
  filename: string;
  pageCount: number;
}

export interface Company {
  id: string;
  name: string;
  pdfFilenames: string[];
  crops: CropRegion[];
}

export type JornalState = "upload" | "configure" | "crop" | "processing" | "done";
