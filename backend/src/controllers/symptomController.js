// ===============================================
// 🎯 SYMPTOM CONTROLLER INTEGRADO CON WATSON - CORREGIDO
// backend/src/controllers/symptomController.js (VERSIÓN FINAL CON AUTO-MIGRACIÓN)
// ===============================================

import SymptomRecord from "../models/SymptomRecord.js";
import User from "../models/User.js";
import watsonController from './watsonController.js';
import sessionService from '../services/sessionService.js';

// ✅ FUNCIÓN PRINCIPAL - INTEGRACIÓN WATSON + FALLBACK + AUTO-MIGRACIÓN
export const createSymptomRecord = async (req, res) => {
 const startTime = Date.now();
 
 try {
   console.log('📝 === INICIANDO REGISTRO DE SÍNTOMAS CON WATSON ===');
   console.log('📊 Datos recibidos:', {
     userId: req.body.userId,
     symptoms: req.body.symptoms,
     temperature: req.body.temperature,
     hasBaseConditions: req.body.baseConditions?.length > 0,
     edad: req.body.edad,
     frecuenciaCardiaca: req.body.frecuenciaCardiaca,
     presionArterial: req.body.presionArterial
   }); 

   const { 
     userId, 
     symptoms, 
     baseConditions, 
     notes, 
     temperature, 
     timestamp, 
     edad, 
     frecuenciaCardiaca, 
     presionArterial, 
     assistedBy, 
     isAssisted 
   } = req.body;
   
   // 🛡️ Validaciones básicas
   if (!userId || !symptoms || !Array.isArray(symptoms)) {
     return res.status(400).json({ 
       error: "userId y symptoms (array) son requeridos" 
     });
   }

   // 🆕 Validaciones signos vitales
   if (edad && (edad < 0 || edad > 120)) {
     return res.status(400).json({ 
       error: "Edad debe estar entre 0 y 120 años" 
     });
   }

   if (frecuenciaCardiaca && (frecuenciaCardiaca < 30 || frecuenciaCardiaca > 220)) {
     return res.status(400).json({ 
       error: "Frecuencia cardíaca debe estar entre 30 y 220 lpm" 
     });
   }

   // 🚀 VERIFICAR Y AUTO-MIGRAR USUARIO SI ES NECESARIO
   try {
     const users = await User.findWithMigration({ userId });
     const user = users[0];
     if (user) {
       console.log(`👤 Usuario encontrado y auto-migrado: ${user.fullName}`);
     }
   } catch (userError) {
     console.log("⚠️ Error verificando usuario, continuando...");
   }

   // 🆔 Crear nueva sesión
   const sessionInfo = await sessionService.createNewSession(userId);
   
   let classificationResult = null;
   let classificationMethod = 'simple';
   let watsonResponse = null;
   let fallbackReason = null;

   // 🤖 INTENTAR CLASIFICACIÓN CON WATSON
   try {
     console.log('🧠 Intentando clasificación con Watson IA...');
     
     // Construir contexto para Watson
     const contextInfo = await sessionService.buildContextualPrompt(
       userId,
       symptoms.join(', '),
       notes || 'Sin notas adicionales'
     );

     console.log('📋 Contexto construido:', {
       tiene_historial: contextInfo.hasHistory,
       consultas_previas: contextInfo.historyCount
     });

     // Llamar a Watson
     const watsonResult = await watsonController.callTriageManchester(
       symptoms.join(', '),
       notes || '',
       contextInfo.hasHistory ? contextInfo.contextualPrompt : ''
     );

     classificationResult = watsonResult.clasificacion_estandar;
     classificationMethod = 'watson';
     watsonResponse = watsonResult;
     
     console.log('✅ Watson clasificó exitosamente:', {
       nivel: classificationResult.level,
       especialidad: classificationResult.specialty,
       tokens: watsonResult.tokens_info
     });

   } catch (watsonError) {
     console.log('⚠️ Watson falló, aplicando clasificación simple...');
     console.error('Error Watson:', watsonError.message);
     
     // 🔄 FALLBACK A CLASIFICACIÓN SIMPLE
     classificationResult = getSimpleClassification({
       symptoms,
       temperature,
       baseConditions,
       edad,
       frecuenciaCardiaca,
       presionArterial
     });
     
     classificationMethod = 'simple';
     fallbackReason = watsonError.message;
     
     console.log('🔧 Clasificación simple aplicada:', {
       nivel: classificationResult.level,
       motivo_fallback: fallbackReason
     });
   }

   // 💾 GUARDAR REGISTRO CON TODA LA INFORMACIÓN
   const recordData = {
     // Datos originales
     userId,
     symptoms,
     baseConditions: baseConditions || [],
     notes: notes || '',
     temperature: temperature || '',
     
     // 🆕 CAMPOS ASISTENTE
     assistedBy: assistedBy || null,
     isAssisted: isAssisted || false,
       
     // 🆕 SIGNOS VITALES - FASE 1.2
     edad: edad || null,
     frecuenciaCardiaca: frecuenciaCardiaca || null,
     presionArterial: presionArterial || {
       sistolica: null,
       diastolica: null,
       texto: ""
     },
     
     timestamp: timestamp || new Date().toLocaleString('es-BO'),
     
     // Datos de sesión
     sessionId: sessionInfo.sessionId,
     previous_session_id: sessionInfo.previousSessionId,
     session_sequence: sessionInfo.sequence,
     is_follow_up: sessionInfo.isFollowUp,

     // Datos de clasificación
     classification_method: classificationMethod,
     final_classification: classificationResult,
     watson_response: watsonResponse,
     fallback_reason: fallbackReason,

     // Metadatos
     processing_time_ms: Date.now() - startTime,
     confidence_score: classificationResult.confidence || 0.8,
     watson_tokens_used: watsonResponse?.tokens_info?.generated_tokens || 0
   };

   const newRecord = new SymptomRecord(recordData);
   await newRecord.save();

   // 📊 Actualizar estado del usuario
   await sessionService.updateUserTriageStatus(userId);

   const processingTime = Date.now() - startTime;
   
   console.log(`✅ === REGISTRO COMPLETADO EN ${processingTime}ms ===`);
   console.log('📈 Resultado final:', {
     metodo: classificationMethod,
     nivel: classificationResult.level,
     especialidad: classificationResult.specialty,
     sesion: sessionInfo.sessionId.substring(0, 8)
   });

   // 🎯 RESPUESTA ENRIQUECIDA
   res.status(201).json({ 
     message: "Registro guardado exitosamente",
     data: {
       _id: newRecord._id,
       sessionId: sessionInfo.sessionId,
       userId,
       symptoms,
       baseConditions,
       temperature,
       timestamp: newRecord.timestamp,
       createdAt: newRecord.createdAt
     },
     classification: {
       ...classificationResult,
       method: classificationMethod,
       confidence: classificationResult.confidence || 0.8,
       processing_time_ms: processingTime
     },
     session_info: {
       is_follow_up: sessionInfo.isFollowUp,
       has_previous_session: !!sessionInfo.previousSessionId,
       sequence: sessionInfo.sequence
     },
     watson_info: watsonResponse ? {
       tokens_used: watsonResponse.tokens_info?.generated_tokens || 0,
       model: watsonResponse.model_info?.model_id || 'unknown'
     } : null,
     fallback_reason: fallbackReason
   });

 } catch (error) {
   const processingTime = Date.now() - startTime;
   
   console.error(`❌ === ERROR GENERAL EN ${processingTime}ms ===`);
   console.error("Error completo:", error);
   
   res.status(500).json({ 
     error: "Error al guardar los síntomas",
     details: error.message,
     processing_time_ms: processingTime
   });
 }
};

