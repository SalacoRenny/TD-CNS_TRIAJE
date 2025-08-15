//Script api.js:
import axios from "axios";

console.log('📦 Cargando api.js'); // Para verificar que se carga

const API = axios.create({
 baseURL: "http://localhost:5000/api",
});

// ✅ INTERCEPTOR CORREGIDO - Dinámico con localStorage
API.interceptors.request.use(
 (config) => {
   console.log('🚀 INTERCEPTOR EJECUTÁNDOSE!!');
   console.log('🔍 Config original:', config);
   
   // Obtener usuario del localStorage
   const storedUser = localStorage.getItem("cnsUser");
   if (storedUser) {
     const user = JSON.parse(storedUser);
     config.headers['x-user-id'] = user.userId;  // ✅ USAR userId CORRECTO
     config.headers['x-user-role'] = user.role;   // ✅ USAR role CORRECTO
     
     console.log('👤 Usuario del localStorage:', user);
     console.log('📋 Headers finales:', config.headers);
   } else {
     console.log('⚠️ No hay usuario en localStorage');
   }
   
   return config;
 },
 (error) => {
   console.error('❌ Error en interceptor:', error);
   return Promise.reject(error);
 }
);

console.log('✅ Interceptor configurado');

// ======================================
// 🏥 SERVICIOS ORIGINALES (mantener)
// ======================================

// Dashboard médico
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

// ======================================
// 🆕 NUEVAS FUNCIONES MÉDICAS WATSON
// ======================================

// 👤 Obtener detalle completo del paciente con datos Watson
export const getPatientDetailWithWatson = (patientId) => {
 console.log('📞 Llamando getPatientDetailWithWatson:', patientId);
 return API.get(`/medical/patient-detail/${patientId}`);
};

// 🏥 Actualizar estado de atención del paciente
export const updateAttentionStatus = (patientId, data) => {
 console.log('📞 Llamando updateAttentionStatus:', patientId, data);
 return API.put(`/medical/attention-status/${patientId}`, data);
};

// Síntomas y usuarios
export const postSymptomRecord = (data) => API.post("/symptoms", data);
export const postUser = (data) => API.post("/users", data);
export const postLogin = (data) => API.post("/auth/login", data);
export const getSymptomHistoryByUser = (userId) => {
 console.log(`📞 Llamando getSymptomHistoryByUser: ${userId}`);
 return API.get(`/symptom-records/history/${userId}`);
};

// ======================================
// 🆕 SERVICIOS PARA GESTIÓN DE PACIENTES
// ======================================

// 📊 Estadísticas de pacientes
export const getPatientStats = () => {
 console.log('📞 Llamando getPatientStats');
 return API.get("/patients/stats");
};

// 📋 Obtener todos los pacientes con filtros
export const getAllPatients = (params = {}) => {
 console.log('📞 Llamando getAllPatients con params:', params);
 return API.get("/patients", { params });
};

// 👤 Obtener paciente específico
export const getPatientById = (id) => {
 console.log(`📞 Llamando getPatientById: ${id}`);
 return API.get(`/patients/${id}`);
};

// ➕ Crear nuevo paciente
export const createPatient = (data) => {
 console.log('📞 Llamando createPatient con data:', data);
 return API.post("/patients", data);
};

// ✏️ Actualizar paciente
export const updatePatient = (id, data) => {
 console.log(`📞 Llamando updatePatient: ${id}`, data);
 return API.put(`/patients/${id}`, data);
};

// 🗑️ Eliminar paciente
export const deletePatient = (id) => {
 console.log(`📞 Llamando deletePatient: ${id}`);
 return API.delete(`/patients/${id}`);
};

// 🔄 Sincronizar datos del usuario después de actualización médica
export const syncUserData = (userId) => {
 console.log(`📞 Llamando syncUserData: ${userId}`);
 return API.get(`/auth/sync-user/${userId}`);
};

// ======================================
// 🔄 FUNCIONES DE UTILIDAD PARA PACIENTES
// ======================================

// 🔍 Búsqueda de pacientes con múltiples criterios
export const searchPatients = (searchTerm, filters = {}) => {
 const params = {
   search: searchTerm,
   ...filters
 };
 console.log('📞 Llamando searchPatients:', params);
 return API.get("/patients", { params });
};

