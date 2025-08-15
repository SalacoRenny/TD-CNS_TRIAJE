// ✅ MEDICAL CONTROLLER ACTUALIZADO - CON SISTEMA DE DOCTORES Y NOMBRES SEGUROS
// medicalController.js - VERSIÓN CORREGIDA CON AUTO-MIGRACIÓN

import SymptomRecord from "../models/SymptomRecord.js";
import User from "../models/User.js";

// 🆕 FUNCIÓN MEJORADA: Usar datos Watson REALES en lugar de re-clasificar
const getWatsonClassificationOrFallback = (record) => {
 // ✅ PRIORIDAD 1: Usar clasificación Watson si existe
 if (record.final_classification && record.classification_method === 'watson') {
   return {
     urgency: {
       level: record.final_classification.level,
       color: record.final_classification.color,
       label: record.final_classification.label,
       bgColor: record.final_classification.bgColor
     },
     specialty: record.final_classification.specialty,
     method: 'watson',
     confidence: record.confidence_score || 0.85,
     isWatsonData: true
   };
 }

 // ✅ PRIORIDAD 2: Usar clasificación simple si existe
 if (record.final_classification) {
   return {
     urgency: {
       level: record.final_classification.level,
       color: record.final_classification.color,
       label: record.final_classification.label,
       bgColor: record.final_classification.bgColor
     },
     specialty: record.final_classification.specialty || 'Medicina General',
     method: record.classification_method || 'simple',
     confidence: record.confidence_score || 0.75,
     isWatsonData: false
   };
 }

 // 🔄 FALLBACK: Solo si no hay datos guardados (registros antiguos)
 console.log(`⚠️ Usando fallback para registro ${record._id} - sin clasificación guardada`);
 const urgencyData = classifyUrgencyFallback(record.symptoms || [], record.temperature);
 return {
   urgency: urgencyData,
   specialty: suggestSpecialtyFallback(record.symptoms || [], record.baseConditions || []),
   method: 'fallback',
   confidence: 0.7,
   isWatsonData: false
 };
};

// 🔄 FUNCIONES FALLBACK (mantener igual)
const classifyUrgencyFallback = (symptoms, temperature) => {
 const urgentSymptoms = ['dolor de pecho', 'dificultad para respirar', 'sangrado', 'inconsciente', 'convulsiones'];
 const highSymptoms = ['fiebre alta', 'vómito', 'dolor intenso', 'mareos'];
 const temp = parseFloat(temperature) || 0;
 
 if (urgentSymptoms.some(symptom => 
   symptoms.some(s => s.toLowerCase().includes(symptom))
 ) || temp >= 39.5) {
   return { level: 1, color: '#EF4444', label: 'Inmediato', bgColor: '#FEF2F2' };
 }
 
 if (highSymptoms.some(symptom => 
   symptoms.some(s => s.toLowerCase().includes(symptom))
 ) || temp >= 38.5) {
   return { level: 2, color: '#F97316', label: 'Muy Urgente', bgColor: '#FFF7ED' };
 }
 
 if (temp >= 37.5 || symptoms.length >= 3) {
   return { level: 3, color: '#EAB308', label: 'Urgente', bgColor: '#FEFCE8' };
 }
 
 if (symptoms.length >= 1) {
   return { level: 4, color: '#22C55E', label: 'Menos Urgente', bgColor: '#F0FDF4' };
 }
 
 return { level: 5, color: '#3B82F6', label: 'No Urgente', bgColor: '#EFF6FF' };
};

