import axios from "./axios.customize";

/**
 * NOTIFICATION
 * Base: /v1/api/notification
 * Routes:
 *  POST   /
 *  GET    /
 *  GET    /:id
 *  PATCH  /:id/read
 *  PATCH  /read-all
 *  DELETE /:id
 *  PATCH  /:id/restore
 */

const createNotificationAPI = (data) => {
    const urlBackend = "/v1/api/notification";
    return axios.post(urlBackend, data);
};

const getNotificationsAPI = (params = {}) => {
    const urlBackend = "/v1/api/notification";
    return axios.get(urlBackend, { params });
};

const getNotificationByIdAPI = (id) => {
    const urlBackend = `/v1/api/notification/${id}`;
    return axios.get(urlBackend);
};

const markNotificationReadAPI = (id) => {
    const urlBackend = `/v1/api/notification/${id}/read`;
    return axios.patch(urlBackend);
};

const markAllNotificationsReadAPI = () => {
    const urlBackend = "/v1/api/notification/read-all";
    return axios.patch(urlBackend);
};

const deleteNotificationAPI = (id) => {
    const urlBackend = `/v1/api/notification/${id}`;
    return axios.delete(urlBackend);
};

const restoreNotificationAPI = (id) => {
    const urlBackend = `/v1/api/notification/${id}/restore`;
    return axios.patch(urlBackend);
};

export {
    createNotificationAPI,
    getNotificationsAPI,
    getNotificationByIdAPI,
    markNotificationReadAPI,
    markAllNotificationsReadAPI,
    deleteNotificationAPI,
    restoreNotificationAPI,
};
