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
  el.style.pointerEvents = "none"; // ✅ quan trọng: không chặn click dưới
  el.style.zIndex = "2147483647";
  document.body.appendChild(el);
  return el;
}

export default function AiChatWidget({
  userKey: userKeyProp,
  bottomOffset = 104, // ✅ tăng/giảm để tránh che FAB "Thêm giao dịch"
  rightOffset = 16,
}) {
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
    setMessages([makeMsg("assistant", "✅ Đã xóa lịch sử chat.")]);
    setErrText("");
    try {
      localStorage.removeItem(key);
    } catch {}
  };

  const ui = (
    // ✅ Layer full-screen: pointer-events NONE (xuyên click)
    <div className="fixed inset-0 pointer-events-none z-[2147483647]">
      {/* ===== Closed: floating bubble ===== */}
      {!open ? (
        <button
          type="button"
          aria-label="Open AI"
          onClick={() => setOpen(true)}
          className="
            pointer-events-auto fixed
            w-14 h-14 rounded-full
            shadow-xl shadow-emerald-500/20
            bg-gradient-to-br from-emerald-500 to-teal-500
            hover:brightness-105 active:scale-[0.98]
            grid place-items-center
            transition
          "
          style={bottomStyle}
        >
          <span className="text-white text-xl select-none">💬</span>

          {hasUnreadDot ? (
            <span
              className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-red-500 ring-2 ring-white"
              aria-hidden="true"
            />
          ) : null}
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
          ) : (
            /* ===== Expanded widget ===== */
            <div
              className="
                pointer-events-auto fixed
                w-[calc(100vw-2rem)] sm:w-[380px]
                h-[78vh] sm:h-[560px]
                left-4 sm:left-auto
                rounded-3xl
                shadow-2xl shadow-black/10
                border border-emerald-100/60 dark:border-white/10
                bg-white/95 dark:bg-zinc-900/95 backdrop-blur
                overflow-hidden
                translate-y-0 opacity-100
                transition duration-200
              "
              style={bottomStyle}
              role="dialog"
              aria-label="AI Chat"
            >
              {/* Header */}
              <div className="px-4 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-white/15 grid place-items-center">
                      <span className="text-lg">🤖</span>
                    </div>
                    <div className="leading-tight">
                      <div className="font-semibold">MoneyLover AI</div>
                      <div className="text-xs text-white/80">Trợ lý tài chính • phản hồi ngắn gọn</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      className="px-2 py-1 rounded-lg text-sm hover:bg-white/10"
                      onClick={() => nav("/ai")}
                      title="Mở trang AI"
                    >
                      ↗
                    </button>
                    <button
                      type="button"
                      className="px-2 py-1 rounded-lg text-sm hover:bg-white/10"
                      onClick={() => setMinimized(true)}
                      title="Thu nhỏ"
                    >
                      —
                    </button>
                    <button
                      type="button"
                      className="px-2 py-1 rounded-lg text-sm hover:bg-white/10"
                      onClick={() => {
                        setOpen(false);
                        setMinimized(false);
                      }}
                      title="Đóng"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              </div>

              {/* Body */}
              <div className="h-[calc(100%-168px)] sm:h-[calc(100%-168px)] px-3 py-3 overflow-y-auto">
                <div className="space-y-3">
                  {messages.map((m) => {
                    const isUser = m.role === "user";
                    const isAssistant = m.role === "assistant";
                    return (
                      <div key={m.id} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[85%]`}>
                          <div
                            className={[
                              "px-3 py-2 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap",
                              isUser
                                ? "bg-emerald-500 text-white rounded-br-md"
                                : isAssistant
                                ? "bg-zinc-100 text-zinc-900 dark:bg-white/10 dark:text-zinc-50 rounded-bl-md"
                                : "bg-amber-50 text-amber-900 dark:bg-amber-500/10 dark:text-amber-200",
                            ].join(" ")}
                          >
                            {m.text}
                          </div>
                          <div
                            className={[
                              "mt-1 text-[11px] opacity-70",
                              isUser ? "text-right text-zinc-500 dark:text-zinc-400" : "text-zinc-500 dark:text-zinc-400",
                            ].join(" ")}
                          >
                            {new Date(m.at).toLocaleTimeString("vi-VN")}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  <div ref={bottomRef} />
                </div>
              </div>

              {/* Footer */}
              <div className="px-3 py-3 border-t border-emerald-100/60 dark:border-white/10">
                {errText ? (
                  <div className="mb-2 text-xs text-red-600 dark:text-red-300 bg-red-50 dark:bg-red-500/10 px-3 py-2 rounded-xl">
                    {errText}
                  </div>
                ) : null}

                <div className="flex items-end gap-2">
                  <textarea
                    className="
                      flex-1 min-h-[44px] max-h-[110px] resize-none
                      px-3 py-2 rounded-2xl
                      bg-zinc-100 dark:bg-white/10
                      text-zinc-900 dark:text-zinc-50
                      placeholder:text-zinc-500 dark:placeholder:text-zinc-400
                      outline-none focus:ring-2 focus:ring-emerald-400/60
                    "
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        send();
                      }
                    }}
                    placeholder="Nhập tin nhắn… (Enter để gửi, Shift+Enter xuống dòng)"
                    rows={2}
                  />

                  <button
                    type="button"
                    onClick={send}
                    disabled={busy || !input.trim()}
                    className="
                      h-[44px] px-4 rounded-2xl font-semibold
                      bg-emerald-500 text-white
                      hover:brightness-105 active:scale-[0.99]
                      disabled:opacity-50 disabled:cursor-not-allowed
                      transition
                    "
                    title="Gửi"
                  >
                    {busy ? "..." : "Gửi"}
                  </button>
                </div>

                <div className="mt-2 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={clear}
                    className="text-xs px-3 py-1.5 rounded-xl
                      text-zinc-600 dark:text-zinc-300
                      hover:bg-zinc-100 dark:hover:bg-white/5 transition"
                  >
                    Xóa chat
                  </button>

                  <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    Esc để đóng
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );

  return portalRoot ? createPortal(ui, portalRoot) : ui;
}
