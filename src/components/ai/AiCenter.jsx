import React, { useState } from "react";
import AiChatPanel from "./AiChatPanel";
import AiAlertsPanel from "./AiAlertsPanel";
import "../../styles/ai.css";

export default function AiCenter() {
  const [tab, setTab] = useState("chat");

  return (
    <div className="ai-shell">
      <div className="ai-top">
        <h1 className="ai-h1">Trung tâm AI</h1>
        <div className="ai-tabs" role="tablist" aria-label="Tabs trung tâm AI">
          <button
            className={`ai-tab ${tab === "chat" ? "is-active" : ""}`}
            onClick={() => setTab("chat")}
            role="tab"
            aria-selected={tab === "chat"}
          >
            💬 Trò chuyện AI
          </button>
          <button
            className={`ai-tab ${tab === "alerts" ? "is-active" : ""}`}
            onClick={() => setTab("alerts")}
            role="tab"
            aria-selected={tab === "alerts"}
          >
            🔔 Cảnh báo sớm
          </button>
        </div>
      </div>

      <div className="ai-grid">
        {tab === "chat" ? <AiChatPanel /> : <AiAlertsPanel />}
        
        <aside className="ai-side ai-card">
          <div className="ai-side__title">📝 Ghi chú</div>
          <ul className="ai-ul">
            <li>
              Panel Cảnh báo tự động gọi <code>/ai/alerts</code> (có thể cấu hình khoảng thời gian).
            </li>
            <li>
              Thông báo trình duyệt yêu cầu quyền từ người dùng.
            </li>
            <li>
              Panel Chat gọi endpoint <code>/v1/api/chat/quick-query</code> để trò chuyện với AI.
            </li>
            <li>
              Tất cả request phụ thuộc vào <code>axios.customize.js</code> (baseURL + xử lý token).
            </li>
            <li>
              Hệ thống sử dụng Google Gemini AI để phân tích và tư vấn tài chính thông minh.
            </li>
          </ul>
        </aside>
      </div>
    </div>
  );
}