import type { Company } from "../types";

const JORNAL_API = import.meta.env.VITE_JORNAL_API_URL || "http://localhost:8000";

export async function uploadPdfs(
  files: File[]
): Promise<{ jobId: string; files: { filename: string; pages: number }[] }> {
  const formData = new FormData();
  files.forEach((f) => formData.append("files", f));
  const res = await fetch(`${JORNAL_API}/api/upload`, { method: "POST", body: formData });
  if (!res.ok) throw new Error(`Upload failed: ${res.statusText}`);
  return res.json();
}

export async function uploadTemplate(file: File): Promise<{ message: string }> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(`${JORNAL_API}/api/upload-template`, { method: "POST", body: formData });
  if (!res.ok) throw new Error(`Template upload failed: ${res.statusText}`);
  return res.json();
}

export async function startProcessing(
  jobId: string,
  companies: Company[]
): Promise<{ jobId: string; status: string }> {
  const res = await fetch(`${JORNAL_API}/api/process?jobId=${encodeURIComponent(jobId)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ companies }),
  });
  if (!res.ok) throw new Error(`Processing failed: ${res.statusText}`);
  return res.json();
}

export function subscribeStatus(
  jobId: string,
  onMessage: (data: { status: string; progress: number; message: string }) => void,
  onError?: (err: Event) => void
): EventSource {
  const es = new EventSource(`${JORNAL_API}/api/status/${jobId}`);
  es.onmessage = (event) => {
    try { onMessage(JSON.parse(event.data)); } catch { /* ignore */ }
  };
  es.onerror = (err) => { onError?.(err); es.close(); };
  return es;
}

export function getDownloadUrl(jobId: string): string {
  return `${JORNAL_API}/api/download/${jobId}`;
}
