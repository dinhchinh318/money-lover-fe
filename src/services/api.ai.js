import axios from "./axios.customize";

/**
 * api.ai.js
 *
 * baseURL (axios.customize.js): http://localhost:5000 (KHÔNG có /v1/api)
 * => Tất cả path trong file này dùng FULL prefix /v1/api/...
 *
 * Endpoints dùng cho AI UI:
 * - Chat:        POST /v1/api/chat/quick-query   body: { query, context }
 * - Alerts:      GET  /v1/api/ai/alerts
 * - SuggestBudget:GET /v1/api/ai/suggest-budget?categoryId=...
 *
 * Endpoints deterministic để lấy dữ liệu tháng (không phụ thuộc Gemini):
 * - GET /v1/api/report/financial-dashboard?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
 * - GET /v1/api/report/category/expense?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
 * - GET /v1/api/transaction/stats/overview?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
 *
 * (Các endpoint analysis/insights/forecast có thể rỗng khi Gemini 429/503)
 */

export const aiApi = {
  // ===== AI Suggest / Alerts =====
  getAlerts: () => axios.get("/v1/api/ai/alerts"),
  suggestBudget: (categoryId) =>
    axios.get("/v1/api/ai/suggest-budget", { params: { categoryId } }),

  // ===== Analysis (AI-dependent) =====
  insights: () => axios.get("/v1/api/analysis/insights"),
  quickMonthly: () => axios.get("/v1/api/analysis/quick/monthly"),
  analyzeSpending: ({ startDate, endDate }) =>
    axios.post("/v1/api/analysis/spending", { startDate, endDate }),
  forecast: ({ period }) => axios.post("/v1/api/analysis/forecast", { period }),
  compare: ({ period1Start, period1End, period2Start, period2End }) =>
    axios.post("/v1/api/analysis/compare", {
      period1Start,
      period1End,
      period2Start,
      period2End,
    }),

  // ===== Reports (deterministic monthly data) =====
  getFinancialDashboard: ({ startDate, endDate }) =>
    axios.get("/v1/api/report/financial-dashboard", { params: { startDate, endDate } }),

  getCategoryExpenseReport: ({ startDate, endDate }) =>
    axios.get("/v1/api/report/category/expense", { params: { startDate, endDate } }),

  getStatsOverview: ({ startDate, endDate }) =>
    axios.get("/v1/api/transaction/stats/overview", { params: { startDate, endDate } }),

  // ===== Chat =====
  // Backend expects: { query, context }
  chat: ({ message, context }) =>
    axios.post("/v1/api/chat/quick-query", {
      query: message,
      context,
    }),
};

export function normalizeApiError(err) {
  const data = err?.response?.data;
  if (data) return data;
  return { message: err?.message || "Unknown error" };
}

export function pickAlertsPayload(payload) {
  const raw = payload;
  const candidates = [raw?.data?.alerts, raw?.alerts, raw?.data, raw];

  let list = [];
  for (const c of candidates) {
    if (Array.isArray(c)) {
      list = c;
      break;
    }
    if (c && Array.isArray(c.alerts)) {
      list = c.alerts;
      break;
    }
  }
  return { list: Array.isArray(list) ? list : [], raw };
}

export function stableAlertKey(a, idx) {
  return (
    a?._id ||
    a?.id ||
    a?.key ||
    `${a?.type || "alert"}:${a?.createdAt || a?.time || idx}`
  );
}
