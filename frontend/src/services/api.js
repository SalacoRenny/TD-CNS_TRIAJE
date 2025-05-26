import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000/api",
});

// Registro de síntomas
export const postSymptomRecord = (data) => API.post("/symptoms", data);

// Registro de usuario
export const postUser = (data) => API.post("/users", data);

// Login de usuario
export const postLogin = (data) => API.post("/auth/login", data);

// Historial clínico
export const getSymptomHistoryByUser = (userId) =>
  API.get(`/symptom-records/history/${userId}`);
