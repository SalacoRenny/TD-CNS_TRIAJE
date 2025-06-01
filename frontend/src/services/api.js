import axios from "axios";

console.log('📦 Cargando api.js'); // Para verificar que se carga

const API = axios.create({
  baseURL: "http://localhost:5000/api",
});

// Agregar interceptor INMEDIATAMENTE
API.interceptors.request.use(
  (config) => {
    console.log('🚀 INTERCEPTOR EJECUTÁNDOSE!!');
    console.log('🔍 Config original:', config);
    
    // Hardcodear valores para prueba
    config.headers['x-user-id'] = '5151511';
    config.headers['x-user-role'] = 'personal_medico';
    
    console.log('📋 Headers finales:', config.headers);
    return config;
  },
  (error) => {
    console.error('❌ Error en interceptor:', error);
    return Promise.reject(error);
  }
);

console.log('✅ Interceptor configurado');

// Resto de funciones...
export const getDashboardStats = () => {
  console.log('📞 Llamando getDashboardStats');
  return API.get("/medical/dashboard-stats");
};

export const getAllRecordsWithTriage = (params) => {
  console.log('📞 Llamando getAllRecordsWithTriage');
  return API.get("/medical/records", { params });
};

export const getUrgencyAnalysis = () => {
  console.log('📞 Llamando getUrgencyAnalysis');
  return API.get("/medical/urgency-analysis");
};

// Otras funciones...
export const postSymptomRecord = (data) => API.post("/symptoms", data);
export const postUser = (data) => API.post("/users", data);
export const postLogin = (data) => API.post("/auth/login", data);
export const getSymptomHistoryByUser = (userId) => API.get(`/symptom-records/history/${userId}`);