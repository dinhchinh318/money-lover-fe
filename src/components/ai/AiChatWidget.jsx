import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { aiApi, normalizeApiError } from "../../services/api.ai";
import "../../styles/ai.css";
import { extractChatText, errorToText } from "./aiText";

/**
 * AiChatWidget (Messenger-like)
 * - Render via React Portal to document.body to avoid being blocked by layout overlays / z-index / overflow hidden.
 */

function nowIso() {
  return new Date().toISOString();
}

function makeMsg(role, text) {
  return {
    id: `${role}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    role,
    text,
    at: nowIso(),
  };
}

function loadHistory() {
  try {
    const raw = localStorage.getItem("ml_ai_widget_history");
    const parsed = raw ? JSON.parse(raw) : null;
    if (Array.isArray(parsed)) return parsed.slice(-50);
  } catch {}
  return null;
}

function saveHistory(list) {
  try {
    localStorage.setItem("ml_ai_widget_history", JSON.stringify(list.slice(-50)));
  } catch {}
}

function ensurePortalRoot() {
  const id = "ml-ai-portal-root";
  let el = document.getElementById(id);
  if (el) return el;

  el = document.createElement("div");
  el.id = id;
  // keep highest stacking layer
  el.style.position = "fixed";
  el.style.inset = "0";
  el.style.pointerEvents = "none";
  el.style.zIndex = "2147483647"; // max-ish
  document.body.appendChild(el);
  return el;
}

export default function AiChatWidget() {
  const nav = useNavigate();

  const portalRoot = useMemo(() => {
    if (typeof document === "undefined") return null;
    return ensurePortalRoot();
  }, []);

  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [busy, setBusy] = useState(false);
  const [input, setInput] = useState("");
  const [errText, setErrText] = useState("");

  const [messages, setMessages] = useState(() => {
    const cached = loadHistory();
    if (cached) return cached;
    return [makeMsg("assistant", "AI sẵn sàng. Nhập tin nhắn để chat.")];
  });

  const bottomRef = useRef(null);
  const scrollDown = () => bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });

  useEffect(() => {
    saveHistory(messages);
  }, [messages]);

  useEffect(() => {
    if (open && !minimized) setTimeout(scrollDown, 0);
  }, [open, minimized]);

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

    setErrText("");
    push(makeMsg("user", text));
    setInput("");
    setBusy(true);

    try {
      const res = await aiApi.chat({ message: text, context });
      const ans = extractChatText(res?.data ?? res) || "Không có nội dung trả lời từ chatbot.";
      push(makeMsg("assistant", ans));
    } catch (e) {
      const err = normalizeApiError(e);
      const t = errorToText(err);
      setErrText(t);
      push(makeMsg("assistant", t));
    } finally {
      setBusy(false);
    }
  };

  const clear = () => {
    setMessages([makeMsg("assistant", "Đã xóa lịch sử chat.")]);
    setErrText("");
    try { localStorage.removeItem("ml_ai_widget_history"); } catch {}
  };

  // Close on ESC
  useEffect(() => {
    const onKey = (ev) => {
      if (ev.key === "Escape") {
        setOpen(false);
        setMinimized(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const ui = (
    <div className="ai-portal-layer">
      {!open ? (
        <button className="ai-float-btn" onClick={() => setOpen(true)} aria-label="Open AI Chat" type="button">
          <span className="ai-float-btn__icon" aria-hidden="true">💬</span>
          <span className="ai-float-btn__text">AI</span>
        </button>
      ) : (
        <div className={`ai-widget ${minimized ? "is-minimized" : ""}`} role="dialog" aria-label="AI Chat">
          <div className="ai-widget__head">
            <div className="ai-widget__title">
              <span className="ai-widget__dot" aria-hidden="true" />
              <span>MoneyLover AI</span>
            </div>

            <div className="ai-widget__headActions">
              <button className="ai-widget__iconBtn" onClick={() => nav("/ai")} title="Mở trang AI" type="button">↗</button>
              <button
                className="ai-widget__iconBtn"
                onClick={() => setMinimized((v) => !v)}
                title={minimized ? "Mở rộng" : "Thu nhỏ"}
                type="button"
              >
                {minimized ? "▢" : "—"}
              </button>
              <button
                className="ai-widget__iconBtn"
                onClick={() => { setOpen(false); setMinimized(false); }}
                title="Đóng"
                type="button"
              >
                ✕
              </button>
            </div>
          </div>

          {!minimized ? (
            <>
              <div className="ai-widget__body">
                {messages.map((m) => (
                  <div key={m.id} className={`ai-widget__msg ai-widget__msg--${m.role}`}>
                    <div className="ai-widget__bubble">{m.text}</div>
                    <div className="ai-widget__meta">{new Date(m.at).toLocaleTimeString("vi-VN")}</div>
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>

              <div className="ai-widget__foot">
                {errText ? <div className="ai-widget__error">{errText}</div> : null}

                <div className="ai-widget__compose">
                  <textarea
                    className="ai-widget__input"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        send();
                      }
                    }}
                    placeholder="Nhập tin nhắn... (Enter để gửi)"
                    rows={2}
                  />
                  <button className="ai-widget__send" onClick={send} disabled={busy || !input.trim()} type="button">
                    {busy ? "..." : "Gửi"}
                  </button>
                </div>

                <div className="ai-widget__tools">
                  <button className="ai-widget__toolBtn" onClick={clear} type="button">Xóa chat</button>
                  <button className="ai-widget__toolBtn" onClick={() => nav("/ai")} type="button">Phân tích tại /ai</button>
                </div>
              </div>
            </>
          ) : null}
        </div>
      )}
    </div>
  );

  if (!portalRoot) return ui;
  return createPortal(ui, portalRoot);
}
