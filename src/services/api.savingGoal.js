import axios from "./axios.customize";

const getAllSavingGoalsAPI = (params) => {
    const urlBackend = "/v1/api/saving-goal";
    return axios.get(urlBackend, { params });
}

const getSavingGoalByIdAPI = (id) => {
    const urlBackend = `/v1/api/saving-goal/${id}`;
    return axios.get(urlBackend);
}

const createSavingGoalAPI = (data) => {
    const urlBackend = "/v1/api/saving-goal";
    return axios.post(urlBackend, data);
}

const updateSavingGoalAPI = (id, data) => {
    const urlBackend = `/v1/api/saving-goal/${id}`;
    return axios.put(urlBackend, data);
}

const deleteSavingGoalAPI = (id) => {
    const urlBackend = `/v1/api/saving-goal/${id}`;
    return axios.delete(urlBackend);
}

const addAmountAPI = (id, amount) => {
    const urlBackend = `/v1/api/saving-goal/${id}/add`;
    return axios.post(urlBackend, { amount });
}

const withdrawAmountAPI = (id, amount) => {
    const urlBackend = `/v1/api/saving-goal/${id}/withdraw`;
    return axios.post(urlBackend, { amount });
}

export {
    getAllSavingGoalsAPI,
    getSavingGoalByIdAPI,
    createSavingGoalAPI,
    updateSavingGoalAPI,
    deleteSavingGoalAPI,
    addAmountAPI,
    withdrawAmountAPI,
};

