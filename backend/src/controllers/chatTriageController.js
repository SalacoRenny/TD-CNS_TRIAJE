// ===============================================
// 💬 CHAT TRIAGE CONTROLLER - CONTROLADOR PRINCIPAL (CORREGIDO COMPLETAMENTE)
// backend/src/controllers/chatTriageController.js
// ===============================================

import conversationService from '../services/conversationService.js';
import watsonChatService from '../services/watsonChatService.js';
import Conversation from '../models/Conversation.js';
import ChatMessage from '../models/ChatMessage.js';
import User from '../models/User.js';

// ===============================================
// 🔧 FUNCIÓN AUXILIAR PARA MAPEAR TIPOS
// ===============================================
function mapResponseTypeToMessageType(responseType) {
  const typeMapping = {
    'initial': 'welcome',
    'followup': 'question',
    'symptom_inquiry': 'question',
    'classification': 'classification',
    'emergency': 'alert',
    'validation_request': 'question',
    'text': 'text',
    'alert': 'alert',
    'summary': 'summary',
    'welcome': 'welcome'
  };
  
  return typeMapping[responseType] || 'text';
}

// ===============================================
// 🚀 INICIAR NUEVA CONVERSACIÓN
// ===============================================
export const startConversation = async (req, res) => {
  const startTime = Date.now();
  
  try {
    console.log('🚀 === INICIANDO CONVERSACIÓN DE CHAT TRIAJE ===');
    
    const { userId } = req.body;
    
    // 🛡️ Validaciones
    if (!userId) {
      return res.status(400).json({
        error: "userId es requerido",
        code: "MISSING_USER_ID"
      });
    }

    // Verificar que el usuario existe
    const user = await User.findOne({ userId });
    if (!user) {
      return res.status(404).json({
        error: "Usuario no encontrado",
        code: "USER_NOT_FOUND"
      });
    }

    console.log(`👤 Iniciando conversación para usuario: ${userId} (${user.name})`);

    // 🔧 CORRECCIÓN: Usar gestión inteligente de conversaciones
    const conversationResult = await conversationService.startNewConversation(userId);
    
    const processingTime = Date.now() - startTime;
    
    console.log(`✅ === CONVERSACIÓN INICIADA EN ${processingTime}ms ===`);
    console.log(`🗣️ ID: ${conversationResult.conversation.conversationId}`);
    console.log(`📝 Es existente: ${conversationResult.isExisting}`);

    // 🎯 RESPUESTA ESTRUCTURADA
    res.status(201).json({
      message: conversationResult.isExisting ? 
        "Conversación activa reanudada" : 
        "Nueva conversación iniciada exitosamente",
      data: {
        conversationId: conversationResult.conversation.conversationId,
        status: conversationResult.conversation.status,
        isExisting: conversationResult.isExisting,
        hasHistory: conversationResult.hasHistory,
        currentUrgencyLevel: conversationResult.conversation.currentUrgencyLevel,
        currentSpecialty: conversationResult.conversation.currentSpecialty,
        startedAt: conversationResult.conversation.startedAt,
        conversationSequence: conversationResult.conversation.conversationSequence,
        isFollowUp: conversationResult.conversation.isFollowUpConversation,
        conversationTurns: conversationResult.conversation.watsonMetadata?.conversationTurns || 0
      },
      welcomeMessage: {
        messageId: conversationResult.welcomeMessage.messageId,
        content: conversationResult.welcomeMessage.content,
        messageType: conversationResult.welcomeMessage.messageType,
        timestamp: conversationResult.welcomeMessage.timestamp
      },
      processing_info: {
        processing_time_ms: processingTime,
        method: 'conversation_service_intelligent'
      }
    });

  } catch (error) {
    const processingTime = Date.now() - startTime;
    
    console.error(`❌ === ERROR INICIANDO CONVERSACIÓN EN ${processingTime}ms ===`);
    console.error("Error completo:", error);
    
    res.status(500).json({
      error: "Error al iniciar conversación",
      details: error.message,
      code: "CONVERSATION_START_ERROR",
      processing_time_ms: processingTime
    });
  }
};

