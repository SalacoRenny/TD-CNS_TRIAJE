// ===============================================
// 🗣️ CONVERSATION SERVICE - GESTIÓN INTELIGENTE DE SESIONES + DEBUGS
// backend/src/services/conversationService.js
// ===============================================

import { v4 as uuidv4 } from 'uuid';
import Conversation from '../models/Conversation.js';
import ChatMessage from '../models/ChatMessage.js';
import User from '../models/User.js';
import SymptomRecord from '../models/SymptomRecord.js';

/**
 * Servicio para gestión completa de conversaciones de triaje
 */
class ConversationService {
  
  /**
   * 🔧 CORRECCIÓN CRÍTICA: Iniciar nueva conversación con gestión inteligente
   * @param {string} userId - ID del usuario
   * @returns {Promise<Object>} Nueva conversación creada
   */
  async startNewConversation(userId) {
    try {
      console.log(`🗣️ Iniciando nueva conversación para usuario: ${userId}`);
      
      // 🔍 DEBUG: Detección de Conversación Existente
      console.log('🔍 === DEBUG CONVERSACIÓN INTELIGENTE ===');
      console.log('🔄 Verificando conversación activa para userId:', userId);
      
      // 🔧 CORRECCIÓN 1: Verificar conversación activa Y su estado
      const activeConversation = await Conversation.findActiveByUser(userId);
      
      console.log('🔄 Resultado verificación conversación activa:', {
        userId,
        activeFound: !!activeConversation,
        activeId: activeConversation?.conversationId || null,
        activeStatus: activeConversation?.status || null,
        activeStartedAt: activeConversation?.startedAt || null,
        isCompleted: activeConversation?.status === 'completed',
        hasFinalClassification: !!activeConversation?.finalClassification,
        conversationTurns: activeConversation?.watsonMetadata?.conversationTurns || 0
      });
      
      // 🔧 NUEVA LÓGICA: Verificar si conversación activa está realmente activa
      if (activeConversation) {
        const turnos = activeConversation.watsonMetadata?.conversationTurns || 0;
        const hasClassification = !!activeConversation.finalClassification;
        const isCompleted = activeConversation.status === 'completed';
        
        console.log('🧐 Análisis conversación existente:', {
          turnos,
          hasClassification,
          isCompleted,
          shouldFinalize: turnos >= 6 || hasClassification || isCompleted
        });
        
        // 🔧 CORRECCIÓN CRÍTICA: Auto-finalizar conversaciones que deberían estar completadas
        if (turnos >= 6 || hasClassification || isCompleted) {
          console.log('⚠️ CONVERSACIÓN DEBE SER FINALIZADA - Auto-finalizando...');
          
          try {
            // Finalizar conversación automáticamente
            if (activeConversation.status === 'active') {
              const autoClassification = hasClassification ? 
                activeConversation.finalClassification : 
                await this.generateAutoClassification(activeConversation);
              
              await activeConversation.finalize(autoClassification);
              console.log('✅ Conversación auto-finalizada exitosamente');
            }
            
            // Crear nueva conversación después de finalizar
            console.log('🆕 Creando nueva conversación después de auto-finalización...');
            return await this.createFreshConversation(userId);
            
          } catch (finalizeError) {
            console.error('❌ Error auto-finalizando conversación:', finalizeError);
            // Continuar con nueva conversación aunque falle la finalización
            return await this.createFreshConversation(userId);
          }
        }
        
        // 🔧 NUEVA CONDICIÓN: Solo reanudar si realmente está activa y válida
        if (turnos < 6 && !hasClassification && !isCompleted) {
          console.log(`✅ REANUDANDO conversación válida con ${turnos} turnos`);
          console.log('🔍 === FIN DEBUG CONVERSACIÓN INTELIGENTE ===');
          return {
            conversation: activeConversation,
            isExisting: true,
            welcomeMessage: this.generateResumeMessage(activeConversation)
          };
        }
      }

      // 🔧 CORRECCIÓN: Crear nueva conversación
      console.log('🆕 No hay conversación activa válida - Creando nueva...');
      console.log('🔍 === FIN DEBUG CONVERSACIÓN INTELIGENTE ===');
      return await this.createFreshConversation(userId);

    } catch (error) {
      console.error('❌ Error iniciando conversación:', error);
      console.log('🔍 === FIN DEBUG CONVERSACIÓN INTELIGENTE (ERROR) ===');
      throw new Error('Error al iniciar conversación de triaje');
    }
  }

