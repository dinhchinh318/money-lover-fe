import axios from "./axios.customize";

const getAllBudgetsAPI = (params) => {
    const urlBackend = "/v1/api/budget";
    return axios.get(urlBackend, { params });
}

const getBudgetByIdAPI = (id) => {
    const urlBackend = `/v1/api/budget/${id}`;
    return axios.get(urlBackend);
}

const createBudgetAPI = (data) => {
    const urlBackend = "/v1/api/budget";
    return axios.post(urlBackend, data);
}

const updateBudgetAPI = (id, data) => {
    const urlBackend = `/v1/api/budget/${id}`;
    return axios.put(urlBackend, data);
}

const deleteBudgetAPI = (id) => {
    const urlBackend = `/v1/api/budget/${id}`;
    return axios.delete(urlBackend);
}

const getBudgetStatsAPI = (id, params) => {
    const urlBackend = `/v1/api/budget/${id}/statistics`;
    return axios.get(urlBackend, { params });
}
const getBudgetTransactionsAPI = (id, params) => {
  return axios.get(`/v1/api/budget/${id}/transactions`, { params });
};
export {
    getAllBudgetsAPI,
    getBudgetByIdAPI,
    createBudgetAPI,
    updateBudgetAPI,
    deleteBudgetAPI,
    getBudgetStatsAPI,
    getBudgetTransactionsAPI,
};




