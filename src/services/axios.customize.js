import axios from "axios";
const instance = axios.create({
    baseURL: import.meta.env.VITE_BACKEND_URL,
    withCredentials: true
});
instance.interceptors.request.use(function (config) {
    const token = localStorage.getItem("accessToken");
    const auth = token ? `Bearer ${token}` : '';
    config.headers['Authorization'] = auth;
    return config;
}, function (error) {
    return Promise.reject(error);
});
instance.interceptors.response.use(function (response) {
    if (response && response.data)
        return response.data;
    return response;
}, function (error) {
    if (error && error.response && error.response.data)
        return error.response.data;
    return Promise.reject(error);
});
export default instance;