  /**
   * 🆕 NUEVO: Crear conversación completamente nueva
   */
  async createFreshConversation(userId) {
    // Buscar conversación anterior para contexto
    console.log('📚 Verificando historial previo...');
    const previousConversation = await Conversation.findOne({ userId })
      .sort({ startedAt: -1 });

    console.log('📚 Resultado verificación historial previo:', {
      userId,
      previousFound: !!previousConversation,
      previousId: previousConversation?.conversationId || null,
      previousStatus: previousConversation?.status || null,
      previousDate: previousConversation?.startedAt || null,
      willBeFollowUp: !!previousConversation
    });

    // Obtener información del usuario
    const user = await User.findOne({ userId }).select('name dateOfBirth gender');
    console.log('👤 Información del usuario obtenida:', {
      userFound: !!user,
      userName: user?.name || 'No disponible',
      userAge: this.calculateAge(user?.dateOfBirth) || 'No disponible'
    });

    // Crear nueva conversación
    const conversationId = uuidv4();
    const newConversation = new Conversation({
      conversationId,
      userId,
      previousConversationId: previousConversation?.conversationId || null,
      isFollowUpConversation: !!previousConversation,
      conversationSequence: previousConversation ? 
        (previousConversation.conversationSequence + 1) : 1,
      patientAge: this.calculateAge(user?.dateOfBirth),
      patientGender: user?.gender || '',
      // 🔧 CORRECCIÓN: Inicializar turnos en 0
      watsonMetadata: {
        totalTokensUsed: 0,
        totalProcessingTime: 0,
        modelVersion: 'llama-3-3-70b-instruct',
        conversationTurns: 0 // ← IMPORTANTE: Empezar en 0
      }
    });

    await newConversation.save();

    console.log(`✅ Nueva conversación creada: ${conversationId}`);
    
    // Crear mensaje de bienvenida
    const welcomeMessage = await this.createWelcomeMessage(
      conversationId, 
      userId, 
      user?.name,
      !!previousConversation
    );

    return {
      conversation: newConversation,
      isExisting: false,
      welcomeMessage,
      hasHistory: !!previousConversation
    };
  }

  /**
   * 🔧 CORRECCIÓN CRÍTICA: Agregar mensaje SIN incremento duplicado de turnos
   */
  async addMessage(conversationId, sender, content, messageType = 'text', additionalData = {}) {
    try {
      console.log('💬 === DEBUG AGREGAR MENSAJE CORREGIDO ===');
      console.log('📝 Agregando mensaje:', {
        conversationId,
        sender,
        messageType,
        contentLength: content?.length || 0,
        hasAdditionalData: Object.keys(additionalData).length > 0
      });

      const conversation = await Conversation.findOne({ conversationId });
      if (!conversation) {
        throw new Error('Conversación no encontrada');
      }

      console.log('📊 Estado conversación ANTES de agregar mensaje:', {
        status: conversation.status,
        currentTurns: conversation.watsonMetadata.conversationTurns,
        lastMessageAt: conversation.lastMessageAt,
        urgencyLevel: conversation.currentUrgencyLevel
      });

      const messageId = uuidv4();
      const messageSequence = await ChatMessage.countDocuments({ conversationId }) + 1;

      const newMessage = new ChatMessage({
        messageId,
        conversationId,
        userId: conversation.userId,
        sender,
        content,
        messageType,
        messageSequence,
        ...additionalData
      });

      await newMessage.save();

      // 🔧 CORRECCIÓN CRÍTICA: Solo actualizar lastMessageAt, NO incrementar turnos aquí
      // Los turnos se manejan ÚNICAMENTE en watsonChatService.js
      conversation.lastMessageAt = new Date();
      
      console.log('🚫 NO INCREMENTANDO TURNOS - Se maneja en watsonChatService');
      console.log('📊 Estado conversación DESPUÉS de agregar mensaje:', {
        status: conversation.status,
        currentTurns: conversation.watsonMetadata.conversationTurns, // Sin cambios
        lastMessageAt: conversation.lastMessageAt
      });
      
      await conversation.save();

      console.log(`💬 Mensaje agregado exitosamente: ${messageId} (${sender})`);
      console.log('💬 === FIN DEBUG AGREGAR MENSAJE CORREGIDO ===');
      
      return newMessage;

    } catch (error) {
      console.error('❌ Error agregando mensaje:', error);
      console.log('💬 === FIN DEBUG AGREGAR MENSAJE CORREGIDO (ERROR) ===');
      throw new Error('Error al agregar mensaje');
    }
  }