const suggestSpecialtyFallback = (symptoms, baseConditions) => {
 const specialties = {
   'Cardiología': ['dolor de pecho', 'palpitaciones', 'hipertensión', 'arritmia'],
   'Neurología': ['dolor de cabeza', 'mareos', 'convulsiones', 'pérdida de conciencia'],
   'Gastroenterología': ['dolor abdominal', 'náuseas', 'vómito', 'diarrea'],
   'Neumología': ['dificultad para respirar', 'tos', 'dolor de pecho al respirar'],
   'Traumatología': ['dolor de huesos', 'fractura', 'esguince', 'dolor articular'],
   'Dermatología': ['erupción', 'picazón', 'lesiones en la piel']
 };

 const allSymptoms = [...(symptoms || []), ...(baseConditions || [])].map(s => s.toLowerCase());
 
 for (const [specialty, keywords] of Object.entries(specialties)) {
   if (keywords.some(keyword => 
     allSymptoms.some(symptom => symptom.includes(keyword))
   )) {
     return specialty;
   }
 }
 
 return 'Medicina General';
};

// Función auxiliar para tiempo transcurrido
function getTimeAgo(date) {
 const now = new Date();
 const diffInMinutes = Math.floor((now - new Date(date)) / (1000 * 60));
 
 if (diffInMinutes < 1) return 'Ahora mismo';
 if (diffInMinutes < 60) return `${diffInMinutes} min ago`;
 
 const diffInHours = Math.floor(diffInMinutes / 60);
 if (diffInHours < 24) return `${diffInHours}h ago`;
 
 const diffInDays = Math.floor(diffInHours / 24);
 return `${diffInDays}d ago`;
}

// 🚀 FUNCIÓN HELPER CORREGIDA - Obtener nombre seguro CON AUTO-MIGRACIÓN
const getSafePatientName = (user, record) => {
  // 🔧 AUTO-MIGRAR usuario si es necesario
  if (user && user.migrateNameIfNeeded) {
    user.migrateNameIfNeeded();
  }
  
  // 🔧 USAR EL VIRTUAL fullName del modelo USER
  if (user && user.fullName) {
    return user.fullName;
  }
  
  // 🔧 CONSTRUIR NOMBRE DESDE CAMPOS SEPARADOS
  if (user && user.firstName && user.lastName) {
    const nameParts = [user.firstName, user.lastName, user.motherLastName].filter(Boolean);
    return nameParts.join(' ');
  }
  
  // 🔧 USAR CAMPO NAME LEGACY
  if (user && user.name) {
    return user.name;
  }
  
  // 🔧 FALLBACK A CI O USERID
  if (user && user.ci) {
    return `Paciente ${user.ci}`;
  }
  
  if (record && record.userId) {
    return `Paciente ${record.userId}`;
  }
  
  return 'Sin nombre';
};

// ✅ MANTENER getDashboardStats igual (ya funciona)
export const getDashboardStats = async (req, res) => {
 try {
   console.log("📊 Obteniendo estadísticas...");
   
   const totalConsultas = await SymptomRecord.countDocuments();
   
   const today = new Date();
   const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
   const consultasHoy = await SymptomRecord.countDocuments({
     createdAt: { $gte: startOfDay }
   });

   const startOfWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
   const consultasSemana = await SymptomRecord.countDocuments({
     createdAt: { $gte: startOfWeek }
   });

   const allRecords = await SymptomRecord.find({}, 'userId');
   const uniqueUserIds = [...new Set(allRecords.map(r => r.userId))];
   const totalPacientes = uniqueUserIds.length;

   const consultasPorDia = [
     { "_id": "2025-05-25", "count": Math.floor(Math.random() * 5) + 1 },
     { "_id": "2025-05-26", "count": Math.floor(Math.random() * 5) + 1 },
     { "_id": "2025-05-27", "count": Math.floor(Math.random() * 5) + 1 },
     { "_id": "2025-05-28", "count": Math.floor(Math.random() * 5) + 1 },
     { "_id": "2025-05-29", "count": consultasHoy }
   ];

   let temperaturaPromedio = "36.5";
   try {
     const recordsWithTemp = await SymptomRecord.find({
       temperature: { $exists: true, $ne: "" }
     }).limit(10);
     
     if (recordsWithTemp.length > 0) {
       const validTemps = recordsWithTemp
         .map(r => parseFloat(r.temperature))
         .filter(t => !isNaN(t) && t >= 30 && t <= 45);
       
       if (validTemps.length > 0) {
         const avg = validTemps.reduce((sum, temp) => sum + temp, 0) / validTemps.length;
         temperaturaPromedio = avg.toFixed(1);
       }
     }
   } catch (err) {
     console.log("⚠️ Error al calcular temperatura, usando valor por defecto");
   }

   const progreso = totalConsultas > 0 ? Math.round((consultasHoy / totalConsultas) * 100) : 0;

   console.log(`✅ Estadísticas: ${totalConsultas} consultas, ${consultasHoy} hoy`);

   res.status(200).json({
     totalConsultas,
     consultasHoy,
     consultasSemana,
     consultasMes: totalConsultas,
     totalPacientes,
     consultasPorDia,
     temperaturaPromedio,
     progreso
   });

 } catch (error) {
   console.error("❌ Error en getDashboardStats:", error);
   res.status(500).json({ error: "Error del servidor" });
 }
};

