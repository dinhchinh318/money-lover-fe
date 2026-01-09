import React, { useMemo, useState } from "react";
import { useAiAlerts } from "./useAiAlerts";
import "../../styles/ai.css";
import { errorToText } from "./aiText";

export default function AlertBell({ intervalMs = 60000 }) {
  const [open, setOpen] = useState(false);
  const { count, alerts, error, loading, reload, lastUpdatedAt } = useAiAlerts({
    enabled: true,
    intervalMs,
  });

  const top = useMemo(() => (alerts && alerts.length ? alerts[0] : null), [alerts]);

  return (
    <div className="ai-bell">
      <button className="ai-bell__btn" onClick={() => setOpen((v) => !v)} aria-label="AI Alerts" type="button">
        <span className="ai-bell__icon" aria-hidden="true">🔔</span>
        {count ? <span className="ai-bell__badge">{count}</span> : null}
      </button>

      {open ? (
        <div className="ai-bell__panel">
          <div className="ai-bell__head">
            <div className="ai-bell__title">Cảnh báo</div>
            <button className="ai-btn ai-btn--ghost" onClick={reload} disabled={loading} type="button">
              {loading ? "..." : "Làm mới"}
            </button>
          </div>

          {error ? <div className="ai-bell__error">{errorToText(error)}</div> : null}

          {!top && !loading ? <div className="ai-empty">Không có cảnh báo.</div> : null}

          {top ? (
            <div className="ai-bell__item">
              <div className="ai-bell__itemTitle">{top.title || top.type || "Cảnh báo"}</div>
              <div className="ai-bell__itemMsg">{top.message || top.description || ""}</div>
              <div className="ai-sub">
                {lastUpdatedAt ? <>Cập nhật: <b>{new Date(lastUpdatedAt).toLocaleTimeString("vi-VN")}</b></> : null}
              </div>
            </div>
          ) : null}

          <div className="ai-bell__foot">
            <a className="ai-link" href="/ai">Mở AI Center</a>
          </div>
        </div>
      ) : null}
    </div>
  );
}