// ===============================================
// 💬 PROCESAR MENSAJE DEL USUARIO
// ===============================================
export const processMessage = async (req, res) => {
  const startTime = Date.now();
  
  try {
    console.log('💬 === PROCESANDO MENSAJE DE USUARIO ===');
    
    const { conversationId, message } = req.body;
    
    // 🛡️ Validaciones
    if (!conversationId || !message) {
      return res.status(400).json({
        error: "conversationId y message son requeridos",
        code: "MISSING_REQUIRED_FIELDS"
      });
    }

    if (message.trim().length === 0) {
      return res.status(400).json({
        error: "El mensaje no puede estar vacío",
        code: "EMPTY_MESSAGE"
      });
    }

    // Verificar conversación
    const conversation = await Conversation.findOne({ conversationId });
    if (!conversation) {
      return res.status(404).json({
        error: "Conversación no encontrada",
        code: "CONVERSATION_NOT_FOUND"
      });
    }

    // 🔧 CORRECCIÓN: Verificar si conversación está realmente activa
    if (conversation.status === 'completed') {
      return res.status(400).json({
        error: "La conversación ya está completada. Inicia una nueva consulta.",
        code: "CONVERSATION_COMPLETED",
        currentStatus: conversation.status,
        suggestion: "Inicia una nueva conversación para continuar"
      });
    }

    if (conversation.status !== 'active') {
      return res.status(400).json({
        error: "La conversación no está activa",
        code: "CONVERSATION_NOT_ACTIVE",
        currentStatus: conversation.status
      });
    }

    console.log(`📝 Mensaje de usuario: "${message.substring(0, 50)}..."`);
    console.log(`🗣️ Conversación: ${conversationId}`);
    console.log(`🔢 Turnos actuales: ${conversation.watsonMetadata?.conversationTurns || 0}`);

    // 🔧 CORRECCIÓN: Verificar si la conversación debe auto-finalizarse
    const currentTurns = conversation.watsonMetadata?.conversationTurns || 0;
    if (currentTurns >= 6) {
      console.log('⚠️ CONVERSACIÓN CON 6+ TURNOS - Auto-finalizando antes de procesar');
      
      try {
        const autoClassification = await watsonChatService.generateFinalClassification(conversation);
        await conversationService.finalizeConversation(conversationId, autoClassification);
        
        return res.status(400).json({
          error: "Conversación auto-finalizada por exceso de turnos",
          code: "CONVERSATION_AUTO_COMPLETED",
          finalClassification: autoClassification,
          suggestion: "Inicia una nueva conversación para continuar"
        });
      } catch (autoFinalizeError) {
        console.error('❌ Error auto-finalizando:', autoFinalizeError);
        // Continuar con el procesamiento normal si falla
      }
    }

    // Guardar mensaje del usuario
    const userMessage = await conversationService.addMessage(
      conversationId,
      'user',
      message,
      'text',
      {
        extractedInfo: conversationService.extractMedicalInfo(message)
      }
    );

    console.log(`💾 Mensaje usuario guardado: ${userMessage.messageId}`);

    // 🔧 CORRECCIÓN: Procesar con Watson usando validación médica
    console.log('🧠 Enviando a Watson IA...');
    const watsonResult = await watsonChatService.processUserMessage(
      conversationId,
      message,
      conversation.userId
    );

    console.log(`🎯 Watson respondió en ${watsonResult.processingTime}ms`);
    console.log(`📊 Tokens usados: ${watsonResult.tokensUsed}`);
    console.log(`🔄 Tipo de respuesta: ${watsonResult.responseType}`);

    // 🔧 MAPEAR RESPONSE TYPE A MESSAGE TYPE VÁLIDO
    const messageType = mapResponseTypeToMessageType(watsonResult.responseType);
    console.log(`🔄 Mapeando responseType '${watsonResult.responseType}' → messageType '${messageType}'`);

    // Guardar respuesta de Watson
    const watsonMessage = await conversationService.addMessage(
      conversationId,
      'watson',
      watsonResult.watsonMessage,
      messageType,
      {
        watsonResponse: {
          rawResponse: watsonResult,
          processingTime: watsonResult.processingTime,
          tokensUsed: watsonResult.tokensUsed,
          promptType: watsonResult.responseType
        },
        urgencyUpdate: !!watsonResult.urgencyUpdate,
        messageMetadata: {
          suggestedFollowups: watsonResult.nextQuestions?.map(q => ({
            question: q,
            priority: 'medium'
          })) || [],
          confidenceScore: 0.8,
          usedFallback: watsonResult.responseType === 'fallback',
          fallbackReason: watsonResult.fallbackReason || ''
        }
      }
    );

    // Actualizar urgencia si Watson la detectó
    let urgencyUpdate = null;
    if (watsonResult.urgencyUpdate) {
      const updatedConversation = await conversationService.updateConversationUrgency(
        conversationId,
        watsonResult.urgencyUpdate.level,
        watsonResult.urgencyUpdate.specialty,
        watsonResult.urgencyUpdate.reason
      );
      
      urgencyUpdate = {
        previousLevel: conversation.currentUrgencyLevel,
        newLevel: watsonResult.urgencyUpdate.level,
        newSpecialty: watsonResult.urgencyUpdate.specialty,
        reason: watsonResult.urgencyUpdate.reason,
        requiresAttention: watsonResult.urgencyUpdate.level <= 2
      };
      
      console.log(`🚨 Urgencia actualizada: ${conversation.currentUrgencyLevel} → ${watsonResult.urgencyUpdate.level}`);
    }

    // 🔧 CORRECCIÓN: Auto-finalización inteligente
    let shouldComplete = watsonResult.conversationComplete;
    if (!shouldComplete) {
      // Recargar conversación para obtener turnos actualizados
      const updatedConversation = await Conversation.findOne({ conversationId });
      const updatedTurns = updatedConversation.watsonMetadata?.conversationTurns || 0;
      
      console.log('🔍 VERIFICANDO AUTO-FINALIZACIÓN:', {
        turnosActuales: updatedTurns,
        esClasificacion: watsonResult.responseType === 'classification',
        deberiaCompletar: updatedTurns >= 6 || watsonResult.responseType === 'classification'
      });
      
      shouldComplete = updatedTurns >= 6 || watsonResult.responseType === 'classification';
    }

    const processingTime = Date.now() - startTime;

    console.log(`✅ === MENSAJE PROCESADO EN ${processingTime}ms ===`);
    console.log(`📊 Should complete: ${shouldComplete}`);

    // 🎯 RESPUESTA COMPLETA
    res.status(200).json({
      message: "Mensaje procesado exitosamente",
      data: {
        conversationId,
        userMessage: {
          messageId: userMessage.messageId,
          content: userMessage.content,
          timestamp: userMessage.timestamp,
          extractedInfo: userMessage.extractedInfo
        },
        watsonMessage: {
          messageId: watsonMessage.messageId,
          content: watsonMessage.content,
          messageType: watsonMessage.messageType,
          timestamp: watsonMessage.timestamp
        },
        conversation: {
          currentUrgencyLevel: conversation.currentUrgencyLevel,
          currentSpecialty: conversation.currentSpecialty,
          emergencyDetected: conversation.emergencyDetected,
          conversationTurns: (conversation.watsonMetadata?.conversationTurns || 0) + 1 // +1 por el mensaje procesado
        }
      },
      urgencyUpdate,
      suggestedQuestions: watsonResult.nextQuestions || [],
      shouldComplete,
      watson_info: {
        processing_time_ms: watsonResult.processingTime,
        tokens_used: watsonResult.tokensUsed,
        response_type: watsonResult.responseType,
        mapped_message_type: messageType,
        used_fallback: watsonResult.responseType === 'fallback',
        conversation_phase: watsonResult.conversationPhase,
        has_historical_context: watsonResult.hasHistoricalContext
      },
      processing_info: {
        total_processing_time_ms: processingTime,
        method: 'watson_chat_with_validation'
      }
    });

  } catch (error) {
    const processingTime = Date.now() - startTime;
    
    console.error(`❌ === ERROR PROCESANDO MENSAJE EN ${processingTime}ms ===`);
    console.error("Error completo:", error);
    
    res.status(500).json({
      error: "Error al procesar mensaje",
      details: error.message,
      code: "MESSAGE_PROCESSING_ERROR",
      processing_time_ms: processingTime
    });
  }
};