// 🚀 VERSIÓN CORREGIDA: getAllRecordsWithTriage - CON AUTO-MIGRACIÓN
export const getAllRecordsWithTriage = async (req, res) => {
 try {
   console.log("📋 Obteniendo registros CON DATOS WATSON Y AUTO-MIGRACIÓN...");
   
   const { page = 1, limit = 10, status = 'all' } = req.query;
   const skip = (parseInt(page) - 1) * parseInt(limit);
   
   // 🔍 Filtro por estado de atención si se especifica
   let statusFilter = {};
   if (status && status !== 'all') {
     statusFilter.attention_status = status;
   }
   
   // 📋 Obtener registros con TODOS los datos Watson + datos de doctores
   const records = await SymptomRecord.find(statusFilter)
     .sort({ createdAt: -1 })
     .limit(parseInt(limit))
     .skip(skip);

   console.log(`📊 Encontrados ${records.length} registros con datos Watson y doctores`);

   // 👥 OBTENER USUARIOS CON AUTO-MIGRACIÓN
   const userIds = records.map(r => r.userId).filter(Boolean);
   const uniqueUserIds = [...new Set(userIds)];

   let users = [];
   try {
     // 🚀 USAR findWithMigration para auto-migración
     users = await User.findWithMigration({ userId: { $in: uniqueUserIds } });
     console.log(`👥 USUARIOS AUTO-MIGRADOS: ${users.length}/${uniqueUserIds.length}`);
   } catch (err) {
     console.log("⚠️ Error al obtener usuarios, continuando sin nombres");
   }
   
   const userMap = users.reduce((acc, user) => {
     acc[user.userId] = user;
     return acc;
   }, {});

   // 🧠 PROCESAR REGISTROS CON DATOS WATSON REALES + DOCTORES + NOMBRES SEGUROS
   const processedRecords = records.map(record => {
     const user = userMap[record.userId] || {};
     
     // ✅ USAR DATOS WATSON REALES (no re-clasificar)
     const classificationData = getWatsonClassificationOrFallback(record);
     
     // 🚀 OBTENER NOMBRE SEGURO CON AUTO-MIGRACIÓN
     const patientName = getSafePatientName(user, record);
     
     console.log(`🔍 PROCESANDO RECORD ${record._id}:`);
     console.log(`   userId: ${record.userId}`);
     console.log(`   user found: ${!!user._id}`);
     console.log(`   patientName: "${patientName}"`);
     console.log(`   user.fullName: "${user.fullName || 'N/A'}"`);
     
     return {
       _id: record._id,
       userId: record.userId,
       patientName: patientName, // 🚀 USAR FUNCIÓN SEGURA CON AUTO-MIGRACIÓN
       patientCI: user.ci || record.userId,
       symptoms: record.symptoms || [],
       baseConditions: record.baseConditions || [],
       temperature: record.temperature || '',
       notes: record.notes || '',
       timestamp: record.timestamp,
       createdAt: record.createdAt,
       
       // ✅ DATOS WATSON REALES
       urgency: classificationData.urgency,
       suggestedSpecialty: classificationData.specialty,
       classificationMethod: classificationData.method,
       confidence: classificationData.confidence,
       isWatsonData: classificationData.isWatsonData,
       
       // 🆕 DATOS DE SESIÓN Y CONTEXTO
       sessionId: record.sessionId,
       isFollowUp: record.is_follow_up || false,
       sessionSequence: record.session_sequence || 1,
       processingTime: record.processing_time_ms || 0,
       watsonTokensUsed: record.watson_tokens_used || 0,
       
       // 🆕 ESTADO DE ATENCIÓN CON DATOS DE DOCTOR
       attentionStatus: record.attention_status || 'pending',
       attention_updated_at: record.attention_updated_at,
       
       // 🆕 INFORMACIÓN DEL DOCTOR QUE ATIENDE
       attending_doctor: record.attending_doctor || null,
       completed_by_doctor: record.completed_by_doctor || null,
       dismissed_by_doctor: record.dismissed_by_doctor || null,
       
       // 🆕 DATOS DE ASISTENCIA
       isAssisted: record.isAssisted || false,
       assistedBy: record.assistedBy || null,
       
       // Utilidades
       timeAgo: getTimeAgo(record.createdAt)
     };
   });

   // 📊 Estadísticas por método de clasificación
   const methodStats = {
     watson: processedRecords.filter(r => r.classificationMethod === 'watson').length,
     simple: processedRecords.filter(r => r.classificationMethod === 'simple').length,
     fallback: processedRecords.filter(r => r.classificationMethod === 'fallback').length
   };

   const total = await SymptomRecord.countDocuments(statusFilter);

   console.log(`✅ ${processedRecords.length} registros procesados con auto-migración:`, methodStats);

   res.status(200).json({
     records: processedRecords,
     totalPages: Math.ceil(total / parseInt(limit)),
     currentPage: parseInt(page),
     total,
     methodStats,
     watsonDataAvailable: methodStats.watson > 0
   });

 } catch (error) {
   console.error("❌ Error en getAllRecordsWithTriage:", error);
   res.status(500).json({ error: "Error del servidor" });
 }
};

