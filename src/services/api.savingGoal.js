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
const completeSavingGoalAPI = (id) => {
  return axios.patch(`/v1/api/saving-goal/${id}/complete`);
};



export {
    getAllSavingGoalsAPI,
    getSavingGoalByIdAPI,
    createSavingGoalAPI,
    updateSavingGoalAPI,
    deleteSavingGoalAPI,
    completeSavingGoalAPI,
};




