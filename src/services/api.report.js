import axios from "./axios.customize";

// ============================================
// FINANCIAL DASHBOARD
// ============================================
const getFinancialDashboardAPI = (params) => {
    const urlBackend = "/v1/api/report/financial-dashboard";
    return axios.get(urlBackend, { params });
}

const getWalletChangesAPI = (params) => {
    const urlBackend = "/v1/api/report/wallet-changes";
    return axios.get(urlBackend, { params });
}

// ============================================
// TIME-BASED REPORTS
// ============================================
const getTimeBasedReportAPI = (params) => {
    const urlBackend = "/v1/api/report/time-based";
    return axios.get(urlBackend, { params });
}

// ============================================
// CATEGORY REPORTS
// ============================================
const getCategoryExpenseReportAPI = (params) => {
    const urlBackend = "/v1/api/report/category/expense";
    return axios.get(urlBackend, { params });
}

const getTopExpenseCategoriesAPI = (params) => {
    const urlBackend = "/v1/api/report/category/top-expense";
    return axios.get(urlBackend, { params });
}

const getTopIncomeCategoriesAPI = (params) => {
    const urlBackend = "/v1/api/report/category/top-income";
    return axios.get(urlBackend, { params });
}

// ============================================
// WALLET REPORTS
// ============================================
const getWalletExpenseReportAPI = (params) => {
    const urlBackend = "/v1/api/report/wallet/expense";
    return axios.get(urlBackend, { params });
}

const getWalletExpenseDistributionAPI = (params) => {
    const urlBackend = "/v1/api/report/wallet/distribution";
    return axios.get(urlBackend, { params });
}

const compareWalletExpenseOverTimeAPI = (params) => {
    const urlBackend = "/v1/api/report/wallet/compare-time";
    return axios.get(urlBackend, { params });
}

// ============================================
// COMPARISON REPORTS
// ============================================
const compareCurrentMonthWithPreviousAPI = () => {
    const urlBackend = "/v1/api/report/compare/month";
    return axios.get(urlBackend);
}

const compareCurrentWeekWithPreviousAPI = () => {
    const urlBackend = "/v1/api/report/compare/week";
    return axios.get(urlBackend);
}

const compareCurrentYearWithPreviousAPI = () => {
    const urlBackend = "/v1/api/report/compare/year";
    return axios.get(urlBackend);
}

export {
    getFinancialDashboardAPI,
    getWalletChangesAPI,
    getTimeBasedReportAPI,
    getCategoryExpenseReportAPI,
    getTopExpenseCategoriesAPI,
    getTopIncomeCategoriesAPI,
    getWalletExpenseReportAPI,
    getWalletExpenseDistributionAPI,
    compareWalletExpenseOverTimeAPI,
    compareCurrentMonthWithPreviousAPI,
    compareCurrentWeekWithPreviousAPI,
    compareCurrentYearWithPreviousAPI,
};

