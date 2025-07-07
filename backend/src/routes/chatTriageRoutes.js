// ===============================================
// 🛣️ CHAT TRIAGE ROUTES - RUTAS DEL CHAT
// backend/src/routes/chatTriageRoutes.js
// ===============================================

import express from "express";
import {
  startConversation,
  processMessage,
  getConversation,
  finalizeConversation,
  getConversationHistory,
  getConversationStats
} from "../controllers/chatTriageController.js";

const router = express.Router();

// ===============================================
// 🚀 RUTAS PRINCIPALES DEL CHAT TRIAJE
// ===============================================

/**
 * @route   POST /api/chat-triage/start
 * @desc    Iniciar nueva conversación de triaje
 * @access  Requiere autenticación (usuario logueado)
 * @body    { userId: string }
 */
router.post("/start", startConversation);

/**
 * @route   POST /api/chat-triage/message
 * @desc    Procesar mensaje del usuario con Watson IA
 * @access  Requiere autenticación
 * @body    { conversationId: string, message: string }
 */
router.post("/message", processMessage);

/**
 * @route   GET /api/chat-triage/conversation/:conversationId
 * @desc    Obtener conversación completa con mensajes
 * @access  Requiere autenticación
 * @params  conversationId - ID de la conversación
 * @query   includeMessages=true|false, limit=50
 */
router.get("/conversation/:conversationId", getConversation);

/**
 * @route   POST /api/chat-triage/finalize
 * @desc    Finalizar conversación y generar clasificación Manchester
 * @access  Requiere autenticación
 * @body    { conversationId: string, forceFinalize?: boolean }
 */
router.post("/finalize", finalizeConversation);

/**
 * @route   GET /api/chat-triage/history/:userId
 * @desc    Obtener historial de conversaciones del usuario
 * @access  Requiere autenticación
 * @params  userId - ID del usuario
 * @query   limit=5, includeActive=true|false
 */
router.get("/history/:userId", getConversationHistory);

/**
 * @route   GET /api/chat-triage/stats/:userId
 * @desc    Obtener estadísticas de conversaciones del usuario
 * @access  Requiere autenticación
 * @params  userId - ID del usuario
 */
router.get("/stats/:userId", getConversationStats);

// ===============================================
// 🔧 RUTAS ADICIONALES DE UTILIDAD
// ===============================================

/**
 * @route   GET /api/chat-triage/health
 * @desc    Verificar estado del servicio de chat
 * @access  Público
 */
router.get("/health", (req, res) => {
  res.status(200).json({
    service: "Chat Triaje Watson IA",
    status: "operational",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    endpoints: {
      start: "POST /api/chat-triage/start",
      message: "POST /api/chat-triage/message", 
      conversation: "GET /api/chat-triage/conversation/:id",
      finalize: "POST /api/chat-triage/finalize",
      history: "GET /api/chat-triage/history/:userId",
      stats: "GET /api/chat-triage/stats/:userId"
    },
    watson_integration: "enabled",
    fallback_system: "enabled"
  });
});

/**
 * @route   GET /api/chat-triage/active-conversations
 * @desc    Obtener conversaciones activas (para monitoreo médico)
 * @access  Requiere rol médico
 */
router.get("/active-conversations", async (req, res) => {
  try {
    const { limit = '10' } = req.query;
    
    // Importar aquí para evitar dependencia circular
    const Conversation = (await import('../models/Conversation.js')).default;
    
    const activeConversations = await Conversation.find({ 
      status: 'active',
      lastMessageAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Últimas 24 horas
    })
    .sort({ lastMessageAt: -1 })
    .limit(parseInt(limit))
    .select('conversationId userId currentUrgencyLevel currentSpecialty emergencyDetected startedAt lastMessageAt');

    res.status(200).json({
      message: "Conversaciones activas obtenidas",
      data: {
        conversations: activeConversations,
        totalActive: activeConversations.length,
        emergencyCount: activeConversations.filter(conv => conv.emergencyDetected).length
      }
    });

  } catch (error) {
    console.error('❌ Error obteniendo conversaciones activas:', error);
    res.status(500).json({
      error: "Error al obtener conversaciones activas",
      details: error.message
    });
  }
});

/**
 * @route   GET /api/chat-triage/emergency-alerts
 * @desc    Obtener alertas de emergencia del chat
 * @access  Requiere rol médico
 */
