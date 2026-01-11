import React, { useMemo, useRef, useState } from "react";
import { aiApi, normalizeApiError } from "../../services/api.ai";
import "../../styles/ai.css";

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

const VND = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
});

function money(x) {
  return typeof x === "number" && Number.isFinite(x) ? VND.format(x) : null;
}

function monthValueNow() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function monthRangeYMD(monthValue) {
  const [yStr, mStr] = String(monthValue || "").split("-");
  const y = Number(yStr);
  const m = Number(mStr);
  if (!Number.isFinite(y) || !Number.isFinite(m) || m < 1 || m > 12) return null;

  const last = new Date(y, m, 0).getDate();
  const mm = String(m).padStart(2, "0");
  const dd = String(last).padStart(2, "0");
  return { startDate: `${y}-${mm}-01`, endDate: `${y}-${mm}-${dd}`, days: last };
}

function extractText(res) {
  const d = res?.data ?? res;
  if (typeof d === "string") return d;
  if (typeof d?.answer === "string") return d.answer;
  if (typeof d?.reply === "string") return d.reply;
  if (typeof res?.answer === "string") return res.answer;
  if (typeof res?.reply === "string") return res.reply;
  return "";
}

/**
 * Nếu AI trả về dạng:
 * 1) ... 2) ... 3) ... rồi lại 1) ... (khuyến nghị)
 * => chèn đề mục lớn chung để hiểu 1/2/3 đang nói về gì.
 */
function addTopicHeadings(text) {
  const t = String(text || "").replace(/\r/g, "").trim();
  if (!t) return "";

  const lines = t.split("\n");
  const firstIdx = lines.findIndex((l) => /^\s*1[.)]\s+/.test(l));
  if (firstIdx === -1) return t;

  // nếu chưa có đề mục tổng
  const before = lines.slice(0, firstIdx).join(" ").toLowerCase();
  const already =
    before.includes("chủ đề") ||
    before.includes("vấn đề") ||
    before.includes("điểm chính") ||
    before.includes("tổng quan");
  if (!already) {
    lines.splice(firstIdx, 0, "Chủ đề: Các vấn đề phát hiện (mục 1–3).");
  }

  // tìm list thứ 2 (reset về 1)
  let seen2 = false;
  let secondIdx = -1;
  for (let i = firstIdx + 1; i < lines.length; i++) {
    if (/^\s*2[.)]\s+/.test(lines[i])) seen2 = true;
    if (/^\s*1[.)]\s+/.test(lines[i]) && seen2) {
      secondIdx = i;
      break;
    }
  }

  if (secondIdx !== -1) {
    const prev = (lines[secondIdx - 1] || "").toLowerCase();
    const hasHeading = prev.includes("khuyến nghị") || prev.includes("hành động") || prev.includes("gợi ý");
    if (!hasHeading) lines.splice(secondIdx, 0, "Khuyến nghị:");
  }

  return lines.join("\n").trim();
}

function compact(text, maxLines = 10) {
  const s = String(text || "").replace(/\r/g, "").trim();
  if (!s) return "";
  const lines = s.split("\n").map((l) => l.trim()).filter(Boolean);
  return lines.slice(0, maxLines).join("\n");
}

function arrData(x) {
  if (Array.isArray(x)) return x;
  if (Array.isArray(x?.data)) return x.data;
  if (Array.isArray(x?.data?.data)) return x.data.data;
  return [];
}

function safeFn(fn) {
  return typeof fn === "function";
}

async function safeCall(fn, ...args) {
  if (!safeFn(fn)) return null;
  const res = await fn(...args);
  return res?.data ?? res;
}

function errorToText(err) {
  if (!err) return "Lỗi không xác định.";
  const msg =
    (typeof err?.message === "string" && err.message) ||
    (typeof err?.error === "string" && err.error) ||
    (typeof err?.data?.message === "string" && err.data.message) ||
    "Lỗi không xác định.";
  return msg;
}