// ===============================================
// 📋 OBTENER CONVERSACIÓN COMPLETA
// ===============================================
export const getConversation = async (req, res) => {
  try {
    console.log('📋 === OBTENIENDO CONVERSACIÓN ===');
    
    const { conversationId } = req.params;
    const { includeMessages = 'true', limit = '50' } = req.query;

    // Obtener conversación
    const conversation = await Conversation.findOne({ conversationId });
    if (!conversation) {
      return res.status(404).json({
        error: "Conversación no encontrada",
        code: "CONVERSATION_NOT_FOUND"
      });
    }

    let messages = [];
    if (includeMessages === 'true') {
      messages = await conversationService.getConversationMessages(
        conversationId, 
        parseInt(limit)
      );
    }

    console.log(`📱 Conversación obtenida: ${conversationId}`);
    console.log(`💬 Mensajes incluidos: ${messages.length}`);

    res.status(200).json({
      message: "Conversación obtenida exitosamente",
      data: {
        conversation: {
          conversationId: conversation.conversationId,
          userId: conversation.userId,
          status: conversation.status,
          currentUrgencyLevel: conversation.currentUrgencyLevel,
          currentSpecialty: conversation.currentSpecialty,
          startedAt: conversation.startedAt,
          lastMessageAt: conversation.lastMessageAt,
          completedAt: conversation.completedAt,
          emergencyDetected: conversation.emergencyDetected,
          isFollowUpConversation: conversation.isFollowUpConversation,
          conversationSequence: conversation.conversationSequence,
          collectedSymptoms: conversation.collectedSymptoms,
          collectedConditions: conversation.collectedConditions,
          collectedTemperature: conversation.collectedTemperature,
          conversationSummary: conversation.conversationSummary,
          finalClassification: conversation.finalClassification,
          conversationTurns: conversation.watsonMetadata?.conversationTurns || 0
        },
        messages: messages.map(msg => ({
          messageId: msg.messageId,
          sender: msg.sender,
          content: msg.content,
          messageType: msg.messageType,
          timestamp: msg.timestamp,
          messageSequence: msg.messageSequence,
          urgencyUpdate: msg.urgencyUpdate,
          extractedInfo: msg.extractedInfo
        })),
        metadata: {
          totalMessages: messages.length,
          conversationTurns: conversation.watsonMetadata?.conversationTurns || 0,
          totalTokensUsed: conversation.watsonMetadata?.totalTokensUsed || 0
        }
      }
    });

  } catch (error) {
    console.error('❌ Error obteniendo conversación:', error);
    
    res.status(500).json({
      error: "Error al obtener conversación",
      details: error.message,
      code: "GET_CONVERSATION_ERROR"
    });
  }
};