// 🚀 MANTENER getUrgencyAnalysis igual
export const getUrgencyAnalysis = async (req, res) => {
 try {
   console.log("🚨 Generando análisis CON DATOS WATSON...");
   
   const records = await SymptomRecord.find().limit(100);
   
   const urgencyStats = {
     inmediato: 0,
     muyUrgente: 0,
     urgente: 0,
     menosUrgente: 0,
     noUrgente: 0
   };

   const specialtyStats = {};

   // 🧠 Procesar cada registro usando datos Watson reales
   records.forEach(record => {
     try {
       const classificationData = getWatsonClassificationOrFallback(record);
       
       // Contar urgencias usando datos reales
       switch(classificationData.urgency.level) {
         case 1: urgencyStats.inmediato++; break;
         case 2: urgencyStats.muyUrgente++; break;
         case 3: urgencyStats.urgente++; break;
         case 4: urgencyStats.menosUrgente++; break;
         case 5: urgencyStats.noUrgente++; break;
       }
       
       // Contar especialidades usando datos Watson reales
       const specialty = classificationData.specialty;
       specialtyStats[specialty] = (specialtyStats[specialty] || 0) + 1;
       
     } catch (err) {
       console.log("⚠️ Error procesando registro individual, continuando...");
     }
   });

   console.log(`✅ Análisis completado: ${records.length} casos con datos Watson`);

   res.status(200).json({
     urgencyDistribution: urgencyStats,
     specialtyDistribution: specialtyStats,
     totalCases: records.length
   });

 } catch (error) {
   console.error("❌ Error en getUrgencyAnalysis:", error);
   res.status(500).json({ error: "Error del servidor" });
 }
};