function formatMonthlyReport({ range, dashboard, categories }) {
  const d = dashboard || {};
  const cats = arrData(categories);

  const lines = ["Báo cáo tháng:"];
  lines.push(`- Kỳ: ${range.startDate} → ${range.endDate}`);

  if (typeof d.totalIncome === "number") lines.push(`- Tổng thu: ${money(d.totalIncome)}`);
  else lines.push("- Tổng thu: Không đủ dữ liệu để xác minh.");

  if (typeof d.totalExpense === "number") lines.push(`- Tổng chi: ${money(d.totalExpense)}`);
  else lines.push("- Tổng chi: Không đủ dữ liệu để xác minh.");

  if (typeof d.balance === "number") lines.push(`- Chênh lệch: ${money(d.balance)}`);
  else lines.push("- Chênh lệch: Không đủ dữ liệu để xác minh.");

  if (cats.length) {
    const sorted = [...cats].sort((a, b) => (b?.totalAmount || 0) - (a?.totalAmount || 0));
    lines.push("Top danh mục chi:");
    sorted.slice(0, 5).forEach((c) => {
      const name = c?.categoryName || "Không rõ";
      const icon = c?.categoryIcon ? `${c.categoryIcon} ` : "";
      const amt =
        typeof c?.totalAmount === "number"
          ? money(c.totalAmount)
          : "Không đủ dữ liệu để xác minh.";
      lines.push(`- ${icon}${name}: ${amt}`);
    });
  } else {
    lines.push("Top danh mục chi: Không đủ dữ liệu để xác minh.");
  }

  return lines.join("\n");
}

function budgetsNormalized(budgets) {
  const list = arrData(budgets);
  return list
    .map((b) => ({
      categoryId: b?.categoryId || b?.category?._id,
      categoryName: b?.categoryName || b?.category?.name,
      amount: typeof b?.amount === "number" ? b.amount : (typeof b?.limit === "number" ? b.limit : null),
      startDate: b?.startDate,
      endDate: b?.endDate,
    }))
    .filter((x) => x.categoryId || x.categoryName);
}

function overlap(aStart, aEnd, bStart, bEnd) {
  const aS = aStart ? new Date(aStart).getTime() : NaN;
  const aE = aEnd ? new Date(aEnd).getTime() : NaN;
  const bS = bStart ? new Date(bStart).getTime() : NaN;
  const bE = bEnd ? new Date(bEnd).getTime() : NaN;
  if (!Number.isFinite(aS) || !Number.isFinite(aE) || !Number.isFinite(bS) || !Number.isFinite(bE)) return false;
  return aS <= bE && bS <= aE;
}

