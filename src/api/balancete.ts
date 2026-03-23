const BALANCETE_API = import.meta.env.VITE_BALANCETE_API_URL || "http://localhost:8080";

export async function extractBalancete(files: File[]): Promise<Blob> {
  const formData = new FormData();
  files.forEach((file) => formData.append("files", file));

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 600000);

  try {
    const res = await fetch(`${BALANCETE_API}/extract`, {
      method: "POST",
      body: formData,
      signal: controller.signal,
    });

    if (!res.ok) {
      const errorText = await res.text().catch(() => "");
      throw new Error(errorText || `Erro ${res.status}: ${res.statusText}`);
    }

    return res.blob();
  } finally {
    clearTimeout(timeout);
  }
}
