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

// 📋 FUNCIÓN CORREGIDA - Obtener todos los pacientes con auto-migración
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
    
    // ✅ BÚSQUEDA MEJORADA - Incluir nuevos campos de nombre
    if (search) {
      searchFilter.$or = [
        { name: { $regex: search, $options: "i" } },          // Campo legacy
        { firstName: { $regex: search, $options: "i" } },     // ✅ Nuevo campo
        { lastName: { $regex: search, $options: "i" } },      // ✅ Nuevo campo
        { motherLastName: { $regex: search, $options: "i" } }, // ✅ Nuevo campo
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
    
    // ✅ USAR findWithMigration para auto-migración de nombres
    const patients = await User.findWithMigration(searchFilter);
    
    // Aplicar ordenamiento y paginación manualmente después de la migración
    const sortedPatients = patients.sort((a, b) => {
      const aVal = a[sortBy];
      const bVal = b[sortBy];
      const order = sortOrder === "desc" ? -1 : 1;
      
      if (aVal < bVal) return -1 * order;
      if (aVal > bVal) return 1 * order;
      return 0;
    });
    
    const paginatedPatients = sortedPatients.slice(skip, skip + parseInt(limit));
    const total = patients.length;
    
    // Procesar cada paciente con información adicional
    const processedPatients = await Promise.all(
      paginatedPatients.map(async (patient) => {
        // Buscar último registro de síntomas
        const lastSymptomRecord = await SymptomRecord.findOne({ 
          userId: patient.userId 
        }).sort({ createdAt: -1 });
        
        // ✅ USAR getPatientSummary() para consistencia total
        const patientSummary = patient.getPatientSummary();
        
        return {
          ...patientSummary,
          hasHistory: !!lastSymptomRecord,
          lastAppointment: lastSymptomRecord?.timestamp || null,
        };
      })
    );
    
    console.log(`✅ ${processedPatients.length} pacientes procesados (${processedPatients.filter(p => p.firstName).length} migrados)`);
    
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

// 👤 FUNCIÓN CORREGIDA - Obtener paciente específico con auto-migración
export const getPatientById = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`👤 Obteniendo paciente: ${id}`);
    
    // ✅ USAR findWithMigration para auto-migración
    const patients = await User.findWithMigration({ 
      $or: [
        { _id: id },           // Búsqueda por _id
        { userId: id }         // Búsqueda por userId  
      ],
      role: "asegurado",
      isActive: true
    });
    
    const patient = patients[0];
    if (!patient) {
      return res.status(404).json({ error: "Paciente no encontrado" });
    }
    
    // Obtener historial completo de síntomas
    const symptomHistory = await SymptomRecord.find({ 
      userId: patient.userId 
    }).sort({ createdAt: -1 });
    
    // ✅ USAR getPatientSummary() y agregar historial
    const patientData = {
      ...patient.getPatientSummary(),
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
    
    console.log(`✅ Paciente encontrado: ${patient.fullName}`);
    res.status(200).json(patientData);
    
  } catch (error) {
    console.error("❌ Error obteniendo paciente:", error);
    res.status(500).json({ error: "Error del servidor" });
  }
};

