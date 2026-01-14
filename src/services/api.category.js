import axios from "./axios.customize";

const getCategoriesAPI = () => {
    const urlBackend = "/v1/api/category";
    return axios.get(urlBackend);
}

const getCategoryByIdAPI = (id) => {
    const urlBackend = `/v1/api/category/${id}`;
    return axios.get(urlBackend);
}

const createCategoryAPI = (data) => {
    const urlBackend = "/v1/api/category";
    return axios.post(urlBackend, data);
}

const updateCategoryAPI = (id, data) => {
    const urlBackend = `/v1/api/category/${id}`;
    return axios.put(urlBackend, data);
}

const deleteCategoryAPI = (id) => {
    const urlBackend = `/v1/api/category/${id}`;
    return axios.delete(urlBackend);
}

export {
    getCategoriesAPI,
    getCategoryByIdAPI,
    createCategoryAPI,
    updateCategoryAPI,
    deleteCategoryAPI,
    setDefaultCategoryAPI,
};