function formatIssuesWithTopic({ range, dashboard, categories, budgets, wallets, recentTx }) {
  const d = dashboard || {};
  const cats = arrData(categories);
  const bds = budgetsNormalized(budgets);
  const wls = arrData(wallets);
  const txs = arrData(recentTx);

  const income = typeof d.totalIncome === "number" ? d.totalIncome : null;
  const expense = typeof d.totalExpense === "number" ? d.totalExpense : null;
  const balance =
    typeof d.balance === "number" ? d.balance : (income != null && expense != null ? income - expense : null);

  const walletTotal = wls.reduce((s, w) => s + (typeof w?.balance === "number" ? w.balance : 0), 0);
  const txCount = txs.length;

  const lines = [];
  lines.push(`Chủ đề: Đánh giá dữ liệu & kiểm soát ngân sách (${range.startDate} → ${range.endDate})`);

  const summary = [];
  if (income != null) summary.push(`Thu ${money(income)}`);
  if (expense != null) summary.push(`Chi ${money(expense)}`);
  if (balance != null) summary.push(`Chênh lệch ${money(balance)}`);
  if (Number.isFinite(walletTotal) && walletTotal > 0) summary.push(`Số dư ví ${money(walletTotal)}`);
  if (summary.length) lines.push(`Tóm tắt: ${summary.join(" • ")}`);

  // 1) Chất lượng dữ liệu giao dịch
  const hasAgg = income != null || expense != null || balance != null;
  if (!hasAgg && txCount === 0) {
    lines.push(`1) Thiếu dữ liệu giao dịch trong kỳ`);
    lines.push(`- Bằng chứng: Danh sách giao dịch gần nhất trả về 0 bản ghi.`);
    lines.push(`- Hệ quả: Không thể phân tích theo danh mục/xu hướng vì không có dữ liệu đầu vào.`);
    lines.push(`- Hành động: Nhập/đồng bộ giao dịch (thu & chi) trong kỳ rồi chạy lại báo cáo/phân tích.`);
  } else if (hasAgg && txCount === 0) {
    lines.push(`1) Bất nhất giữa số liệu tổng hợp và danh sách giao dịch`);
    lines.push(
      `- Bằng chứng: Báo cáo tổng hợp có số (Thu ${income != null ? money(income) : "N/A"}, Chi ${
        expense != null ? money(expense) : "N/A"
      }) nhưng danh sách giao dịch gần nhất trả về 0 bản ghi.`
    );
    lines.push(`- Hệ quả: Phân tích chi tiết theo từng giao dịch sẽ sai/thiếu; cảnh báo theo giao dịch không hoạt động.`);
    lines.push(
      `- Hành động: Kiểm tra endpoint list giao dịch có filter theo kỳ không; đảm bảo cùng userId, timezone, và cùng điều kiện lọc ngày với báo cáo.`
    );
  }

  // 2) Phủ ngân sách cho danh mục chi lớn
  if (cats.length) {
    const budgetCatIds = new Set(bds.map((b) => String(b.categoryId || "")).filter(Boolean));
    const topCats = [...cats].sort((a, b) => (b?.totalAmount || 0) - (a?.totalAmount || 0));
    const missing = topCats
      .filter((c) => {
        const cid = String(c?._id || c?.categoryId || "");
        return cid && !budgetCatIds.has(cid);
      })
      .slice(0, 3);

    if (missing.length) {
      lines.push(`2) Danh mục chi lớn chưa có ngân sách để kiểm soát`);
      lines.push(
        `- Bằng chứng: ${missing
          .map((c) => `${c?.categoryName || "Không rõ"} ${typeof c?.totalAmount === "number" ? money(c.totalAmount) : "N/A"}`)
          .join(" • ")}`
      );
      lines.push(`- Hệ quả: Không có ngưỡng so sánh “đã chi / còn lại”, khó phát hiện vượt chi sớm.`);
      lines.push(`- Hành động: Tạo ngân sách cho các danh mục trên (1 ngân sách/danh mục/kỳ, không chồng lấn).`);
    }
  }

  // 3) Mục tiêu dòng tiền
  if ((income != null && expense != null) || (Number.isFinite(walletTotal) && walletTotal > 0)) {
    lines.push(`3) Thiếu mục tiêu dòng tiền để dẫn hướng ngân sách`);
    const ev = [];
    if (income != null) ev.push(`Thu ${money(income)}`);
    if (expense != null) ev.push(`Chi ${money(expense)}`);
    if (balance != null) ev.push(`Chênh lệch ${money(balance)}`);
    if (Number.isFinite(walletTotal) && walletTotal > 0) ev.push(`Số dư ví ${money(walletTotal)}`);
    lines.push(`- Bằng chứng: ${ev.join(" • ")}`);
    lines.push(`- Hệ quả: Ngân sách khó ra quyết định (cắt giảm ở đâu / dành bao nhiêu cho mục tiêu).`);
    lines.push(`- Hành động: Đặt mục tiêu tiết kiệm/tháng + trần chi theo tháng; sau đó phân bổ ngân sách theo Top danh mục chi.`);
  }

  if (lines.length <= 2) return "Không đủ dữ liệu để xác minh.";
  return lines.join("\n");
}

function formatAlertsDeterministic({ dashboard, categories }) {
  const d = dashboard || {};
  const cats = arrData(categories);

  const lines = ["Chủ đề: Cảnh báo sớm dựa trên dữ liệu tháng đang chọn."];
  let count = 0;

  if (typeof d.balance === "number" && d.balance < 0) {
    lines.push(`1) Chi vượt thu trong kỳ`);
    lines.push(`- Dấu hiệu: Chênh lệch âm = ${money(d.balance)}.`);
    count++;
  }

  if (typeof d.totalExpense === "number" && d.totalExpense > 0 && cats.length) {
    const top = [...cats].sort((a, b) => (b?.totalAmount || 0) - (a?.totalAmount || 0))[0];
    if (top?.totalAmount && top.totalAmount / d.totalExpense >= 0.5) {
      const share = (top.totalAmount / d.totalExpense) * 100;
      lines.push(`${count + 1}) Chi tiêu tập trung`);
      lines.push(
        `- Dấu hiệu: ${top.categoryName || "Không rõ"} chiếm ~${share.toFixed(1)}% tổng chi (${money(
          top.totalAmount
        )}).`
      );
      count++;
    }
  }

  if (count === 0) return "Không có cảnh báo.";
  return lines.join("\n");
}

