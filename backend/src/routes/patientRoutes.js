import express from "express";
import {
  getPatientStats,
  getAllPatients,
  getPatientById,
  createPatient,
  updatePatient,
  deletePatient
} from "../controllers/patientController.js";

const router = express.Router();

// 📊 GET - Estadísticas simples de pacientes
router.get("/stats", getPatientStats);

// 📋 GET - Obtener todos los pacientes con filtros y paginación
// Query params: page, limit, search, status, sortBy, sortOrder
router.get("/", getAllPatients);

// 👤 GET - Obtener paciente específico con historial completo
router.get("/:id", getPatientById);

// ➕ POST - Crear nuevo paciente
router.post("/", createPatient);

// ✏️ PUT - Actualizar paciente existente
router.put("/:id", updatePatient);

// 🗑️ DELETE - Eliminar paciente (soft delete)
router.delete("/:id", deletePatient);

export default router;