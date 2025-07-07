// ===============================================
// 💬 CHAT TRIAGE API - SERVICIOS FRONTEND
// frontend/src/services/chatTriageApi.js
// ===============================================

import axios from "axios";

// Crear instancia específica para Chat Triaje
const ChatAPI = axios.create({
  baseURL: "http://localhost:5000/api/chat-triage",
  headers: {
    'Content-Type': 'application/json'
  }
});

console.log('💬 Chat Triaje API inicializada');

// Interceptor para logging de requests
ChatAPI.interceptors.request.use(
  (config) => {
    console.log(`🚀 Chat API Request: ${config.method?.toUpperCase()} ${config.url}`);
    console.log('📋 Data:', config.data);
    return config;
  },
  (error) => {
    console.error('❌ Error en request Chat API:', error);
    return Promise.reject(error);
  }
);

// Interceptor para logging de responses
ChatAPI.interceptors.response.use(
  (response) => {
    console.log(`✅ Chat API Response: ${response.status} ${response.config.url}`);
    console.log('📊 Data:', response.data);
    return response;
  },
  (error) => {
    console.error('❌ Error en response Chat API:', error.response?.status, error.response?.data);
    return Promise.reject(error);
  }
);

// ===============================================
// 🚀 GESTIÓN DE CONVERSACIONES
// ===============================================

/**
 * Iniciar nueva conversación de triaje
 * @param {string} userId - ID del usuario
 * @returns {Promise<Object>} Conversación iniciada
 */
export const startConversation = async (userId) => {
  try {
    console.log(`🚀 Iniciando conversación para usuario: ${userId}`);
    
    const response = await ChatAPI.post('/start', { userId });
    
    console.log('✅ Conversación iniciada:', response.data.data.conversationId);
    
    // ✅ AGREGAR ESTOS LOGS DE DEBUG:
    console.log('🔍 RESPUESTA COMPLETA startConversation:', response.data);
    console.log('🔍 DATA:', response.data.data);
    console.log('🔍 IS EXISTING:', response.data.data.isExisting);
    console.log('🔍 WELCOME MESSAGE:', response.data.welcomeMessage);
    
    return {
      success: true,
      conversation: response.data.data,
      welcomeMessage: response.data.welcomeMessage,
      isExisting: response.data.data.isExisting,
      hasHistory: response.data.data.hasHistory
    };
    
  } catch (error) {
    console.error('❌ Error iniciando conversación:', error);
    
    return {
      success: false,
      error: error.response?.data?.error || 'Error al iniciar conversación',
      code: error.response?.data?.code || 'UNKNOWN_ERROR'
    };
  }
};


/**
 * Enviar mensaje del usuario y recibir respuesta Watson
 * @param {string} conversationId - ID de conversación
 * @param {string} message - Mensaje del usuario
 * @returns {Promise<Object>} Respuesta Watson
 */
// ===============================================
// 🔍 DEBUG TEMPORAL - Agregar en chatTriageApi.js
// frontend/src/services/chatTriageApi.js
// ===============================================

// En la función sendMessage, línea 45, agrega estos logs:

export const sendMessage = async (conversationId, message) => {
  try {
    console.log(`💬 Enviando mensaje: "${message.substring(0, 50)}..."`);
    
    const response = await ChatAPI.post('/message', {
      conversationId,
      message: message.trim()
    });
    
    // ✅ AGREGAR ESTOS LOGS DE DEBUG:
    console.log('🔍 RESPUESTA COMPLETA DEL BACKEND:', response.data);
    console.log('🔍 WATSON MESSAGE:', response.data.data?.watsonMessage);
    console.log('🔍 WATSON CONTENT:', response.data.data?.watsonMessage?.content);
    
    const data = response.data.data;
    
    console.log('🧠 Watson respondió:', data.watsonMessage.content.substring(0, 50) + '...');
    
    if (response.data.urgencyUpdate) {
      console.log('🚨 Urgencia actualizada:', response.data.urgencyUpdate);
    }
    
    return {
      success: true,
      userMessage: data.userMessage,
      watsonMessage: data.watsonMessage,
      conversation: data.conversation,
      urgencyUpdate: response.data.urgencyUpdate,
      suggestedQuestions: response.data.suggestedQuestions || [],
      shouldComplete: response.data.shouldComplete || false,
      watsonInfo: response.data.watson_info
    };
    
  } catch (error) {
    console.error('❌ Error enviando mensaje:', error);
    
    return {
      success: false,
      error: error.response?.data?.error || 'Error al enviar mensaje',
      code: error.response?.data?.code || 'UNKNOWN_ERROR'
    };
  }
};

