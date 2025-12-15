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
    const urlBackend = `/v1/api/budget/${id}/stats`;
    return axios.get(urlBackend, { params });
}

export {
    getAllBudgetsAPI,
    getBudgetByIdAPI,
    createBudgetAPI,
    updateBudgetAPI,
    deleteBudgetAPI,
    getBudgetStatsAPI,
};