// 🔧 FUNCIÓN DE CLASIFICACIÓN SIMPLE (FALLBACK) - CORREGIDA
const getSimpleClassification = ({ symptoms, temperature, baseConditions, edad, frecuenciaCardiaca, presionArterial }) => {  
 console.log('🔧 Ejecutando clasificación simple...');
 
 const urgentSymptoms = [
   'dolor de pecho', 'dificultad para respirar', 'sangrado', 
   'inconsciente', 'convulsiones', 'pérdida de conciencia'
 ];
 
 const highSymptoms = [
   'fiebre alta', 'vómito', 'dolor intenso', 'mareos', 
   'dificultad respiratoria', 'dolor severo'
 ];
 
 const temp = parseFloat(temperature) || 0;
 
 // 🆕 Evaluar signos vitales críticos
 const age = parseInt(edad) || 0;
 const heartRate = parseInt(frecuenciaCardiaca) || 0;
 const systolic = presionArterial?.sistolica || 0;
 const diastolic = presionArterial?.diastolica || 0;
 
 // Factores de riesgo por signos vitales
 const hasVitalRisk = (
   heartRate >= 120 || heartRate <= 50 ||
   systolic >= 180 || diastolic >= 110 ||
   age >= 80
 ); 
 
 const symptomList = symptoms.map(s => s.toLowerCase());
 
 // Verificar síntomas críticos
 const hasCriticalSymptom = urgentSymptoms.some(critical => 
   symptomList.some(symptom => symptom.includes(critical))
 );
 
 const hasHighSymptom = highSymptoms.some(high => 
   symptomList.some(symptom => symptom.includes(high))
 );

 // Clasificación por nivel
 if (hasCriticalSymptom || temp >= 39.5 || (systolic >= 180 || diastolic >= 110)) {
   return {
     level: 1,
     color: '#EF4444',
     label: 'Inmediato',
     bgColor: '#FEF2F2',
     specialty: 'Medicina de Emergencia',
     source: 'simple',
     confidence: 0.9
   };
 }
 
 if (hasHighSymptom || temp >= 38.5 || hasVitalRisk) {    
   return {
     level: 2,
     color: '#F97316',
     label: 'Muy Urgente',
     bgColor: '#FFF7ED',
     specialty: suggestSpecialtySimple(symptoms, baseConditions),
     source: 'simple',
     confidence: 0.8
   };
 }
 
 if (temp >= 37.5 || symptoms.length >= 3) {
   return {
     level: 3,
     color: '#EAB308',
     label: 'Urgente',
     bgColor: '#FEFCE8',
     specialty: suggestSpecialtySimple(symptoms, baseConditions),
     source: 'simple',
     confidence: 0.7
   };
 }
 
 if (symptoms.length >= 1) {
   return {
     level: 4,
     color: '#22C55E',
     label: 'Menos Urgente',
     bgColor: '#F0FDF4',
     specialty: suggestSpecialtySimple(symptoms, baseConditions),
     source: 'simple',
     confidence: 0.7
   };
 }
 
 return {
   level: 5,
   color: '#3B82F6',
   label: 'No Urgente',
   bgColor: '#EFF6FF',
   specialty: 'Medicina General',
   source: 'simple',
   confidence: 0.6
 };
};

