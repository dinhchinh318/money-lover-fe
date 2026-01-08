import { useEffect, useMemo, useRef, useState } from "react";
import { aiApi, normalizeApiError, pickAlertsPayload } from "../../services/api.ai";

function hashAlerts(list) {
  try {
    const minimal = (list || []).map((a) => ({
      id: a?._id || a?.id || null,
      type: a?.type || null,
      title: a?.title || a?.name || null,
      message: a?.message || a?.description || null,
      severity: a?.severity || a?.level || null,
      createdAt: a?.createdAt || a?.time || null,
      value: a?.value || null,
    }));
    return JSON.stringify(minimal);
  } catch {
    return String(Date.now());
  }
}

export function useAiAlerts({ enabled = true, intervalMs = 60000 } = {}) {
  const [state, setState] = useState({
    loading: false,
    error: null,
    alerts: [],
    raw: null,
    lastUpdatedAt: null,
    changed: false,
  });

  const lastHashRef = useRef("");

  const load = async () => {
    setState((s) => ({ ...s, loading: true, error: null, changed: false }));
    try {
      const res = await aiApi.getAlerts();
      const picked = pickAlertsPayload(res?.data);
      const nextHash = hashAlerts(picked.list);
      const changed = lastHashRef.current && lastHashRef.current !== nextHash;
      lastHashRef.current = nextHash;

      setState((s) => ({
        ...s,
        loading: false,
        alerts: picked.list,
        raw: picked.raw,
        lastUpdatedAt: new Date().toISOString(),
        changed,
      }));
      return { ok: true, changed, alerts: picked.list, raw: picked.raw };
    } catch (e) {
      const err = normalizeApiError(e);
      setState((s) => ({
        ...s,
        loading: false,
        error: err,
        lastUpdatedAt: new Date().toISOString(),
      }));
      return { ok: false, error: err };
    }
  };

  useEffect(() => {
    if (!enabled) return;
    let timer = null;

    // initial load
    load();

    timer = setInterval(() => {
      load();
    }, intervalMs);

    return () => {
      if (timer) clearInterval(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, intervalMs]);

  const count = useMemo(() => state.alerts?.length || 0, [state.alerts]);

  return { ...state, count, reload: load };
}
