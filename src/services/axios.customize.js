import axios from "axios";

// Flag để tránh redirect nhiều lần khi có nhiều API calls cùng lúc trả về 401
let isRedirecting = false;

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
    // Xử lý lỗi 401 (Unauthorized) - token hết hạn hoặc không hợp lệ
    if (error && error.response && error.response.status === 401) {
        // Xóa token
        localStorage.removeItem("accessToken");
        
        // Chỉ redirect một lần và chỉ khi không đang ở trang login
        if (!isRedirecting && window.location.pathname !== '/login') {
            isRedirecting = true;
            // Sử dụng window.location để đảm bảo reload hoàn toàn và reset state
            setTimeout(() => {
                window.location.href = '/login';
            }, 100);
        }
    }
    
    if (error && error.response && error.response.data)
        return error.response.data;
    return Promise.reject(error);
});

export default instance;