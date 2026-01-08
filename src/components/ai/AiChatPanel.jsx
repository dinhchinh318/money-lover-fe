import React, { useMemo, useRef, useState } from "react";
import { aiApi, normalizeApiError } from "../../services/api.ai";
import "../../styles/ai.css";

function nowIso() {
  return new Date().toISOString();
}

function makeMsg(role, text, meta = {}) {
  return {
    id: `${role}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    role,
    text,
    at: nowIso(),
    meta,
  };
}

function formatObject(obj) {
  return "```json\n" + JSON.stringify(obj, null, 2) + "\n```";
}

// Extract clean answer from response
function extractAnswer(response) {
  if (response?.answer) return response.answer;
  if (response?.data?.answer) return response.data.answer;
  if (response?.reply) return response.reply;
  if (response?.data?.reply) return response.data.reply;
  return formatObject(response);
}

export default function AiChatPanel() {
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const [categoryId, setCategoryId] = useState("");
  const [period, setPeriod] = useState("month");

  const [messages, setMessages] = useState(() => [
    makeMsg("assistant", "Xin chào! Tôi là trợ lý AI của Money Lover. Bạn có thể dùng các nút tính năng nhanh bên dưới hoặc chat trực tiếp với tôi."),
  ]);

  const bottomRef = useRef(null);
  const scrollDown = () => bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });

  const context = useMemo(() => {
    return messages.slice(-10).map((m) => ({ role: m.role, text: m.text, at: m.at }));
  }, [messages]);

  const push = (msg) => {
    setMessages((prev) => [...prev, msg]);
    setTimeout(scrollDown, 0);
  };

  const send = async () => {
    const text = input.trim();
    if (!text || busy) return;

    setError(null);
    push(makeMsg("user", text));
    setInput("");
    setBusy(true);

    try {
      const res = await aiApi.chat({ message: text, context });
      const answer = extractAnswer(res);
      push(makeMsg("assistant", answer));
    } catch (e) {
      const err = normalizeApiError(e);
      setError(err);
      push(makeMsg("assistant", "Xin lỗi, có lỗi xảy ra. Vui lòng thử lại.", { error: err }));
    } finally {
      setBusy(false);
    }
  };

  const quick = async (fn, label) => {
    if (busy) return;
    setBusy(true);
    setError(null);
    push(makeMsg("system", `Đang chạy: ${label}`));
    try {
      const res = await fn();
      push(makeMsg("assistant", formatObject(res?.data ?? res)));
    } catch (e) {
      const err = normalizeApiError(e);
      setError(err);
      push(makeMsg("assistant", `Lỗi khi chạy ${label}\n` + formatObject(err), { error: err }));
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="ai-card">
      <header className="ai-card__head">
        <div className="ai-stack">
          <h2 className="ai-title">Trợ lý AI</h2>
          <div className="ai-sub">
            Chat với AI hoặc sử dụng các tính năng nhanh để phân tích tài chính
          </div>
        </div>
      </header>

      <div className="ai-quick">
        <button 
          className="ai-btn ai-btn--ghost" 
          onClick={() => quick(aiApi.getAlerts, "Cảnh báo")} 
          disabled={busy}
        >
          🔔 Cảnh báo
        </button>
        
        <button 
          className="ai-btn ai-btn--ghost" 
          onClick={() => quick(aiApi.insights, "Phân tích chi tiêu")} 
          disabled={busy}
        >
          💡 Phân tích
        </button>
        
        <button 
          className="ai-btn ai-btn--ghost" 
          onClick={() => quick(aiApi.quickMonthly, "Báo cáo tháng")} 
          disabled={busy}
        >
          📊 Báo cáo tháng
        </button>

        <div className="ai-quick__group">
          <input
            className="ai-input"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            placeholder="ID danh mục"
          />
          <button
            className="ai-btn ai-btn--ghost"
            onClick={() => quick(() => aiApi.suggestBudget(categoryId), "Gợi ý ngân sách")}
            disabled={busy || !categoryId.trim()}
          >
            💰 Gợi ý ngân sách
          </button>
        </div>

        <div className="ai-quick__group">
          <select 
            className="ai-select" 
            value={period} 
            onChange={(e) => setPeriod(e.target.value)}
          >
            <option value="week">Tuần</option>
            <option value="month">Tháng</option>
            <option value="quarter">Quý</option>
            <option value="year">Năm</option>
          </select>
          <button 
            className="ai-btn ai-btn--ghost" 
            onClick={() => quick(() => aiApi.forecast({ period }), "Dự báo")} 
            disabled={busy}
          >
            🔮 Dự báo
          </button>
        </div>
      </div>

      {error ? (
        <div className="ai-error">
          <div className="ai-error__title">Lỗi gần nhất</div>
          <pre className="ai-pre">{JSON.stringify(error, null, 2)}</pre>
        </div>
      ) : null}

      <div className="ai-chat">
        {messages.map((m) => (
          <div key={m.id} className={`ai-msg ai-msg--${m.role}`}>
            <div className="ai-msg__meta">
              <span className="ai-msg__role">
                {m.role === "user" ? "Bạn" : m.role === "assistant" ? "AI" : "Hệ thống"}
              </span>
              <span className="ai-dot">•</span>
              <span>{new Date(m.at).toLocaleTimeString("vi-VN")}</span>
            </div>
            <div className="ai-msg__bubble">{m.text}</div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="ai-compose">
        <textarea
          className="ai-textarea"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          placeholder="Nhập tin nhắn... (Enter để gửi, Shift+Enter để xuống dòng)"
          rows={3}
        />
        <button 
          className="ai-btn ai-btn--primary" 
          onClick={send} 
          disabled={busy || !input.trim()}
        >
          {busy ? "Đang gửi..." : "Gửi"}
        </button>
      </div>
    </section>
  );
}