router.get("/emergency-alerts", async (req, res) => {
  try {
    const { limit = '10' } = req.query;
    
    // Importar aquí para evitar dependencia circular
    const Conversation = (await import('../models/Conversation.js')).default;
    
    const emergencyConversations = await Conversation.getEmergencyCases(parseInt(limit));

    res.status(200).json({
      message: "Alertas de emergencia obtenidas",
      data: {
        emergencyConversations: emergencyConversations.map(conv => ({
          conversationId: conv.conversationId,
          userId: conv.userId,
          urgencyLevel: conv.currentUrgencyLevel,
          specialty: conv.currentSpecialty,
          emergencyReason: conv.emergencyReason,
          startedAt: conv.startedAt,
          lastMessageAt: conv.lastMessageAt,
          status: conv.status,
          chiefComplaint: conv.chiefComplaint
        })),
        totalEmergencies: emergencyConversations.length
      }
    });

  } catch (error) {
    console.error('❌ Error obteniendo alertas:', error);
    res.status(500).json({
      error: "Error al obtener alertas de emergencia",
      details: error.message
    });
  }
});

/**
 * @route   POST /api/chat-triage/admin/force-complete/:conversationId
 * @desc    Forzar finalización de conversación (admin)
 * @access  Requiere rol admin/médico
 */
router.post("/admin/force-complete/:conversationId", async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { reason = "Finalizada por administrador" } = req.body;
    
    // Importar servicios
    const conversationService = (await import('../services/conversationService.js')).default;
    const Conversation = (await import('../models/Conversation.js')).default;
    
    const conversation = await Conversation.findOne({ conversationId });
    if (!conversation) {
      return res.status(404).json({
        error: "Conversación no encontrada"
      });
    }

    // Finalizar forzadamente
    const simpleClassification = {
      level: conversation.currentUrgencyLevel,
      color: '#3B82F6',
      label: 'Clasificación Administrativa',
      bgColor: '#EFF6FF',
      specialty: conversation.currentSpecialty,
      source: 'admin_override',
      confidence: 0.5
    };

    await conversation.finalize(simpleClassification);
    
    // Agregar mensaje de finalización
    await conversationService.addMessage(
      conversationId,
      'watson',
      `Conversación finalizada por administrador. Razón: ${reason}`,
      'summary'
    );

    res.status(200).json({
      message: "Conversación finalizada forzadamente",
      data: {
        conversationId,
        previousStatus: 'active',
        newStatus: 'completed',
        reason,
        finalClassification: simpleClassification
      }
    });

  } catch (error) {
    console.error('❌ Error forzando finalización:', error);
    res.status(500).json({
      error: "Error al forzar finalización",
      details: error.message
    });
  }
});

// ===============================================
// 🔍 RUTAS DE TESTING Y DESARROLLO
// ===============================================

/**
 * @route   GET /api/chat-triage/dev/test-watson
 * @desc    Probar conexión con Watson (solo desarrollo)
 * @access  Desarrollo
 */
router.get("/dev/test-watson", async (req, res) => {
  // Solo habilitar en desarrollo
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({
      error: "Endpoint no disponible en producción"
    });
  }

  try {
    const watsonController = (await import('../controllers/watsonController.js')).default;
    
    const testResponse = await watsonController.callTriageManchester(
      "dolor de cabeza leve",
      "Prueba de conectividad Watson",
      "Test de desarrollo"
    );

    res.status(200).json({
      message: "Watson conectado correctamente",
      data: {
        watson_responsive: true,
        test_response: testResponse,
        model: testResponse.model_info?.model_id || 'unknown',
        tokens_used: testResponse.tokens_info?.generated_tokens || 0,
        processing_time: testResponse.processing_time || 0
      }
    });

  } catch (error) {
    res.status(500).json({
      message: "Error conectando con Watson",
      error: error.message,
      watson_responsive: false
    });
  }
});

/**
 * @route   POST /api/chat-triage/dev/simulate-conversation
 * @desc    Simular conversación completa (solo desarrollo)
 * @access  Desarrollo
 */
router.post("/dev/simulate-conversation", async (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({
      error: "Endpoint no disponible en producción"
    });
  }

  try {
    const { userId = "test-user", messages = [] } = req.body;
    
    // Simulación básica
    const simulationResults = {
      userId,
      simulatedMessages: messages.length,
      estimatedTime: messages.length * 2000, // 2 segundos por mensaje
      estimatedTokens: messages.length * 15,
      expectedClassification: "Simulación - Nivel 3-AMARILLO-MEDICINA"
    };

    res.status(200).json({
      message: "Simulación completada",
      data: simulationResults
    });

  } catch (error) {
    res.status(500).json({
      error: "Error en simulación",
      details: error.message
    });
  }
});

// ===============================================
// 🛡️ MIDDLEWARE DE VALIDACIÓN (OPCIONAL)
// ===============================================

/**
 * Middleware para validar que el usuario existe antes de operaciones de chat
 */
router.use("/conversation/:conversationId", async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    
    // Importar modelo
    const Conversation = (await import('../models/Conversation.js')).default;
    
    const conversation = await Conversation.findOne({ conversationId }).select('userId status');
    
    if (!conversation) {
      return res.status(404).json({
        error: "Conversación no encontrada",
        code: "CONVERSATION_NOT_FOUND"
      });
    }

    // Agregar info de conversación al request para uso posterior
    req.conversation = conversation;
    next();

  } catch (error) {
    console.error('❌ Error en middleware de validación:', error);
    res.status(500).json({
      error: "Error de validación",
      details: error.message
    });
  }
});