  /**
   * 🆕 NUEVO: Generar clasificación automática para conversaciones largas
   */
  async generateAutoClassification(conversation) {
    const symptoms = conversation.collectedSymptoms;
    const temperature = parseFloat(conversation.collectedTemperature) || 0;
    
    // Lógica simple para auto-clasificación
    let level = 5;
    if (temperature >= 39.5 || symptoms.some(s => s.includes('dolor de pecho'))) level = 2;
    else if (temperature >= 38.5 || symptoms.length >= 3) level = 3;
    else if (temperature >= 37.5 || symptoms.length >= 1) level = 4;

    const specialty = this.determineSpecialtyFromSymptoms(symptoms);
    
    return {
      level,
      color: this.getLevelColor(level),
      label: this.getLevelLabel(level),
      bgColor: this.getLevelBgColor(level),
      specialty: specialty,
      source: 'auto_finalization',
      confidence: 0.6
    };
  }

  /**
   * 🔧 MÉTODO AUXILIAR: Determinar especialidad por síntomas
   */
  determineSpecialtyFromSymptoms(symptoms) {
    const specialtyMap = {
      'dolor de pecho': 'Cardiología',
      'dolor de cabeza': 'Neurología', 
      'dolor de estómago': 'Gastroenterología',
      'tos': 'Neumología',
      'fiebre': 'Medicina Interna',
      'mareos': 'Neurología',
      'náuseas': 'Gastroenterología',
      'vómito': 'Gastroenterología'
    };

    for (const symptom of symptoms) {
      if (specialtyMap[symptom]) {
        return specialtyMap[symptom];
      }
    }
    return 'Medicina General';
  }

  getLevelColor(level) {
    const colors = { 1: '#EF4444', 2: '#F97316', 3: '#EAB308', 4: '#22C55E', 5: '#3B82F6' };
    return colors[level] || colors[5];
  }

  getLevelLabel(level) {
    const labels = { 1: 'Inmediato', 2: 'Muy Urgente', 3: 'Urgente', 4: 'Menos Urgente', 5: 'No Urgente' };
    return labels[level] || labels[5];
  }

  getLevelBgColor(level) {
    const colors = { 1: '#FEF2F2', 2: '#FFF7ED', 3: '#FEFCE8', 4: '#F0FDF4', 5: '#EFF6FF' };
    return colors[level] || colors[5];
  }

  // ===============================================
  // 🔧 MÉTODOS EXISTENTES MANTENIDOS
  // ===============================================

  async getConversationMessages(conversationId, limit = 50) {
    try {
      const messages = await ChatMessage.getConversationMessages(conversationId, limit);
      
      console.log('📋 === DEBUG OBTENER MENSAJES ===');
      console.log('📨 Mensajes obtenidos:', {
        conversationId,
        totalMessages: messages.length,
        limit,
        userMessages: messages.filter(m => m.sender === 'user').length,
        watsonMessages: messages.filter(m => m.sender === 'watson').length
      });
      console.log('📋 === FIN DEBUG OBTENER MENSAJES ===');
      
      return messages;
    } catch (error) {
      console.error('❌ Error obteniendo mensajes:', error);
      throw new Error('Error al obtener mensajes');
    }
  }

  async updateConversationUrgency(conversationId, urgencyLevel, specialty, reason) {
    try {
      console.log('🚨 === DEBUG ACTUALIZAR URGENCIA ===');
      
      const conversation = await Conversation.findOne({ conversationId });
      if (!conversation) {
        throw new Error('Conversación no encontrada');
      }

      const previousLevel = conversation.currentUrgencyLevel;
      const previousSpecialty = conversation.currentSpecialty;
      
      console.log('🚨 Actualizando urgencia:', {
        conversationId,
        nivelAnterior: previousLevel,
        nivelNuevo: urgencyLevel,
        especialidadAnterior: previousSpecialty,
        especialidadNueva: specialty,
        razon: reason,
        esEscalado: urgencyLevel < previousLevel
      });

      await conversation.updateUrgency(urgencyLevel, specialty, reason);

      if (urgencyLevel < previousLevel) {
        console.log('⚠️ ESCALADO DE URGENCIA DETECTADO - Creando mensaje de alerta');
        await this.addMessage(
          conversationId,
          'watson',
          this.generateUrgencyAlertMessage(urgencyLevel, specialty, reason),
          'alert',
          {
            urgencyUpdate: true,
            urgencyChanged: {
              previousLevel,
              newLevel: urgencyLevel,
              reason
            },
            displayProperties: {
              priority: urgencyLevel <= 2 ? 'critical' : 'urgent',
              requiresAttention: true
            }
          }
        );
      }

      console.log(`🚨 Urgencia actualizada exitosamente: ${previousLevel} → ${urgencyLevel}`);
      console.log('🚨 === FIN DEBUG ACTUALIZAR URGENCIA ===');
      
      return conversation;

    } catch (error) {
      console.error('❌ Error actualizando urgencia:', error);
      console.log('🚨 === FIN DEBUG ACTUALIZAR URGENCIA (ERROR) ===');
      throw new Error('Error al actualizar urgencia');
    }
  }