// 🏥 SUGERIR ESPECIALIDAD (VERSIÓN SIMPLE)
const suggestSpecialtySimple = (symptoms, baseConditions) => {
 const allSymptoms = [...symptoms, ...(baseConditions || [])]
   .map(s => s.toLowerCase());

 const specialties = {
   'Cardiología': ['dolor de pecho', 'palpitaciones', 'hipertensión', 'arritmia'],
   'Neurología': ['dolor de cabeza', 'mareos', 'convulsiones', 'pérdida de conciencia'],
   'Neumología': ['dificultad para respirar', 'tos', 'dolor de pecho al respirar', 'asma'],
   'Gastroenterología': ['dolor abdominal', 'náuseas', 'vómito', 'diarrea'],
   'Traumatología': ['dolor de huesos', 'fractura', 'esguince', 'dolor articular'],
   'Dermatología': ['erupción', 'picazón', 'lesiones en la piel']
 };

 for (const [specialty, keywords] of Object.entries(specialties)) {
   if (keywords.some(keyword => 
     allSymptoms.some(symptom => symptom.includes(keyword))
   )) {
     return specialty;
   }
 }
 
 return 'Medicina General';
};

// ✅ FUNCIÓN ORIGINAL MANTENIDA (SIN CAMBIOS)
export const getSymptomHistoryByUser = async (req, res) => {
 try {
   const { userId } = req.params;
   const history = await SymptomRecord.find({ userId }).sort({ createdAt: -1 });
   res.status(200).json(history);
 } catch (error) {
   console.error("Error al obtener historial:", error);
   res.status(500).json({ message: "Error interno del servidor" });
 }
};