/**
 * Obtener conversación completa con mensajes
 * @param {string} conversationId - ID de conversación
 * @param {Object} options - Opciones adicionales
 * @returns {Promise<Object>} Conversación completa
 */
export const getConversation = async (conversationId, options = {}) => {
  try {
    const { includeMessages = true, limit = 50 } = options;
    
    console.log(`📋 Obteniendo conversación: ${conversationId}`);
    console.log('🔍 OPTIONS:', { includeMessages, limit });
    
    const response = await ChatAPI.get(`/conversation/${conversationId}`, {
      params: {
        includeMessages: includeMessages.toString(),
        limit: limit.toString()
      }
    });
    
    const data = response.data.data;
    
    console.log(`📱 Conversación obtenida: ${data.messages.length} mensajes`);
    console.log('🔍 RESPUESTA COMPLETA getConversation:', response.data);
    console.log('🔍 MESSAGES:', data.messages);
    
    return {
      success: true,
      conversation: data.conversation,
      messages: data.messages,
      metadata: data.metadata
    };
    
  } catch (error) {
    console.error('❌ Error obteniendo conversación:', error);
    console.error('🔍 ERROR DETAILS:', error.response?.data);
    
    return {
      success: false,
      error: error.response?.data?.error || 'Error al obtener conversación',
      code: error.response?.data?.code || 'UNKNOWN_ERROR'
    };
  }
};

/**
 * Finalizar conversación y obtener clasificación Manchester
 * @param {string} conversationId - ID de conversación
 * @param {boolean} forceFinalize - Forzar finalización
 * @returns {Promise<Object>} Resultado de finalización
 */
export const finalizeConversation = async (conversationId, forceFinalize = false) => {
  try {
    console.log(`✅ Finalizando conversación: ${conversationId}`);
    
    const response = await ChatAPI.post('/finalize', {
      conversationId,
      forceFinalize
    });
    
    const data = response.data.data;
    
    console.log('🎯 Clasificación final:', data.finalClassification);
    
    return {
      success: true,
      finalClassification: data.finalClassification,
      symptomRecord: data.symptomRecord,
      conversation: data.conversation,
      recommendations: response.data.recommendations
    };
    
    } catch (error) {
    console.error('❌ Error finalizando conversación:', error);
    
    // 🔍 DEBUG: Información detallada del error
    console.log('🔍 === DEBUG ERROR FINALIZE ===');
    console.log('📝 Error status:', error.response?.status);
    console.log('📝 Error data:', error.response?.data);
    console.log('📝 Error config:', error.config);
    console.log('🔍 === FIN DEBUG ERROR ===');
    
    return {
      success: false,
      error: error.response?.data?.error || 'Error al finalizar conversación',
      code: error.response?.data?.code || 'UNKNOWN_ERROR',
      suggestion: error.response?.data?.suggestion,
      details: error.response?.data?.details,
      httpStatus: error.response?.status
    };
  }
};

// ===============================================
// 📚 HISTORIAL Y ESTADÍSTICAS
// ===============================================

/**
 * Obtener historial de conversaciones del usuario
 * @param {string} userId - ID del usuario
 * @param {Object} options - Opciones de consulta
 * @returns {Promise<Object>} Historial de conversaciones
 */