// 📄 Obtener pacientes con paginación específica
export const getPatientsPaginated = (page = 1, limit = 10, filters = {}) => {
 const params = {
   page,
   limit,
   ...filters
 };
 console.log('📞 Llamando getPatientsPaginated:', params);
 return API.get("/patients", { params });
};

// 📈 Obtener historial médico completo de un paciente
export const getPatientMedicalHistory = async (patientId) => {
 try {
   console.log(`📞 Llamando getPatientMedicalHistory: ${patientId}`);
   const response = await API.get(`/patients/${patientId}`);
   return response.data.symptomHistory || [];
 } catch (error) {
   console.error("Error obteniendo historial médico:", error);
   throw error;
 }
};

//REPORTES DEL PERSONAL MÉDICO:

// Estadísticas generales del dashboard
export const getReportsStats = () => {
 console.log('📞 Llamando getReportsStats');
 return API.get("/reports/stats");
};

// Analíticas de triaje por período
export const getTriageAnalytics = (params = {}) => {
 console.log('📞 Llamando getTriageAnalytics con params:', params);
 return API.get("/reports/triage-analytics", { params });
};

// Distribución de urgencias
export const getUrgencyDistribution = (params = {}) => {
 console.log('📞 Llamando getUrgencyDistribution');
 return API.get("/reports/urgency-distribution", { params });
};

// Estadísticas por departamento
export const getDepartmentStats = (params = {}) => {
 console.log('📞 Llamando getDepartmentStats');
 return API.get("/reports/department-stats", { params });
};

// Actividad reciente
export const getRecentActivity = (params = {}) => {
 console.log('📞 Llamando getRecentActivity');
 return API.get("/reports/recent-activity", { params });
};

// Exportar reportes
export const exportReport = (type, params = {}) => {
 console.log('📞 Llamando exportReport:', type, params);
 return API.get(`/reports/export/${type}`, { 
   params,
   responseType: 'blob' // Para descargar archivos
 });
};

// 🆕 AGREGAR: Obtener contexto histórico del paciente
export const getPatientRecentContext = (userId) => {
 console.log(`📞 Llamando getPatientRecentContext: ${userId}`);
 return API.get(`/symptoms/patients/${userId}/recent-context`);
};

// 🔍 Verificar si userId ya existe
export const checkUserIdExists = (userId) => {
 console.log(`📞 Llamando checkUserIdExists: ${userId}`);
 return API.get(`/patients/check-userid/${userId}`);
};

// 🔐 Actualizar contraseña de paciente
export const updatePatientPassword = (id, newPassword) => {
 console.log(`📞 Llamando updatePatientPassword: ${id}`);
 return API.put(`/patients/${id}/password`, { newPassword });
};

//Inicio de sesión - registros de usuarios:

// 🆕 AGREGAR ESTA FUNCIÓN AL FINAL DEL ARCHIVO api.js
export const registerUser = (data) => {
  console.log('📞 Llamando registerUser con data:', data);
  return API.post("/auth/register", data);
};

// Estadísticas del asistente
export const getAssistantStats = (assistantId, params = {}) => {
  console.log('📞 Llamando getAssistantStats:', assistantId);
  return API.get(`/assistant/stats/${assistantId}`, { params });
};

export const getAssistantTriageHistory = (assistantId, params = {}) => {
  console.log('📞 Llamando getAssistantTriageHistory:', assistantId);
  return API.get(`/assistant/history/${assistantId}`, { params });
};

// ======================================
// 🛠️ CONFIGURACIÓN ADICIONAL
// ======================================

// Interceptor para manejo global de errores
API.interceptors.response.use(
 (response) => {
   console.log('✅ Respuesta exitosa:', response.status);
   return response;
 },
 (error) => {
   console.error('❌ Error en respuesta:', error.response?.status, error.response?.data);
   
   if (error.response?.status === 401) {
     console.log('🚨 Error 401 - Redirigiendo a login');
     // En el futuro, aquí puedes limpiar el contexto de usuario
     // window.location.href = '/login';
   }
   
   return Promise.reject(error);
 }
);

export default API;