  async finalizeConversation(conversationId, finalClassification) {
    try {
      console.log('✅ === DEBUG FINALIZAR CONVERSACIÓN ===');
      
      const conversation = await Conversation.findOne({ conversationId });
      if (!conversation) {
        throw new Error('Conversación no encontrada');
      }

      console.log('✅ Finalizando conversación:', {
        conversationId,
        estado: conversation.status,
        turnos: conversation.watsonMetadata.conversationTurns,
        sintomas: conversation.collectedSymptoms,
        clasificacionFinal: finalClassification
      });

      const conversationSummary = await this.generateConversationSummary(conversationId);
      conversation.conversationSummary = conversationSummary;

      await conversation.finalize(finalClassification);

      const symptomRecord = await this.createSymptomRecordFromConversation(conversation);

      console.log('📋 SymptomRecord creado:', {
        recordId: symptomRecord._id,
        sintomas: symptomRecord.symptoms,
        metodoClasificacion: symptomRecord.classification_method,
        conversationId: symptomRecord.conversation_id
      });

      await this.addMessage(
        conversationId,
        'watson',
        this.generateFinalSummaryMessage(finalClassification, symptomRecord._id),
        'summary',
        {
          displayProperties: {
            priority: finalClassification.level <= 2 ? 'critical' : 'normal'
          }
        }
      );

      console.log(`✅ Conversación finalizada exitosamente: ${conversationId}`);
      console.log('✅ === FIN DEBUG FINALIZAR CONVERSACIÓN ===');
      
      return {
        conversation,
        symptomRecord,
        summary: conversationSummary
      };

    } catch (error) {
      console.error('❌ Error finalizando conversación:', error);
      console.log('✅ === FIN DEBUG FINALIZAR CONVERSACIÓN (ERROR) ===');
      throw new Error('Error al finalizar conversación');
    }
  }

  async getUserConversationHistory(userId, limit = 5) {
    try {
      console.log('📚 === DEBUG OBTENER HISTORIAL ===');
      console.log('📖 Obteniendo historial para usuario:', userId, 'límite:', limit);
      
      const conversations = await Conversation.getUserConversationHistory(userId, limit);
      
      console.log('📚 Historial obtenido:', {
        userId,
        totalConversaciones: conversations.length,
        conversacionesActivas: conversations.filter(c => c.status === 'active').length,
        conversacionesCompletadas: conversations.filter(c => c.status === 'completed').length,
        conversacionIds: conversations.map(c => c.conversationId)
      });

      if (conversations.length > 0) {
        console.log('📋 Última conversación:', {
          id: conversations[0].conversationId,
          fecha: conversations[0].startedAt,
          estado: conversations[0].status,
          urgencia: conversations[0].currentUrgencyLevel
        });
      }
      
      console.log('📚 === FIN DEBUG OBTENER HISTORIAL ===');
      
      return conversations;
    } catch (error) {
      console.error('❌ Error obteniendo historial:', error);
      console.log('📚 === FIN DEBUG OBTENER HISTORIAL (ERROR) ===');
      throw new Error('Error al obtener historial');
    }
  }