export const getConversationHistory = async (userId, options = {}) => {
  try {
    const { limit = 5, includeActive = true } = options;
    
    console.log(`📚 Obteniendo historial para usuario: ${userId}`);
    
    const response = await ChatAPI.get(`/history/${userId}`, {
      params: {
        limit: limit.toString(),
        includeActive: includeActive.toString()
      }
    });
    
    const data = response.data.data;
    
    console.log(`📖 Historial obtenido: ${data.conversations.length} conversaciones`);
    
    return {
      success: true,
      conversations: data.conversations,
      metadata: data.metadata
    };
    
  } catch (error) {
    console.error('❌ Error obteniendo historial:', error);
    
    return {
      success: false,
      error: error.response?.data?.error || 'Error al obtener historial',
      code: error.response?.data?.code || 'UNKNOWN_ERROR'
    };
  }
};

/**
 * Obtener estadísticas de conversaciones del usuario
 * @param {string} userId - ID del usuario
 * @returns {Promise<Object>} Estadísticas
 */
export const getConversationStats = async (userId) => {
  try {
    console.log(`📊 Obteniendo estadísticas para usuario: ${userId}`);
    
    const response = await ChatAPI.get(`/stats/${userId}`);
    
    const data = response.data.data;
    
    console.log('📈 Estadísticas obtenidas:', data.conversationStats);
    
    return {
      success: true,
      conversationStats: data.conversationStats,
      performanceStats: data.performanceStats
    };
    
  } catch (error) {
    console.error('❌ Error obteniendo estadísticas:', error);
    
    return {
      success: false,
      error: error.response?.data?.error || 'Error al obtener estadísticas',
      code: error.response?.data?.code || 'UNKNOWN_ERROR'
    };
  }
};

// ===============================================
// 🔧 FUNCIONES DE UTILIDAD
// ===============================================

/**
 * Verificar estado del servicio de chat
 * @returns {Promise<Object>} Estado del servicio
 */
export const getServiceHealth = async () => {
  try {
    console.log('🏥 Verificando estado del servicio...');
    
    const response = await ChatAPI.get('/health');
    
    console.log('✅ Servicio operativo:', response.data.status);
    
    return {
      success: true,
      status: response.data.status,
      service: response.data.service,
      version: response.data.version,
      endpoints: response.data.endpoints,
      watsonIntegration: response.data.watson_integration,
      fallbackSystem: response.data.fallback_system
    };
    
  } catch (error) {
    console.error('❌ Error verificando estado:', error);
    
    return {
      success: false,
      error: 'Servicio no disponible',
      details: error.message
    };
  }
};

/**
 * Obtener documentación de la API
 * @returns {Promise<Object>} Documentación
 */
export const getApiDocumentation = async () => {
  try {
    console.log('📝 Obteniendo documentación API...');
    
    const response = await ChatAPI.get('/docs');
    
    return {
      success: true,
      documentation: response.data
    };
    
  } catch (error) {
    console.error('❌ Error obteniendo documentación:', error);
    
    return {
      success: false,
      error: 'Error al obtener documentación'
    };
  }
};

// ===============================================
// 🎭 FUNCIONES DE DESARROLLO/TESTING
// ===============================================

/**
 * Probar conexión con Watson (solo desarrollo)
 * @returns {Promise<Object>} Resultado del test
 */
export const testWatsonConnection = async () => {
  try {
    console.log('🧪 Probando conexión Watson...');
    
    const response = await ChatAPI.get('/dev/test-watson');
    
    return {
      success: true,
      watsonResponsive: response.data.data.watson_responsive,
      model: response.data.data.model,
      tokensUsed: response.data.data.tokens_used,
      processingTime: response.data.data.processing_time
    };
    
  } catch (error) {
    console.error('❌ Error probando Watson:', error);
    
    return {
      success: false,
      watsonResponsive: false,
      error: error.response?.data?.error || 'Error de conexión'
    };
  }
};

