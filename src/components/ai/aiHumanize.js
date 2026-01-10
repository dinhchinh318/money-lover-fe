// src/pages/analytics/ai/aiHumanize.js
// Map backend JSON -> human-readable text (no JSON dump)

const VND = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
});

function isNum(x) {
  return typeof x === "number" && Number.isFinite(x);
}

function money(x) {
  return isNum(x) ? VND.format(x) : null;
}

function textOrNull(x) {
  return typeof x === "string" && x.trim() ? x.trim() : null;
}

function dateYMD(x) {
  // Accept: YYYY-MM-DD or ISO
  if (!x) return null;
  if (typeof x === "string" && /^\d{4}-\d{2}-\d{2}$/.test(x)) return x;
  const d = new Date(x);
  if (Number.isNaN(d.getTime())) return null;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function aiErrorToText(err) {
  if (!err) return "Lỗi không xác định.";
  const msg =
    textOrNull(err.message) ||
    textOrNull(err.error) ||
    textOrNull(err?.data?.message) ||
    textOrNull(err?.data?.error) ||
    "Lỗi không xác định.";

  const raw = String(err.error || err.message || "");
  const m = raw.match(/retry in\s+([0-9.]+)s/i) || raw.match(/retryDelay"\s*:\s*"([0-9.]+)s/i);
  const retry = m ? Number(m[1]) : null;
  if (Number.isFinite(retry)) return `${msg} (thử lại sau ~${Math.ceil(retry)} giây)`;

  return msg;
}

export function extractChatText(payload) {
  const p = payload || {};
  const s =
    (typeof p?.answer === "string" && p.answer) ||
    (typeof p?.reply === "string" && p.reply) ||
    (typeof p?.data?.answer === "string" && p.data.answer) ||
    (typeof p?.data?.reply === "string" && p.data.reply);
  return textOrNull(s);
}

function formatInsights(list) {
  if (!Array.isArray(list) || list.length === 0) return "Không có phân tích.";
  const lines = ["Phân tích:"];
  list.slice(0, 10).forEach((it, i) => {
    const title = textOrNull(it?.title) || `Insight #${i + 1}`;
    const pr = textOrNull(it?.priority);
    const desc = textOrNull(it?.description);
    lines.push(`- ${title}${pr ? ` (${pr})` : ""}${desc ? `: ${desc}` : ""}`);
    const act = textOrNull(it?.suggestedAction);
    if (act) lines.push(`  • Gợi ý: ${act}`);
    const impact = money(it?.impact);
    if (impact) lines.push(`  • Tác động ước tính: ${impact}`);
  });
  return lines.join("\n");
}

function formatSuggestBudget(s) {
  if (!s) return "Không có dữ liệu dự toán.";
  if (typeof s === "string") return s;

  const cat = textOrNull(s?.categoryName) || textOrNull(s?.category) || textOrNull(s?.name);
  const amount =
    money(s?.suggestedAmount) ||
    money(s?.amount) ||
    money(s?.recommendedBudget) ||
    money(s?.budget);

  const reason = textOrNull(s?.reason) || textOrNull(s?.explanation) || textOrNull(s?.message);

  const lines = ["Dự toán (gợi ý ngân sách):"];
  if (cat) lines.push(`- Danh mục: ${cat}`);
  if (amount) lines.push(`- Mức đề xuất: ${amount}`);
  if (reason) lines.push(`- Lý do: ${reason}`);

  // Fallback (no JSON)
  if (lines.length === 1) return "Không đủ dữ liệu để hiển thị dự toán.";
  return lines.join("\n");
}

function formatAlerts(r) {
  if (!r) return "Không có cảnh báo.";
  if (typeof r === "string") return r;

  if (Array.isArray(r?.alerts)) r = r.alerts;

  if (Array.isArray(r)) {
    if (!r.length) return "Không có cảnh báo.";
    const lines = ["Cảnh báo:"];
    r.slice(0, 12).forEach((a, i) => {
      const t = textOrNull(a?.title) || textOrNull(a?.type) || `Alert #${i + 1}`;
      const msg = textOrNull(a?.message) || textOrNull(a?.description);
      const sev = textOrNull(a?.severity) || textOrNull(a?.level);
      lines.push(`- ${t}${sev ? ` (${sev})` : ""}${msg ? `: ${msg}` : ""}`);
    });
    return lines.join("\n");
  }

  const summary = textOrNull(r?.summary) || textOrNull(r?.message) || textOrNull(r?.note);
  return summary ? `Cảnh báo:\n- ${summary}` : "Không có cảnh báo.";
}

function formatForecast(payload) {
  const p = payload || {};
  const arr = Array.isArray(p) ? p : Array.isArray(p?.forecast) ? p.forecast : [];
  if (!arr.length) return "Không có dữ liệu dự báo.";
  const lines = ["Dự báo chi tiêu:"];
  arr.slice(0, 10).forEach((x) => {
    const d = dateYMD(x?.date) || "N/A";
    const amt = money(x?.predictedAmount) || money(x?.amount) || "N/A";
    const conf = isNum(x?.confidence) ? `${Math.round(x.confidence * 100)}%` : null;
    lines.push(`- ${d}: ${amt}${conf ? ` (độ tin cậy ${conf})` : ""}`);
  });
  return lines.join("\n");
}

export function formatMonthlyFromReports({ startDate, endDate, dashboard, categories, overview }) {
  const d = dashboard || {};
  const catsRaw = categories;

  // category endpoint might return {data: [...]} or direct array
  const cats = Array.isArray(catsRaw) ? catsRaw : Array.isArray(catsRaw?.data) ? catsRaw.data : [];

  const lines = ["Báo cáo tháng:"];
  const s = dateYMD(startDate);
  const e = dateYMD(endDate);
  if (s || e) lines.push(`- Kỳ: ${s || "N/A"} → ${e || "N/A"}`);

  const totalIncome = money(d?.totalIncome);
  const totalExpense = money(d?.totalExpense);
  const balance = money(d?.balance);
  const totalWalletBalance = money(d?.totalWalletBalance);

  if (totalIncome) lines.push(`- Tổng thu: ${totalIncome}`);
  if (totalExpense) lines.push(`- Tổng chi: ${totalExpense}`);
  if (balance) lines.push(`- Chênh lệch: ${balance}`);
  if (totalWalletBalance) lines.push(`- Tổng số dư ví: ${totalWalletBalance}`);
  if (isNum(d?.walletCount)) lines.push(`- Số ví: ${d.walletCount}`);

  if (isNum(d?.incomeChangePercent)) lines.push(`- Thu so với kỳ trước: ${d.incomeChangePercent.toFixed(2)}%`);
  if (isNum(d?.expenseChangePercent)) lines.push(`- Chi so với kỳ trước: ${d.expenseChangePercent.toFixed(2)}%`);

  // Optional overview: depends on API response; only display known numbers
  if (overview && typeof overview === "object") {
    const txCount = overview?.totalTransactions ?? overview?.count;
    if (isNum(txCount)) lines.push(`- Số giao dịch: ${txCount}`);
  }

  if (cats.length) {
    const sorted = [...cats].sort((a, b) => (b?.totalAmount || 0) - (a?.totalAmount || 0));
    lines.push("Top danh mục chi:");
    sorted.slice(0, 5).forEach((c) => {
      const name = textOrNull(c?.categoryName) || "Không rõ";
      const amt = money(c?.totalAmount) || "N/A";
      const icon = textOrNull(c?.categoryIcon);
      lines.push(`- ${icon ? icon + " " : ""}${name}: ${amt}`);
    });
  }

  return lines.join("\n");
}

export function aiHumanize(kind, payload) {
  // backend errors commonly: { success:false, message, error }
  if (payload && typeof payload === "object" && payload.success === false) return aiErrorToText(payload);

  if (kind === "alerts") return formatAlerts(payload);
  if (kind === "insights") return formatInsights(payload);
  if (kind === "forecast") return formatForecast(payload);
  if (kind === "suggestBudget") return formatSuggestBudget(payload);

  if (typeof payload === "string") return payload;
  return "Không có dữ liệu.";
}
