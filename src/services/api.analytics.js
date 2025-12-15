import axios from "./axios.customize";

// ============================================
// DIAGNOSTIC ANALYTICS
// ============================================

// Biến động chi tiêu
const getCategorySpendingSpikesAPI = (params) => {
    const urlBackend = "/v1/api/analytics/diagnostic/category-spikes";
    return axios.get(urlBackend, { params });
}

const getMonthlySpendingSpikesAPI = (params) => {
    const urlBackend = "/v1/api/analytics/diagnostic/monthly-spikes";
    return axios.get(urlBackend, { params });
}

const getWalletVariationsAPI = (params) => {
    const urlBackend = "/v1/api/analytics/diagnostic/wallet-variations";
    return axios.get(urlBackend, { params });
}

// Phát hiện bất thường
const detectUnusualLargeExpensesAPI = (params) => {
    const urlBackend = "/v1/api/analytics/diagnostic/unusual-large";
    return axios.get(urlBackend, { params });
}

const detectUnusualTimeSpendingAPI = (params) => {
    const urlBackend = "/v1/api/analytics/diagnostic/unusual-time";
    return axios.get(urlBackend, { params });
}

const detect24hSpendingSpikeAPI = (params) => {
    const urlBackend = "/v1/api/analytics/diagnostic/24h-spike";
    return axios.get(urlBackend, { params });
}

// Thói quen chi tiêu
const getMostSpendingDayOfWeekAPI = (params) => {
    const urlBackend = "/v1/api/analytics/diagnostic/spending-day";
    return axios.get(urlBackend, { params });
}

const getMostFrequentCategoriesAPI = (params) => {
    const urlBackend = "/v1/api/analytics/diagnostic/frequent-categories";
    return axios.get(urlBackend, { params });
}

const getTransactionFrequencyAPI = (params) => {
    const urlBackend = "/v1/api/analytics/diagnostic/transaction-frequency";
    return axios.get(urlBackend, { params });
}

// ============================================
// PREDICTIVE ANALYTICS
// ============================================

// Dự đoán chi tiêu cuối tháng
const predictMonthEndExpense7DaysAPI = (params) => {
    const urlBackend = "/v1/api/analytics/predictive/month-end-7days";
    return axios.get(urlBackend, { params });
}

const predictMonthEndExpense30DaysAPI = (params) => {
    const urlBackend = "/v1/api/analytics/predictive/month-end-30days";
    return axios.get(urlBackend, { params });
}

const predictMonthEndExpenseTrendAPI = (params) => {
    const urlBackend = "/v1/api/analytics/predictive/month-end-trend";
    return axios.get(urlBackend, { params });
}

// Dự đoán vượt ngân sách
const predictBudgetOverrunAPI = (params) => {
    const urlBackend = "/v1/api/analytics/predictive/budget-overrun";
    return axios.get(urlBackend, { params });
}

// Dự đoán theo danh mục
const predictCategorySpendingAPI = (params) => {
    const urlBackend = "/v1/api/analytics/predictive/category-spending";
    return axios.get(urlBackend, { params });
}

// ============================================
// PRESCRIPTIVE ANALYTICS
// ============================================

// Gợi ý tối ưu
const suggestOptimizeSpendingAPI = (params) => {
    const urlBackend = "/v1/api/analytics/prescriptive/optimize-spending";
    return axios.get(urlBackend, { params });
}

const suggestBudgetAdjustmentAPI = (params) => {
    const urlBackend = "/v1/api/analytics/prescriptive/budget-adjustment";
    return axios.get(urlBackend, { params });
}

// Khuyến nghị chuyển tiền
const suggestWalletTransferAPI = (params) => {
    const urlBackend = "/v1/api/analytics/prescriptive/wallet-transfer";
    return axios.get(urlBackend, { params });
}

// Cảnh báo thông minh
const createSmartAlertsAPI = (data) => {
    const urlBackend = "/v1/api/analytics/prescriptive/create-alerts";
    return axios.post(urlBackend, data);
}

const getAlertHistoryAPI = (params) => {
    const urlBackend = "/v1/api/analytics/prescriptive/alert-history";
    return axios.get(urlBackend, { params });
}

const markAlertAsReadAPI = (alertId) => {
    const urlBackend = `/v1/api/analytics/prescriptive/alerts/${alertId}/read`;
    return axios.patch(urlBackend);
}

export {
    // Diagnostic
    getCategorySpendingSpikesAPI,
    getMonthlySpendingSpikesAPI,
    getWalletVariationsAPI,
    detectUnusualLargeExpensesAPI,
    detectUnusualTimeSpendingAPI,
    detect24hSpendingSpikeAPI,
    getMostSpendingDayOfWeekAPI,
    getMostFrequentCategoriesAPI,
    getTransactionFrequencyAPI,
    // Predictive
    predictMonthEndExpense7DaysAPI,
    predictMonthEndExpense30DaysAPI,
    predictMonthEndExpenseTrendAPI,
    predictBudgetOverrunAPI,
    predictCategorySpendingAPI,
    // Prescriptive
    suggestOptimizeSpendingAPI,
    suggestBudgetAdjustmentAPI,
    suggestWalletTransferAPI,
    createSmartAlertsAPI,
    getAlertHistoryAPI,
    markAlertAsReadAPI,
};

