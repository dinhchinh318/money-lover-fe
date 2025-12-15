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

const setDefaultWalletAPI = (id) => {
    const urlBackend = `/v1/api/wallet/${id}/default`;
    return axios.patch(urlBackend);
}

const archiveWalletAPI = (id) => {
    const urlBackend = `/v1/api/wallet/${id}/archive`;
    return axios.patch(urlBackend);
}

const unarchiveWalletAPI = (id) => {
    const urlBackend = `/v1/api/wallet/${id}/unarchive`;
    return axios.patch(urlBackend);
}

export {
    getWalletsAPI,
    getWalletByIdAPI,
    createWalletAPI,
    updateWalletAPI,
    deleteWalletAPI,
    setDefaultWalletAPI,
    archiveWalletAPI,
    unarchiveWalletAPI,
};

