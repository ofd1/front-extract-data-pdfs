import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import type { JornalState, Company, PdfFile } from "../../types";
import UploadStep from "./UploadStep";
import CompanySetup from "./CompanySetup";
import PdfCropper from "./PdfCropper";
import ProcessingView from "./ProcessingView";
import DownloadView from "./DownloadView";

interface JornalPageProps {
  onBack: () => void;
}

export default function JornalPage({ onBack }: JornalPageProps) {
  const [state, setState] = useState<JornalState>("upload");
  const [jobId, setJobId] = useState("");
  const [pdfFiles, setPdfFiles] = useState<PdfFile[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);

  const handleUploadDone = (id: string, files: PdfFile[]) => {
    setJobId(id);
    setPdfFiles(files);
    setState("configure");
  };

  const handleCompaniesDone = (comps: Company[]) => {
    setCompanies(comps);
    setState("crop");
  };

  const handleCropDone = (comps: Company[]) => {
    setCompanies(comps);
    setState("processing");
  };

  const handleReset = () => {
    setState("upload");
    setJobId("");
    setPdfFiles([]);
    setCompanies([]);
  };

  return (
    <section className="animate-fade-in">
      {state !== "crop" && (
        <div className="max-w-2xl mx-auto px-6 md:px-8 pt-16">
          <button
            onClick={state === "upload" ? onBack : () => setState("upload")}
            className="flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors mb-12"
          >
            <ArrowLeft size={16} />
            Voltar
          </button>

          <div className="mb-12">
            <h1 className="font-editorial text-4xl md:text-5xl text-text-primary tracking-tight" style={{ letterSpacing: "-0.02em" }}>
              Extração de Jornais
            </h1>
            <p className="mt-3 text-text-secondary text-base md:text-lg">
              Extraia dados de demonstrações financeiras publicadas em jornais
            </p>
          </div>
        </div>
      )}

      {state === "upload" && (
        <div className="max-w-2xl mx-auto px-6 md:px-8 pb-16">
          <UploadStep onDone={handleUploadDone} />
        </div>
      )}
      {state === "configure" && (
        <div className="max-w-2xl mx-auto px-6 md:px-8 pb-16">
          <CompanySetup
            pdfFiles={pdfFiles}
            onDone={handleCompaniesDone}
            onBack={() => setState("upload")}
          />
        </div>
      )}
      {state === "crop" && (
        <PdfCropper
          pdfFiles={pdfFiles}
          companies={companies}
          onDone={handleCropDone}
          onBack={() => setState("configure")}
        />
      )}
      {state === "processing" && (
        <div className="max-w-2xl mx-auto px-6 md:px-8 pb-16">
          <ProcessingView
            jobId={jobId}
            companies={companies}
            onDone={() => setState("done")}
            onRetry={() => setState("processing")}
          />
        </div>
      )}
      {state === "done" && (
        <div className="max-w-2xl mx-auto px-6 md:px-8 pb-16">
          <DownloadView
            jobId={jobId}
            companies={companies}
            pdfFiles={pdfFiles}
            onReset={handleReset}
          />
        </div>
      )}
    </section>
  );
}
