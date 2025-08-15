// backend/src/routes/medicalRoutes.js
import express from 'express';
import { getDashboardStats, getAllRecordsWithTriage,
        getUrgencyAnalysis,getPatientDetailWithWatson, 
        updateAttentionStatus } from '../controllers/MedicalController.js';

import medicalMiddleware from '../middleware/medicalMiddleware.js';

const router = express.Router();

// Solo usar medicalMiddleware (sin authMiddleware)
router.use(medicalMiddleware);

// Las 3 rutas principales que necesitas
router.get('/dashboard-stats', getDashboardStats);
router.get('/records', getAllRecordsWithTriage);
router.get('/urgency-analysis', getUrgencyAnalysis);
// Agregar nuevas rutas
// DESPUÉS:
router.get('/patient-detail/:patientId', (req, res, next) => {
  console.log('🔥🔥🔥 RUTA /patient-detail LLAMADA con ID:', req.params.patientId);
  console.log('🔥🔥🔥 Headers:', req.headers);
  next();
}, getPatientDetailWithWatson);

router.put('/attention-status/:patientId', updateAttentionStatus);

export default router;