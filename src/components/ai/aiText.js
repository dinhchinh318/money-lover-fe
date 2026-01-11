// src/components/ai/aiText.js
// Clean, deterministic context + output sanitization

const VND = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
});

export function money(x) {
  return typeof x === "number" && Number.isFinite(x) ? VND.format(x) : null;
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

export function extractChatText(payload) {
  const p = payload || {};
  const s =
    (typeof p?.answer === "string" && p.answer) ||
    (typeof p?.reply === "string" && p.reply) ||
    (typeof p?.data?.answer === "string" && p.data.answer) ||
    (typeof p?.data?.reply === "string" && p.data.reply) ||
    (typeof p === "string" && p);
  return typeof s === "string" && s.trim() ? s.trim() : null;
}

export function errorToText(err) {
  if (!err) return "Lỗi không xác định.";
  const msg =
    (typeof err?.message === "string" && err.message) ||
    (typeof err?.error === "string" && err.error) ||
    (typeof err?.data?.message === "string" && err.data.message) ||
    "Lỗi không xác định.";

  const raw = String(err?.error || err?.message || "");
  const m =
    raw.match(/retry in\s+([0-9.]+)s/i) ||
    raw.match(/retryDelay"\s*:\s*"([0-9.]+)s/i);
  const retry = m ? Number(m[1]) : null;
  if (Number.isFinite(retry)) return `${msg} (thử lại sau ~${Math.ceil(retry)} giây)`;
  return msg;
}

function stripMarkdown(s) {
  let t = String(s || "");
  // remove fenced code blocks
  t = t.replace(/```[\s\S]*?```/g, "");
  // remove inline code
  t = t.replace(/`([^`]*)`/g, "$1");
  // remove bold/italic markers
  t = t.replace(/\*\*(.*?)\*\*/g, "$1");
  t = t.replace(/__(.*?)__/g, "$1");
  t = t.replace(/\*(.*?)\*/g, "$1");
  t = t.replace(/_(.*?)_/g, "$1");
  // normalize bullets: "* " -> "- "
  t = t.replace(/^\s*\*\s+/gm, "- ");
  return t;
}

function stripGreeting(s) {
  const t = String(s || "").trim();
  // remove leading greeting line(s)
  const lines = t.split("\n");
  while (lines.length) {
    const l = lines[0].trim().toLowerCase();
    if (
      l.startsWith("chào") ||
      l.startsWith("xin chào") ||
      l.startsWith("hi") ||
      l.startsWith("hello") ||
      l.startsWith("mình là") ||
      l.startsWith("tôi là")
    ) {
      lines.shift();
      continue;
    }
    break;
  }
  return lines.join("\n").trim();
}

export function compactReply(text, maxLines = 8) {
  let s = stripGreeting(stripMarkdown(text));
  s = s.replace(/\r/g, "").trim();
  if (!s) return "";

  // remove excessive blank lines
  s = s.replace(/\n{3,}/g, "\n\n");

  const lines = s.split("\n").map((l) => l.trim()).filter(Boolean);

  // prefer bullet / numbered lines
  const bullets = lines.filter((l) => /^(-|•|\d+\.)\s+/.test(l));
  const chosen = (bullets.length >= 3 ? bullets : lines).slice(0, maxLines);

  // ensure bullets use "- "
  const normalized = chosen.map((l) => {
    if (/^•\s+/.test(l)) return "- " + l.replace(/^•\s+/, "");
    return l;
  });

  return normalized.join("\n");
}

function sumWallets(wallets) {
  const arr = Array.isArray(wallets) ? wallets : Array.isArray(wallets?.data) ? wallets.data : [];
  const total = arr.reduce((s, w) => s + (typeof w?.balance === "number" ? w.balance : 0), 0);
  return {
    count: arr.length,
    total,
    sample: arr.slice(0, 5).map((w) => ({
      name: w?.name,
      balance: typeof w?.balance === "number" ? w.balance : undefined,
      currency: w?.currency,
    })),
  };
}

function slimBudgets(budgets) {
  const arr = Array.isArray(budgets) ? budgets : Array.isArray(budgets?.data) ? budgets.data : [];
  return arr.slice(0, 12).map((b) => ({
    categoryId: b?.categoryId || b?.category?._id,
    categoryName: b?.categoryName || b?.category?.name,
    limit:
      (typeof b?.amount === "number" ? b.amount : undefined) ??
      (typeof b?.limit === "number" ? b.limit : undefined),
    startDate: b?.startDate,
    endDate: b?.endDate,
  }));
}

function slimCategoryExpense(categories) {
  const arr = Array.isArray(categories) ? categories : Array.isArray(categories?.data) ? categories.data : [];
  const sorted = [...arr].sort((a, b) => (b?.totalAmount || 0) - (a?.totalAmount || 0));
  return sorted.slice(0, 8).map((c) => ({
    categoryId: c?.categoryId || c?._id,
    categoryName: c?.categoryName,
    categoryIcon: c?.categoryIcon,
    totalAmount: typeof c?.totalAmount === "number" ? c.totalAmount : undefined,
  }));
}

function slimTx(txs) {
  const arr = Array.isArray(txs) ? txs : Array.isArray(txs?.data) ? txs.data : (Array.isArray(txs?.data?.data) ? txs.data.data : []);
  return arr.slice(0, 10).map((t) => ({
    date: t?.date,
    type: t?.type,
    amount: typeof t?.amount === "number" ? t.amount : undefined,
    categoryName: t?.category?.name || t?.categoryName,
    walletName: t?.wallet?.name || t?.walletName,
  }));
}

/**
 * Build a SMALL, verifiable snapshot to feed into LLM.
 * Only totals + top categories + budget list + wallet sum + recent tx.
 */
export async function buildAiSnapshot({ aiApi, monthValue }) {
  const range = monthRangeYMD(monthValue);
  if (!range) return { period: null, note: "invalid-month" };

  const settled = await Promise.allSettled([
    aiApi.getFinancialDashboard(range),
    aiApi.getCategoryExpenseReport(range),
    aiApi.getWallets(),
    aiApi.getBudgets(),
    aiApi.getRecentTransactions(),
  ]);

  const getVal = (i) => (settled[i].status === "fulfilled" ? (settled[i].value?.data ?? settled[i].value) : null);

  const dashboard = getVal(0);
  const categories = getVal(1);
  const wallets = getVal(2);
  const budgets = getVal(3);
  const txs = getVal(4);

  const snap = {
    period: range,
    dashboard: {
      totalIncome: typeof dashboard?.totalIncome === "number" ? dashboard.totalIncome : null,
      totalExpense: typeof dashboard?.totalExpense === "number" ? dashboard.totalExpense : null,
      balance: typeof dashboard?.balance === "number" ? dashboard.balance : null,
      totalWalletBalance: typeof dashboard?.totalWalletBalance === "number" ? dashboard.totalWalletBalance : null,
    },
    topExpenseCategories: slimCategoryExpense(categories),
    wallets: sumWallets(wallets),
    budgets: slimBudgets(budgets),
    recentTransactions: slimTx(txs),
  };

  return snap;
}

export function snapshotToSystemText(snapshot) {
  const p = snapshot?.period;
  const d = snapshot?.dashboard || {};
  const lines = [];
  lines.push("DATA_TEXT:");
  if (p?.startDate && p?.endDate) lines.push(`Period: ${p.startDate} -> ${p.endDate}`);
  if (typeof d.totalIncome === "number") lines.push(`TotalIncome: ${money(d.totalIncome)}`);
  if (typeof d.totalExpense === "number") lines.push(`TotalExpense: ${money(d.totalExpense)}`);
  if (typeof d.balance === "number") lines.push(`Balance: ${money(d.balance)}`);
  if (typeof d.totalWalletBalance === "number") lines.push(`WalletTotal: ${money(d.totalWalletBalance)}`);

  const cats = Array.isArray(snapshot?.topExpenseCategories) ? snapshot.topExpenseCategories : [];
  if (cats.length) {
    lines.push("TopExpenseCategories:");
    cats.slice(0, 6).forEach((c) => {
      if (typeof c?.totalAmount === "number") {
        lines.push(`- ${c.categoryIcon ? c.categoryIcon + " " : ""}${c.categoryName || "N/A"}: ${money(c.totalAmount)}`);
      }
    });
  }

  const budgets = Array.isArray(snapshot?.budgets) ? snapshot.budgets : [];
  if (budgets.length) {
    lines.push("Budgets:");
    budgets.slice(0, 10).forEach((b) => {
      const lim = typeof b?.limit === "number" ? money(b.limit) : null;
      lines.push(`- ${b.categoryName || b.categoryId || "N/A"}: ${lim || "Không đủ dữ liệu để xác minh"} (${b.startDate || "?"} -> ${b.endDate || "?"})`);
    });
  }

  const walletSum = snapshot?.wallets;
  if (walletSum && typeof walletSum.total === "number") {
    lines.push(`Wallets: ${walletSum.count} | TotalBalance: ${money(walletSum.total)}`);
  }

  // Also include compact JSON for exact parse if model wants
  lines.push("DATA_JSON:" + JSON.stringify(snapshot));

  return lines.join("\n");
}