// 🆕 FUNCIÓN CORREGIDA: Historial enriquecido con clasificaciones + AUTO-MIGRACIÓN
export const getSymptomHistoryWithClassifications = async (req, res) => {
 try {
   const { userId } = req.params;
   const { includeWatsonData = false, limit = 10 } = req.query;
   
   console.log(`📚 Obteniendo historial enriquecido para: ${userId}`);
   
   // 🚀 AUTO-MIGRAR USUARIO SI ES NECESARIO
   try {
     const users = await User.findWithMigration({ userId });
     const user = users[0];
     if (user) {
       console.log(`👤 Usuario auto-migrado: ${user.fullName}`);
     }
   } catch (userError) {
     console.log("⚠️ Error auto-migrando usuario");
   }
   
   let projection = { watson_response: 0 }; // Excluir por defecto
   if (includeWatsonData === 'true') {
     projection = {}; // Incluir todo
   }

   const history = await SymptomRecord.find({ userId }, projection)
     .sort({ createdAt: -1 })
     .limit(parseInt(limit));

   const enrichedHistory = history.map(record => {
     const recordObj = record.toObject();
     
     return {
       ...recordObj,
       classification_summary: {
         level: recordObj.final_classification?.level || 5,
         label: recordObj.final_classification?.label || 'No clasificado',
         color: recordObj.final_classification?.color || '#3B82F6',
         specialty: recordObj.final_classification?.specialty || 'Medicina General',
         method: recordObj.classification_method || 'simple',
         confidence: recordObj.confidence_score || 0.7
       },
       session_info: {
         sessionId: recordObj.sessionId,
         sequence: recordObj.session_sequence || 1,
         isFollowUp: recordObj.is_follow_up || false,
         processingTime: recordObj.processing_time_ms || 0
       }
     };
   });

   console.log(`✅ Historial obtenido: ${enrichedHistory.length} registros`);

   res.status(200).json({
     userId,
     total: enrichedHistory.length,
     history: enrichedHistory
   });

 } catch (error) {
   console.error("❌ Error obteniendo historial enriquecido:", error);
   res.status(500).json({ 
     message: "Error interno del servidor",
     error: error.message 
   });
 }
};

