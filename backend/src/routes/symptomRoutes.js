// ===============================================
// 🎯 SYMPTOM ROUTES ACTUALIZADO CON WATSON + CONTEXTO HISTÓRICO
// backend/src/routes/symptomRoutes.js
// ===============================================

import express from 'express';
import { 
  createSymptomRecord, 
  getSymptomHistoryByUser,
  getSymptomHistoryWithClassifications,  // 🆕 NUEVA
  getUserTriageStats,                    // 🆕 NUEVA
  getPatientRecentContext               // 🆕 CRÍTICA - Para memoria contextual
} from '../controllers/symptomController.js';
import SymptomRecord from '../models/SymptomRecord.js'; // Agregado para las rutas de búsqueda

const router = express.Router();

// ===============================================
// 📝 RUTAS PRINCIPALES DE SÍNTOMAS
// ===============================================

// ✅ Crear nuevo registro de síntomas (con Watson integrado)
// Nota: La ruta principal POST /api/symptoms está en app.js
// Esta ruta es alternativa por si se quiere usar el endpoint completo
router.post('/', createSymptomRecord);

// ✅ Obtener historial básico de usuario (original)
// router.get('/history/:userId', getSymptomHistoryByUser);

// ✅ AGREGAR ESTAS LÍNEAS:
router.get('/:userId', getPatientRecentContext);
router.get('/patient/:userId', getPatientRecentContext);
router.get('/context/:userId', getPatientRecentContext);


// ===============================================
// 🆕 RUTAS CRÍTICAS PARA MEMORIA CONTEXTUAL
// ===============================================

// 🧠 NUEVA: Obtener contexto histórico reciente para memoria Watson
router.get('/patients/:userId/recent-context', getPatientRecentContext);

// ===============================================
// 🆕 NUEVAS RUTAS ENRIQUECIDAS CON WATSON
// ===============================================

// 📚 Historial con clasificaciones detalladas
router.get('/history-with-classifications/:userId', getSymptomHistoryWithClassifications);

// 📊 Estadísticas completas de usuario
router.get('/user-stats/:userId', getUserTriageStats);

// ===============================================
// 🔍 RUTAS DE BÚSQUEDA Y FILTRADO
// ===============================================

// 🔎 Buscar registros por múltiples criterios
router.get('/search', async (req, res) => {
  try {
    const { 
      userId, 
      method,           // watson, simple
      level,            // 1-5
      specialty,        // Cardiología, etc.
      dateFrom,         // YYYY-MM-DD
      dateTo,           // YYYY-MM-DD
      limit = 10,
      page = 1
    } = req.query;

    console.log('🔍 Búsqueda de registros con filtros:', req.query);

    // Construir filtro dinámico
    const filter = {};
    
    if (userId) filter.userId = userId;
    if (method) filter.classification_method = method;
    if (level) filter['final_classification.level'] = parseInt(level);
    if (specialty) filter['final_classification.specialty'] = { $regex: specialty, $options: 'i' };
    
    // Filtro de fechas
    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
      if (dateTo) filter.createdAt.$lte = new Date(dateTo + 'T23:59:59.999Z');
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [results, total] = await Promise.all([
      SymptomRecord.find(filter)
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip(skip)
        .lean(),
      SymptomRecord.countDocuments(filter)
    ]);

    console.log(`✅ Búsqueda completada: ${results.length}/${total} registros`);

    res.status(200).json({
      results,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      },
      filters_applied: filter
    });

  } catch (error) {
    console.error('❌ Error en búsqueda:', error);
    res.status(500).json({ 
      error: 'Error realizando búsqueda',
      details: error.message 
    });
  }
});

// ===============================================
// 📊 RUTAS DE ANÁLISIS Y REPORTES
// ===============================================

