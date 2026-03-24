const BALANCETE_API = import.meta.env.VITE_BALANCETE_API_URL || "http://localhost:8080";

export interface JobStatus {
  status: "processing" | "done" | "error";
  progress: number;
  message: string;
  error?: string;
}

export async function startExtraction(files: File[]): Promise<string> {
  const formData = new FormData();
  files.forEach((file) => formData.append("files", file));

  const res = await fetch(`${BALANCETE_API}/extract`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => "");
    throw new Error(errorText || `Erro ${res.status}`);
  }

  const data = await res.json();
  return data.job_id;
}

export async function pollJobStatus(jobId: string): Promise<JobStatus> {
  const res = await fetch(`${BALANCETE_API}/status/${jobId}`);
  if (!res.ok) throw new Error(`Status check failed: ${res.status}`);
  return res.json();
}

export async function downloadResult(jobId: string): Promise<Blob> {
  const res = await fetch(`${BALANCETE_API}/download/${jobId}`);
  if (!res.ok) throw new Error("Download failed");
  return res.blob();
}