  extractMedicalInfo(message) {
    console.log('🔬 === DEBUG EXTRAER INFO MÉDICA ===');
    console.log('📝 Analizando mensaje:', message?.substring(0, 100) + '...');
    
    const extracted = {
      symptoms: [],
      conditions: [],
      vitalSigns: {},
      timeFactors: {},
      painLevel: null
    };

    const text = message.toLowerCase();

    // 🔧 PATRONES EXPANDIDOS para mejor detección
    const symptomPatterns = [
      { pattern: /dolor de (cabeza|pecho|estómago|garganta|espalda|torácico)/g, type: 'dolor' },
      { pattern: /dolor torácico|dolor en el pecho/g, type: 'dolor de pecho' },
      { pattern: /fiebre|temperatura|calor/g, type: 'fiebre' },
      { pattern: /tos|toser/g, type: 'tos' },
      { pattern: /náuseas|ganas de vomitar/g, type: 'náuseas' },
      { pattern: /vómito|vomité|vomitar/g, type: 'vómito' },
      { pattern: /mareos|mareado/g, type: 'mareos' },
      { pattern: /dificultad para respirar|falta de aire|disnea/g, type: 'disnea' },
      { pattern: /sudoración|sudor|transpirando/g, type: 'sudoración' },
      { pattern: /irradia|se extiende/g, type: 'irradiación' }
    ];

    symptomPatterns.forEach(({ pattern, type }) => {
      if (pattern.test(text)) {
        extracted.symptoms.push(type);
      }
    });

    // Extraer nivel de dolor
    const painMatch = text.match(/dolor.*?(\d+).*?(de|\/).*?10|(\d+).*?(de|\/).*?10.*?dolor/);
    if (painMatch) {
      extracted.painLevel = parseInt(painMatch[1] || painMatch[3]);
    }

    // Extraer temperatura
    const tempMatch = text.match(/(\d{2,3}\.?\d?).*?°?c?/i);
    if (tempMatch && parseFloat(tempMatch[1]) > 35 && parseFloat(tempMatch[1]) < 45) {
      extracted.vitalSigns.temperature = tempMatch[1];
    }

    if (/hace.*?(hora|día|semana|mes)/i.test(text)) {
      const timeMatch = text.match(/hace.*?(\d+).*?(hora|día|semana|mes)/i);
      if (timeMatch) {
        extracted.timeFactors.duration = `${timeMatch[1]} ${timeMatch[2]}${timeMatch[1] > 1 ? 's' : ''}`;
      }
    }

    console.log('🔬 Información extraída:', {
      sintomas: extracted.symptoms,
      nivelDolor: extracted.painLevel,
      temperatura: extracted.vitalSigns.temperature,
      duracion: extracted.timeFactors.duration
    });
    console.log('🔬 === FIN DEBUG EXTRAER INFO MÉDICA ===');

    return extracted;
  }

  // ===============================================
  // 🔧 MÉTODOS AUXILIARES
  // ===============================================

  async createWelcomeMessage(conversationId, userId, userName, hasHistory) {
    console.log('👋 === DEBUG MENSAJE BIENVENIDA ===');
    console.log('👋 Creando mensaje de bienvenida:', {
      conversationId,
      userId,
      userName: userName || 'Sin nombre',
      hasHistory
    });
    
    const welcomeContent = hasHistory ?
      `¡Hola de nuevo${userName ? `, ${userName}` : ''}! 👋 Soy Watson, tu asistente médico inteligente. Veo que has consultado antes. ¿Cómo te sientes hoy?` :
      `¡Hola${userName ? `, ${userName}` : ''}! 👋 Soy Watson, tu asistente médico inteligente. Estoy aquí para ayudarte con una evaluación inicial de tus síntomas. ¿Qué te está molestando hoy?`;

    console.log('👋 Mensaje de bienvenida generado:', welcomeContent);
    console.log('👋 === FIN DEBUG MENSAJE BIENVENIDA ===');

    return await this.addMessage(
      conversationId,
      'watson',
      welcomeContent,
      'welcome'
    );
  }

  generateResumeMessage(conversation) {
    return `¡Hola de nuevo! 👋 Tienes una conversación activa iniciada ${this.formatTimeAgo(conversation.startedAt)}. ¿Quieres continuar donde lo dejamos o prefieres empezar una nueva evaluación?`;
  }

  generateUrgencyAlertMessage(level, specialty, reason) {
    const urgencyLabels = {
      1: { label: 'CRÍTICO', icon: '🚨', color: 'ROJO' },
      2: { label: 'MUY URGENTE', icon: '⚠️', color: 'NARANJA' },
      3: { label: 'URGENTE', icon: '🟡', color: 'AMARILLO' }
    };

    const urgency = urgencyLabels[level] || urgencyLabels[3];
    
    return `${urgency.icon} **ATENCIÓN ${urgency.label}**\n\n` +
           `He detectado síntomas que requieren evaluación en **${specialty}**.\n\n` +
           `**Nivel ${level} - ${urgency.color}**\n` +
           `Razón: ${reason}\n\n` +
           (level <= 2 ? '🏥 **Recomiendo buscar atención médica inmediata.**' : 
                        '📝 **Programa una cita médica pronto.**');
  }

