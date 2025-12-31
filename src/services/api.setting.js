import axios from "./axios.customize";

/**
 * SETTING
 * Base: /v1/api/setting
 * Routes:
 *  GET    /me
 *  PUT    /me
 *  POST   /me/reset
 *  DELETE /me
 *  PATCH  /me/restore
 */

const getMySettingAPI = () => {
    const urlBackend = "/v1/api/setting/me";
    return axios.get(urlBackend);
};

const updateMySettingAPI = (data) => {
    const urlBackend = "/v1/api/setting/me";
    return axios.put(urlBackend, data);
};

const resetMySettingAPI = () => {
    const urlBackend = "/v1/api/setting/me/reset";
    return axios.post(urlBackend);
};

const deleteMySettingAPI = () => {
    const urlBackend = "/v1/api/setting/me";
    return axios.delete(urlBackend);
};

const restoreMySettingAPI = () => {
    const urlBackend = "/v1/api/setting/me/restore";
    return axios.patch(urlBackend);
};

export {
    getMySettingAPI,
    updateMySettingAPI,
    resetMySettingAPI,
    deleteMySettingAPI,
    restoreMySettingAPI,
};
