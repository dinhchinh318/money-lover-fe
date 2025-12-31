import axios from "./axios.customize";

/**
 * PROFILE
 * Base: /v1/api/profile
 * Routes:
 *  GET    /me
 *  PUT    /me
 *  DELETE /me
 *  PATCH  /me/restore
 */

const getMyProfileAPI = () => {
    const urlBackend = "/v1/api/profile/me";
    return axios.get(urlBackend);
};

const updateMyProfileAPI = (data) => {
    const urlBackend = "/v1/api/profile/me";
    return axios.put(urlBackend, data);
};

const uploadMyAvatarAPI = (file) => {
  const formData = new FormData();
  formData.append("avatar", file);

  return axios.put("/v1/api/profile/me/avatar", formData);
};


const deleteMyProfileAPI = () => {
    const urlBackend = "/v1/api/profile/me";
    return axios.delete(urlBackend);
};

const restoreMyProfileAPI = () => {
    const urlBackend = "/v1/api/profile/me/restore";
    return axios.patch(urlBackend);
};

export {
    getMyProfileAPI,
    updateMyProfileAPI,
    uploadMyAvatarAPI,
    deleteMyProfileAPI,
    restoreMyProfileAPI,
};