function formatForecastDeterministic({ range, dashboard, period }) {
  const d = dashboard || {};
  if (typeof d.totalExpense !== "number" || d.totalExpense <= 0) return "Không đủ dữ liệu để xác minh.";

  const avgDaily = d.totalExpense / (range.days || 30);
  const days = period === "week" ? 7 : (range.days || 30);
  const projected = avgDaily * days;

  const lines = [];
  lines.push("Chủ đề: Dự báo chi tiêu (ước tính tuyến tính).");
  lines.push(`- Cơ sở: Tổng chi ${money(d.totalExpense)} / ${range.days} ngày (≈ ${money(avgDaily)} / ngày)`);
  lines.push(`- Kỳ dự báo: ${period === "week" ? "Tuần" : "Tháng"} (${days} ngày)`);
  lines.push(`- Ước tính chi: ${money(projected)}`);
  return lines.join("\n");
}

function formatBudgetStrategyDeterministic({ range, dashboard, categories, budgets, wallets }, categoryId) {
  const d = dashboard || {};
  const cats = arrData(categories);
  const bds = budgetsNormalized(budgets);
  const wls = arrData(wallets);

  const totalWallet = wls.reduce((s, w) => s + (typeof w?.balance === "number" ? w.balance : 0), 0);

  const lines = [];
  lines.push("Chủ đề: Dự toán ngân sách dựa trên dữ liệu tháng đang chọn.");

  if (Number.isFinite(totalWallet) && totalWallet > 0) {
    lines.push(`- Tổng số dư ví: ${money(totalWallet)}`);
  } else {
    lines.push(`- Tổng số dư ví: Không đủ dữ liệu để xác minh.`);
  }

  if (typeof d.totalIncome === "number") lines.push(`- Tổng thu tháng: ${money(d.totalIncome)}`);
  else lines.push(`- Tổng thu tháng: Không đủ dữ liệu để xác minh.`);

  if (typeof d.totalExpense === "number") lines.push(`- Tổng chi tháng: ${money(d.totalExpense)}`);
  else lines.push(`- Tổng chi tháng: Không đủ dữ liệu để xác minh.`);

  // category strategy
  if (categoryId && categoryId.trim()) {
    const cid = categoryId.trim();
    const cat = cats.find((c) => String(c?._id || c?.categoryId) === cid);
    const bd = bds.find((b) => String(b.categoryId || "") === cid);

    lines.push("");
    lines.push("Mục tiêu: Danh mục cụ thể");

    lines.push(`- Kỳ: ${range.startDate} → ${range.endDate}`);

    if (cat && typeof cat.totalAmount === "number") {
      lines.push(`- Chi thực tế danh mục: ${money(cat.totalAmount)}`);
    } else {
      lines.push(`- Chi thực tế danh mục: Không đủ dữ liệu để xác minh.`);
    }

    if (bd && typeof bd.amount === "number") {
      lines.push(`- Ngân sách đã đặt: ${money(bd.amount)}`);
      if (cat && typeof cat.totalAmount === "number") {
        const delta = bd.amount - cat.totalAmount;
        lines.push(`- Còn lại/ vượt: ${money(delta)}`);
      }
    } else {
      lines.push(`- Ngân sách đã đặt: Không đủ dữ liệu để xác minh.`);
      lines.push(`- Việc làm ngay: Tạo ngân sách cho danh mục này (1 ngân sách/kỳ, không chồng lấn).`);
    }

    return lines.join("\n").trim();
  }

  // overall strategy
  lines.push("");
  lines.push("Mục tiêu: Tổng thể");
  if (typeof d.totalIncome === "number" && typeof d.totalExpense === "number") {
    const surplus = d.totalIncome - d.totalExpense;
    lines.push(`- Chênh lệch tháng: ${money(surplus)}`);
    if (surplus > 0) {
      lines.push(`- Gợi ý: Ưu tiên đưa ${money(surplus)} vào tiết kiệm/mục tiêu.`);
    } else if (surplus < 0) {
      lines.push(`- Gợi ý: Cần giảm chi ít nhất ${money(Math.abs(surplus))} hoặc tăng thu tương ứng.`);
    }
  } else {
    lines.push(`- Chênh lệch tháng: Không đủ dữ liệu để xác minh.`);
  }

  // top categories -> suggest budgeting
  if (cats.length) {
    const sorted = [...cats].sort((a, b) => (b?.totalAmount || 0) - (a?.totalAmount || 0)).slice(0, 3);
    lines.push("- Ưu tiên đặt ngân sách cho Top danh mục chi:");
    sorted.forEach((c) => {
      const amt =
        typeof c?.totalAmount === "number" ? money(c.totalAmount) : "Không đủ dữ liệu để xác minh.";
      lines.push(`  • ${c?.categoryName || "Không rõ"}: ${amt}`);
    });
  }

  return lines.join("\n").trim();
}

