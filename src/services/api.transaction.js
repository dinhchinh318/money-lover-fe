import axios from "./axios.customize";

const getAllTransactionsAPI = (params) => {
    const urlBackend = "/v1/api/transaction";
    return axios.get(urlBackend, { params });
}

const getTransactionByIdAPI = (id) => {
    const urlBackend = `/v1/api/transaction/${id}`;
    return axios.get(urlBackend);
}

const createTransactionAPI = (data) => {
    const urlBackend = "/v1/api/transaction";
    return axios.post(urlBackend, data);
}

const updateTransactionAPI = (id, data) => {
    const urlBackend = `/v1/api/transaction/${id}`;
    return axios.put(urlBackend, data);
}

const deleteTransactionAPI = (id) => {
    const urlBackend = `/v1/api/transaction/${id}`;
    return axios.delete(urlBackend);
}

const restoreTransactionAPI = (id) => {
    const urlBackend = `/v1/api/transaction/${id}/restore`;
    return axios.patch(urlBackend);
}

const settleDebtLoanAPI = (id) => {
    const urlBackend = `/v1/api/transaction/${id}/settle`;
    return axios.patch(urlBackend);
}

const getOverviewStatsAPI = (params) => {
    const urlBackend = "/v1/api/transaction/stats/overview";
    return axios.get(urlBackend, { params });
}

const getStatsByCategoryAPI = (params) => {
    const urlBackend = "/v1/api/transaction/stats/category";
    return axios.get(urlBackend, { params });
}

export {
    getAllTransactionsAPI,
    getTransactionByIdAPI,
    createTransactionAPI,
    updateTransactionAPI,
    deleteTransactionAPI,
    restoreTransactionAPI,
    settleDebtLoanAPI,
    getOverviewStatsAPI,
    getStatsByCategoryAPI,
};



