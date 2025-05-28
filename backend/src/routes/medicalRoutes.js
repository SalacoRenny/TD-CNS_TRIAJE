// backend/src/routes/medicalRoutes.js
import express from 'express';
import * as medicalController from '../controllers/MedicalController.js';
import authMiddleware from '../middleware/authMiddleware.js';
import medicalMiddleware from '../middleware/medicalMiddleware.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// Middleware para verificar que es personal médico
router.use(medicalMiddleware);

// Dashboard y estadísticas
router.get('/dashboard-stats', medicalController.getDashboardStats);
router.get('/triage-queue', medicalController.getTriageQueue);
router.get('/today-patients', medicalController.getTodayPatients);

// Gestión de pacientes
router.put('/attend-patient/:id', medicalController.attendPatient);
router.put('/complete-attention/:id', medicalController.completeAttention);
router.get('/patient-history/:patientId', medicalController.getPatientHistory);

// Registro de síntomas por médico
router.post('/register-symptoms', medicalController.registerPatientSymptoms);

// Búsqueda de pacientes
router.get('/search-patient', medicalController.searchPatient);

export default router;