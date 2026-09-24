// src/features/auth/authApi.js

import apiClient from "../../services/apiClient.js";

export const registerUserApi = async (userData) => {
  const response = await apiClient.post("/auth/register", userData);
  return response.data;
};

export const loginUserApi = async (userData) => {
  const response = await apiClient.post("/auth/login", userData);
  return response.data;
};

export const getProfileApi = async () => {
  const response = await apiClient.get("/auth/profile");
  return response.data;
};

export const uploadProfileImageApi = async (formData) => {
  const response = await apiClient.post(
    "/auth/upload-image",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return response.data;
};