// ===============================================
// 📱 FUNCIONES PARA MANEJO DE ERRORES
// ===============================================

/**
 * Interpretar códigos de error de la API
 * @param {string} errorCode - Código de error
 * @returns {Object} Información del error
 */
export const interpretErrorCode = (errorCode) => {
  const errorMessages = {
    'MISSING_USER_ID': {
      title: 'Usuario Requerido',
      message: 'Debes iniciar sesión para usar el chat médico',
      action: 'Inicia sesión e intenta de nuevo'
    },
    'CONVERSATION_NOT_FOUND': {
      title: 'Conversación No Encontrada',
      message: 'La conversación no existe o ha sido eliminada',
      action: 'Inicia una nueva conversación'
    },
    'CONVERSATION_NOT_ACTIVE': {
      title: 'Conversación Finalizada',
      message: 'Esta conversación ya ha sido completada',
      action: 'Revisa el historial o inicia una nueva conversación'
    },
    'EMPTY_MESSAGE': {
      title: 'Mensaje Vacío',
      message: 'No puedes enviar un mensaje vacío',
      action: 'Escribe tu mensaje e intenta de nuevo'
    },
    'WATSON_ERROR': {
      title: 'Error de IA',
      message: 'Watson IA no está disponible temporalmente',
      action: 'El sistema continuará con análisis básico'
    },
    'PROCESSING_ERROR': {
      title: 'Error de Procesamiento',
      message: 'Hubo un problema procesando tu solicitud',
      action: 'Intenta de nuevo en unos momentos'
    }
  };

  return errorMessages[errorCode] || {
    title: 'Error Desconocido',
    message: 'Ocurrió un error inesperado',
    action: 'Intenta de nuevo o contacta soporte'
  };
};

/**
 * Validar mensaje antes de enviar
 * @param {string} message - Mensaje a validar
 * @returns {Object} Resultado de validación
 */
export const validateMessage = (message) => {
  if (!message || typeof message !== 'string') {
    return {
      isValid: false,
      error: 'El mensaje debe ser texto'
    };
  }

  const trimmed = message.trim();
  
  if (trimmed.length === 0) {
    return {
      isValid: false,
      error: 'El mensaje no puede estar vacío'
    };
  }

  if (trimmed.length > 2000) {
    return {
      isValid: false,
      error: 'El mensaje es muy largo (máximo 2000 caracteres)'
    };
  }

  return {
    isValid: true,
    message: trimmed
  };
};

// ===============================================
// 📊 CONSTANTES Y CONFIGURACIÓN
// ===============================================

export const CHAT_CONFIG = {
  MAX_MESSAGE_LENGTH: 2000,
  TYPING_DELAY: 1000,
  RETRY_ATTEMPTS: 3,
  TIMEOUT: 30000,
  
  MESSAGE_TYPES: {
    TEXT: 'text',
    QUESTION: 'question', 
    ALERT: 'alert',
    SUMMARY: 'summary',
    WELCOME: 'welcome'
  },
  
  URGENCY_LEVELS: {
    1: { label: 'Inmediato', color: '#EF4444', priority: 'critical' },
    2: { label: 'Muy Urgente', color: '#F97316', priority: 'urgent' },
    3: { label: 'Urgente', color: '#EAB308', priority: 'important' },
    4: { label: 'Menos Urgente', color: '#22C55E', priority: 'normal' },
    5: { label: 'No Urgente', color: '#3B82F6', priority: 'low' }
  }
};

console.log('✅ Chat Triaje API servicios cargados');

export default {
  startConversation,
  sendMessage,
  getConversation,
  finalizeConversation,
  getConversationHistory,
  getConversationStats,
  getServiceHealth,
  getApiDocumentation,
  testWatsonConnection,
  interpretErrorCode,
  validateMessage,
  CHAT_CONFIG
};