export default function AiChatPanel() {
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const [categoryId, setCategoryId] = useState("");
  const [period, setPeriod] = useState("month");
  const [month, setMonth] = useState(monthValueNow());

  const [messages, setMessages] = useState(() => [makeMsg("assistant", "AI sẵn sàng.")]);

  const bottomRef = useRef(null);
  const scrollDown = () => bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });

  const tailContext = useMemo(() => {
    return messages.slice(-10).map((m) => ({ role: m.role, text: m.text, at: m.at }));
  }, [messages]);

  const push = (msg) => {
    setMessages((prev) => [...prev, msg]);
    setTimeout(scrollDown, 0);
  };

  async function loadMonthData() {
    const range = monthRangeYMD(month);
    if (!range) throw { message: "Tháng không hợp lệ." };

    const [dashboard, categories, budgets, wallets, recentTx] = await Promise.all([
      safeCall(aiApi.getFinancialDashboard, range),
      safeCall(aiApi.getCategoryExpenseReport, range),
      safeCall(aiApi.getBudgets),
      safeCall(aiApi.getWallets),
      safeCall(aiApi.getRecentTransactions),
    ]);

    return { range, dashboard, categories, budgets, wallets, recentTx };
  }

  async function runQuick(label, actionFn) {
    if (busy) return;
    if (!safeFn(actionFn)) {
      setError({ message: "Hành động không khả dụng (fn is not a function)." });
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const text = await actionFn();
      push(makeMsg("assistant", text || "Không đủ dữ liệu để xác minh."));
    } catch (e) {
      const err = normalizeApiError(e);
      setError(err);
      push(makeMsg("assistant", errorToText(err)));
    } finally {
      setBusy(false);
    }
  }

  async function send() {
    const text = input.trim();
    if (!text || busy) return;

    setError(null);
    push(makeMsg("user", text));
    setInput("");
    setBusy(true);

    try {
      if (!safeFn(aiApi.chat)) throw { message: "Endpoint chat không khả dụng." };

      // snapshot gọn đưa vào context để logic hơn
      const snap = await loadMonthData();
      const snapshot = {
        period: snap.range,
        dashboard: snap.dashboard ?? null,
        topExpenseCategories: arrData(snap.categories)
          .sort((a, b) => (b?.totalAmount || 0) - (a?.totalAmount || 0))
          .slice(0, 5)
          .map((c) => ({
            id: c?._id || c?.categoryId,
            name: c?.categoryName,
            totalAmount: typeof c?.totalAmount === "number" ? c.totalAmount : null,
          })),
        walletTotal: arrData(snap.wallets).reduce(
          (s, w) => s + (typeof w?.balance === "number" ? w.balance : 0),
          0
        ),
        budgetsCount: arrData(snap.budgets).length,
        recentTxCount: arrData(snap.recentTx).length,
      };

      const context = [
        {
          role: "system",
          text:
            "Yêu cầu trả lời: gọn, theo dạng gạch đầu dòng; không chào hỏi; " +
            "chỉ dùng dữ liệu trong DATA_JSON; nếu thiếu dữ liệu thì ghi: Không đủ dữ liệu để xác minh.",
        },
        { role: "system", text: `DATA_JSON:${JSON.stringify(snapshot)}` },
        ...tailContext,
      ];

      const res = await aiApi.chat({ message: text, context });
      const raw = extractText(res);
      const cleaned = addTopicHeadings(raw);
      push(makeMsg("assistant", compact(cleaned || "Không có nội dung trả lời.", 12)));
    } catch (e) {
      const err = normalizeApiError(e);
      setError(err);
      push(makeMsg("assistant", errorToText(err)));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="ai-card">
      <header className="ai-card__head">
        <div className="ai-stack">
          <h2 className="ai-title">Trợ lý AI</h2>
          <div className="ai-sub">Nút nhanh không phụ thuộc các endpoint dễ thiếu (tránh lỗi fn is not a function).</div>
        </div>
      </header>

      <div className="ai-quick">
        <button
          className="ai-btn ai-btn--ghost"
          onClick={() =>
            runQuick("Cảnh báo", async () => {
             const snap = await loadMonthData();
             const res = await safeCall(aiApi.getAlerts);
             const list = Array.isArray(res) ? res : Array.isArray(res?.alerts) ? res.alerts : [];
             const meaningful = list.filter((a) => {
            if (!a || typeof a !== "object") return false;
              return Boolean(
                 a.title ||
                 a.type ||
                 a.name ||
                 a.message ||
                 a.description ||
                 a.reason ||
                 a.severity ||
                 a.level
            );
           });
           if (meaningful.length) {
             const lines = ["Chủ đề: Cảnh báo sớm (từ hệ thống)."];
             meaningful.slice(0, 6).forEach((a) => {
             const title = a.title || a.type || a.name || "";
             const msg = a.message || a.description || a.reason || "";
             const sev = a.severity || a.level || "";
           if (title && msg) lines.push(`- ${title}${sev ? ` (${sev})` : ""}: ${msg}`);
           else if (title) lines.push(`- ${title}${sev ? ` (${sev})` : ""}`);
           else if (msg) lines.push(`- ${msg}`);
            });
           if (lines.length > 1) return lines.join("\n");
           }
           return formatAlertsDeterministic(snap);
  })
}

          disabled={busy}
          type="button"
        >
          🔔 Cảnh báo
        </button>

        <button
          className="ai-btn ai-btn--ghost"
          onClick={() =>
            runQuick("Phân tích", async () => {
              const snap = await loadMonthData();
              return formatIssuesWithTopic(snap);
            })
          }
          disabled={busy}
          type="button"
        >
          💡 Phân tích
        </button>

        <div className="ai-quick__group">
          <input
            className="ai-input ai-input--month"
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            aria-label="Chọn tháng"
          />
          <button
            className="ai-btn ai-btn--ghost"
            onClick={() =>
              runQuick("Báo cáo tháng", async () => {
                const snap = await loadMonthData();
                return formatMonthlyReport(snap);
              })
            }
            disabled={busy}
            type="button"
          >
            📊 Báo cáo tháng
          </button>
        </div>

        <div className="ai-quick__group">
          <input
            className="ai-input"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            placeholder="ID danh mục (tuỳ chọn)"
          />
          <button
            className="ai-btn ai-btn--ghost"
            onClick={() =>
              runQuick("Dự toán", async () => {
                const snap = await loadMonthData();
                return formatBudgetStrategyDeterministic(snap, categoryId);
              })
            }
            disabled={busy}
            type="button"
          >
            💰 Dự toán
          </button>
        </div>

        <div className="ai-quick__group">
          <select className="ai-select" value={period} onChange={(e) => setPeriod(e.target.value)}>
            <option value="week">Tuần</option>
            <option value="month">Tháng</option>
          </select>
          <button
            className="ai-btn ai-btn--ghost"
            onClick={() =>
              runQuick("Dự báo", async () => {
                const snap = await loadMonthData();
                return formatForecastDeterministic({ range: snap.range, dashboard: snap.dashboard, period });
              })
            }
            disabled={busy}
            type="button"
          >
            🔮 Dự báo
          </button>
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
              <span className="ai-msg__role">{m.role === "user" ? "Bạn" : "AI"}</span>
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
        <button className="ai-btn ai-btn--primary" onClick={send} disabled={busy || !input.trim()} type="button">
          {busy ? "..." : "Gửi"}
        </button>
      </div>
    </section>
  );
}
