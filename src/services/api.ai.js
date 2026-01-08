import axios from "./axios.customize";

/**
 * api.ai.js - FINAL FIX
 * 
 * baseURL: http://localhost:5000 (KHÔNG có /v1/api)
 * Backend endpoints: /v1/api/chat/quick-query, /v1/api/ai/alerts, etc.
 * 
 * => Phải thêm prefix /v1/api vào tất cả paths
 */

export const aiApi = {
  // ===== AI Suggest / Alerts =====
  // baseURL: http://localhost:5000
  // Path: /v1/api/ai/alerts
  getAlerts: () => axios.get("/v1/api/ai/alerts"),
  
  suggestBudget: (categoryId) =>
    axios.get("/v1/api/ai/suggest-budget", { params: { categoryId } }),

  // ===== Analysis =====
  insights: () => axios.get("/v1/api/analysis/insights"),
  
  quickMonthly: () => axios.get("/v1/api/analysis/quick/monthly"),
  
  analyzeSpending: ({ startDate, endDate }) =>
    axios.post("/v1/api/analysis/spending", { startDate, endDate }),
  
  forecast: ({ period }) => 
    axios.post("/v1/api/analysis/forecast", { period }),
  
  compare: ({ period1Start, period1End, period2Start, period2End }) =>
    axios.post("/v1/api/analysis/compare", {
      period1Start,
      period1End,
      period2Start,
      period2End,
    }),

  // ===== Chat =====
  // Full URL: http://localhost:5000/v1/api/chat/quick-query
  // Backend expects: { query, context }
  chat: ({ message, context }) => {
    console.log('[AI CHAT] Calling:', axios.defaults.baseURL + '/v1/api/chat/quick-query');
    
    return axios.post("/v1/api/chat/quick-query", { 
      query: message,  // Backend expects 'query' not 'message'
      context 
    });
  },
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