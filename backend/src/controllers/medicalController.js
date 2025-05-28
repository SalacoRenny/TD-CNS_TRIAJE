// backend/src/controllers/medicalController.js
import User from '../models/User.js';
import SymptomRecord from '../models/SymptomRecord.js';
import jwt from 'jsonwebtoken';

// Obtener estadísticas del dashboard
export const getDashboardStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Total de pacientes hoy
    const totalPacientes = await SymptomRecord.countDocuments({
      createdAt: { $gte: today }
    });

    // Pacientes atendidos hoy
    const atendidos = await SymptomRecord.countDocuments({
      createdAt: { $gte: today },
      status: { $in: ['attended', 'completed'] }
    });

    // Pacientes en espera
    const enEspera = await SymptomRecord.countDocuments({
      status: 'waiting'
    });

    // Pacientes urgentes en espera
    const urgentes = await SymptomRecord.countDocuments({
      priority: { $in: ['alta', 'muy-alta'] },
      status: 'waiting'
    });

    // Calcular tiempo promedio de espera
    const waitingTimes = await SymptomRecord.aggregate([
      {
        $match: {
          createdAt: { $gte: today },
          status: { $in: ['attended', 'completed'] },
          attendedAt: { $ne: null }
        }
      },
      {
        $project: {
          waitTime: {
            $subtract: ['$attendedAt', '$createdAt']
          }
        }
      }
    ]);

    let avgWaitTime = 0;
    if (waitingTimes.length > 0) {
      const totalWaitTime = waitingTimes.reduce((sum, record) => sum + record.waitTime, 0);
      avgWaitTime = Math.floor(totalWaitTime / waitingTimes.length / 60000); // Convertir a minutos
    }

    res.status(200).json({
      success: true,
      data: {
        totalPacientes,
        atendidos,
        enEspera,
        urgentes,
        tiempoPromedio: `${avgWaitTime} min`
      }
    });
  } catch (error) {
    console.error('Error en getDashboardStats:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al obtener estadísticas',
      error: error.message 
    });
  }
};

// Obtener cola de triaje
export const getTriageQueue = async (req, res) => {
  try {
    const queue = await SymptomRecord.find({ 
      status: 'waiting' 
    })
    .populate('userId', 'fullName insuranceCode birthDate phone')
    .sort({ 
      // Ordenar por prioridad (personalizado)
      priority: 1,
      createdAt: 1
    })
    .limit(50);

    // Mapear prioridades para ordenamiento correcto
    const priorityOrder = {
      'muy-alta': 1,
      'alta': 2,
      'media': 3,
      'baja': 4,
      'muy-baja': 5
    };

    // Ordenar manualmente por prioridad
    const sortedQueue = queue.sort((a, b) => {
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

    res.status(200).json({
      success: true,
      count: sortedQueue.length,
      data: sortedQueue
    });
  } catch (error) {
    console.error('Error en getTriageQueue:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al obtener cola de triaje',
      error: error.message 
    });
  }
};

// Atender paciente
export const attendPatient = async (req, res) => {
  try {
    const { id } = req.params;
    const medicalStaffId = req.userId; // ID del médico desde el token

    const record = await SymptomRecord.findByIdAndUpdate(
      id,
      {
        status: 'in-progress',
        attendedAt: new Date(),
        attendedBy: medicalStaffId
      },
      { new: true }
    ).populate('userId', 'fullName insuranceCode');

    if (!record) {
      return res.status(404).json({ 
        success: false,
        message: 'Registro no encontrado' 
      });
    }

    res.status(200).json({
      success: true,
      data: record,
      message: 'Paciente marcado como en atención'
    });
  } catch (error) {
    console.error('Error en attendPatient:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al atender paciente',
      error: error.message 
    });
  }
};

// Completar atención
export const completeAttention = async (req, res) => {
  try {
    const { id } = req.params;
    const { diagnosis, treatment, notes } = req.body;

    const record = await SymptomRecord.findByIdAndUpdate(
      id,
      {
        status: 'completed',
        completedAt: new Date(),
        additionalNotes: notes || ''
      },
      { new: true }
    );

    if (!record) {
      return res.status(404).json({ 
        success: false,
        message: 'Registro no encontrado' 
      });
    }

    res.status(200).json({
      success: true,
      data: record,
      message: 'Atención completada exitosamente'
    });
  } catch (error) {
    console.error('Error en completeAttention:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al completar atención',
      error: error.message 
    });
  }
};

// Obtener historial de un paciente
export const getPatientHistory = async (req, res) => {
  try {
    const { patientId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const history = await SymptomRecord.find({
      userId: patientId
    })
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .populate('attendedBy', 'fullName')
    .populate('registeredBy', 'fullName');

    const count = await SymptomRecord.countDocuments({ userId: patientId });

    res.status(200).json({
      success: true,
      count: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      data: history
    });
  } catch (error) {
    console.error('Error en getPatientHistory:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al obtener historial',
      error: error.message 
    });
  }
};

// Registrar síntomas de un paciente (por el médico)
export const registerPatientSymptoms = async (req, res) => {
  try {
    const { 
      insuranceCode,
      symptoms, 
      preExistingConditions, 
      temperature, 
      additionalNotes,
      priority 
    } = req.body;

    // Buscar paciente por código de asegurado
    const patient = await User.findOne({ 
      insuranceCode,
      userType: 'asegurado'
    });

    if (!patient) {
      return res.status(404).json({ 
        success: false,
        message: 'Paciente no encontrado con ese código de asegurado' 
      });
    }

    const newRecord = new SymptomRecord({
      userId: patient._id,
      symptoms,
      preExistingConditions,
      temperature,
      additionalNotes,
      priority: priority || 'media',
      status: 'waiting',
      registeredBy: req.userId // ID del médico que registra
    });

    await newRecord.save();

    // Poblar datos del usuario
    await newRecord.populate('userId', 'fullName insuranceCode');

    res.status(201).json({
      success: true,
      message: 'Síntomas registrados exitosamente',
      data: newRecord
    });
  } catch (error) {
    console.error('Error en registerPatientSymptoms:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al registrar síntomas',
      error: error.message 
    });
  }
};

// Buscar paciente por código de asegurado
export const searchPatient = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.length < 3) {
      return res.status(400).json({ 
        success: false,
        message: 'Ingrese al menos 3 caracteres para buscar' 
      });
    }

    const patients = await User.find({
      userType: 'asegurado',
      $or: [
        { insuranceCode: { $regex: q, $options: 'i' } },
        { fullName: { $regex: q, $options: 'i' } },
        { documentNumber: { $regex: q, $options: 'i' } }
      ]
    })
    .select('insuranceCode fullName documentNumber email phone')
    .limit(10);

    res.status(200).json({
      success: true,
      count: patients.length,
      data: patients
    });
  } catch (error) {
    console.error('Error en searchPatient:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al buscar paciente',
      error: error.message 
    });
  }
};

// Obtener todos los pacientes atendidos hoy
export const getTodayPatients = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const patients = await SymptomRecord.find({
      createdAt: { $gte: today }
    })
    .populate('userId', 'fullName insuranceCode')
    .populate('attendedBy', 'fullName')
    .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: patients.length,
      data: patients
    });
  } catch (error) {
    console.error('Error en getTodayPatients:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al obtener pacientes del día',
      error: error.message 
    });
  }
};