  generateFinalSummaryMessage(classification, recordId) {
    return `✅ **Evaluación Completada**\n\n` +
           `**Clasificación:** Nivel ${classification.level} - ${classification.specialty}\n` +
           `**Confianza:** ${Math.round(classification.confidence * 100)}%\n\n` +
           `📋 Tu registro médico ha sido guardado y estará disponible para el personal médico.\n\n` +
           `🏥 **Próximos pasos:** ${this.getNextStepsRecommendation(classification.level)}`;
  }

  async generateConversationSummary(conversationId) {
    const messages = await ChatMessage.find({ conversationId, sender: 'user' })
      .sort({ messageSequence: 1 });
    
    const conversation = await Conversation.findOne({ conversationId });
    
    let summary = `Paciente consultó por: ${conversation.chiefComplaint || 'síntomas múltiples'}.\n`;
    
    if (conversation.collectedSymptoms.length > 0) {
      summary += `Síntomas reportados: ${conversation.collectedSymptoms.join(', ')}.\n`;
    }
    
    if (conversation.collectedTemperature) {
      summary += `Temperatura: ${conversation.collectedTemperature}°C.\n`;
    }
    
    summary += `Conversación de ${messages.length} intercambios. `;
    summary += `Clasificación final: Nivel ${conversation.currentUrgencyLevel} - ${conversation.currentSpecialty}.`;
    
    return summary;
  }

  async createSymptomRecordFromConversation(conversation) {
    console.log('📋 === DEBUG CREAR SYMPTOM RECORD ===');
    console.log('📋 Creando SymptomRecord desde conversación:', {
      conversationId: conversation.conversationId,
      userId: conversation.userId,
      sintomas: conversation.collectedSymptoms,
      temperatura: conversation.collectedTemperature,
      clasificacion: conversation.finalClassification
    });
    
    const symptomRecord = new SymptomRecord({
      userId: conversation.userId,
      symptoms: conversation.collectedSymptoms,
      baseConditions: conversation.collectedConditions,
      notes: conversation.conversationSummary,
      temperature: conversation.collectedTemperature,
      timestamp: new Date().toLocaleString('es-BO'),
      
      sessionId: conversation.conversationId,
      classification_method: 'watson_chat',
      final_classification: conversation.finalClassification,
      watson_response: {
        conversation_based: true,
        total_tokens: conversation.watsonMetadata.totalTokensUsed,
        conversation_turns: conversation.watsonMetadata.conversationTurns
      },
      processing_time_ms: conversation.watsonMetadata.totalProcessingTime,
      confidence_score: conversation.finalClassification.confidence,
      
      conversation_id: conversation.conversationId,
      conversation_turns: conversation.watsonMetadata.conversationTurns,
      had_historical_context: conversation.isFollowUpConversation,
      historical_consultations_count: conversation.conversationSequence - 1,
      conversation_summary: conversation.conversationSummary
    });

    await symptomRecord.save();
    
    conversation.linkedSymptomRecordId = symptomRecord._id;
    await conversation.save();
    
    console.log('📋 SymptomRecord creado exitosamente:', symptomRecord._id);
    console.log('📋 === FIN DEBUG CREAR SYMPTOM RECORD ===');
    
    return symptomRecord;
  }

  calculateAge(dateOfBirth) {
    if (!dateOfBirth) return '';
    const today = new Date();
    const birth = new Date(dateOfBirth);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age.toString();
  }

  formatTimeAgo(date) {
    const now = new Date();
    const diff = now - new Date(date);
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `hace ${days} día${days > 1 ? 's' : ''}`;
    if (hours > 0) return `hace ${hours} hora${hours > 1 ? 's' : ''}`;
    if (minutes > 0) return `hace ${minutes} minuto${minutes > 1 ? 's' : ''}`;
    return 'hace un momento';
  }

  getNextStepsRecommendation(level) {
    const recommendations = {
      1: 'Busca atención médica INMEDIATA. Dirígete a emergencias.',
      2: 'Programa una cita urgente o visita emergencias si empeora.',
      3: 'Programa una cita médica en las próximas 24-48 horas.',
      4: 'Considera programar una cita médica en los próximos días.',
      5: 'Monitorea síntomas. Consulta si persisten o empeoran.'
    };
    return recommendations[level] || recommendations[5];
  }
}

export default new ConversationService();