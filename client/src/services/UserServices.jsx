// src/services/UserServices.js
import api from "../api/axios";

/**
 * PATCH /api/v1/user → update profile
 */
export const updateProfileApi = async (formData) => {
  const response = await api.patch('/user', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data?.data;
};

/**
 * DELETE /api/v1/user → remove display picture
 */
export const removeDpApi = async () => {
  const response = await api.delete('/user');
  return response.data?.data;
};