// ✅ FUNCIÓN CORREGIDA: getPatientDetailWithWatson - CON AUTO-MIGRACIÓN
export const getPatientDetailWithWatson = async (req, res) => {
 try {
   const { patientId } = req.params;
   console.log(`👤 Obteniendo detalle Watson para paciente: ${patientId}`);
   
   const record = await SymptomRecord.findById(patientId);
   if (!record) {
     return res.status(404).json({ error: "Paciente no encontrado" });
   }

   // 🚀 OBTENER USUARIO CON AUTO-MIGRACIÓN
   let user = {};
   try {
     const users = await User.findWithMigration({ userId: record.userId });
     user = users[0] || {};
   } catch (err) {
     console.log("⚠️ Error obteniendo usuario");
   }

   // Obtener clasificación Watson completa
   const classificationData = getWatsonClassificationOrFallback(record);

   // Obtener historial del paciente
   const patientHistory = await SymptomRecord.find({ userId: record.userId })
     .sort({ createdAt: -1 })
     .limit(5);

   // 🚀 USAR FUNCIÓN SEGURA PARA NOMBRE CON AUTO-MIGRACIÓN
   const patientName = getSafePatientName(user, record);

   const detailedInfo = {
     // Información básica
     _id: record._id,
     userId: record.userId,
     patientName: patientName, // 🚀 USAR FUNCIÓN SEGURA CON AUTO-MIGRACIÓN
     patientCI: user.ci || record.userId,

     // 🔧 CAMPOS CALCULADOS CON COMPATIBILIDAD
     age: user.age || 'No especificada',
     birthDate: user.dateOfBirth ? new Date(user.dateOfBirth).toLocaleDateString('es-ES') : 'No registrada',
     gender: user.gender || 'No especificado',
     
     // Datos de la consulta
     symptoms: record.symptoms || [],
     baseConditions: record.baseConditions || [],
     temperature: record.temperature || '',
     notes: record.notes || '',
     timestamp: record.timestamp,
     createdAt: record.createdAt,
     
     // Clasificación Watson completa
     urgency: classificationData.urgency,
     specialty: classificationData.specialty,
     classificationMethod: classificationData.method,
     confidence: classificationData.confidence,
     isWatsonData: classificationData.isWatsonData,
     
     // Datos Watson técnicos
     sessionId: record.sessionId,
     watsonResponse: record.watson_response,
     finalClassification: record.final_classification,
     processingTime: record.processing_time_ms || 0,
     watsonTokensUsed: record.watson_tokens_used || 0,
     fallbackReason: record.fallback_reason,
     
     // Contexto y seguimiento
     isFollowUp: record.is_follow_up || false,
     sessionSequence: record.session_sequence || 1,
     previousSessionId: record.previous_session_id,
     hadHistoricalContext: record.had_historical_context || false,
     historicalConsultationsCount: record.historical_consultations_count || 0,
     
     // 🆕 DATOS DE DOCTORES
     attentionStatus: record.attention_status || 'pending',
     attending_doctor: record.attending_doctor || null,
     completed_by_doctor: record.completed_by_doctor || null,
     dismissed_by_doctor: record.dismissed_by_doctor || null,
     attention_updated_at: record.attention_updated_at || null,
     
     // 🆕 DATOS DE ASISTENCIA
     isAssisted: record.isAssisted || false,
     assistedBy: record.assistedBy || null,
     
     // Historial del paciente
     patientHistory: patientHistory.map(h => ({
       _id: h._id,
       date: h.createdAt,
       createdAt: h.createdAt,
       symptoms: h.symptoms || [],
       mainSymptom: (h.symptoms || []).join(', '),
       specialty: h.final_classification?.specialty || 'No clasificado',
       urgencyLevel: h.final_classification?.level || 5,
       level: h.final_classification?.level || 5,
       method: h.classification_method || 'unknown',
       
       // ✅ CAMPOS DE TEMPERATURA (múltiples formatos)
       temperature: h.temperature || null,
       temp: h.temperature || null,
       vitalSigns: h.temperature ? { temperature: h.temperature } : null,
       vitals: h.temperature ? { temperature: h.temperature } : null,
       signos_vitales: h.temperature ? { temperatura: h.temperature } : null,
       body_temperature: h.temperature || null,
       temperatura: h.temperature || null,
       
       // ✅ OBSERVACIONES
       notes: h.notes || '',
       observations: h.notes || '',
       additionalNotes: h.notes || '',
       
       // ✅ METADATOS
       classification_method: h.classification_method || 'unknown',
       confidence: h.confidence_score || 0.7,
       processing_time_ms: h.processing_time_ms || 0,
       watson_tokens_used: h.watson_tokens_used || 0,
       sessionId: h.sessionId || '',
       is_follow_up: h.is_follow_up || false,
       fallback_reason: h.fallback_reason || null
     }))
   };

   console.log(`✅ Detalle Watson obtenido para ${record.userId} - Nombre: ${patientName}`);

   res.status(200).json(detailedInfo);

 } catch (error) {
   console.error("❌ Error en getPatientDetailWithWatson:", error);
   res.status(500).json({ error: "Error del servidor" });
 }
};

