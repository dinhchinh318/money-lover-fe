import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { aiApi, normalizeApiError } from "../../services/api.ai";
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
  el.style.pointerEvents = "none"; // quan trọng: root không chặn click trang
  el.style.zIndex = "2147483647";
  document.body.appendChild(el);
  return el;
}

function timeVi(iso) {
  try {
    return new Date(iso).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

/**
 * AiChatWidget (Tailwind UI)
 * - Không dùng ai.css
 * - Portal root pointerEvents none, widget pointerEvents auto
 * - Mặc định bottomOffset=96 để tránh đè nút + Transaction (thường ở bottom-6/8)
 */
export default function AiChatWidget({
  userKey: userKeyProp,
  bottomOffset = 96, // ✅ tăng/giảm để né nút + Transaction (px)
  rightOffset = 16,  // px
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

  useEffect(() => {
    saveHistory(key, messages);
  }, [key, messages]);

  const bottomRef = useRef(null);
  const scrollDown = () => bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });

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
    try {
      localStorage.removeItem(key);
    } catch {}
  };

  // ✅ “né” FAB: dùng env(safe-area-inset-bottom) + bottomOffset (px)
  const anchorStyle = {
    right: `calc(${rightOffset}px + env(safe-area-inset-right, 0px))`,
    bottom: `calc(${bottomOffset}px + env(safe-area-inset-bottom, 0px))`,
  };

  const ui = (
    <div className="pointer-events-none fixed inset-0 z-[2147483647]">
      {/* FAB closed */}
      {!open ? (
        <div className="pointer-events-auto fixed" style={anchorStyle}>
          <button
            type="button"
            aria-label="Open AI"
            onClick={() => setOpen(true)}
            className="
              group relative grid h-14 w-14 place-items-center rounded-full
              bg-emerald-500 text-white shadow-lg shadow-emerald-500/25
              ring-1 ring-black/5
              transition active:scale-[0.98] hover:brightness-105
            "
          >
            <span className="text-[20px] leading-none">💬</span>

            {/* subtle ping */}
            <span className="absolute -inset-1 rounded-full bg-emerald-500/20 blur-md opacity-0 group-hover:opacity-100 transition" />
          </button>
        </div>
      ) : (
        <div className="pointer-events-auto fixed" style={anchorStyle}>
          {/* minimized pill */}
          {minimized ? (
            <div
              className="
                flex items-center gap-2 rounded-full bg-white/95 dark:bg-neutral-900/95
                px-3 py-2 shadow-xl ring-1 ring-black/5 dark:ring-white/10 backdrop-blur
              "
            >
              <div className="flex items-center gap-2">
                <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                <span className="text-sm font-semibold text-neutral-800 dark:text-neutral-100">
                  MoneyLover AI
                </span>
              </div>

              <button
                type="button"
                onClick={() => setMinimized(false)}
                className="
                  rounded-full px-2 py-1 text-xs font-medium
                  bg-emerald-50 text-emerald-700 hover:bg-emerald-100
                  dark:bg-emerald-500/10 dark:text-emerald-300 dark:hover:bg-emerald-500/20
                "
              >
                Mở
              </button>

              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  setMinimized(false);
                }}
                className="
                  rounded-full px-2 py-1 text-xs font-medium
                  bg-neutral-100 text-neutral-700 hover:bg-neutral-200
                  dark:bg-white/10 dark:text-neutral-200 dark:hover:bg-white/15
                "
              >
                ✕
              </button>
            </div>
          ) : (
            // opened card / mobile sheet
            <div
              className="
                w-[92vw] max-w-[420px]
                rounded-3xl bg-white/95 dark:bg-neutral-950/95
                shadow-2xl ring-1 ring-black/5 dark:ring-white/10
                backdrop-blur overflow-hidden
                sm:w-[380px]
              "
            >
              {/* Header */}
              <div
                className="
                  flex items-center justify-between
                  px-4 py-3
                  bg-gradient-to-r from-emerald-600 to-emerald-500
                  text-white
                "
              >
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-2 w-2 rounded-full bg-white/90" />
                  <div className="leading-tight">
                    <div className="text-sm font-semibold">MoneyLover AI</div>
                    <div className="text-[11px] text-white/85">Trả lời theo dữ liệu hệ thống</div>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    title="Mở trang AI"
                    onClick={() => nav("/ai")}
                    className="rounded-full px-2 py-1 text-sm hover:bg-white/15 active:bg-white/20"
                  >
                    ↗
                  </button>

                  <button
                    type="button"
                    title="Thu nhỏ"
                    onClick={() => setMinimized(true)}
                    className="rounded-full px-2 py-1 text-sm hover:bg-white/15 active:bg-white/20"
                  >
                    —
                  </button>

                  <button
                    type="button"
                    title="Đóng"
                    onClick={() => {
                      setOpen(false);
                      setMinimized(false);
                    }}
                    className="rounded-full px-2 py-1 text-sm hover:bg-white/15 active:bg-white/20"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Body */}
              <div className="h-[58vh] max-h-[520px] sm:h-[440px] overflow-y-auto px-3 py-3">
                {messages.map((m) => {
                  const isUser = m.role === "user";
                  return (
                    <div key={m.id} className={`mb-2 flex ${isUser ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[85%] ${isUser ? "text-right" : "text-left"}`}>
                        <div
                          className={[
                            "inline-block rounded-2xl px-3 py-2 text-[13px] leading-relaxed",
                            isUser
                              ? "bg-emerald-600 text-white shadow-sm"
                              : "bg-neutral-100 text-neutral-800 dark:bg-white/10 dark:text-neutral-100",
                          ].join(" ")}
                        >
                          {m.text}
                        </div>
                        <div className="mt-1 text-[10px] text-neutral-500 dark:text-neutral-400">
                          {timeVi(m.at)}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>

              {/* Footer */}
              <div className="border-t border-black/5 dark:border-white/10 px-3 py-3">
                {errText ? (
                  <div
                    className="
                      mb-2 rounded-2xl px-3 py-2 text-[12px]
                      bg-rose-50 text-rose-700
                      dark:bg-rose-500/10 dark:text-rose-200
                    "
                  >
                    {errText}
                  </div>
                ) : null}

                <div className="flex items-end gap-2">
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        send();
                      }
                    }}
                    rows={2}
                    placeholder="Nhập tin nhắn..."
                    className="
                      flex-1 resize-none rounded-2xl px-3 py-2 text-[13px]
                      bg-neutral-100 text-neutral-900 placeholder:text-neutral-400
                      ring-1 ring-black/5 focus:outline-none focus:ring-2 focus:ring-emerald-500/60
                      dark:bg-white/10 dark:text-white dark:placeholder:text-white/40 dark:ring-white/10
                    "
                  />

                  <button
                    type="button"
                    onClick={send}
                    disabled={busy || !input.trim()}
                    className="
                      h-10 shrink-0 rounded-2xl px-4 text-sm font-semibold
                      bg-emerald-600 text-white shadow-sm
                      hover:bg-emerald-700 active:scale-[0.99]
                      disabled:opacity-50 disabled:cursor-not-allowed
                    "
                  >
                    {busy ? "..." : "Gửi"}
                  </button>
                </div>

                <div className="mt-2 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={clear}
                    className="
                      rounded-full px-3 py-1.5 text-[12px] font-medium
                      bg-neutral-100 text-neutral-700 hover:bg-neutral-200
                      dark:bg-white/10 dark:text-neutral-200 dark:hover:bg-white/15
                    "
                  >
                    Xóa chat
                  </button>

                  <button
                    type="button"
                    onClick={() => setMinimized(true)}
                    className="
                      rounded-full px-3 py-1.5 text-[12px] font-medium
                      bg-emerald-50 text-emerald-700 hover:bg-emerald-100
                      dark:bg-emerald-500/10 dark:text-emerald-300 dark:hover:bg-emerald-500/20
                    "
                  >
                    Thu nhỏ
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );

  return portalRoot ? createPortal(ui, portalRoot) : ui;
}
