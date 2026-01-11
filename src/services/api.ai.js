import axios from "./axios.customize";

/**
 * baseURL (axios.customize.js) là host (ví dụ http://localhost:5000)
 * => mọi endpoint dùng full prefix /v1/api/...
 */

export const aiApi = {
  // ===== AI Suggest / Alerts =====
  getAlerts: () => axios.get("/v1/api/ai/alerts"),
  suggestBudget: (categoryId) =>
    axios.get("/v1/api/ai/suggest-budget", { params: { categoryId } }),

  // ===== Deterministic data (không phụ thuộc Gemini) =====
  getFinancialDashboard: ({ startDate, endDate }) =>
    axios.get("/v1/api/report/financial-dashboard", { params: { startDate, endDate } }),

  getCategoryExpenseReport: ({ startDate, endDate }) =>
    axios.get("/v1/api/report/category/expense", { params: { startDate, endDate } }),

  getWallets: () => axios.get("/v1/api/wallet"),
  getBudgets: () => axios.get("/v1/api/budget"),
  getRecentTransactions: () =>
    axios.get("/v1/api/transaction", { params: { limit: 10, sortBy: "-date" } }),

  // ===== Chat =====
  // Backend expects body: { query, context }
  chat: ({ message, context }) =>
    axios.post("/v1/api/chat/quick-query", { query: message, context }),
};

export function normalizeApiError(err) {
  const data = err?.response?.data;
  if (data) return data;
  return { message: err?.message || "Unknown error" };
}

// useAiAlerts.js imports this
export function pickAlertsPayload(payload) {
  const raw = payload;
  const candidates = [raw?.data?.alerts, raw?.alerts, raw?.data, raw];

  let list = [];
  for (const c of candidates) {
    if (Array.isArray(c)) { list = c; break; }
    if (c && Array.isArray(c.alerts)) { list = c.alerts; break; }
  }
  return { list: Array.isArray(list) ? list : [], raw };
}

// AiAlertsPanel.jsx imports this
export function stableAlertKey(a, idx) {
  return (
    a?._id ||
    a?.id ||
    a?.key ||
    `${a?.type || "alert"}:${a?.createdAt || a?.time || idx}`
  );
}
