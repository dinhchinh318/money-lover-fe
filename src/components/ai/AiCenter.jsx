import React, { useState } from "react";
import AiChatPanel from "./AiChatPanel";
import AiAlertsPanel from "./AiAlertsPanel";
import "../../styles/ai.css";

export default function AiCenter() {
  const [tab, setTab] = useState("chat");

  return (
    <div className="ai-shell">
      <div className="ai-top">
        <div className="ai-top__left">
          <h1 className="ai-h1">Trung tâm AI</h1>
          <div className="ai-powered-badge" aria-label="Supported by Gemini">
            <span className="ai-powered-badge__dot" aria-hidden="true" />
            <span>Supported by Gemini</span>
          </div>
        </div>

        <div className="ai-tabs" role="tablist" aria-label="Tabs trung tâm AI">
          <button
            className={`ai-tab ${tab === "chat" ? "is-active" : ""}`}
            onClick={() => setTab("chat")}
            role="tab"
            aria-selected={tab === "chat"}
            type="button"
          >
            💬 Trò chuyện AI
          </button>
          <button
            className={`ai-tab ${tab === "alerts" ? "is-active" : ""}`}
            onClick={() => setTab("alerts")}
            role="tab"
            aria-selected={tab === "alerts"}
            type="button"
          >
            🔔 Cảnh báo sớm
          </button>
        </div>
      </div>

      <div className="ai-grid ai-grid--single">
        {tab === "chat" ? <AiChatPanel /> : <AiAlertsPanel />}
      </div>
    </div>
  );
}