// ===============================================
// ✅ FINALIZAR CONVERSACIÓN
// ===============================================
export const finalizeConversation = async (req, res) => {
  const startTime = Date.now();
  
  try {
    console.log('✅ === FINALIZANDO CONVERSACIÓN ===');
    
    const { conversationId } = req.body;
    const { forceFinalize = false } = req.body;

    // 🔍 DEBUG: Verificar qué llega en el request
    console.log('🔍 === DEBUG FINALIZE REQUEST ===');
    console.log('📝 Body recibido:', req.body);
    console.log('📝 ConversationId:', conversationId);
    console.log('📝 ForceFinalize:', forceFinalize);
    console.log('🔍 === FIN DEBUG FINALIZE ===');

    // Verificar conversación
    const conversation = await Conversation.findOne({ conversationId });
    if (!conversation) {
      console.log('❌ Conversación no encontrada:', conversationId);
      return res.status(404).json({
        error: "Conversación no encontrada",
        code: "CONVERSATION_NOT_FOUND"
      });
    }

    if (conversation.status === 'completed') {
      return res.status(400).json({
        error: "La conversación ya está finalizada",
        code: "CONVERSATION_ALREADY_COMPLETED",
        currentStatus: conversation.status
      });
    }

    // 🔧 CORRECCIÓN: Verificar si está lista para finalizar con turnos correctos
    const currentTurns = conversation.watsonMetadata?.conversationTurns || 0;
    const isReady = watsonChatService.isConversationReadyToFinalize(conversation);
    
    console.log('🔍 VERIFICACIÓN FINALIZACIÓN:', {
      currentTurns,
      isReady,
      forceFinalize,
      hasSymptoms: conversation.collectedSymptoms.length,
      hasChiefComplaint: !!conversation.chiefComplaint
    });
    
    if (!isReady && !forceFinalize) {
      return res.status(400).json({
        error: "Conversación no tiene suficiente información para finalizar",
        code: "INSUFFICIENT_INFORMATION",
        suggestion: "Continúa la conversación o usa forceFinalize=true",
        currentData: {
          symptoms: conversation.collectedSymptoms.length,
          turns: currentTurns,
          hasChiefComplaint: !!conversation.chiefComplaint,
          minimumTurns: 5
        }
      });
    }

    console.log(`🏁 Finalizando conversación: ${conversationId}`);

    // Generar clasificación final con Watson
    const finalClassification = await watsonChatService.generateFinalClassification(conversation);
    
    console.log(`🎯 Clasificación final: Nivel ${finalClassification.level} - ${finalClassification.specialty}`);

    // Finalizar conversación
    const finalizationResult = await conversationService.finalizeConversation(
      conversationId,
      finalClassification
    );

    const processingTime = Date.now() - startTime;

    console.log(`✅ === CONVERSACIÓN FINALIZADA EN ${processingTime}ms ===`);
    console.log(`📋 SymptomRecord creado: ${finalizationResult.symptomRecord._id}`);

    // 🎯 RESPUESTA COMPLETA
    res.status(200).json({
      message: "Conversación finalizada exitosamente",
      data: {
        conversationId,
        finalClassification,
        symptomRecord: {
          id: finalizationResult.symptomRecord._id,
          userId: finalizationResult.symptomRecord.userId,
          symptoms: finalizationResult.symptomRecord.symptoms,
          timestamp: finalizationResult.symptomRecord.timestamp,
          classification_method: finalizationResult.symptomRecord.classification_method,
          conversation_turns: finalizationResult.symptomRecord.conversation_turns
        },
        conversation: {
          status: finalizationResult.conversation.status,
          completedAt: finalizationResult.conversation.completedAt,
          conversationSummary: finalizationResult.conversation.conversationSummary,
          qualityMetrics: finalizationResult.conversation.conversationQuality,
          totalTurns: finalizationResult.conversation.watsonMetadata?.conversationTurns || 0
        }
      },
      recommendations: {
        nextSteps: getNextStepsRecommendation(finalClassification.level),
        requiresImmediateAttention: finalClassification.level <= 2,
        suggestedSpecialty: finalClassification.specialty
      },
      processing_info: {
        processing_time_ms: processingTime,
        total_conversation_time: Date.now() - new Date(conversation.startedAt).getTime(),
        method: 'watson_final_classification'
      }
    });

  } catch (error) {
    const processingTime = Date.now() - startTime;
    
    console.error(`❌ === ERROR FINALIZANDO CONVERSACIÓN EN ${processingTime}ms ===`);
    console.error("Error completo:", error);
    
    res.status(500).json({
      error: "Error al finalizar conversación",
      details: error.message,
      code: "FINALIZATION_ERROR",
      processing_time_ms: processingTime
    });
  }
};

