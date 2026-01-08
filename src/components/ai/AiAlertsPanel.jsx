import React, { useMemo, useState } from "react";
import { useAiAlerts } from "./useAiAlerts";
import { stableAlertKey } from "../../services/api.ai";
import "../../styles/ai.css";

function requestBrowserNotificationPermission() {
  if (!("Notification" in window)) return { ok: false, reason: "NOT_SUPPORTED" };
  if (Notification.permission === "granted") return { ok: true, status: "granted" };
  if (Notification.permission === "denied") return { ok: false, status: "denied" };
  return { ok: true, status: "default" };
}

function notify(title, body) {
  if (!("Notification" in window)) return false;
  if (Notification.permission !== "granted") return false;
  try {
    new Notification(title, { body });
    return true;
  } catch {
    return false;
  }
}

function alertTitle(a) {
  return a?.title || a?.name || a?.type || "Alert";
}

function alertMessage(a) {
  return a?.message || a?.description || a?.detail || "";
}

export default function AiAlertsPanel() {
  const [enabled, setEnabled] = useState(true);
  const [intervalMs, setIntervalMs] = useState(60000);
  const [toast, setToast] = useState(null);
  const [browserNoti, setBrowserNoti] = useState(false);

  const { alerts, raw, loading, error, count, lastUpdatedAt, changed, reload } =
    useAiAlerts({ enabled, intervalMs });

  React.useEffect(() => {
    if (!changed) return;
    setToast({ type: "info", text: "Alerts updated" });
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [changed]);

  React.useEffect(() => {
    if (!browserNoti) return;
    if (!changed) return;
    if (!alerts?.length) return;
    const top = alerts[0];
    notify("Money Lover AI Alert", `${alertTitle(top)}${alertMessage(top) ? ": " + alertMessage(top) : ""}`);
  }, [browserNoti, changed, alerts]);

  const perm = useMemo(() => requestBrowserNotificationPermission(), []);

  const onEnableBrowserNoti = async () => {
    if (!("Notification" in window)) {
      setToast({ type: "warn", text: "Browser Notification not supported" });
      return;
    }
    if (Notification.permission === "granted") {
      setBrowserNoti(true);
      setToast({ type: "ok", text: "Browser Notification enabled" });
      return;
    }
    const p = await Notification.requestPermission();
    if (p === "granted") {
      setBrowserNoti(true);
      setToast({ type: "ok", text: "Browser Notification enabled" });
    } else {
      setBrowserNoti(false);
      setToast({ type: "warn", text: "Browser Notification permission denied" });
    }
  };

  return (
    <section className="ai-card">
      <header className="ai-card__head">
        <div className="ai-stack">
          <h2 className="ai-title">AI Alerts</h2>
          <div className="ai-sub">
            Count: <b>{count}</b>
            {lastUpdatedAt ? <span className="ai-dot">•</span> : null}
            {lastUpdatedAt ? <span>Updated: {lastUpdatedAt}</span> : null}
          </div>
        </div>

        <div className="ai-actions">
          <button className="ai-btn" onClick={reload} disabled={loading}>
            Refresh
          </button>
        </div>
      </header>

      {toast ? (
        <div className={`ai-toast ai-toast--${toast.type}`}>
          {toast.text}
        </div>
      ) : null}

      <div className="ai-controls">
        <label className="ai-control">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
          />
          <span>Auto refresh</span>
        </label>

        <label className="ai-control">
          <span>Interval</span>
          <select
            value={intervalMs}
            onChange={(e) => setIntervalMs(Number(e.target.value))}
          >
            <option value={30000}>30s</option>
            <option value={60000}>60s</option>
            <option value={120000}>120s</option>
            <option value={300000}>300s</option>
          </select>
        </label>

        <div className="ai-control ai-control--right">
          <button
            className="ai-btn ai-btn--ghost"
            onClick={onEnableBrowserNoti}
          >
            Enable browser notification
          </button>
          <span className="ai-sub">
            Permission:{" "}
            <b>
              {("Notification" in window) ? Notification.permission : (perm?.reason || "unknown")}
            </b>
          </span>
        </div>
      </div>

      {error ? (
        <div className="ai-error">
          <div className="ai-error__title">Request error</div>
          <pre className="ai-pre">{JSON.stringify(error, null, 2)}</pre>
        </div>
      ) : null}

      <div className="ai-list">
        {(alerts || []).length === 0 && !loading ? (
          <div className="ai-empty">No alerts</div>
        ) : null}

        {(alerts || []).map((a, idx) => (
          <article key={stableAlertKey(a, idx)} className="ai-item">
            <div className="ai-item__row">
              <div className="ai-item__title">{alertTitle(a)}</div>
              <div className="ai-badges">
                {a?.severity || a?.level ? (
                  <span className="ai-badge">{a.severity || a.level}</span>
                ) : null}
                {a?.type ? <span className="ai-badge ai-badge--soft">{a.type}</span> : null}
              </div>
            </div>

            {alertMessage(a) ? (
              <div className="ai-item__msg">{alertMessage(a)}</div>
            ) : null}

            <div className="ai-item__meta">
              {a?.createdAt || a?.time ? <span>{a.createdAt || a.time}</span> : null}
              {a?.value !== undefined ? (
                <>
                  <span className="ai-dot">•</span>
                  <span>value: {String(a.value)}</span>
                </>
              ) : null}
            </div>
          </article>
        ))}
      </div>

      <details className="ai-raw">
        <summary>Raw response</summary>
        <pre className="ai-pre">{JSON.stringify(raw, null, 2)}</pre>
      </details>
    </section>
  );
}
