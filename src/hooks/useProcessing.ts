import { useState, useCallback, useRef, useEffect } from "react";
import { startProcessing, subscribeStatus } from "../api/jornal";
import { humanizeError } from "../utils/errors";
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
  const subRef = useRef<{ close: () => void } | null>(null);

  useEffect(() => () => { subRef.current?.close(); }, []);

  const startProcess = useCallback(async (jobId: string, companies: Company[]) => {
    subRef.current?.close();
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
      subRef.current = subscribeStatus(
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
            subRef.current?.close();
            subRef.current = null;
          }
        },
        (errMsg) => {
          setState((prev) =>
            prev.isDone || prev.error
              ? prev
              : { ...prev, isProcessing: false, error: errMsg }
          );
        }
      );
      return resolvedId;
    } catch (err) {
      const msg = err instanceof Error ? humanizeError(err.message) : "Erro ao iniciar.";
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
    subRef.current?.close();
    subRef.current = null;
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
