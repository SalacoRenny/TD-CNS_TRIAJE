import User from "../models/User.js";
import SymptomRecord from "../models/SymptomRecord.js";

// 📊 Obtener estadísticas generales de pacientes (NO métricas de alto nivel)
export const getPatientStats = async (req, res) => {
  try {
    console.log("📊 Obteniendo estadísticas de pacientes...");
    
    // Solo pacientes asegurados activos
    const totalPatients = await User.countDocuments({ 
      role: "asegurado", 
      isActive: true 
    });
    
    // Pacientes con historial médico
    const patientsWithHistory = await User.countDocuments({ 
      role: "asegurado", 
      isActive: true,
      status: "con_historial"
    });
    
    console.log(`✅ Estadísticas: ${totalPatients} pacientes, ${patientsWithHistory} con historial`);
    
    res.status(200).json({
      totalPatients,
      patientsWithHistory,
      registeredOnly: totalPatients - patientsWithHistory
    });
    
  } catch (error) {
    console.error("❌ Error obteniendo estadísticas:", error);
    res.status(500).json({ error: "Error del servidor" });
  }
};

// 📋 Obtener todos los pacientes con paginación y filtros
export const getAllPatients = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search = "", 
      status = "",
      sortBy = "createdAt",
      sortOrder = "desc"
    } = req.query;
    
    console.log(`📋 Obteniendo pacientes - Página ${page}, Límite ${limit}`);
    
    // Filtro base: solo asegurados activos
    let searchFilter = { 
      role: "asegurado", 
      isActive: true 
    };
    
    // Agregar búsqueda por múltiples campos
    if (search) {
      searchFilter.$or = [
        { name: { $regex: search, $options: "i" } },
        { ci: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { userId: { $regex: search, $options: "i" } }
      ];
    }
    
    // Filtrar por estado si se especifica
    if (status && ["registrado", "con_historial"].includes(status)) {
      searchFilter.status = status;
    }
    
    // Configurar paginación y ordenamiento
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === "desc" ? -1 : 1;
    
    // Obtener pacientes sin contraseña
    const patients = await User.find(searchFilter)
      .select("-password") 
      .sort(sortOptions)
      .limit(parseInt(limit))
      .skip(skip);
    
    // Contar total para paginación
    const total = await User.countDocuments(searchFilter);
    
    // Procesar cada paciente con información adicional
    const processedPatients = await Promise.all(
      patients.map(async (patient) => {
        // Buscar último registro de síntomas
        const lastSymptomRecord = await SymptomRecord.findOne({ 
          userId: patient.userId 
        }).sort({ createdAt: -1 });
        
        return {
          _id: patient._id,
          userId: patient.userId,
          name: patient.name,
          email: patient.email,
          ci: patient.ci,
          dateOfBirth: patient.dateOfBirth, // ← FECHA DE NACIMIENTO.
          age: patient.age,
          gender: patient.gender || "No especificado",
          phone: patient.phone || "No registrado",
          status: patient.status,
          classification: patient.getPatientStatus(),
          lastTriageDate: patient.lastTriageDate,
          lastAppointment: lastSymptomRecord?.timestamp || null,
          createdAt: patient.createdAt,
          updatedAt: patient.updatedAt,
          hasHistory: !!lastSymptomRecord
        };
      })
    );
    
    console.log(`✅ ${processedPatients.length} pacientes procesados`);
    
    res.status(200).json({
      patients: processedPatients,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalPatients: total,
        hasNext: skip + processedPatients.length < total,
        hasPrev: parseInt(page) > 1,
        limit: parseInt(limit)
      }
    });
    
  } catch (error) {
    console.error("❌ Error obteniendo pacientes:", error);
    res.status(500).json({ error: "Error del servidor" });
  }
};

