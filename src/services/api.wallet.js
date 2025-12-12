import axios from "./axios.customize";

const getWalletsAPI = () => {
    const urlBackend = "/v1/api/wallet";
    return axios.get(urlBackend);
}

const getWalletByIdAPI = (id) => {
    const urlBackend = `/v1/api/wallet/${id}`;
    return axios.get(urlBackend);
}

const createWalletAPI = (data) => {
    const urlBackend = "/v1/api/wallet";
    return axios.post(urlBackend, data);
}

const updateWalletAPI = (id, data) => {
    const urlBackend = `/v1/api/wallet/${id}`;
    return axios.put(urlBackend, data);
}

const deleteWalletAPI = (id) => {
    const urlBackend = `/v1/api/wallet/${id}`;
    return axios.delete(urlBackend);
}

export {
    getWalletsAPI,
    getWalletByIdAPI,
    createWalletAPI,
    updateWalletAPI,
    deleteWalletAPI,
};