// ➕ FUNCIÓN CORREGIDA - Crear nuevo paciente
export const createPatient = async (req, res) => {
  try {
    console.log("➕ Creando nuevo paciente...");
    
    // ✅ VALIDACIÓN ACTUALIZADA - Campos nuevos o legacy
    const { 
      userId, 
      firstName, 
      lastName, 
      motherLastName,
      name,           // Campo legacy para compatibilidad
      email, 
      ci, 
      password 
    } = req.body;
    
    // Validar que tengamos firstName/lastName O name
    if (!userId || !email || !ci || !password) {
      return res.status(400).json({ 
        error: "Faltan campos requeridos: userId, email, ci, password" 
      });
    }
    
    if (!firstName && !lastName && !name) {
      return res.status(400).json({ 
        error: "Debe proporcionar firstName + lastName O name" 
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
    
    // ✅ USAR getPatientSummary() para consistencia
    const patientResponse = newPatient.getPatientSummary();
    
    console.log(`✅ Paciente creado: ${newPatient.fullName}`);
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

// ✏️ FUNCIÓN CORREGIDA - Actualizar paciente con auto-migración
export const updatePatient = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`✏️ Actualizando paciente: ${id}`);
    
    // No permitir cambio de campos críticos
    const { role, password, userId, _id, __v, ...updateData } = req.body;
    updateData.updatedAt = new Date();
    
    // ✅ BUSCAR CON findWithMigration
    const patients = await User.findWithMigration({ 
      userId: id, 
      role: "asegurado", 
      isActive: true 
    });
    
    const patient = patients[0];
    if (!patient) {
      return res.status(404).json({ error: "Paciente no encontrado" });
    }
    
    // Actualizar campos
    Object.assign(patient, updateData);
    await patient.save();
    
    // ✅ USAR getPatientSummary() para respuesta consistente
    const patientResponse = patient.getPatientSummary();
    
    console.log(`✅ Paciente actualizado: ${patient.fullName}`);
    res.status(200).json({
      message: "Paciente actualizado exitosamente",
      patient: patientResponse
    });
    
  } catch (error) {
    console.error("❌ Error actualizando paciente:", error);
    if (error.code === 11000) {
      res.status(400).json({ 
        error: "Email ya está en uso por otro usuario" 
      });
    } else {
      res.status(500).json({ error: "Error del servidor" });
    }
  }
};

// 🗑️ FUNCIÓN CORREGIDA - Eliminar paciente con auto-migración
export const deletePatient = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🗑️ Eliminando paciente: ${id}`);
    
    // ✅ BUSCAR CON findWithMigration
    const patients = await User.findWithMigration({ 
      userId: id, 
      role: "asegurado", 
      isActive: true 
    });
    
    const patient = patients[0];
    if (!patient) {
      return res.status(404).json({ error: "Paciente no encontrado" });
    }
    
    // Soft delete
    patient.isActive = false;
    patient.updatedAt = new Date();
    await patient.save();
    
    console.log(`✅ Paciente eliminado: ${patient.fullName}`);
    res.status(200).json({
      message: "Paciente eliminado exitosamente"
    });
    
  } catch (error) {
    console.error("❌ Error eliminando paciente:", error);
    res.status(500).json({ error: "Error del servidor" });
  }
};

// ✅ Verificar si userId ya existe (SIN CAMBIOS - Ya funciona bien)
export const checkUserIdExists = async (req, res) => {
  try {
    const { userId } = req.params;
    console.log(`🔍 Verificando userId: ${userId}`);
    
    const exists = await User.findOne({ 
      userId: userId, 
      isActive: true,
      role: "asegurado" 
    });
    
    console.log(`✅ UserId ${userId} existe: ${!!exists}`);
    res.status(200).json({ exists: !!exists });
    
  } catch (error) {
    console.error("❌ Error verificando userId:", error);
    res.status(500).json({ error: "Error del servidor" });
  }
};

// 🔐 FUNCIÓN CORREGIDA - Actualizar contraseña con auto-migración
export const updatePatientPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;
    
    console.log(`🔐 Actualizando contraseña paciente: ${id}`);
    
    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({ 
        error: "Contraseña debe tener mínimo 8 caracteres" 
      });
    }
    
    if (!/(?=.*[A-Z])/.test(newPassword)) {
      return res.status(400).json({ 
        error: "Contraseña debe contener al menos una mayúscula" 
      });
    }
    
    if (!/(?=.*\d)/.test(newPassword)) {
      return res.status(400).json({ 
        error: "Contraseña debe contener al menos un número" 
      });
    }
    
    // ✅ BUSCAR CON findWithMigration
    const patients = await User.findWithMigration({ 
      userId: id, 
      role: "asegurado", 
      isActive: true 
    });
    
    const patient = patients[0];
    if (!patient) {
      return res.status(404).json({ error: "Paciente no encontrado" });
    }
    
    patient.password = newPassword; // Se hasheará automáticamente
    await patient.save();
    
    console.log(`✅ Contraseña actualizada para: ${patient.fullName}`);
    res.status(200).json({ 
      message: "Contraseña actualizada exitosamente" 
    });
    
  } catch (error) {
    console.error("❌ Error actualizando contraseña:", error);
    res.status(500).json({ error: "Error del servidor" });
  }
};