// 🔧 FUNCIÓN CORREGIDA: getPatientRecentContext - CON AUTO-MIGRACIÓN
export const getPatientRecentContext = async (req, res) => {
 try {
   const { userId } = req.params;
   
   console.log(`📋 Obteniendo contexto reciente COMPLETO para: ${userId}`);
   
   // 🚀 AUTO-MIGRAR USUARIO SI ES NECESARIO
   try {
     const users = await User.findWithMigration({ userId });
     const user = users[0];
     if (user) {
       console.log(`👤 Usuario auto-migrado: ${user.fullName}`);
     }
   } catch (userError) {
     console.log("⚠️ Error auto-migrando usuario");
   }
   
   // Obtener TODAS las consultas
   const recentHistory = await SymptomRecord.find({ userId })
     .sort({ createdAt: -1 })
     .select('symptoms baseConditions final_classification createdAt temperature notes classification_method watson_response confidence_score processing_time_ms watson_tokens_used sessionId is_follow_up fallbackReason');
   
   if (recentHistory.length === 0) {
     return res.json({ hasHistory: false });
   }
   
   const lastConsultation = recentHistory[0];
   const totalConsultations = recentHistory.length;
   
   // Obtener enfermedades base únicas y limpias
   const allBaseConditions = [...new Set(
     recentHistory.flatMap(record => record.baseConditions || [])
       .filter(condition => condition && condition.trim() && 
               condition.toLowerCase() !== 'sin antecedentes' &&
               condition.toLowerCase() !== 'ninguna' &&
               condition.toLowerCase() !== 'no tiene')
   )];
   
   const daysSinceLastConsultation = Math.floor(
     (new Date() - lastConsultation.createdAt) / (1000 * 60 * 60 * 24)
   );
   
   const contextData = {
     hasHistory: true,
     totalConsultations,
     baseConditions: allBaseConditions,
     lastConsultation: {
       date: lastConsultation.createdAt.toLocaleDateString('es-ES'),
       symptoms: lastConsultation.symptoms.join(', '),
       specialty: lastConsultation.final_classification?.specialty || 'Medicina General',
       level: lastConsultation.final_classification?.level || 5,
       temperature: lastConsultation.temperature || 'No registrada',
       daysSince: daysSinceLastConsultation
     },
     // ✅ MAPEO CORREGIDO Y OPTIMIZADO
     consultationHistory: recentHistory.map(record => ({
       _id: record._id,
       
       // ✅ FECHAS (mantener formato completo)
       date: record.createdAt,
       createdAt: record.createdAt,
       timestamp: record.createdAt.toISOString(),
       
       // ✅ SÍNTOMAS (array Y string para compatibilidad)
       symptoms: record.symptoms || [],
       mainSymptom: (record.symptoms || []).join(', '),
       
       // ✅ CLASIFICACIÓN  
       specialty: record.final_classification?.specialty || 'Medicina General',
       urgencyLevel: record.final_classification?.level || 5,
       level: record.final_classification?.level || 5, // Alias
       
       // ✅ SIGNOS VITALES (múltiples formatos para máxima compatibilidad)
       temperature: record.temperature || null,
       temp: record.temperature || null, // Alias que busca el PDF
       vitalSigns: record.temperature ? { temperature: record.temperature } : null,
       vitals: record.temperature ? { temperature: record.temperature } : null,
       signos_vitales: record.temperature ? { temperatura: record.temperature } : null,
       body_temperature: record.temperature || null,
       temperatura: record.temperature || null,
       
       // ✅ OBSERVACIONES
       notes: record.notes || '',
       observations: record.notes || '', // Para compatibilidad con PDF
       additionalNotes: record.notes || '',
       
       // ✅ METADATOS DE CLASIFICACIÓN
       method: record.classification_method || 'simple',
       classification_method: record.classification_method || 'simple',
       classificationMethod: record.classification_method || 'simple',
       
       // ✅ DATOS ADICIONALES
       confidence: record.confidence_score || 0.7,
       confidence_score: record.confidence_score || 0.7,
       processing_time_ms: record.processing_time_ms || 0,
       watson_tokens_used: record.watson_tokens_used || 0,
       sessionId: record.sessionId || '',
       is_follow_up: record.is_follow_up || false,
       isFollowUp: record.is_follow_up || false,
       fallback_reason: record.fallbackReason || null,
       fallbackReason: record.fallbackReason || null
     }))
   };
   
   console.log(`✅ Contexto COMPLETO construido:`, {
     totalConsultas: totalConsultations,
     consultasEnHistorial: contextData.consultationHistory.length,
     ultimaFecha: contextData.lastConsultation.date,
     especialidad: contextData.lastConsultation.specialty,
     enfermedadesBase: allBaseConditions,
     metodosUsados: [...new Set(recentHistory.map(r => r.classification_method))],
     primeraTemperatura: contextData.consultationHistory[0]?.temperature || 'NO ENCONTRADA'
   });
   
   res.json(contextData);
   
 } catch (error) {
   console.error('❌ Error obteniendo contexto completo:', error);
   res.status(500).json({ hasHistory: false, error: error.message });
 }
};

// 🆕 FUNCIÓN CORREGIDA: getUserTriageStats - CON AUTO-MIGRACIÓN
export const getUserTriageStats = async (req, res) => {
 try {
   const { userId } = req.params;
   
   console.log(`📊 Obteniendo estadísticas para: ${userId}`);
   
   // 🚀 AUTO-MIGRAR USUARIO SI ES NECESARIO
   try {
     const users = await User.findWithMigration({ userId });
     const user = users[0];
     if (user) {
       console.log(`👤 Usuario auto-migrado: ${user.fullName}`);
     }
   } catch (userError) {
     console.log("⚠️ Error auto-migrando usuario");
   }
   
   const stats = await sessionService.getUserSessionStats(userId);
   
   if (!stats) {
     return res.status(404).json({ 
       message: "Usuario no encontrado o sin estadísticas" 
     });
   }

   // Estadísticas adicionales
   const methodStats = await SymptomRecord.aggregate([
     { $match: { userId } },
     { 
       $group: {
         _id: '$classification_method',
         count: { $sum: 1 }
       }
     }
   ]);

   const levelStats = await SymptomRecord.aggregate([
     { $match: { userId } },
     { 
       $group: {
         _id: '$final_classification.level',
         count: { $sum: 1 }
       }
     }
   ]);

   res.status(200).json({
     userId,
     general_stats: stats,
     classification_methods: methodStats,
     urgency_levels: levelStats
   });

 } catch (error) {
   console.error("❌ Error obteniendo estadísticas:", error);
   res.status(500).json({ 
     message: "Error interno del servidor",
     error: error.message 
   });
 }
};