// 📈 Análisis de tendencias por usuario
router.get('/trends/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { period = '30' } = req.query; // días

    console.log(`📈 Analizando tendencias para usuario: ${userId} (${period} días)`);

    const dateLimit = new Date();
    dateLimit.setDate(dateLimit.getDate() - parseInt(period));

    const trends = await SymptomRecord.aggregate([
      { 
        $match: { 
          userId,
          createdAt: { $gte: dateLimit }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { 
              format: "%Y-%m-%d", 
              date: "$createdAt" 
            }
          },
          count: { $sum: 1 },
          avgLevel: { $avg: '$final_classification.level' },
          methods: { $push: '$classification_method' },
          specialties: { $push: '$final_classification.specialty' }
        }
      },
      { $sort: { '_id': 1 } }
    ]);

    // Procesar datos para tendencias
    const processedTrends = trends.map(day => ({
      date: day._id,
      consultas: day.count,
      urgencia_promedio: day.avgLevel ? day.avgLevel.toFixed(1) : 'N/A',
      metodo_watson: day.methods.filter(m => m === 'watson').length,
      metodo_simple: day.methods.filter(m => m === 'simple').length,
      especialidades_unicas: [...new Set(day.specialties)].length
    }));

    res.status(200).json({
      userId,
      period_days: parseInt(period),
      trends: processedTrends,
      summary: {
        total_days_with_activity: trends.length,
        total_consultations: trends.reduce((sum, day) => sum + day.count, 0),
        watson_usage_rate: trends.length > 0 ? 
          `${((trends.reduce((sum, day) => sum + day.methods.filter(m => m === 'watson').length, 0) / 
              trends.reduce((sum, day) => sum + day.count, 0)) * 100).toFixed(1)}%` : '0%'
      }
    });

  } catch (error) {
    console.error('❌ Error analizando tendencias:', error);
    res.status(500).json({ 
      error: 'Error analizando tendencias',
      details: error.message 
    });
  }
});

// 🔄 Comparar métodos de clasificación
router.get('/compare-methods/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    console.log(`🔄 Comparando métodos de clasificación para: ${userId}`);

    const comparison = await SymptomRecord.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: '$classification_method',
          count: { $sum: 1 },
          avgLevel: { $avg: '$final_classification.level' },
          avgProcessingTime: { $avg: '$processing_time_ms' },
          avgTokens: { $avg: '$watson_tokens_used' },
          specialties: { $addToSet: '$final_classification.specialty' }
        }
      }
    ]);

    const watsonStats = comparison.find(c => c._id === 'watson') || { count: 0 };
    const simpleStats = comparison.find(c => c._id === 'simple') || { count: 0 };

    res.status(200).json({
      userId,
      comparison: {
        watson: {
          consultas: watsonStats.count,
          urgencia_promedio: watsonStats.avgLevel?.toFixed(1) || 'N/A',
          tiempo_procesamiento_ms: Math.round(watsonStats.avgProcessingTime || 0),
          tokens_promedio: Math.round(watsonStats.avgTokens || 0),
          especialidades_detectadas: watsonStats.specialties?.length || 0
        },
        simple: {
          consultas: simpleStats.count,
          urgencia_promedio: simpleStats.avgLevel?.toFixed(1) || 'N/A',
          tiempo_procesamiento_ms: Math.round(simpleStats.avgProcessingTime || 0),
          especialidades_detectadas: simpleStats.specialties?.length || 0
        }
      },
      recommendation: watsonStats.count > simpleStats.count ? 
        'Watson IA está funcionando correctamente para este usuario' :
        'Verificar configuración Watson - usando mayormente clasificación simple'
    });

  } catch (error) {
    console.error('❌ Error comparando métodos:', error);
    res.status(500).json({ 
      error: 'Error comparando métodos',
      details: error.message 
    });
  }
});

// ===============================================
// 🧪 RUTAS DE TESTING Y VALIDACIÓN
// ===============================================