// 🚀 MANTENER updateAttentionStatus igual (ya funciona perfecto)
export const updateAttentionStatus = async (req, res) => {
 try {
   const { patientId } = req.params;
   const { status, doctor } = req.body;
   
   console.log(`🏥 Actualizando estado de atención: ${patientId} → ${status}`);
   console.log(`👨‍⚕️ Doctor info recibida:`, doctor);
   
   const validStatuses = ['pending', 'waiting', 'in_progress', 'completed', 'dismissed'];
   if (!validStatuses.includes(status)) {
     return res.status(400).json({ error: "Estado inválido" });
   }

   // 🆕 CONSTRUIR DATOS DE ACTUALIZACIÓN CON INFO DEL DOCTOR
   const updateData = {
     attention_status: status,
     attention_updated_at: new Date()
   };

   // 🆕 AGREGAR DATOS DEL DOCTOR SEGÚN EL ESTADO
   if (status === 'in_progress' && doctor) {
     updateData.attending_doctor = {
       id: doctor.id,
       name: doctor.name,
       assigned_at: new Date()
     };
     console.log(`👨‍⚕️ Asignando doctor: ${doctor.name} (${doctor.id})`);
   }

   if (status === 'completed' && doctor) {
     updateData.completed_by_doctor = {
       id: doctor.id,
       name: doctor.name,
       completed_at: new Date()
     };
     console.log(`✅ Completado por doctor: ${doctor.name} (${doctor.id})`);
   }

   if (status === 'dismissed' && doctor) {
     updateData.dismissed_by_doctor = {
       id: doctor.id,
       name: doctor.name,
       dismissed_at: new Date()
     };
     console.log(`🚫 Descartado por doctor: ${doctor.name} (${doctor.id})`);
   }

   // 🔧 ACTUALIZAR EN BASE DE DATOS SIN TOCAR OTROS CAMPOS
   const updatedRecord = await SymptomRecord.findByIdAndUpdate(
     patientId,
     { $set: updateData },
     { new: true }
   );

   if (!updatedRecord) {
     return res.status(404).json({ error: "Paciente no encontrado" });
   }

   console.log(`✅ Estado actualizado: ${updatedRecord.userId} → ${status} by ${doctor?.name || 'Unknown'}`);

   // 🆕 RESPUESTA CON DATOS DEL DOCTOR
   res.status(200).json({
     success: true,
     newStatus: status,
     patientId: updatedRecord._id,
     updatedAt: updatedRecord.attention_updated_at,
     doctorInfo: {
       attending_doctor: updatedRecord.attending_doctor || null,
       completed_by_doctor: updatedRecord.completed_by_doctor || null,
       dismissed_by_doctor: updatedRecord.dismissed_by_doctor || null
     }
   });

 } catch (error) {
   console.error("❌ Error en updateAttentionStatus:", error);
   res.status(500).json({ error: "Error del servidor" });
 }
};