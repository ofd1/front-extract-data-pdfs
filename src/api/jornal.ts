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
  onError?: (err: string) => void
): { close: () => void } {
  let es: EventSource | null = null;
  let retries = 0;
  const MAX_RETRIES = 8;
  let closed = false;

  function connect() {
    if (closed) return;
    es = new EventSource(`${JORNAL_API}/api/status/${jobId}`);

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        retries = 0; // reset on successful message
        onMessage(data);

        if (data.status === "completed" || data.status === "done" || data.status === "error") {
          es?.close();
          closed = true;
        }
      } catch { /* ignore parse errors */ }
    };

    es.onerror = () => {
      es?.close();
      if (closed) return;

      retries++;
      if (retries > MAX_RETRIES) {
        onError?.("Conexão perdida após múltiplas tentativas. Tente novamente.");
        closed = true;
        return;
      }

      const delay = Math.min(2000 * Math.pow(1.5, retries - 1), 30000);
      console.log(`[SSE] Reconectando (tentativa ${retries}/${MAX_RETRIES}) em ${Math.round(delay / 1000)}s...`);
      setTimeout(connect, delay);
    };
  }

  connect();

  return {
    close: () => {
      closed = true;
      es?.close();
    }
  };
}

export function getDownloadUrl(jobId: string): string {
  return `${JORNAL_API}/api/download/${jobId}`;
}