// ===============================================
// 📚 OBTENER HISTORIAL DE CONVERSACIONES
// ===============================================
export const getConversationHistory = async (req, res) => {
  try {
    console.log('📚 === OBTENIENDO HISTORIAL ===');
    
    const { userId } = req.params;
    const { limit = '5', includeActive = 'true' } = req.query;

    // Obtener historial
    const conversations = await conversationService.getUserConversationHistory(
      userId, 
      parseInt(limit)
    );

    // Filtrar conversaciones activas si se solicita
    const filteredConversations = includeActive === 'true' ? 
      conversations : 
      conversations.filter(conv => conv.status !== 'active');

    console.log(`📖 Historial obtenido: ${filteredConversations.length} conversaciones`);

    res.status(200).json({
      message: "Historial obtenido exitosamente",
      data: {
        userId,
        conversations: filteredConversations.map(conv => ({
          conversationId: conv.conversationId,
          status: conv.status,
          startedAt: conv.startedAt,
          completedAt: conv.completedAt,
          currentUrgencyLevel: conv.currentUrgencyLevel,
          currentSpecialty: conv.currentSpecialty,
          chiefComplaint: conv.chiefComplaint,
          emergencyDetected: conv.emergencyDetected,
          conversationSequence: conv.conversationSequence,
          finalClassification: conv.finalClassification,
          conversationTurns: conv.watsonMetadata?.conversationTurns || 0
        })),
        metadata: {
          totalConversations: filteredConversations.length,
          hasActiveConversation: conversations.some(conv => conv.status === 'active'),
          completedConversations: conversations.filter(conv => conv.status === 'completed').length
        }
      }
    });

  } catch (error) {
    console.error('❌ Error obteniendo historial:', error);
    
    res.status(500).json({
      error: "Error al obtener historial",
      details: error.message,
      code: "HISTORY_ERROR"
    });
  }
};