// 🧪 Validar integridad de datos
router.get('/validate/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    console.log(`🧪 Validando integridad de datos para: ${userId}`);

    const records = await SymptomRecord.find({ userId });
    
    const validation = {
      total_records: records.length,
      missing_session_id: records.filter(r => !r.sessionId).length,
      missing_classification: records.filter(r => !r.final_classification).length,
      invalid_levels: records.filter(r => {
        const level = r.final_classification?.level;
        return !level || level < 1 || level > 5;
      }).length,
      watson_without_response: records.filter(r => 
        r.classification_method === 'watson' && !r.watson_response
      ).length,
      simple_with_watson_data: records.filter(r => 
        r.classification_method === 'simple' && r.watson_response
      ).length
    };

    const isValid = Object.values(validation).every(count => count === 0 || count === validation.total_records);

    res.status(200).json({
      userId,
      is_valid: isValid,
      validation_details: validation,
      recommendations: isValid ? 
        ['Datos íntegros - no se requieren acciones'] :
        [
          validation.missing_session_id > 0 ? 'Regenerar sessionId faltantes' : null,
          validation.missing_classification > 0 ? 'Aplicar clasificación a registros sin clasificar' : null,
          validation.invalid_levels > 0 ? 'Corregir niveles de urgencia inválidos' : null,
          validation.watson_without_response > 0 ? 'Revisar registros Watson sin respuesta' : null
        ].filter(Boolean)
    });

  } catch (error) {
    console.error('❌ Error validando datos:', error);
    res.status(500).json({ 
      error: 'Error validando integridad',
      details: error.message 
    });
  }
});

// ===============================================
// 🆕 RUTA ESPECÍFICA PARA TESTING MEMORIA CONTEXTUAL
// ===============================================

// 🧠 Testing: Verificar memoria contextual de Watson
router.get('/test-contextual-memory/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    console.log(`🧠 Testing memoria contextual para: ${userId}`);
    
    // Obtener últimas 3 consultas
    const recentConsultations = await SymptomRecord.find({ userId })
      .sort({ createdAt: -1 })
      .limit(3)
      .select('symptoms final_classification createdAt classification_method watson_response');
    
    if (recentConsultations.length === 0) {
      return res.json({
        userId,
        has_memory: false,
        message: 'No hay consultas previas para analizar memoria'
      });
    }
    
    // Analizar patrones de memoria
    const memoryAnalysis = {
      total_consultations: recentConsultations.length,
      watson_consultations: recentConsultations.filter(c => c.classification_method === 'watson').length,
      different_specialties: [...new Set(recentConsultations.map(c => c.final_classification?.specialty))].length,
      consultation_timeline: recentConsultations.map(c => ({
        date: c.createdAt.toLocaleDateString('es-ES'),
        symptoms: c.symptoms.join(', '),
        specialty: c.final_classification?.specialty || 'N/A',
        method: c.classification_method,
        had_context: !!c.watson_response?.prompt_usado?.includes('HISTORIAL')
      }))
    };
    
    // Calcular score de memoria
    const memoryScore = {
      contextual_consultations: memoryAnalysis.consultation_timeline.filter(c => c.had_context).length,
      memory_percentage: memoryAnalysis.watson_consultations > 0 ? 
        Math.round((memoryAnalysis.consultation_timeline.filter(c => c.had_context).length / memoryAnalysis.watson_consultations) * 100) : 0
    };
    
    res.json({
      userId,
      has_memory: memoryScore.memory_percentage > 50,
      memory_analysis: memoryAnalysis,
      memory_score: memoryScore,
      recommendation: memoryScore.memory_percentage > 80 ? 
        'Memoria contextual funcionando excelentemente' :
        memoryScore.memory_percentage > 50 ?
        'Memoria contextual funcionando correctamente' :
        'Revisar sistema de memoria contextual - baja utilización de contexto histórico'
    });
    
  } catch (error) {
    console.error('❌ Error testing memoria contextual:', error);
    res.status(500).json({ 
      error: 'Error testing memoria contextual',
      details: error.message 
    });
  }
});
router.get('/history/:userId', getSymptomHistoryByUser);

export default router;