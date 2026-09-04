import { useCallback, useEffect, useRef, useState } from "react";

import { apiGet } from "./client";

export type ApiQueryStatus = "loading" | "error" | "success";

export interface ApiQueryResult<T> {
  data: T | null;
  status: ApiQueryStatus;
  error: Error | null;
  refetch: () => void;
}

/** Thin wrapper over apiGet that tracks loading/error/data and re-fetches
 * when `path` changes. Pass `path: null` to skip fetching (e.g. while an id
 * param hasn't resolved yet). */
export function useApiQuery<T>(path: string | null): ApiQueryResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [status, setStatus] = useState<ApiQueryStatus>(path ? "loading" : "success");
  const [error, setError] = useState<Error | null>(null);
  const requestId = useRef(0);

  const load = useCallback(() => {
    if (!path) {
      setStatus("success");
      setData(null);
      setError(null);
      return;
    }
    const id = ++requestId.current;
    setStatus("loading");
    setError(null);
    apiGet<T>(path)
      .then((result) => {
        if (requestId.current !== id) return;
        setData(result);
        setStatus("success");
      })
      .catch((err: unknown) => {
        if (requestId.current !== id) return;
        setError(err instanceof Error ? err : new Error(String(err)));
        setStatus("error");
      });
  }, [path]);

  useEffect(() => {
    load();
  }, [load]);

  return { data, status, error, refetch: load };
}
