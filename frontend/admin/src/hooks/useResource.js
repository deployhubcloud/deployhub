import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "../api/client";

export default function useResource(
  path,
  params = {},
  { interval = 0, enabled = true } = {},
) {
  const query = JSON.stringify(params);
  const [state, setState] = useState({
    data: null,
    loading: true,
    error: "",
    updatedAt: null,
  });
  const active = useRef(null);
  const load = useCallback(
    async (fresh = false) => {
      if (!enabled || !path) return;
      active.current?.abort();
      const controller = new AbortController();
      active.current = controller;
      setState((previous) => ({
        ...previous,
        data: previous.key === path + query ? previous.data : null,
        key: path + query,
        loading: true,
        error: "",
      }));
      try {
        const { data } = await api.get(path, {
          params: { ...JSON.parse(query), ...(fresh ? { fresh: "1" } : {}) },
          signal: controller.signal,
        });
        if (!controller.signal.aborted)
          setState({
            data,
            key: path + query,
            loading: false,
            error: "",
            updatedAt: new Date(),
          });
      } catch (error) {
        if (!controller.signal.aborted)
          setState((previous) => ({
            ...previous,
            loading: false,
            error:
              error.response?.data?.message ||
              "Unable to load this view. Please try again.",
          }));
      }
    },
    [path, query, enabled],
  );
  useEffect(() => {
    load();
    const timer = interval
      ? setInterval(() => {
          if (!document.hidden) load(true);
        }, interval)
      : null;
    return () => {
      active.current?.abort();
      if (timer) clearInterval(timer);
    };
  }, [load, interval]);
  return {
    ...state,
    data: state.key === path + query ? state.data : null,
    loading: state.key !== path + query || state.loading,
    reload: () => load(true),
  };
}
