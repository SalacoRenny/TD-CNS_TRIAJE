// backend/src/routes/medicalRoutes.js
import express from 'express';
import { getDashboardStats, getAllRecordsWithTriage, getUrgencyAnalysis } from '../controllers/MedicalController.js';
import medicalMiddleware from '../middleware/medicalMiddleware.js';

const router = express.Router();

// Solo usar medicalMiddleware (sin authMiddleware)
router.use(medicalMiddleware);

// Las 3 rutas principales que necesitas
router.get('/dashboard-stats', getDashboardStats);
router.get('/records', getAllRecordsWithTriage);
router.get('/urgency-analysis', getUrgencyAnalysis);

export default router;