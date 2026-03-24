const BALANCETE_API = import.meta.env.VITE_BALANCETE_API_URL || "http://localhost:8080";

const ERROR_MESSAGES: Record<string, string> = {
  "Failed to fetch": "Não foi possível conectar ao servidor. O processamento pode ainda estar em andamento — aguarde 2 minutos e tente novamente.",
  "AbortError": "A requisição excedeu o tempo limite. Tente novamente — o servidor pode estar finalizando o processamento.",
};

function friendlyError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  for (const [key, friendly] of Object.entries(ERROR_MESSAGES)) {
    if (msg.includes(key)) return friendly;
  }
  return msg;
}

export async function extractBalancete(files: File[]): Promise<Blob> {
  const formData = new FormData();
  files.forEach((file) => formData.append("files", file));

  const MAX_RETRIES = 2;
  const RETRY_DELAYS = [10000, 30000]; // 10s, 30s

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 900000); // 15 min

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
    } catch (err) {
      clearTimeout(timeout);
      const isNetworkError = err instanceof TypeError ||
        (err instanceof DOMException && err.name === "AbortError");

      if (isNetworkError && attempt < MAX_RETRIES) {
        console.log(`[Balancete] Tentativa ${attempt + 1} falhou, retentando em ${RETRY_DELAYS[attempt] / 1000}s...`);
        await new Promise(r => setTimeout(r, RETRY_DELAYS[attempt]));
        continue;
      }

      throw new Error(friendlyError(err));
    } finally {
      clearTimeout(timeout);
    }
  }

  throw new Error("Não foi possível completar a extração após múltiplas tentativas.");
}