// ===============================================
// 📊 OBTENER ESTADÍSTICAS DE CONVERSACIONES
// ===============================================
export const getConversationStats = async (req, res) => {
  try {
    console.log('📊 === OBTENIENDO ESTADÍSTICAS ===');
    
    const { userId } = req.params;

    // Obtener estadísticas
    const stats = await Conversation.getConversationStats(userId);
    
    // Estadísticas adicionales
    const emergencyCases = await Conversation.find({
      userId,
      emergencyDetected: true
    }).countDocuments();

    const avgResponseTime = await ChatMessage.aggregate([
      { 
        $match: { 
          userId, 
          sender: 'watson',
          'watsonResponse.processingTime': { $gt: 0 }
        } 
      },
      {
        $group: {
          _id: null,
          avgResponseTime: { $avg: '$watsonResponse.processingTime' }
        }
      }
    ]);

    console.log(`📈 Estadísticas calculadas para usuario: ${userId}`);

    res.status(200).json({
      message: "Estadísticas obtenidas exitosamente",
      data: {
        userId,
        conversationStats: stats[0] || {
          totalConversations: 0,
          emergencyDetections: 0,
          avgUrgencyLevel: 5,
          completedConversations: 0,
          totalTokensUsed: 0,
          firstConversation: null,
          lastConversation: null
        },
        performanceStats: {
          emergencyCases,
          avgResponseTime: avgResponseTime[0]?.avgResponseTime || 0
        }
      }
    });

  } catch (error) {
    console.error('❌ Error obteniendo estadísticas:', error);
    
    res.status(500).json({
      error: "Error al obtener estadísticas",
      details: error.message,
      code: "STATS_ERROR"
    });
  }
};

