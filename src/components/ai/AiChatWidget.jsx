import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { aiApi, normalizeApiError } from "../../services/api.ai";
import "../../styles/ai.css";
import { extractChatText, errorToText } from "./aiText";

/**
 * AiChatWidget (Messenger-like, responsive)
 * - Portal to body (avoid overlay/overflow blocking clicks)
 * - Minimized state shows a compact bottom bar like Messenger
 * - Mobile: opens as full-screen bottom sheet (100dvh)
 * - History stored per-user (avoid account A seeing account B on same browser)
 */

const SYSTEM_STYLE = "Trả lời ngắn gọn (<= 6 dòng hoặc 5 gạch đầu dòng).";

function nowIso() {
  return new Date().toISOString();
}

function makeMsg(role, text) {
  return {
    id: `${role}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    role, // user | assistant | system
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
    return [makeMsg("assistant", "AI sẵn sàng. Nhập tin nhắn để chat.")];
  });

  // Reload history when user changes (logout/login another account)
  useEffect(() => {
    const cached = loadHistory(key);
    setMessages(cached || [makeMsg("assistant", "AI sẵn sàng. Nhập tin nhắn để chat.")]);
    setErrText("");
  }, [key]);

  const bottomRef = useRef(null);
  const scrollDown = () => bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });

  useEffect(() => {
    saveHistory(key, messages);
  }, [key, messages]);

  useEffect(() => {
    if (open && !minimized) setTimeout(scrollDown, 0);
  }, [open, minimized]);

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

    setErrText("");
    push(makeMsg("user", text));
    setInput("");
    setBusy(true);

    try {
      const res = await aiApi.chat({ message: text, context });
      const ans = extractChatText(res?.data ?? res) || "Không có nội dung trả lời.";
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
    try { localStorage.removeItem(key); } catch {}
  };

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
        <button className="ai-float-bubble" onClick={() => setOpen(true)} aria-label="Open AI" type="button">
          <span className="ai-float-bubble__icon" aria-hidden="true">💬</span>
        </button>
      ) : (
        <div className={`ai-widget ai-widget--messenger ${minimized ? "is-minimized" : ""}`} role="dialog" aria-label="AI Chat">
          <div
            className="ai-widget__head ai-widget__head--messenger"
            onClick={() => { if (minimized) setMinimized(false); }}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (minimized && (e.key === "Enter" || e.key === " ")) setMinimized(false);
            }}
          >
            <div className="ai-widget__title">
              <span className="ai-widget__dot" aria-hidden="true" />
              <span>MoneyLover AI</span>
            </div>

            <div className="ai-widget__headActions">
              <button className="ai-widget__iconBtn" onClick={(e) => { e.stopPropagation(); nav("/ai"); }} title="Mở trang AI" type="button">↗</button>
              <button
                className="ai-widget__iconBtn"
                onClick={(e) => { e.stopPropagation(); setMinimized((v) => !v); }}
                title={minimized ? "Mở rộng" : "Thu nhỏ"}
                type="button"
              >
                {minimized ? "▢" : "—"}
              </button>
              <button className="ai-widget__iconBtn" onClick={(e) => { e.stopPropagation(); setOpen(false); setMinimized(false); }} title="Đóng" type="button">✕</button>
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
