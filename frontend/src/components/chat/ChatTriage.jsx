// ===============================================
// 💬 CHAT TRIAGE - FRONTEND CORREGIDO COMPLETAMENTE
// frontend/src/components/chat/ChatTriage.jsx
// ===============================================

import { useState, useEffect, useRef } from 'react';
import { 
  Brain, 
  MessageCircle, 
  Shield, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  RefreshCw,
  FileText,
  ArrowDown
} from 'lucide-react';

// Importar componentes del chat
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';

// Importar servicios
import { 
  startConversation, 
  sendMessage, 
  getConversation,
  finalizeConversation,
  getServiceHealth,
  CHAT_CONFIG 
} from '../../services/chatTriageApi';
import { useUser } from '../../context/UserContext';

const ChatTriage = () => {
  const { user } = useUser();
  
  // Estados principales
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState(null);
  const [conversationComplete, setConversationComplete] = useState(false);
  const [finalClassification, setFinalClassification] = useState(null);
  const [initialized, setInitialized] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  
  // 🆕 NUEVOS ESTADOS PARA CONFIRMACIÓN
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [pendingClassification, setPendingClassification] = useState(null);
  
  // Referencias
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);

  // ===============================================
  // 🚀 INICIALIZACIÓN
  // ===============================================
  
  useEffect(() => {
    if (!initialized && user?.id) {
      setInitialized(true);
      initializeChat();
    }
  }, [user, initialized]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const initializeChat = async () => {
    console.log('🚀 INICIANDO CHAT - Usuario:', user?.id);
    
    if (!user?.id) {
      setError('Usuario no identificado. Por favor, inicia sesión.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setMessages([]);
    setConversationComplete(false);
    setFinalClassification(null);
    setShowConfirmation(false);

    try {
      console.log('🚀 Iniciando conversación con Watson...');
      const result = await startConversation(user.id);
      
      console.log('🔍 RESULTADO startConversation:', result);
      
      if (!result.success) {
        throw new Error(result.error || 'Error al iniciar conversación');
      }

      setConversation(result.conversation);

      // ✅ MANEJO CORREGIDO DE CONVERSACIÓN EXISTENTE
      if (result.isExisting) {
        console.log('📚 CONVERSACIÓN EXISTENTE DETECTADA');
        console.log('📚 Conversation ID:', result.conversation.conversationId);
        console.log('📊 Turnos actuales:', result.conversation.conversationTurns);
        
        // 🔧 VERIFICAR SI LA CONVERSACIÓN ESTÁ COMPLETADA
        if (result.conversation.status === 'completed' || result.conversation.conversationTurns >= 6) {
          console.log('⚠️ CONVERSACIÓN YA COMPLETADA - Iniciando nueva automáticamente');
          // Reiniciar para crear nueva conversación
          setInitialized(false);
          return;
        }
        
        setIsLoadingHistory(true);
        
        try {
          console.log('📋 Cargando historial completo...');
          const historyResult = await getConversation(result.conversation.conversationId, {
            includeMessages: true,
            limit: 50
          });
          
          console.log('🔍 HISTORIAL RESULT:', historyResult);
          
          if (historyResult.success && historyResult.messages && historyResult.messages.length > 0) {
            console.log('✅ CARGANDO MENSAJES DEL HISTORIAL:', historyResult.messages.length);
            
            const loadedMessages = historyResult.messages.map((msg, index) => ({
              messageId: msg.messageId || `loaded-${index}-${Date.now()}`,
              content: msg.content || '',
              sender: msg.sender || 'watson',
              messageType: msg.messageType || 'text',
              timestamp: msg.timestamp || new Date().toISOString(),
              extractedInfo: msg.extractedInfo || {},
              urgencyUpdate: msg.urgencyUpdate || null
            }));
            
            setMessages(loadedMessages);
            console.log('✅ Mensajes cargados correctamente');
            
            // Verificar si la conversación está completa
            if (historyResult.conversation && historyResult.conversation.status === 'completed') {
              setConversationComplete(true);
              if (historyResult.conversation.finalClassification) {
                setFinalClassification(historyResult.conversation.finalClassification);
              }
            }
          } else {
            console.log('⚠️ No hay mensajes en el historial o falló');
            setMessages([{
              messageId: `resume-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              content: "¡Hola de nuevo! 👋 Veo que tienes una conversación previa. ¿Cómo te sientes ahora?",
              sender: 'watson',
              messageType: 'welcome',
              timestamp: new Date().toISOString()
            }]);
          }
        } catch (historyError) {
          console.error('❌ Error cargando historial:', historyError);
          setMessages([{
            messageId: `resume-error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            content: "¡Hola de nuevo! 👋 Tuve un problema cargando tu historial, pero podemos continuar. ¿Cómo te sientes?",
            sender: 'watson',
            messageType: 'welcome',
            timestamp: new Date().toISOString()
          }]);
        } finally {
          setIsLoadingHistory(false);
        }
      } else {
        // ✅ NUEVA CONVERSACIÓN
        console.log('✅ NUEVA CONVERSACIÓN - Agregando mensaje de bienvenida');
        if (result.welcomeMessage && result.welcomeMessage.content) {
          setMessages([{
            messageId: result.welcomeMessage.messageId || `welcome-${Date.now()}`,
            content: result.welcomeMessage.content,
            sender: 'watson',
            messageType: 'welcome',
            timestamp: result.welcomeMessage.timestamp || new Date().toISOString()
          }]);
        } else {
          setMessages([{
            messageId: `welcome-default-${Date.now()}`,
            content: "¡Hola! 👋 Soy Watson, tu asistente médico inteligente. ¿Cómo te sientes hoy?",
            sender: 'watson',
            messageType: 'welcome',
            timestamp: new Date().toISOString()
          }]);
        }
      }

      console.log(`✅ Chat inicializado: ${result.conversation.conversationId}`);

    } catch (error) {
      console.error('❌ Error inicializando chat:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // ===============================================
  // 💬 MANEJO DE MENSAJES
  // ===============================================

  const handleSendMessage = async (messageText) => {
    if (!conversation || !messageText.trim() || isTyping || isLoadingHistory || conversationComplete) return;

    const userMessage = {
      messageId: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      content: messageText,
      sender: 'user',
      messageType: 'text',
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);
    setError(null);

    try {
      console.log(`💬 Enviando mensaje: "${messageText.substring(0, 50)}..."`);
      
      const result = await sendMessage(conversation.conversationId, messageText);

      if (!result.success) {
        throw new Error(result.error || 'Error al enviar mensaje');
      }

      const watsonMessage = {
        messageId: `watson-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        content: result.watsonMessage.content,
        sender: 'watson',
        messageType: result.watsonMessage.messageType || 'question',
        timestamp: result.watsonMessage.timestamp || new Date().toISOString()
      };

      console.log('✅ Agregando respuesta de Watson:', watsonMessage.content);
      setMessages(prev => [...prev, watsonMessage]);

      // Actualizar conversación
      if (result.conversation) {
        setConversation(prev => ({
          ...prev,
          ...result.conversation
        }));
      }

      // 🔧 CORRECCIÓN: Manejo de finalización inteligente
      console.log('🔍 VERIFICANDO FINALIZACIÓN:', {
        shouldComplete: result.shouldComplete,
        responseType: result.watson_info?.response_type,
        conversationTurns: result.conversation?.conversationTurns
      });

      // Verificar si es una clasificación Manchester
      const isClassification = result.watson_info?.response_type === 'classification' || 
                               result.watsonMessage.content.match(/NIVEL \d-\w+-\w+/i);

      if (result.shouldComplete || isClassification) {
        console.log('🎯 CLASIFICACIÓN DETECTADA - Mostrando confirmación');
        
        // Extraer clasificación del mensaje
        const classificationMatch = result.watsonMessage.content.match(/NIVEL (\d)-(\w+)-(\w+)/i);
        if (classificationMatch) {
          const classification = {
            level: parseInt(classificationMatch[1]),
            color: classificationMatch[2],
            specialty: classificationMatch[3],
            confidence: 0.9
          };
          
          setPendingClassification(classification);
          setShowConfirmation(true);
        } else {
          // Finalizar automáticamente si no hay clasificación clara
          setTimeout(() => {
            handleConversationComplete();
          }, 2000);
        }
      }

    } catch (error) {
      console.error('❌ Error enviando mensaje:', error);
      
      // 🔧 MANEJO ESPECIAL DE CONVERSACIÓN COMPLETADA
      if (error.response?.status === 400 && 
          (error.response?.data?.code === 'CONVERSATION_COMPLETED' || 
           error.response?.data?.code === 'CONVERSATION_AUTO_COMPLETED')) {
        
        console.log('🏁 CONVERSACIÓN AUTO-COMPLETADA - Finalizando UI');
        
        if (error.response.data.finalClassification) {
          setFinalClassification(error.response.data.finalClassification);
          setPendingClassification(error.response.data.finalClassification);
          setShowConfirmation(true);
        } else {
          setConversationComplete(true);
        }
        
        const completionMessage = {
          messageId: `completion-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          content: `✅ **Evaluación Completada**\n\nTu consulta ha sido procesada exitosamente. El triaje ha sido completado.`,
          sender: 'watson',
          messageType: 'summary',
          timestamp: new Date().toISOString()
        };
        
        setMessages(prev => [...prev, completionMessage]);
        
      } else {
        setError(error.message);
        
        const errorMessage = {
          messageId: `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          content: `Lo siento, tuve un problema técnico. ¿Puedes repetir tu mensaje?`,
          sender: 'watson',
          messageType: 'text',
          timestamp: new Date().toISOString()
        };
        
        setMessages(prev => [...prev, errorMessage]);
      }
      
    } finally {
      setIsTyping(false);
    }
  };

  // ===============================================
  // 🔧 MANEJO DE FINALIZACIÓN Y CONFIRMACIÓN
  // ===============================================

  const handleConfirmClassification = async () => {
    if (!conversation || !pendingClassification) return;

    console.log('✅ CONFIRMANDO CLASIFICACIÓN:', pendingClassification);
    setIsLoading(true);

    try {
      const result = await finalizeConversation(conversation.conversationId, true);
      
      if (result.success) {
        setFinalClassification(pendingClassification);
        setConversationComplete(true);
        setShowConfirmation(false);
        
        const summaryMessage = {
          messageId: `summary-confirmed-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          content: `✅ **Triaje Confirmado y Completado**

**Clasificación Manchester:**
• Nivel ${pendingClassification.level} - ${getLevelLabel(pendingClassification.level)}
• Especialidad: ${pendingClassification.specialty}
• Confianza: ${Math.round(pendingClassification.confidence * 100)}%

📋 Tu registro médico ha sido guardado correctamente.
🏥 **Próximos pasos:** ${getNextStepsRecommendation(pendingClassification.level)}`,
          sender: 'watson',
          messageType: 'summary',
          timestamp: new Date().toISOString()
        };
        
        setMessages(prev => [...prev, summaryMessage]);
        
        console.log('✅ Clasificación confirmada y conversación finalizada');
      }
      
    } catch (error) {
      console.error('❌ Error confirmando clasificación:', error);
      setError('Error al confirmar la clasificación. Inténtalo de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRejectClassification = () => {
    console.log('❌ CLASIFICACIÓN RECHAZADA - Continuando conversación');
    setShowConfirmation(false);
    setPendingClassification(null);
    
    const continueMessage = {
      messageId: `continue-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      content: "Entiendo que la clasificación no te parece correcta. ¿Puedes contarme más detalles sobre tus síntomas?",
      sender: 'watson',
      messageType: 'question',
      timestamp: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, continueMessage]);
  };

  const handleConversationComplete = async () => {
    if (!conversation || conversationComplete) return;

    console.log('✅ Completando conversación automáticamente...');
    setIsLoading(true);

    try {
      const result = await finalizeConversation(conversation.conversationId);
      
      if (result.success) {
        setFinalClassification(result.finalClassification);
        setConversationComplete(true);
        
        const summaryMessage = {
          messageId: `summary-auto-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          content: `✅ **Evaluación Completada**

**Clasificación Manchester:**
• Nivel ${result.finalClassification.level} - ${result.finalClassification.label}
• Especialidad: ${result.finalClassification.specialty}
• Confianza: ${Math.round(result.finalClassification.confidence * 100)}%

📋 Tu registro médico ha sido guardado.`,
          sender: 'watson',
          messageType: 'summary',
          timestamp: new Date().toISOString()
        };
        
        setMessages(prev => [...prev, summaryMessage]);
      }
      
    } catch (error) {
      console.error('❌ Error completando conversación:', error);
      setError('Error al completar la conversación automáticamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleNewConsultation = () => {
    console.log('🆕 INICIANDO NUEVA CONSULTA');
    setInitialized(false);
    setConversation(null);
    setMessages([]);
    setConversationComplete(false);
    setFinalClassification(null);
    setShowConfirmation(false);
    setPendingClassification(null);
    setError(null);
  };

  // ===============================================
  // 🎨 FUNCIONES AUXILIARES
  // ===============================================

  const getLevelLabel = (level) => {
    const labels = {
      1: 'INMEDIATO',
      2: 'MUY URGENTE', 
      3: 'URGENTE',
      4: 'POCO URGENTE',
      5: 'NO URGENTE'
    };
    return labels[level] || 'DESCONOCIDO';
  };

  const getNextStepsRecommendation = (level) => {
    const recommendations = {
      1: 'Diríjase INMEDIATAMENTE a emergencias.',
      2: 'Programa una cita urgente o visita emergencias si empeora.',
      3: 'Programa una cita médica en las próximas 24-48 horas.',
      4: 'Considera programar una cita médica en los próximos días.',
      5: 'Monitorea síntomas. Consulta si persisten o empeoran.'
    };
    return recommendations[level] || 'Consulta con un profesional médico.';
  };

  const getProgressPercentage = () => {
    if (!conversation || conversationComplete) return 100;
    const maxTurns = 6;
    const currentTurns = conversation.conversationTurns || 0;
    return Math.min((currentTurns / maxTurns) * 100, 100);
  };

  const getCurrentPhaseDescription = () => {
    if (conversationComplete) return "Evaluación completada";
    if (!conversation) return "Iniciando...";
    
    const turn = conversation.conversationTurns || 0;
    const phases = [
      "Iniciando conversación",
      "Recopilando síntoma principal", 
      "Revisando antecedentes médicos",
      "Analizando detalles específicos",
      "Evaluando duración e intensidad", 
      "Recopilando síntomas adicionales",
      "Generando clasificación"
    ];
    
    return phases[Math.min(turn, phases.length - 1)];
  };

  // ===============================================
  // 🎨 RENDERIZADO
  // ===============================================

  if (!user) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center space-y-4">
          <Brain className="w-16 h-16 text-indigo-600 mx-auto animate-pulse" />
          <div className="text-xl font-semibold text-gray-700">Cargando usuario...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* =============================================== */}
      {/* 📊 HEADER CON PROGRESO */}
      {/* =============================================== */}
      <div className="bg-white border-b border-indigo-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Brain className="w-10 h-10 text-indigo-600" />
                {conversation && !conversationComplete && (
                  <div className="absolute -top-1 -right-1">
                    <div className="w-4 h-4 bg-green-500 rounded-full animate-pulse"></div>
                  </div>
                )}
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Watson Triaje Médico</h1>
                <p className="text-sm text-gray-600">{getCurrentPhaseDescription()}</p>
              </div>
            </div>
            
            {/* Indicador de progreso */}
            {conversation && !conversationComplete && (
              <div className="flex items-center space-x-3">
                <div className="text-sm text-gray-600">
                  Turno {conversation.conversationTurns || 0}/6
                </div>
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${getProgressPercentage()}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* =============================================== */}
      {/* 💬 ÁREA DE CHAT */}
      {/* =============================================== */}
      <div className="flex-1 flex overflow-hidden">
        {/* Chat principal */}
        <div className="flex-1 flex flex-col">
          <div 
            ref={messagesContainerRef}
            className="flex-1 overflow-y-auto px-4 py-6 space-y-4"
          >
            {/* Estado de carga inicial */}
            {isLoading && messages.length === 0 && (
              <div className="flex items-center justify-center py-12">
                <div className="text-center space-y-4">
                  <RefreshCw className="w-8 h-8 text-indigo-600 mx-auto animate-spin" />
                  <div className="text-gray-600">Iniciando conversación con Watson...</div>
                </div>
              </div>
            )}

            {/* Carga de historial */}
            {isLoadingHistory && (
              <div className="flex items-center justify-center py-8">
                <div className="text-center space-y-2">
                  <FileText className="w-6 h-6 text-indigo-600 mx-auto animate-pulse" />
                  <div className="text-sm text-gray-600">Cargando historial médico...</div>
                </div>
              </div>
            )}

            {/* Mensajes del chat */}
            {messages.map((message) => (
              <ChatMessage 
                key={message.messageId} 
                message={message}
                isTyping={isTyping && message.sender === 'watson'}
              />
            ))}

            {/* Indicador de escritura */}
            {isTyping && (
              <div className="flex items-center space-x-2 text-gray-500">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                </div>
                <span className="text-sm">Watson está escribiendo...</span>
              </div>
            )}

            {/* Mensaje de error */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  <div className="text-red-800 text-sm">{error}</div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* =============================================== */}
          {/* ⌨️ ÁREA DE ENTRADA */}
          {/* =============================================== */}
          <div className="border-t border-indigo-200 bg-white">
            <div className="max-w-4xl mx-auto p-4">
              {conversationComplete ? (
                <div className="text-center space-y-4">
                  <div className="flex items-center justify-center space-x-2 text-green-600">
                    <CheckCircle className="w-6 h-6" />
                    <span className="font-semibold">Consulta completada exitosamente</span>
                  </div>
                  <button
                    onClick={handleNewConsultation}
                    className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-semibold"
                  >
                    <MessageCircle className="w-5 h-5 inline mr-2" />
                    Nueva Consulta
                  </button>
                </div>
              ) : (
                <ChatInput 
                  onSendMessage={handleSendMessage}
                  disabled={isLoading || isTyping || isLoadingHistory}
                  placeholder={isLoadingHistory ? "Cargando historial..." : "Describe tus síntomas..."}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* =============================================== */}
      {/* 🎯 MODAL DE CONFIRMACIÓN */}
      {/* =============================================== */}
      {showConfirmation && pendingClassification && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto">
                <Shield className="w-8 h-8 text-indigo-600" />
              </div>
              
              <h3 className="text-xl font-bold text-gray-900">
                Confirmar Clasificación
              </h3>
              
              <div className="bg-gray-50 rounded-lg p-4 text-left">
                <h4 className="font-semibold text-gray-800 mb-2">Clasificación Manchester:</h4>
                <div className="space-y-1 text-sm">
                  <div><span className="font-medium">Nivel:</span> {pendingClassification.level} - {getLevelLabel(pendingClassification.level)}</div>
                  <div><span className="font-medium">Especialidad:</span> {pendingClassification.specialty}</div>
                  <div><span className="font-medium">Confianza:</span> {Math.round(pendingClassification.confidence * 100)}%</div>
                </div>
              </div>
              
              <p className="text-gray-600 text-sm">
                ¿Esta clasificación refleja correctamente tu condición actual?
              </p>
              
              <div className="flex space-x-3">
                <button
                  onClick={handleConfirmClassification}
                  disabled={isLoading}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold disabled:opacity-50"
                >
                  {isLoading ? 'Confirmando...' : 'Sí, es correcto'}
                </button>
                <button
                  onClick={handleRejectClassification}
                  disabled={isLoading}
                  className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-semibold disabled:opacity-50"
                >
                  Necesito más análisis
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatTriage;



//pensar sobre el enfoque. 1 chatbot conversacional o 2 formulario estructurado inteligente.