// 👤 Obtener un paciente específico con historial completo
export const getPatientById = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`👤 Obteniendo paciente: ${id}`);
    
    // Buscar paciente por ID
    const patient = await User.findById(id).select("-password");
    if (!patient || patient.role !== "asegurado" || !patient.isActive) {
      return res.status(404).json({ error: "Paciente no encontrado" });
    }
    
    // Obtener historial completo de síntomas
    const symptomHistory = await SymptomRecord.find({ 
      userId: patient.userId 
    }).sort({ createdAt: -1 });
    
    // Preparar respuesta completa
    const patientData = {
      ...patient.toObject(),
      age: patient.age,
      classification: patient.getPatientStatus(),
      symptomHistory: symptomHistory.map(record => ({
        _id: record._id,
        symptoms: record.symptoms || [],
        baseConditions: record.baseConditions || [],
        temperature: record.temperature || "",
        notes: record.notes || "",
        timestamp: record.timestamp,
        createdAt: record.createdAt
      }))
    };
    
    console.log(`✅ Paciente encontrado: ${patient.name}`);
    res.status(200).json(patientData);
    
  } catch (error) {
    console.error("❌ Error obteniendo paciente:", error);
    res.status(500).json({ error: "Error del servidor" });
  }
};

// ➕ Crear nuevo paciente
export const createPatient = async (req, res) => {
  try {
    console.log("➕ Creando nuevo paciente...");
    
    // Validar datos requeridos
    const { userId, name, email, ci, password } = req.body;
    if (!userId || !name || !email || !ci || !password) {
      return res.status(400).json({ 
        error: "Faltan campos requeridos: userId, name, email, ci, password" 
      });
    }
    
    // Preparar datos del paciente
    const patientData = {
      ...req.body,
      role: "asegurado", // Forzar rol de asegurado
      status: "registrado" // Estado inicial
    };
    
    const newPatient = new User(patientData);
    await newPatient.save();
    
    // Respuesta sin contraseña
    const patientResponse = newPatient.getPatientSummary();
    
    console.log(`✅ Paciente creado: ${newPatient.name}`);
    res.status(201).json({
      message: "Paciente creado exitosamente",
      patient: patientResponse
    });
    
  } catch (error) {
    console.error("❌ Error creando paciente:", error);
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      res.status(400).json({ 
        error: `Ya existe un paciente con ese ${field === 'userId' ? 'código de asegurado' : field}` 
      });
    } else {
      res.status(500).json({ error: "Error del servidor" });
    }
  }
};

// ✏️ Actualizar paciente existente
export const updatePatient = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`✏️ Actualizando paciente: ${id}`);
    
    // No permitir cambio de campos críticos
    const { role, password, userId, _id, __v, ...updateData } = req.body;
    updateData.updatedAt = new Date();
    
    const updatedPatient = await User.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).select("-password");
    
    if (!updatedPatient || updatedPatient.role !== "asegurado") {
      return res.status(404).json({ error: "Paciente no encontrado" });
    }
    
    const patientResponse = updatedPatient.getPatientSummary();
    
    console.log(`✅ Paciente actualizado: ${updatedPatient.name}`);
    res.status(200).json({
      message: "Paciente actualizado exitosamente",
      patient: patientResponse
    });
    
  } catch (error) {
    console.error("❌ Error actualizando paciente:", error);
    res.status(500).json({ error: "Error del servidor" });
  }
};

// 🗑️ Eliminar paciente (soft delete)
export const deletePatient = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🗑️ Eliminando paciente: ${id}`);
    
    const deletedPatient = await User.findByIdAndUpdate(
      id,
      { 
        isActive: false, 
        updatedAt: new Date() 
      },
      { new: true }
    ).select("-password");
    
    if (!deletedPatient || deletedPatient.role !== "asegurado") {
      return res.status(404).json({ error: "Paciente no encontrado" });
    }
    
    console.log(`✅ Paciente eliminado: ${deletedPatient.name}`);
    res.status(200).json({
      message: "Paciente eliminado exitosamente"
    });
    
  } catch (error) {
    console.error("❌ Error eliminando paciente:", error);
    res.status(500).json({ error: "Error del servidor" });
  }
};