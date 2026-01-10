// src/components/ai/aiText.js
// Deterministic text builders for monthly report / analysis / forecast / alerts (no JSON dump)

const VND = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
});

export function money(x) {
  return typeof x === "number" && Number.isFinite(x) ? VND.format(x) : null;
}

export function pct(x) {
  return typeof x === "number" && Number.isFinite(x) ? `${x.toFixed(2)}%` : null;
}

export function dateYMD(x) {
  if (!x) return null;
  if (typeof x === "string" && /^\d{4}-\d{2}-\d{2}$/.test(x)) return x;
  const d = new Date(x);
  if (Number.isNaN(d.getTime())) return null;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function monthValueNow() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

export function monthRangeYMD(monthValue) {
  const [yStr, mStr] = String(monthValue || "").split("-");
  const y = Number(yStr);
  const m = Number(mStr);
  if (!Number.isFinite(y) || !Number.isFinite(m) || m < 1 || m > 12) return null;

  const last = new Date(y, m, 0).getDate();
  const mm = String(m).padStart(2, "0");
  const dd = String(last).padStart(2, "0");
  return { startDate: `${y}-${mm}-01`, endDate: `${y}-${mm}-${dd}`, days: last };
}

export function nextMonthsDayCount(fromMonthValue, nMonths) {
  const [yStr, mStr] = String(fromMonthValue || "").split("-");
  const y = Number(yStr);
  const m = Number(mStr);
  if (!Number.isFinite(y) || !Number.isFinite(m) || m < 1 || m > 12) return null;

  let total = 0;
  for (let i = 1; i <= nMonths; i++) {
    const dt = new Date(y, (m - 1) + i, 1);
    const yy = dt.getFullYear();
    const mm = dt.getMonth() + 1;
    const last = new Date(yy, mm, 0).getDate();
    total += last;
  }
  return total;
}

export function extractChatText(payload) {
  const p = payload || {};
  const s =
    (typeof p?.answer === "string" && p.answer) ||
    (typeof p?.reply === "string" && p.reply) ||
    (typeof p?.data?.answer === "string" && p.data.answer) ||
    (typeof p?.data?.reply === "string" && p.data.reply) ||
    (typeof p === "string" && p);
  return (typeof s === "string" && s.trim()) ? s.trim() : null;
}

export function errorToText(err) {
  if (!err) return "Lỗi không xác định.";

  const msg =
    (typeof err?.message === "string" && err.message) ||
    (typeof err?.error === "string" && err.error) ||
    (typeof err?.data?.message === "string" && err.data.message) ||
    "Lỗi không xác định.";

  const raw = String(err?.error || err?.message || "");
  const m = raw.match(/retry in\s+([0-9.]+)s/i) || raw.match(/retryDelay"\s*:\s*"([0-9.]+)s/i);
  const retry = m ? Number(m[1]) : null;
  if (Number.isFinite(retry)) return `${msg} (thử lại sau ~${Math.ceil(retry)} giây)`;

  return msg;
}

export function formatMonthlyReport({ startDate, endDate, dashboard, categories, overview }) {
  const d = dashboard || {};
  const cats = Array.isArray(categories) ? categories : Array.isArray(categories?.data) ? categories.data : [];

  const lines = ["Báo cáo tháng:"];
  lines.push(`- Kỳ: ${dateYMD(startDate) || "N/A"} → ${dateYMD(endDate) || "N/A"}`);

  const totalIncome = money(d?.totalIncome);
  const totalExpense = money(d?.totalExpense);
  const balance = money(d?.balance);
  const totalWalletBalance = money(d?.totalWalletBalance);

  if (totalIncome) lines.push(`- Tổng thu: ${totalIncome}`);
  if (totalExpense) lines.push(`- Tổng chi: ${totalExpense}`);
  if (balance) lines.push(`- Chênh lệch: ${balance}`);
  if (totalWalletBalance) lines.push(`- Tổng số dư ví: ${totalWalletBalance}`);
  if (typeof d?.walletCount === "number") lines.push(`- Số ví: ${d.walletCount}`);

  const ic = pct(d?.incomeChangePercent);
  const ec = pct(d?.expenseChangePercent);
  if (ic) lines.push(`- Thu so với kỳ trước: ${ic}`);
  if (ec) lines.push(`- Chi so với kỳ trước: ${ec}`);

  const sorted = [...cats].sort((a, b) => (b?.totalAmount || 0) - (a?.totalAmount || 0));
  if (sorted.length) {
    lines.push("Top danh mục chi:");
    sorted.slice(0, 5).forEach((c) => {
      const name = c?.categoryName || "Không rõ";
      const icon = c?.categoryIcon || "";
      const amt = money(c?.totalAmount) || "N/A";
      lines.push(`- ${icon ? icon + " " : ""}${name}: ${amt}`);
    });
  } else {
    lines.push("Top danh mục chi: Không có dữ liệu.");
  }

  // Optional overview count (only if numeric)
  const txCount = overview?.totalTransactions ?? overview?.count;
  if (typeof txCount === "number" && Number.isFinite(txCount)) {
    lines.push(`- Số giao dịch: ${txCount}`);
  }

  return lines.join("\n");
}

export function formatAnalysisFromReport({ dashboard, categories }) {
  const d = dashboard || {};
  const cats = Array.isArray(categories) ? categories : Array.isArray(categories?.data) ? categories.data : [];
  const lines = ["Phân tích:"];
  const totalIncome = d?.totalIncome;
  const totalExpense = d?.totalExpense;

  const inc = money(totalIncome);
  const exp = money(totalExpense);
  const bal = money(d?.balance);

  if (inc) lines.push(`- Tổng thu: ${inc}`);
  if (exp) lines.push(`- Tổng chi: ${exp}`);
  if (bal) lines.push(`- Chênh lệch: ${bal}`);

  const ic = pct(d?.incomeChangePercent);
  const ec = pct(d?.expenseChangePercent);
  if (ic) lines.push(`- Thu so với kỳ trước: ${ic}`);
  if (ec) lines.push(`- Chi so với kỳ trước: ${ec}`);

  // Category share (only if we can compute)
  if (typeof totalExpense === "number" && totalExpense > 0 && cats.length) {
    const sorted = [...cats].sort((a, b) => (b?.totalAmount || 0) - (a?.totalAmount || 0));
    const top = sorted[0];
    const topAmt = typeof top?.totalAmount === "number" ? top.totalAmount : null;
    if (typeof topAmt === "number" && Number.isFinite(topAmt)) {
      const share = (topAmt / totalExpense) * 100;
      lines.push(`- Danh mục chi lớn nhất: ${top?.categoryName || "Không rõ"} (${share.toFixed(1)}% tổng chi)`);
    }
  }

  if (lines.length === 1) return "Phân tích: Không đủ dữ liệu.";
  return lines.join("\n");
}

export function formatForecastLinear({ monthValue, dashboard, period }) {
  const d = dashboard || {};
  const range = monthRangeYMD(monthValue);
  if (!range) return "Dự báo: Tháng không hợp lệ.";

  const totalExpense = d?.totalExpense;
  if (typeof totalExpense !== "number" || !Number.isFinite(totalExpense) || totalExpense <= 0) {
    return "Dự báo: Không đủ dữ liệu chi tiêu để ước tính.";
  }

  const avgDaily = totalExpense / range.days;

  let days = null;
  if (period === "week") days = 7;
  else if (period === "month") days = nextMonthsDayCount(monthValue, 1);
  else if (period === "quarter") days = nextMonthsDayCount(monthValue, 3);
  else if (period === "year") days = nextMonthsDayCount(monthValue, 12);

  if (typeof days !== "number" || !Number.isFinite(days) || days <= 0) {
    return "Dự báo: Không hỗ trợ period này.";
  }

  const projected = avgDaily * days;

  const lines = ["Dự báo (ước tính tuyến tính):"];
  lines.push(`- Cơ sở: tổng chi ${money(totalExpense)} trong ${range.days} ngày (≈ ${money(avgDaily)} / ngày)`);
  lines.push(`- Period: ${period} (${days} ngày)`);
  lines.push(`- Ước tính chi: ${money(projected) || "N/A"}`);

  return lines.join("\n");
}

export function formatAlertsFallback({ monthValue, dashboard, categories }) {
  const d = dashboard || {};
  const cats = Array.isArray(categories) ? categories : Array.isArray(categories?.data) ? categories.data : [];

  const lines = ["Cảnh báo (từ dữ liệu kỳ):"];
  let count = 0;

  if (typeof d?.balance === "number" && d.balance < 0) {
    lines.push(`- Chi vượt thu trong kỳ: ${money(Math.abs(d.balance)) || "N/A"}`);
    count++;
  }

  if (typeof d?.expenseChangePercent === "number" && Number.isFinite(d.expenseChangePercent)) {
    lines.push(`- Chi so với kỳ trước: ${pct(d.expenseChangePercent) || "N/A"}`);
    count++;
  }

  // Top category share
  if (typeof d?.totalExpense === "number" && d.totalExpense > 0 && cats.length) {
    const sorted = [...cats].sort((a, b) => (b?.totalAmount || 0) - (a?.totalAmount || 0));
    const top = sorted[0];
    const topAmt = typeof top?.totalAmount === "number" ? top.totalAmount : null;
    if (typeof topAmt === "number" && Number.isFinite(topAmt)) {
      const share = (topAmt / d.totalExpense) * 100;
      lines.push(`- Danh mục chi lớn nhất: ${top?.categoryName || "Không rõ"} (${share.toFixed(1)}% tổng chi)`);
      count++;
    }
  }

  if (count == 0) return "Không có cảnh báo.";
  return lines.join("\n");
}
