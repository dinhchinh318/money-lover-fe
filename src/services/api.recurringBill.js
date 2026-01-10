import axios from "./axios.customize";

const getAllRecurringBillsAPI = (params) => {
    const urlBackend = "/v1/api/recurring-bill";
    return axios.get(urlBackend, { params });
}

const getRecurringBillByIdAPI = (id) => {
    const urlBackend = `/v1/api/recurring-bill/${id}`;
    return axios.get(urlBackend);
}

const createRecurringBillAPI = (data) => {
    const urlBackend = "/v1/api/recurring-bill";
    return axios.post(urlBackend, data);
}

const updateRecurringBillAPI = (id, data) => {
    const urlBackend = `/v1/api/recurring-bill/${id}`;
    return axios.put(urlBackend, data);
}

const deleteRecurringBillAPI = (id) => {
    const urlBackend = `/v1/api/recurring-bill/${id}`;
    return axios.delete(urlBackend);
}

const payRecurringBillAPI = (id) => {
    const urlBackend = `/v1/api/recurring-bill/${id}/pay`;
    return axios.post(urlBackend);
}
const pauseRecurringBillAPI = (id) => {
    const urlBackend = `/v1/api/recurring-bill/${id}/pause`;
    return axios.patch(urlBackend);
};

const resumeRecurringBillAPI = (id) => {
    const urlBackend = `/v1/api/recurring-bill/${id}/resume`;
    return axios.patch(urlBackend);
};

export {
    getAllRecurringBillsAPI,
    getRecurringBillByIdAPI,
    createRecurringBillAPI,
    updateRecurringBillAPI,
    deleteRecurringBillAPI,
    payRecurringBillAPI,
    pauseRecurringBillAPI,
    resumeRecurringBillAPI,
};




