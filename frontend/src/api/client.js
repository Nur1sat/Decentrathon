import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL || "http://localhost:8000",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 60000,
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.detail ||
      error.message ||
      "Неизвестная ошибка";
    console.error("[API Error]", message);
    return Promise.reject(new Error(message));
  }
);

export const getCandidates = () =>
  api.get("/candidates").then((r) => r.data);

export const getCandidate = (id) =>
  api.get(`/candidates/${id}`).then((r) => r.data);

export const scoreCandidate = (id) =>
  api.post(`/candidates/${id}/score`).then((r) => r.data);

export const submitFeedback = (id, data) =>
  api.post(`/candidates/${id}/feedback`, data).then((r) => r.data);

export const setCandidateStatus = (id, status) =>
  api.post(`/candidates/${id}/decision`, { status }).then((r) => r.data);

export const getStats = () =>
  api.get("/stats").then((r) => r.data);

export default api;
