// ===============================================
// 🎯 SYMPTOM CONTROLLER INTEGRADO CON WATSON
// backend/src/controllers/symptomController.js (VERSIÓN FINAL)
// ===============================================

import SymptomRecord from "../models/SymptomRecord.js";
import User from "../models/User.js";
import watsonController from './watsonController.js';
import sessionService from '../services/sessionService.js';

// ✅ FUNCIÓN PRINCIPAL - INTEGRACIÓN WATSON + FALLBACK
export const createSymptomRecord = async (req, res) => {
  const startTime = Date.now();
  
  try {
    console.log('📝 === INICIANDO REGISTRO DE SÍNTOMAS CON WATSON ===');
    console.log('📊 Datos recibidos:', {
      userId: req.body.userId,
      symptoms: req.body.symptoms,
      temperature: req.body.temperature,
      hasBaseConditions: req.body.baseConditions?.length > 0
    });

    const { userId, symptoms, baseConditions, notes, temperature, timestamp } = req.body;

    // 🛡️ Validaciones básicas
    if (!userId || !symptoms || !Array.isArray(symptoms)) {
      return res.status(400).json({ 
        error: "userId y symptoms (array) son requeridos" 
      });
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
        baseConditions
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

// 🔧 FUNCIÓN DE CLASIFICACIÓN SIMPLE (FALLBACK)
const getSimpleClassification = ({ symptoms, temperature, baseConditions }) => {
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
  const symptomList = symptoms.map(s => s.toLowerCase());
  
  // Verificar síntomas críticos
  const hasCriticalSymptom = urgentSymptoms.some(critical => 
    symptomList.some(symptom => symptom.includes(critical))
  );
  
  const hasHighSymptom = highSymptoms.some(high => 
    symptomList.some(symptom => symptom.includes(high))
  );

  // Clasificación por nivel
  if (hasCriticalSymptom || temp >= 39.5) {
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
  
  if (hasHighSymptom || temp >= 38.5) {
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

// 🆕 NUEVA FUNCIÓN: Historial enriquecido con clasificaciones
export const getSymptomHistoryWithClassifications = async (req, res) => {
  try {
    const { userId } = req.params;
    const { includeWatsonData = false, limit = 10 } = req.query;
    
    console.log(`📚 Obteniendo historial enriquecido para: ${userId}`);
    
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

// 🆕 NUEVA FUNCIÓN: Estadísticas de usuario
export const getUserTriageStats = async (req, res) => {
  try {
    const { userId } = req.params;
    
    console.log(`📊 Obteniendo estadísticas para: ${userId}`);
    
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