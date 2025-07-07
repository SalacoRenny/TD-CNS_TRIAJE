import express from 'express';
import watsonController from '../controllers/watsonController.js';
import sessionService from '../services/sessionService.js';
import SymptomRecord from '../models/SymptomRecord.js'; // ← AGREGAR ESTA LÍNEA

const router = express.Router();

// 🤖 Endpoint directo para clasificación Watson (opcional)
router.post('/triaje-directo', async (req, res) => {
  try {
    console.log('🚀 POST /api/watson/triaje-directo');
    
    const { sintoma_principal, detalles_sintomas, contexto_historial } = req.body;
    
    if (!sintoma_principal || !detalles_sintomas) {
      return res.status(400).json({ 
        error: 'sintoma_principal y detalles_sintomas son requeridos' 
      });
    }

    const result = await watsonController.callTriageManchester(
      sintoma_principal,
      detalles_sintomas,
      contexto_historial || ''
    );

    res.status(200).json({
      success: true,
      clasificacion: result.clasificacion_estandar,
      watson_response: result.clasificacion_completa,
      tokens_info: result.tokens_info,
      timestamp: result.timestamp
    });

  } catch (error) {
    console.error('❌ Error en triaje directo:', error);
    res.status(500).json({ 
      error: 'Error procesando con Watson',
      details: error.message
    });
  }
});

// 📊 Obtener contexto de usuario para nueva sesión
router.post('/sessions/context', async (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'userId es requerido' });
    }

    console.log(`📋 Obteniendo contexto para usuario: ${userId}`);

    const context = await sessionService.buildContextualPrompt(
      userId,
      'consulta_inicial',
      'Preparando contexto para nueva consulta'
    );

    res.status(200).json({
      userId,
      context: {
        hasHistory: context.hasHistory,
        historyCount: context.historyCount,
        lastConsultation: context.lastConsultation,
        userInfo: context.userInfo
      },
      ready: true,
      message: context.hasHistory 
        ? `Usuario con ${context.historyCount} consulta(s) previa(s)`
        : 'Primera consulta del usuario'
    });

  } catch (error) {
    console.error('❌ Error obteniendo contexto:', error);
    res.status(500).json({ 
      error: 'Error obteniendo contexto de usuario',
      details: error.message
    });
  }
});

// 📚 Obtener historial de sesiones
router.get('/sessions/history/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 5 } = req.query;
    
    console.log(`📚 Obteniendo historial de sesiones: ${userId}`);

    const history = await sessionService.getSessionHistory(userId, parseInt(limit));
    const stats = await sessionService.getUserSessionStats(userId);

    res.status(200).json({
      userId,
      history,
      stats,
      total: history.length
    });

  } catch (error) {
    console.error('❌ Error obteniendo historial:', error);
    res.status(500).json({ 
      error: 'Error obteniendo historial de sesiones',
      details: error.message
    });
  }
});

// 🔍 Probar conexión con Watson
router.get('/test-connection', async (req, res) => {
  try {
    console.log('🧪 Probando conexión con Watson...');

    const testResult = await watsonController.callTriageManchester(
      'prueba de conexión',
      'síntoma de prueba para verificar conectividad',
      ''
    );

    res.status(200).json({
      success: true,
      message: 'Conexión Watson exitosa',
      test_classification: testResult.clasificacion_completa,
      model_info: testResult.model_info,
      tokens_used: testResult.tokens_info
    });

  } catch (error) {
    console.error('❌ Error en test de conexión:', error);
    res.status(500).json({
      success: false,
      error: 'Error de conexión con Watson',
      details: error.message
    });
  }
});

// 📊 Estadísticas generales de Watson
router.get('/stats', async (req, res) => {
  try {
    console.log('📊 Obteniendo estadísticas Watson...');

    // Estadísticas de uso de Watson vs Simple
    const methodStats = await SymptomRecord.aggregate([
      {
        $group: {
          _id: '$classification_method',
          count: { $sum: 1 },
          avgProcessingTime: { $avg: '$processing_time_ms' },
          avgTokens: { $avg: '$watson_tokens_used' }
        }
      }
    ]);

    // Estadísticas por día (últimos 7 días)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const dailyStats = await SymptomRecord.aggregate([
      { 
        $match: { 
          createdAt: { $gte: sevenDaysAgo },
          classification_method: 'watson'
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
          avgTokens: { $avg: '$watson_tokens_used' }
        }
      },
      { $sort: { '_id': 1 } }
    ]);

    res.status(200).json({
      method_distribution: methodStats,
      daily_watson_usage: dailyStats,
      period: 'últimos 7 días'
    });

  } catch (error) {
    console.error('❌ Error obteniendo estadísticas:', error);
    res.status(500).json({ 
      error: 'Error obteniendo estadísticas',
      details: error.message
    });
  }
});

export default router;