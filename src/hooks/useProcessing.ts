import { useState, useCallback, useRef, useEffect } from "react";
import { startProcessing, subscribeStatus } from "../api/jornal";
import type { Company } from "../types";

export interface ProcessingState {
  status: string;
  progress: number;
  message: string;
  isProcessing: boolean;
  isDone: boolean;
  error: string | null;
}

export function useProcessing() {
  const [state, setState] = useState<ProcessingState>({
    status: "idle",
    progress: 0,
    message: "",
    isProcessing: false,
    isDone: false,
    error: null,
  });
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => () => { esRef.current?.close(); }, []);

  const startProcess = useCallback(async (jobId: string, companies: Company[]) => {
    esRef.current?.close();
    setState({
      status: "starting",
      progress: 0,
      message: "Iniciando processamento...",
      isProcessing: true,
      isDone: false,
      error: null,
    });
    try {
      const res = await startProcessing(jobId, companies);
      const resolvedId = res.jobId || jobId;
      esRef.current = subscribeStatus(
        resolvedId,
        (data) => {
          const isDone = data.status === "completed" || data.status === "done";
          const isError = data.status === "error";
          setState({
            status: data.status,
            progress: data.progress,
            message: data.message,
            isProcessing: !isDone && !isError,
            isDone,
            error: isError ? data.message : null,
          });
          if (isDone || isError) {
            esRef.current?.close();
            esRef.current = null;
          }
        },
        () => {
          setState((prev) =>
            prev.isDone || prev.error
              ? prev
              : { ...prev, isProcessing: false, error: "Conexão perdida. Tente novamente." }
          );
        }
      );
      return resolvedId;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao iniciar.";
      setState({
        status: "error",
        progress: 0,
        message: msg,
        isProcessing: false,
        isDone: false,
        error: msg,
      });
      return null;
    }
  }, []);

  const reset = useCallback(() => {
    esRef.current?.close();
    esRef.current = null;
    setState({
      status: "idle",
      progress: 0,
      message: "",
      isProcessing: false,
      isDone: false,
      error: null,
    });
  }, []);

  return { ...state, startProcess, reset };
}
