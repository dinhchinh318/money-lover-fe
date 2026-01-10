import React, { useMemo, useRef, useState } from "react";
import { aiApi, normalizeApiError } from "../../services/api.ai";
import "../../styles/ai.css";
import {
  monthValueNow,
  monthRangeYMD,
  extractChatText,
  errorToText,
  formatMonthlyReport,
  formatAnalysisFromReport,
  formatForecastLinear,
  formatAlertsFallback,
} from "./aiText";

/**
 * AiChatPanel
 * - Remove system "Đang chạy..." bubbles (use button disabled state instead)
 * - Keep chat as main, and quick actions return plain text (no JSON)
 */

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

const SYSTEM_STYLE = "Trả lời ngắn gọn, tối đa 6 dòng hoặc 5 gạch đầu dòng. Không lan man.";

export default function AiChatPanel() {
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const [categoryId, setCategoryId] = useState("");
  const [period, setPeriod] = useState("month");
  const [month, setMonth] = useState(monthValueNow());

  const [messages, setMessages] = useState(() => [
    makeMsg("assistant", "AI sẵn sàng. Có thể chat hoặc dùng các nút nhanh bên dưới."),
  ]);

  const bottomRef = useRef(null);
  const scrollDown = () =>
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });

  const context = useMemo(() => {
    const tail = messages.slice(-10).map((m) => ({ role: m.role, text: m.text, at: m.at }));
    return [{ role: "system", text: SYSTEM_STYLE }, ...tail];
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
      const answer = extractChatText(res?.data ?? res) || "Không có nội dung trả lời từ chatbot.";
      push(makeMsg("assistant", answer));
    } catch (e) {
      const err = normalizeApiError(e);
      setError(err);
      push(makeMsg("assistant", errorToText(err), { error: err }));
    } finally {
      setBusy(false);
    }
  };

  const run = async (fn) => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const text = await fn();
      push(makeMsg("assistant", text));
    } catch (e) {
      const err = normalizeApiError(e);
      setError(err);
      push(makeMsg("assistant", errorToText(err), { error: err }));
    } finally {
      setBusy(false);
    }
  };

  const loadMonthData = async () => {
    const range = monthRangeYMD(month);
    if (!range) throw { message: "Tháng không hợp lệ." };

    const [dashRes, catRes, ovRes] = await Promise.all([
      aiApi.getFinancialDashboard(range),
      aiApi.getCategoryExpenseReport(range),
      aiApi.getStatsOverview(range),
    ]);

    return {
      range,
      dashboard: dashRes?.data ?? dashRes,
      categories: catRes?.data ?? catRes,
      overview: ovRes?.data ?? ovRes,
    };
  };

  const onAlerts = () =>
    run(async () => {
      const res = await aiApi.getAlerts();
      const payload = res?.data ?? res;
      const list = Array.isArray(payload) ? payload : Array.isArray(payload?.alerts) ? payload.alerts : [];
      if (list.length) {
        const lines = ["Cảnh báo:"];
        list.slice(0, 10).forEach((a, i) => {
          const title = a?.title || a?.type || `Alert #${i + 1}`;
          const msg = a?.message || a?.description || "";
          const sev = a?.severity || a?.level;
          lines.push(`- ${title}${sev ? ` (${sev})` : ""}${msg ? `: ${msg}` : ""}`);
        });
        return lines.join("\n");
      }
      const { dashboard, categories } = await loadMonthData();
      return formatAlertsFallback({ monthValue: month, dashboard, categories });
    });

  const onAnalysis = () =>
    run(async () => {
      const { dashboard, categories } = await loadMonthData();
      return formatAnalysisFromReport({ dashboard, categories });
    });

  const onMonthly = () =>
    run(async () => {
      const { range, dashboard, categories, overview } = await loadMonthData();
      return formatMonthlyReport({ startDate: range.startDate, endDate: range.endDate, dashboard, categories, overview });
    });

  const onForecast = () =>
    run(async () => {
      const { dashboard } = await loadMonthData();
      return formatForecastLinear({ monthValue: month, dashboard, period });
    });

  const onBudget = () =>
    run(async () => {
      if (!categoryId.trim()) throw { message: "Thiếu ID danh mục." };
      const res = await aiApi.suggestBudget(categoryId.trim());
      const s = res?.data ?? res;
      if (typeof s === "string" && s.trim()) return s;

      const lines = ["Dự toán (gợi ý ngân sách):"];
      if (s?.categoryName) lines.push(`- Danh mục: ${s.categoryName}`);
      if (typeof s?.suggestedAmount === "number") lines.push(`- Mức đề xuất: ${s.suggestedAmount}`);
      if (s?.reason) lines.push(`- Lý do: ${s.reason}`);
      return lines.length === 1 ? "Không có dữ liệu dự toán." : lines.join("\n");
    });

  return (
    <section className="ai-card">
      <header className="ai-card__head">
        <div className="ai-stack">
          <h2 className="ai-title">Trợ lý AI</h2>
          <div className="ai-sub">Chat là chính. Phân tích/báo cáo/dự báo lấy dữ liệu theo tháng.</div>
        </div>
      </header>

      <div className="ai-quick">
        <button className="ai-btn ai-btn--ghost" onClick={onAlerts} disabled={busy}>🔔 Cảnh báo</button>
        <button className="ai-btn ai-btn--ghost" onClick={onAnalysis} disabled={busy}>💡 Phân tích</button>

        <div className="ai-quick__group">
          <input className="ai-input ai-input--month" type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
          <button className="ai-btn ai-btn--ghost" onClick={onMonthly} disabled={busy}>📊 Báo cáo tháng</button>
        </div>

        <div className="ai-quick__group">
          <input className="ai-input" value={categoryId} onChange={(e) => setCategoryId(e.target.value)} placeholder="ID danh mục" />
          <button className="ai-btn ai-btn--ghost" onClick={onBudget} disabled={busy || !categoryId.trim()}>💰 Dự toán</button>
        </div>

        <div className="ai-quick__group">
          <select className="ai-select" value={period} onChange={(e) => setPeriod(e.target.value)}>
            <option value="week">Tuần</option>
            <option value="month">Tháng</option>
            <option value="quarter">Quý</option>
            <option value="year">Năm</option>
          </select>
          <button className="ai-btn ai-btn--ghost" onClick={onForecast} disabled={busy}>🔮 Dự báo</button>
        </div>
      </div>

      {error ? (
        <div className="ai-error">
          <div className="ai-error__title">Lỗi gần nhất</div>
          <div className="ai-error__msg">{errorToText(error)}</div>
        </div>
      ) : null}

      <div className="ai-chat">
        {messages.map((m) => (
          <div key={m.id} className={`ai-msg ai-msg--${m.role}`}>
            <div className="ai-msg__meta">
              <span className="ai-msg__role">{m.role === "user" ? "Bạn" : m.role === "assistant" ? "AI" : "Hệ Thống"}</span>
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
        <button className="ai-btn ai-btn--primary" onClick={send} disabled={busy || !input.trim()}>
          {busy ? "..." : "Gửi"}
        </button>
      </div>
    </section>
  );
}
