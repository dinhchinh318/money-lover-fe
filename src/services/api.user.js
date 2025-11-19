import axios from "./axios.customize";
const loginAPI = (email, password) => {
    const urlBackend = "/v1/api/auth/login";
    return axios.post(urlBackend, { email, password }, {
        headers: {
            delay: 1000
        }
    });
}
const registerAPI = (name, email, password, phone) => {
    const urlBackend = "/v1/api/auth/register";
    return axios.post(urlBackend, { name, email, password, phone });
}
const fetchAccountAPI = () => {
    const urlBackend = "/v1/api/auth/account";
    return axios.get(urlBackend)
}
const logoutAPI = () => {
    const urlBackend = "/v1/api/auth/logout";
    return axios.post(urlBackend);
}
const createUserAPI = (data) => {
    const urlBackend = "/v1/api/user";
    return axios.post(urlBackend, data)
}
const getUserAPI = () => {
    const urlBackend = "/v1/api/user";
    return axios.get(urlBackend);
}
const getAUserAPI = (id) => {
    const urlBackend = `/v1/api/user/${id}`;
    return axios.get(urlBackend)
}
const updateUserAPI = (data) => {
    const urlBackend = "/v1/api/user";
    return axios.put(urlBackend, data);
}
const deleteUserAPI = (id) => {
    const urlBackend = "/v1/api/user";
    return axios.delete(urlBackend, {
        data: { id }
    })
}
const forgotPasswordAPI = (email) => {
    const urlBackend = "/v1/api/auth/forgotPassword";
    return axios.post(urlBackend, { email })
}
const verifyOTPAPI = (email, otp) => {
    const urlBackend = "/v1/api/auth/verifyOTP";
    return axios.post(urlBackend, { email, otp });
}
const resetPasswordAPI = (email, password) => {
    const urlBackend = "/v1/api/auth/resetPassword";
    return axios.post(urlBackend, { email, password });
}
export { getAUserAPI, loginAPI, registerAPI, fetchAccountAPI, logoutAPI, getUserAPI, deleteUserAPI, createUserAPI, updateUserAPI, forgotPasswordAPI, verifyOTPAPI, resetPasswordAPI }