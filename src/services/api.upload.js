import axios from "./axios.customize";

export const uploadImageAPI = (file) => {
  const urlBackend = "/v1/api/upload/image";
  const formData = new FormData();
  formData.append("image", file);

  return axios.post(urlBackend, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export const deleteImageAPI = (publicId) => {
  const safe = encodeURIComponent(publicId); // ✅ QUAN TRỌNG
  return axios.delete(`/v1/api/upload/image/${safe}`);
};