// ===============================================
// 📝 DOCUMENTACIÓN DE LA API
// ===============================================

/**
 * @route   GET /api/chat-triage/docs
 * @desc    Documentación de la API de Chat Triaje
 * @access  Público
 */
router.get("/docs", (req, res) => {
  res.status(200).json({
    title: "API Chat Triaje Watson IA",
    version: "1.0.0",
    description: "Sistema de triaje médico conversacional con IBM Watson",
    
    endpoints: {
      conversation_management: {
        start: {
          method: "POST",
          path: "/api/chat-triage/start",
          description: "Iniciar nueva conversación",
          body: { userId: "string (required)" },
          response: "Conversación iniciada + mensaje de bienvenida"
        },
        message: {
          method: "POST", 
          path: "/api/chat-triage/message",
          description: "Enviar mensaje y recibir respuesta Watson",
          body: { 
            conversationId: "string (required)",
            message: "string (required)"
          },
          response: "Respuesta Watson + análisis de urgencia"
        },
        get: {
          method: "GET",
          path: "/api/chat-triage/conversation/:conversationId",
          description: "Obtener conversación completa",
          params: { conversationId: "string" },
          query: { 
            includeMessages: "boolean (default: true)",
            limit: "number (default: 50)"
          }
        },
        finalize: {
          method: "POST",
          path: "/api/chat-triage/finalize", 
          description: "Finalizar conversación y obtener clasificación",
          body: {
            conversationId: "string (required)",
            forceFinalize: "boolean (optional)"
          }
        }
      },
      
      user_data: {
        history: {
          method: "GET",
          path: "/api/chat-triage/history/:userId",
          description: "Historial de conversaciones del usuario",
          params: { userId: "string" },
          query: {
            limit: "number (default: 5)",
            includeActive: "boolean (default: true)"
          }
        },
        stats: {
          method: "GET", 
          path: "/api/chat-triage/stats/:userId",
          description: "Estadísticas de uso y rendimiento",
          params: { userId: "string" }
        }
      },

      monitoring: {
        health: {
          method: "GET",
          path: "/api/chat-triage/health",
          description: "Estado del servicio"
        },
        active: {
          method: "GET",
          path: "/api/chat-triage/active-conversations", 
          description: "Conversaciones activas (rol médico)"
        },
        emergencies: {
          method: "GET",
          path: "/api/chat-triage/emergency-alerts",
          description: "Alertas de emergencia (rol médico)"
        }
      }
    },

    data_models: {
      conversation: {
        conversationId: "UUID único",
        userId: "ID del paciente",
        status: "active | completed | emergency | abandoned",
        currentUrgencyLevel: "1-5 (Manchester)",
        currentSpecialty: "Especialidad médica sugerida",
        emergencyDetected: "boolean",
        collectedSymptoms: "array de síntomas",
        finalClassification: "Clasificación Manchester final"
      },
      message: {
        messageId: "UUID único",
        conversationId: "Referencia a conversación",
        sender: "user | watson",
        content: "Texto del mensaje",
        messageType: "text | question | alert | summary",
        watsonResponse: "Metadatos de respuesta Watson"
      }
    },

    watson_integration: {
      models: "llama-3-3-70b-instruct",
      features: [
        "Análisis contextual de síntomas",
        "Escalado automático de urgencia", 
        "Memoria entre conversaciones",
        "Clasificación Manchester automática",
        "Fallback a sistema simple"
      ],
      processing: {
        avg_response_time: "~2 segundos",
        avg_tokens_per_message: "15-25 tokens",
        confidence_threshold: "0.8+"
      }
    },

    usage_examples: {
      start_conversation: {
        request: "POST /api/chat-triage/start",
        body: { userId: "1939" },
        expected_response: "Nueva conversación + mensaje Watson bienvenida"
      },
      send_message: {
        request: "POST /api/chat-triage/message",
        body: {
          conversationId: "uuid-conversation",
          message: "Me duele mucho la cabeza desde ayer"
        },
        expected_response: "Respuesta Watson + posible escalado urgencia"
      }
    },

    error_codes: {
      MISSING_USER_ID: "userId requerido en body",
      CONVERSATION_NOT_FOUND: "ID de conversación inválido",
      CONVERSATION_NOT_ACTIVE: "Conversación ya finalizada",
      EMPTY_MESSAGE: "Mensaje no puede estar vacío",
      INSUFFICIENT_INFORMATION: "Faltan datos para finalizar",
      WATSON_ERROR: "Error en procesamiento Watson IA",
      PROCESSING_ERROR: "Error general de procesamiento"
    }
  });
});

export default router;