import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { aiApi, normalizeApiError } from "../../services/api.ai";
import "../../styles/ai.css";
import {
  extractChatText,
  errorToText,
  buildAiSnapshot,
  snapshotToSystemText,
  compactReply,
  monthValueNow,
} from "./aiText";

const SYSTEM_RULES =
  "QUY TẮC TRẢ LỜI: Không chào hỏi. Không dùng markdown. Không bịa số liệu. Chỉ dùng số trong DATA_TEXT/DATA_JSON. Nếu thiếu dữ liệu thì ghi đúng câu: Không đủ dữ liệu để xác minh. Trả lời theo format:\n- Tóm tắt: (1-2 dòng)\n- Điểm chính: tối đa 3 gạch đầu dòng\n- Hành động: tối đa 3 gạch đầu dòng\nTối đa 8 dòng.";

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

function decodeJwtPayload(token) {
  try {
    const parts = String(token || "").split(".");
    if (parts.length < 2) return null;
    const b64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = b64.padEnd(b64.length + (4 - (b64.length % 4 || 4)) % 4, "=");
    const json = atob(padded);
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function inferUserKey() {
  const candidates = [
    localStorage.getItem("access_token"),
    localStorage.getItem("accessToken"),
    localStorage.getItem("token"),
    localStorage.getItem("jwt"),
    localStorage.getItem("ml_token"),
  ].filter(Boolean);

  for (const t of candidates) {
    const p = decodeJwtPayload(t);
    const id = p?._id || p?.userId || p?.id || p?.sub || p?.uid;
    if (id) return String(id);
  }
  return "anonymous";
}

function storageKey(userKey) {
  return `ml_ai_widget_history::${userKey || "anonymous"}`;
}

function loadHistory(key) {
  try {
    const raw = localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : null;
    if (Array.isArray(parsed)) return parsed.slice(-50);
  } catch {}
  return null;
}

function saveHistory(key, list) {
  try {
    localStorage.setItem(key, JSON.stringify(list.slice(-50)));
  } catch {}
}

function ensurePortalRoot() {
  const id = "ml-ai-portal-root";
  let el = document.getElementById(id);
  if (el) return el;

  el = document.createElement("div");
  el.id = id;
  el.style.position = "fixed";
  el.style.inset = "0";
  el.style.pointerEvents = "none";
  el.style.zIndex = "2147483647";
  document.body.appendChild(el);
  return el;
}

export default function AiChatWidget({ userKey: userKeyProp }) {
  const nav = useNavigate();

  const portalRoot = useMemo(() => {
    if (typeof document === "undefined") return null;
    return ensurePortalRoot();
  }, []);

  const userKey = useMemo(() => userKeyProp || inferUserKey(), [userKeyProp]);
  const key = useMemo(() => storageKey(userKey), [userKey]);

  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [busy, setBusy] = useState(false);
  const [input, setInput] = useState("");
  const [errText, setErrText] = useState("");

  const [messages, setMessages] = useState(() => {
    const cached = loadHistory(key);
    if (cached) return cached;
    return [makeMsg("assistant", "AI sẵn sàng.")];
  });

  useEffect(() => {
    const cached = loadHistory(key);
    setMessages(cached || [makeMsg("assistant", "AI sẵn sàng.")]);
    setErrText("");
  }, [key]);

  const bottomRef = useRef(null);
  const scrollDown = () =>
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });

  useEffect(() => {
    saveHistory(key, messages);
  }, [key, messages]);

  useEffect(() => {
    if (open && !minimized) setTimeout(scrollDown, 0);
  }, [open, minimized]);

  const tailContext = useMemo(() => {
    return messages.slice(-10).map((m) => ({ role: m.role, text: m.text, at: m.at }));
  }, [messages]);

  const push = (msg) => {
    setMessages((prev) => [...prev, msg]);
    setTimeout(scrollDown, 0);
  };

  const buildContext = async () => {
    const snapshot = await buildAiSnapshot({ aiApi, monthValue: monthValueNow() });
    return [
      { role: "system", text: SYSTEM_RULES },
      { role: "system", text: snapshotToSystemText(snapshot) },
      ...tailContext,
    ];
  };

  const send = async () => {
    const text = input.trim();
    if (!text || busy) return;

    setErrText("");
    push(makeMsg("user", text));
    setInput("");
    setBusy(true);

    try {
      const context = await buildContext();
      const res = await aiApi.chat({ message: text, context });
      const raw = extractChatText(res?.data ?? res) || "Không đủ dữ liệu để xác minh.";
      push(makeMsg("assistant", compactReply(raw, 8) || "Không đủ dữ liệu để xác minh."));
    } catch (e) {
      const err = normalizeApiError(e);
      const t = errorToText(err);
      setErrText(t);
      push(makeMsg("assistant", "Lỗi: " + t));
    } finally {
      setBusy(false);
    }
  };

  const clear = () => {
    setMessages([makeMsg("assistant", "Đã xóa lịch sử chat.")]);
    setErrText("");
    try { localStorage.removeItem(key); } catch {}
  };

  const ui = (
    <div className="ai-portal-layer">
      {!open ? (
        <button className="ai-float-bubble" onClick={() => setOpen(true)} aria-label="Open AI" type="button">
          <span className="ai-float-bubble__icon" aria-hidden="true">💬</span>
        </button>
      ) : (
        <div className={`ai-widget ai-widget--messenger ${minimized ? "is-minimized" : ""}`} role="dialog" aria-label="AI Chat">
          <div className="ai-widget__head ai-widget__head--messenger">
            <div className="ai-widget__title">
              <span className="ai-widget__dot" aria-hidden="true" />
              <span>MoneyLover AI</span>
            </div>

            <div className="ai-widget__headActions">
              <button className="ai-widget__iconBtn" onClick={() => nav("/ai")} title="Mở trang AI" type="button">↗</button>
              <button className="ai-widget__iconBtn" onClick={() => setMinimized((v) => !v)} title={minimized ? "Mở rộng" : "Thu nhỏ"} type="button">
                {minimized ? "▢" : "—"}
              </button>
              <button className="ai-widget__iconBtn" onClick={() => { setOpen(false); setMinimized(false); }} title="Đóng" type="button">✕</button>
            </div>
          </div>

          {!minimized ? (
            <>
              <div className="ai-widget__body ai-widget__body--messenger">
                {messages.map((m) => (
                  <div key={m.id} className={`ai-widget__msg ai-widget__msg--${m.role}`}>
                    <div className="ai-widget__bubble">{m.text}</div>
                    <div className="ai-widget__meta">{new Date(m.at).toLocaleTimeString("vi-VN")}</div>
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>

              <div className="ai-widget__foot ai-widget__foot--messenger">
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
                    placeholder="Nhập tin nhắn..."
                    rows={2}
                  />
                  <button className="ai-widget__send" onClick={send} disabled={busy || !input.trim()} type="button">
                    {busy ? "..." : "Gửi"}
                  </button>
                </div>

                <div className="ai-widget__tools">
                  <button className="ai-widget__toolBtn" onClick={clear} type="button">Xóa chat</button>
                </div>
              </div>
            </>
          ) : null}
        </div>
      )}
    </div>
  );

  return portalRoot ? createPortal(ui, portalRoot) : ui;
}