// ===============================================
// 🩺 HEALTH CHECK DEL SERVICIO
// ===============================================
export const getServiceHealth = async (req, res) => {
  try {
    console.log('🏥 === VERIFICANDO ESTADO DEL SERVICIO ===');
    
    // Verificar componentes principales
    const healthStatus = {
      service: 'chat-triage-api',
      status: 'operational',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      components: {
        database: 'operational',
        watson_integration: 'operational',
        conversation_service: 'operational',
        session_service: 'operational'
      },
      endpoints: {
        start_conversation: '/api/chat-triage/start',
        send_message: '/api/chat-triage/message',
        get_conversation: '/api/chat-triage/conversation/:id',
        finalize_conversation: '/api/chat-triage/finalize',
        get_history: '/api/chat-triage/history/:userId',
        get_stats: '/api/chat-triage/stats/:userId'
      },
      watson_integration: {
        model: 'llama-3-3-70b-instruct',
        deployment_id: process.env.IBM_WATSON_DEPLOYMENT_ID ? 'configured' : 'missing',
        region: process.env.IBM_WATSON_REGION || 'us-south'
      },
      fallback_system: {
        enabled: true,
        simple_classification: 'available'
      }
    };

    // Verificar conexión con MongoDB
    try {
      await Conversation.findOne().limit(1);
      healthStatus.components.database = 'operational';
    } catch (dbError) {
      healthStatus.components.database = 'degraded';
      healthStatus.status = 'degraded';
    }

    // Verificar configuración Watson
    if (!process.env.IBM_WATSON_DEPLOYMENT_ID || !process.env.IBM_WATSON_API_KEY) {
      healthStatus.components.watson_integration = 'misconfigured';
      healthStatus.status = 'degraded';
    }

    console.log(`🏥 Estado del servicio: ${healthStatus.status}`);

    res.status(200).json(healthStatus);

  } catch (error) {
    console.error('❌ Error verificando estado:', error);
    
    res.status(500).json({
      service: 'chat-triage-api',
      status: 'error',
      error: 'Health check failed',
      details: error.message
    });
  }
};

// ===============================================
// 🔧 FUNCIÓN AUXILIAR PARA RECOMENDACIONES
// ===============================================
function getNextStepsRecommendation(level) {
  const recommendations = {
    1: 'URGENTE: Dirígete inmediatamente a emergencias o llama al 911',
    2: 'Busca atención médica urgente en las próximas horas',
    3: 'Programa una cita médica en las próximas 24-48 horas',
    4: 'Considera programar una cita médica en los próximos días',
    5: 'Monitorea síntomas. Consulta si persisten o empeoran'
  };
  return recommendations[level] || recommendations[5];
}

// ===============================================
// 🧪 ENDPOINTS DE DESARROLLO/TESTING
// ===============================================
export const testWatsonConnection = async (req, res) => {
  try {
    console.log('🧪 === PROBANDO CONEXIÓN WATSON ===');
    
    const testMessage = "dolor de cabeza";
    const testPrompt = "Evalúa este síntoma según protocolo Manchester.";
    
    const startTime = Date.now();
    
    try {
      const watsonResponse = await watsonController.callTriageManchester(
        testMessage,
        testPrompt,
        "Prueba de conexión"
      );
      
      const processingTime = Date.now() - startTime;
      
      console.log('✅ Watson respondió correctamente');
      
      res.status(200).json({
        message: "Conexión Watson exitosa",
        data: {
          watson_responsive: true,
          model: 'llama-3-3-70b-instruct',
          processing_time: processingTime,
          tokens_used: watsonResponse.tokens_info?.generated_tokens || 0,
          test_response: watsonResponse.generated_text?.substring(0, 100) + '...'
        }
      });
      
    } catch (watsonError) {
      console.error('❌ Error en Watson:', watsonError);
      
      res.status(500).json({
        message: "Error de conexión Watson",
        data: {
          watson_responsive: false,
          error: watsonError.message,
          fallback_available: true
        }
      });
    }

  } catch (error) {
    console.error('❌ Error probando Watson:', error);
    
    res.status(500).json({
      error: "Error en test de Watson",
      details: error.message,
      code: "WATSON_TEST_ERROR"
    });
  }
};

export default {
  startConversation,
  processMessage,
  getConversation,
  finalizeConversation,
  getConversationHistory,
  getConversationStats,
  getServiceHealth,
  testWatsonConnection
};