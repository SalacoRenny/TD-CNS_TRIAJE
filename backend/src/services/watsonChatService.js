// ===============================================
// 🧠 WATSON CHAT SERVICE - FLUJO ESTRUCTURADO + VALIDACIÓN MÉDICA + DEBUGS
// backend/src/services/watsonChatService.js
// ===============================================

import watsonController from '../controllers/watsonController.js';
import conversationService from './conversationService.js';
import sessionService from './sessionService.js';
import Conversation from '../models/Conversation.js';
import ChatMessage from '../models/ChatMessage.js';

/**
 * Servicio especializado en Watson IA para conversaciones
 */
class WatsonChatService {

  // ===============================================
  // 🆕 FASES DE CONVERSACIÓN ESTRUCTURADA
  // ===============================================
  getConversationPhases() {
    return {
      GREETING: 0,           // Turno 1: Saludo inicial + síntoma
      MEDICAL_HISTORY: 1,    // Turno 2: Antecedentes médicos
      SYMPTOM_COLLECTION: 2, // Turno 3: Detalles del síntoma
      DETAIL_INQUIRY: 3,     // Turno 4: Duración/intensidad
      FINAL_ASSESSMENT: 4,   // Turno 5: Síntomas adicionales
      CLASSIFICATION: 5      // Turno 6: Clasificación Manchester final
    };
  }

  /**
   * 🔧 CORRECCIÓN CRÍTICA: Determinar fase con flujo estricto de 6 turnos
   */
  determineConversationPhase(conversationTurns, hasEmergencySymptoms = false) {
    const phases = this.getConversationPhases();

    console.log('🎯 === DEBUG FASES ESTRUCTURADAS ===');
    console.log('📊 Turno actual:', conversationTurns);
    console.log('🚨 Emergencia detectada:', hasEmergencySymptoms);

    // 🔧 EMERGENCIA: Acelerar pero mantener flujo mínimo
    if (hasEmergencySymptoms && conversationTurns >= 3) {
      console.log('🚨 EMERGENCIA - ACELERAR A CLASIFICACIÓN');
      return phases.CLASSIFICATION;
    }

    // 🔧 FLUJO ESTRICTO: 6 turnos según conversación anterior
    if (conversationTurns === 1) {
      console.log('✅ TURNO 1: SALUDO + SÍNTOMA PRINCIPAL');
      return phases.GREETING;
    }
    
    if (conversationTurns === 2) {
      console.log('✅ TURNO 2: ANTECEDENTES MÉDICOS');
      return phases.MEDICAL_HISTORY;
    }
    
    if (conversationTurns === 3) {
      console.log('✅ TURNO 3: DETALLES DEL SÍNTOMA');
      return phases.SYMPTOM_COLLECTION;
    }
    
    if (conversationTurns === 4) {
      console.log('✅ TURNO 4: DURACIÓN/INTENSIDAD');
      return phases.DETAIL_INQUIRY;
    }
    
    if (conversationTurns === 5) {
      console.log('✅ TURNO 5: SÍNTOMAS ADICIONALES');
      return phases.FINAL_ASSESSMENT;
    }
    
    // TURNO 6+: CLASIFICAR AUTOMÁTICAMENTE
    console.log('🎯 TURNO 6+: CLASIFICACIÓN AUTOMÁTICA');
    console.log('🎯 === FIN DEBUG FASES ESTRUCTURADAS ===');
    return phases.CLASSIFICATION;
  }

  /**
   * 🔧 CORRECCIÓN CRÍTICA: Validación médica antes de procesar
   */
  isValidMedicalInput(message) {
    const text = message.toLowerCase().trim();
    
    // 🔧 VALIDACIÓN MÉDICA PROFESIONAL
    const medicalKeywords = [
      // Síntomas físicos
      'dolor', 'duele', 'molestia', 'malestar',
      'fiebre', 'temperatura', 'calor',
      'náuseas', 'vómito', 'vomité', 'mareos',
      'tos', 'respirar', 'aire', 'pecho',
      'cabeza', 'estómago', 'garganta', 'espalda',
      'cansancio', 'fatiga', 'debilidad',
      'sangre', 'sangrado', 'hinchazón',
      'picazón', 'rash', 'erupciones',
      
      // Condiciones y síntomas específicos
      'diabetes', 'hipertensión', 'asma',
      'alergia', 'medicamento', 'pastilla',
      'operación', 'cirugía', 'hospital',
      'doctor', 'médico', 'consulta',
      
      // Descriptores médicos
      'intenso', 'fuerte', 'leve', 'constante',
      'intermitente', 'empeora', 'mejora',
      'desde', 'hace', 'tiempo', 'días', 'horas',
      
      // Emergencias
      'urgente', 'grave', 'crítico',
      'inconsciente', 'desmayo', 'convulsión'
    ];
    
    // ❌ RECHAZAR saludos simples y respuestas no médicas
    const invalidPatterns = [
      /^(hola|hi|hello|buenas|buenos)$/i,
      /^(sí|si|no|ok|bien|mal)$/i,
      /^[a-z]$/i, // Una sola letra
      /^(gracias|ok|vale)$/i,
      /^(adiós|chao|bye)$/i
    ];
    
    // Verificar patrones inválidos
    if (invalidPatterns.some(pattern => pattern.test(text))) {
      console.log('❌ ENTRADA INVÁLIDA:', text);
      return false;
    }
    
    // Verificar que contenga al menos una palabra médica
    const hasmedicalContent = medicalKeywords.some(keyword => 
      text.includes(keyword)
    );
    
    // O que sea una descripción más larga (probablemente médica)
    const isDescriptive = text.split(' ').length >= 3;
    
    const isValid = hasmedicalContent || isDescriptive;
    
    console.log('🔍 VALIDACIÓN MÉDICA:', {
      mensaje: text.substring(0, 50),
      tieneContenidoMedico: hasmedicalContent,
      esDescriptivo: isDescriptive,
      esValido: isValid
    });
    
    return isValid;
  }

  /**
   * 🔧 CORRECCIÓN CRÍTICA: Procesar mensaje con validación y control de turnos
   */
  async processUserMessage(conversationId, userMessage, userId) {
    const startTime = Date.now();
    
    try {
      console.log(`🧠 Procesando mensaje con Watson: ${conversationId}`);
      
      // 🔧 VALIDACIÓN MÉDICA ANTES DE PROCESAR
      if (!this.isValidMedicalInput(userMessage)) {
        console.log('❌ MENSAJE NO VÁLIDO - Solicitando información médica');
        return {
          watsonMessage: "Entiendo que quieres saludar, pero necesito que me cuentes sobre tus síntomas o molestias para poder ayudarte. ¿Qué te está causando malestar hoy?",
          urgencyUpdate: null,
          extractedInfo: { symptoms: [], conditions: [], vitalSigns: {}, timeFactors: {}, painLevel: null },
          nextQuestions: ["¿Tienes algún dolor o molestia?", "¿Cómo te sientes físicamente?"],
          conversationComplete: false,
          processingTime: Date.now() - startTime,
          tokensUsed: 0,
          responseType: 'validation_request',
          conversationPhase: 0,
          hasHistoricalContext: false
        };
      }

      // Obtener conversación y contexto
      const conversation = await Conversation.findOne({ conversationId });
      if (!conversation) {
        throw new Error('Conversación no encontrada');
      }

      // 🆕 CONSTRUIR CONTEXTO HISTÓRICO DEL PACIENTE
      console.log(`📚 Construyendo contexto histórico para usuario: ${userId || conversation.userId}`);
      const actualUserId = userId || conversation.userId;
      
      console.log('🧠 === DEBUG MEMORIA CONTEXTUAL ===');
      console.log('📚 Construyendo contexto histórico para usuario:', actualUserId);
      
      const historicalContext = await sessionService.buildContextualPrompt(
        actualUserId, 
        userMessage, 
        ''
      );

      console.log('📊 Contexto histórico resultado:', {
        hasHistory: historicalContext.hasHistory,
        historyCount: historicalContext.historyCount,
        contextLength: historicalContext.contextualPrompt?.length || 0
      });
      
      if (historicalContext.hasHistory) {
        console.log('📖 Primeros 200 chars del contexto:', historicalContext.contextualPrompt.substring(0, 200) + '...');
      }
      console.log('🧠 === FIN DEBUG MEMORIA ===');

      // Extraer información médica del mensaje
      const extractedInfo = conversationService.extractMedicalInfo(userMessage);
      
      // Actualizar información de conversación
      await this.updateConversationWithInfo(conversation, extractedInfo);

      // 🔧 CORRECCIÓN CRÍTICA: Control de turnos ÚNICO aquí
      console.log('🎯 === DEBUG CONTROL DE TURNOS ===');
      console.log('📊 Estado ANTES de incrementar:', {
        conversationId: conversation.conversationId,
        turnosAnteriores: conversation.watsonMetadata.conversationTurns,
        hasEmergencySymptoms: this.hasEmergencySymptoms(extractedInfo.symptoms),
        extractedSymptoms: extractedInfo.symptoms
      });

      // 🔧 ÚNICO LUGAR DONDE SE INCREMENTAN TURNOS
      const currentTurnCount = conversation.watsonMetadata.conversationTurns + 1;
      conversation.watsonMetadata.conversationTurns = currentTurnCount;
      await conversation.save();

      console.log('🔄 Turnos incrementados:', {
        turnosAnteriores: currentTurnCount - 1,
        turnosNuevos: currentTurnCount,
        deberiaClasificar: currentTurnCount >= 6
      });

      // Determinar fase de conversación
      const currentPhase = this.determineConversationPhase(
        currentTurnCount,
        this.hasEmergencySymptoms(extractedInfo.symptoms)
      );

      console.log('🎯 Fase determinada:', {
        currentPhase,
        currentTurnCount,
        shouldClassify: currentPhase === this.getConversationPhases().CLASSIFICATION,
        phaseName: Object.keys(this.getConversationPhases()).find(key => 
          this.getConversationPhases()[key] === currentPhase
        )
      });
      console.log('🎯 === FIN DEBUG CONTROL DE TURNOS ===');

      // Determinar tipo de respuesta Watson necesaria
      const responseType = this.determineResponseType(userMessage, conversation, currentPhase);
      
      // 🆕 CONSTRUIR CONTEXTO MEJORADO QUE INCLUYE HISTORIAL
      const conversationContext = await this.buildEnhancedConversationContext(
        conversationId, 
        conversation, 
        historicalContext, 
        currentPhase
      );
      
      console.log(`🔄 Fase conversación: ${currentPhase} | Tipo: ${responseType}`);
      
      // 🔧 AUTO-FINALIZACIÓN si alcanza turno 6
      if (currentTurnCount >= 6 || currentPhase === this.getConversationPhases().CLASSIFICATION) {
        console.log('🏁 AUTO-FINALIZANDO conversación - Turno 6 alcanzado');
        
        const finalClassification = await this.generateFinalClassification(conversation);
        await conversationService.finalizeConversation(conversationId, finalClassification);
        
        return {
          watsonMessage: `NIVEL ${finalClassification.level}-${this.getLevelColorName(finalClassification.level)}-${finalClassification.specialty.toUpperCase()}`,
          urgencyUpdate: {
            level: finalClassification.level,
            specialty: finalClassification.specialty,
            reason: 'Clasificación final completada'
          },
          extractedInfo,
          nextQuestions: [],
          conversationComplete: true,
          processingTime: Date.now() - startTime,
          tokensUsed: 0,
          responseType: 'classification',
          conversationPhase: currentPhase,
          hasHistoricalContext: historicalContext.hasHistory,
          finalClassification
        };
      }

      // Generar respuesta con Watson
      const watsonResponse = await this.generateWatsonResponse(
        userMessage,
        responseType,
        conversationContext,
        conversation,
        currentPhase
      );

      // Procesar respuesta y extraer acciones
      const processedResponse = await this.processWatsonResponse(
        watsonResponse,
        conversation,
        responseType,
        currentPhase
      );

      const processingTime = Date.now() - startTime;
      
      console.log(`✅ Watson procesó mensaje en ${processingTime}ms`);
      
      return {
        watsonMessage: processedResponse.message,
        urgencyUpdate: processedResponse.urgencyUpdate,
        extractedInfo,
        nextQuestions: processedResponse.suggestedQuestions,
        conversationComplete: processedResponse.shouldComplete,
        processingTime,
        tokensUsed: watsonResponse.tokens_info?.generated_tokens || 0,
        responseType,
        conversationPhase: currentPhase,
        hasHistoricalContext: historicalContext.hasHistory
      };

    } catch (error) {
      console.error('❌ Error procesando con Watson:', error);
      
      // Fallback a respuesta simple
      return this.generateFallbackResponse(userMessage, conversation, error.message);
    }
  }

  /**
   * 🆕 CONSTRUIR CONTEXTO MEJORADO CON HISTORIAL
   */
  async buildEnhancedConversationContext(conversationId, conversation, historicalContext, currentPhase) {
    const currentContext = await this.buildConversationContext(conversationId, conversation);
    
    console.log('🔧 === DEBUG CONTEXTO MEJORADO ===');
    console.log('🔄 ¿Tiene contexto histórico?:', historicalContext && historicalContext.hasHistory);
    
    if (historicalContext && historicalContext.hasHistory) {
      console.log('📊 Construyendo contexto mejorado con:', historicalContext.historyCount, 'consultas');
      
      const enhancedContext = `${historicalContext.contextualPrompt}

CONVERSACIÓN ACTUAL:
${currentContext}

FASE DE CONVERSACIÓN: ${currentPhase}
TURNO: ${conversation.watsonMetadata.conversationTurns}
CONSULTAS PREVIAS: ${historicalContext.historyCount}`;
      
      console.log(`🧠 Contexto mejorado construido con ${historicalContext.historyCount} consultas previas`);
      console.log('🔧 === FIN DEBUG CONTEXTO MEJORADO ===');
      return enhancedContext;
    }
    
    console.log('🔧 === FIN DEBUG CONTEXTO MEJORADO ===');
    
    return `${currentContext}

FASE DE CONVERSACIÓN: ${currentPhase}
TURNO: ${conversation.watsonMetadata.conversationTurns}
PACIENTE NUEVO: Primera consulta en el sistema`;
  }

  /**
   * 🆕 DETECTAR SÍNTOMAS DE EMERGENCIA
   */
  hasEmergencySymptoms(symptoms) {
    const emergencyKeywords = [
      'dolor de pecho', 'dificultad para respirar', 'sangrado severo', 'convulsiones',
      'pérdida de conocimiento', 'trauma severo', 'quemaduras graves',
      'vomitando sangre', 'sangre en orina', 'sangre en heces',
      'dolor torácico', 'infarto', 'ataque cardíaco'
    ];
    
    return symptoms.some(symptom => 
      emergencyKeywords.some(emergency => 
        symptom.toLowerCase().includes(emergency.toLowerCase())
      )
    );
  }

  /**
   * 🔧 DETERMINAR TIPO DE RESPUESTA POR FASE
   */
  determineResponseType(message, conversation, currentPhase) {
    const text = message.toLowerCase();
    const phases = this.getConversationPhases();
    
    // Detectar emergencia inmediata
    const emergencyPatterns = [
      /no puedo respirar/,
      /dolor de pecho fuerte/,
      /perdí el conocimiento/,
      /sangre en/,
      /convulsiones/,
      /dolor nivel (9|10)/,
      /vomitando sangre/
    ];
    
    if (emergencyPatterns.some(pattern => pattern.test(text))) {
      return 'emergency';
    }

    // 🔧 CORRECCIÓN: Usar solo valores enum válidos del modelo ChatMessage
    switch (currentPhase) {
      case phases.GREETING:
        return 'initial';
      case phases.MEDICAL_HISTORY:
        return 'followup';
      case phases.SYMPTOM_COLLECTION:
        return 'symptom_inquiry';
      case phases.DETAIL_INQUIRY:
        return 'followup';
      case phases.FINAL_ASSESSMENT:
        return 'followup';
      case phases.CLASSIFICATION:
        return 'classification';
      default:
        return 'followup';
    }
  }

  /**
   * 🔧 PROMPTS ESPECIALIZADOS POR FASE Y CONTEXTO
   */
  buildSpecializedPrompt(responseType, userMessage, context, conversation, currentPhase = null) {
    const phases = this.getConversationPhases();
    
    if (!context) {
      console.log('⚠️ Context es undefined, usando contexto por defecto');
      context = `PACIENTE NUEVO: Primera consulta\nMENSAJE: "${userMessage}"`;
    }
    
    const hasHistoricalContext = context.includes('HISTORIAL DE CONSULTAS PREVIAS:') || 
                                context.includes('CONSULTAS PREVIAS:') ||
                                context.includes('consultas previas');
    
    console.log('🔍 === DEBUG PROMPT BUILDING ===');
    console.log('🔍 Parámetros:', {
      hasHistoricalContext,
      contextLength: context.length,
      userMessage: userMessage.substring(0, 50),
      responseType,
      currentPhase
    });
    console.log('🔍 === FIN DEBUG PROMPT ===');
    
    // BASE INSTRUCTIONS
    const baseInstructions = hasHistoricalContext ? 
      `Eres Watson, un asistente médico IA especializado en triaje. IMPORTANTE: Este paciente YA HA CONSULTADO ANTES.

INSTRUCCIONES ESPECÍFICAS PARA PACIENTE CONOCIDO:
- SIEMPRE menciona que recuerdas sus consultas anteriores
- Haz referencia a síntomas o clasificaciones previas cuando sea relevante  
- Pregunta específicamente sobre la evolución de síntomas anteriores
- Compara síntomas actuales con los previos para detectar progresión
- Sé más directo ya que conoces al paciente

CONTEXTO COMPLETO DEL PACIENTE:
${context}

MENSAJE ACTUAL DEL PACIENTE: "${userMessage}"` :

      `Eres Watson, un asistente médico IA especializado en triaje. Tu objetivo es recopilar información médica mediante una conversación natural y clasificar según el Protocolo Manchester.

INSTRUCCIONES ESPECÍFICAS:
- Haz UNA pregunta específica por respuesta
- Sé empático y profesional
- Si detectas urgencia, escala inmediatamente
- Usa un lenguaje claro y comprensible
- Mantén el foco médico pero sé humano

CONTEXTO ACTUAL:
${context}

MENSAJE DEL USUARIO: "${userMessage}"`;

    // PROMPTS POR FASE
    if (currentPhase !== null) {
      switch (currentPhase) {
        case phases.GREETING:
          if (hasHistoricalContext) {
            const isGreeting = /^(hola|hello|hi|buenas|buenos)/i.test(userMessage.trim());
            if (isGreeting) {
              return `${baseInstructions}

SALUDO A PACIENTE CONOCIDO:
El paciente te saluda. YA conoces su historial médico completo.
DEBES mencionar específicamente una consulta anterior y preguntar cómo se siente hoy.
Respuesta en 1-2 oraciones máximo.`;
            }
          }
          return `${baseInstructions}

TURNO 1 - SÍNTOMA PRINCIPAL:
El paciente describe sus síntomas. Reconoce el síntoma principal y haz una pregunta de aclaración específica.
Respuesta en 1-2 oraciones máximo.`;

        case phases.MEDICAL_HISTORY:
          return `${baseInstructions}

TURNO 2 - ANTECEDENTES MÉDICOS:
Pregunta sobre enfermedades previas, medicamentos actuales, alergias o cirugías.
Esta información es crucial para el diagnóstico.
Haz UNA pregunta específica sobre antecedentes médicos.`;

        case phases.SYMPTOM_COLLECTION:
          return `${baseInstructions}

TURNO 3 - DETALLES DEL SÍNTOMA:
Profundiza en las características específicas del síntoma principal.
Pregunta sobre localización, intensidad, o características específicas.
Haz UNA pregunta específica sobre detalles del síntoma.`;

        case phases.DETAIL_INQUIRY:
          return `${baseInstructions}

TURNO 4 - DURACIÓN E INTENSIDAD:
Pregunta sobre cuándo comenzó, duración, progresión o intensidad del síntoma.
Esta información ayuda a determinar la urgencia.
Haz UNA pregunta específica sobre duración o intensidad.`;

        case phases.FINAL_ASSESSMENT:
          return `${baseInstructions}

TURNO 5 - SÍNTOMAS ADICIONALES:
Pregunta sobre síntomas adicionales, factores que mejoran/empeoran, o signos de alarma.
Completa la información para clasificar.
Haz UNA pregunta final sobre síntomas adicionales.`;

        case phases.CLASSIFICATION:
          return `${baseInstructions}

CLASIFICACIÓN FINAL MANCHESTER:
Proporciona clasificación final según el Protocolo Manchester.
Usa EXACTAMENTE el formato: NIVEL X-COLOR-ESPECIALIDAD

Proporciona la clasificación final.`;
      }
    }

    // Fallback por responseType
    switch (responseType) {
      case 'emergency':
        return `${baseInstructions}

SITUACIÓN DE EMERGENCIA:
Evalúa si requiere atención urgente inmediata.
Clasifica como Nivel 1 o 2 si es crítico.
Responde con evaluación de urgencia.`;

      case 'validation_request':
        return `${baseInstructions}

SOLICITUD DE INFORMACIÓN MÉDICA:
El usuario no proporcionó información médica válida.
Solicita que describa sus síntomas o molestias de manera clara.
Sé amable pero directo.`;

      default:
        return `${baseInstructions}

SEGUIMIENTO MÉDICO:
Continúa recopilando información médica relevante.
Haz la siguiente pregunta más importante para el diagnóstico.
Responde con la siguiente pregunta relevante.`;
    }
  }

  // ===============================================
  // 🔧 MÉTODOS AUXILIARES Y EXISTENTES
  // ===============================================

  async buildConversationContext(conversationId, conversation) {
    const userMessages = await ChatMessage.find({
      conversationId,
      sender: 'user'
    }).sort({ messageSequence: 1 }).limit(5);

    let context = `INFORMACIÓN DEL PACIENTE:\n`;
    context += `- ID: ${conversation.userId}\n`;
    if (conversation.patientAge) context += `- Edad: ${conversation.patientAge} años\n`;
    if (conversation.patientGender) context += `- Género: ${conversation.patientGender}\n`;
    
    if (conversation.isFollowUpConversation && conversation.previousConversationId) {
      const prevConversation = await Conversation.findOne({
        conversationId: conversation.previousConversationId
      });
      
      if (prevConversation) {
        context += `\nCONSULTA ANTERIOR:\n`;
        context += `- Fecha: ${prevConversation.startedAt.toLocaleDateString('es-ES')}\n`;
        context += `- Clasificación previa: Nivel ${prevConversation.currentUrgencyLevel} - ${prevConversation.currentSpecialty}\n`;
        context += `- Síntomas anteriores: ${prevConversation.collectedSymptoms.join(', ')}\n`;
      }
    }

    if (conversation.collectedSymptoms.length > 0) {
      context += `\nSÍNTOMAS RECOPILADOS:\n`;
      context += `- ${conversation.collectedSymptoms.join(', ')}\n`;
    }

    if (conversation.collectedConditions.length > 0) {
      context += `\nCONDICIONES MÉDICAS:\n`;
      context += `- ${conversation.collectedConditions.join(', ')}\n`;
    }

    if (conversation.collectedTemperature) {
      context += `\nSIGNOS VITALES:\n`;
      context += `- Temperatura: ${conversation.collectedTemperature}°C\n`;
    }

    if (userMessages.length > 0) {
      context += `\nHISTORIAL DE CONVERSACIÓN:\n`;
      userMessages.forEach((msg, index) => {
        context += `${index + 1}. Usuario: "${msg.content}"\n`;
      });
    }

    context += `\nNIVEL ACTUAL DE URGENCIA: ${conversation.currentUrgencyLevel}\n`;
    context += `ESPECIALIDAD ACTUAL: ${conversation.currentSpecialty}\n`;

    return context;
  }

  async generateWatsonResponse(userMessage, responseType, context, conversation, currentPhase = null) {
    const prompt = this.buildSpecializedPrompt(responseType, userMessage, context, conversation, currentPhase);
    
    console.log(`🎯 Generando respuesta tipo: ${responseType} | Fase: ${currentPhase || 'N/A'}`);
    
    try {
      const response = await watsonController.callTriageManchester(
        userMessage,
        prompt,
        context
      );
      
      return response;
      
    } catch (error) {
      console.error('❌ Error llamando Watson:', error);
      throw error;
    }
  }

  async processWatsonResponse(watsonResponse, conversation, responseType, currentPhase = null) {
    try {
      let urgencyUpdate = null;
      let shouldComplete = false;
      
      const responseText = watsonResponse.generated_text || '';
      
      // Verificar si debe completarse
      if (currentPhase === this.getConversationPhases().CLASSIFICATION) {
        shouldComplete = true;
      }
      
      const urgencyMatch = responseText.match(/NIVEL (\d)-(\w+)-(\w+)/i);
      if (urgencyMatch) {
        const level = parseInt(urgencyMatch[1]);
        const specialty = urgencyMatch[3];
        
        if (level !== conversation.currentUrgencyLevel) {
          urgencyUpdate = {
            level,
            specialty,
            reason: `Watson detectó escalado basado en síntomas reportados`
          };
        }
      }

      const emergencyKeywords = [
        'inmediato', 'emergencia', 'crítico', 'urgente',
        'nivel 1', 'nivel 2', 'atención inmediata'
      ];
      
      const hasEmergencyKeywords = emergencyKeywords.some(keyword => 
        responseText.toLowerCase().includes(keyword.toLowerCase())
      );

      if (hasEmergencyKeywords && !urgencyUpdate) {
        urgencyUpdate = {
          level: Math.min(conversation.currentUrgencyLevel, 2),
          specialty: this.determineSpecialtyFromSymptoms(conversation.collectedSymptoms),
          reason: 'Watson detectó indicadores de urgencia en síntomas'
        };
      }

      const suggestedQuestions = this.extractSuggestedQuestions(responseText, responseType);
      const cleanMessage = this.cleanWatsonResponse(responseText);

      return {
        message: cleanMessage,
        urgencyUpdate,
        shouldComplete,
        suggestedQuestions,
        hasEmergencyIndicators: hasEmergencyKeywords
      };

    } catch (error) {
      console.error('❌ Error procesando respuesta Watson:', error);
      return {
        message: "Disculpa, puedes repetir eso de otra manera para entenderte mejor?",
        urgencyUpdate: null,
        shouldComplete: false,
        suggestedQuestions: []
      };
    }
  }

  async updateConversationWithInfo(conversation, extractedInfo) {
    let updated = false;

    if (extractedInfo.symptoms.length > 0) {
      extractedInfo.symptoms.forEach(symptom => {
        if (!conversation.collectedSymptoms.includes(symptom)) {
          conversation.collectedSymptoms.push(symptom);
          updated = true;
        }
      });
    }

    if (extractedInfo.vitalSigns.temperature && !conversation.collectedTemperature) {
      conversation.collectedTemperature = extractedInfo.vitalSigns.temperature;
      updated = true;
    }

    if (!conversation.chiefComplaint && conversation.collectedSymptoms.length > 0) {
      conversation.chiefComplaint = conversation.collectedSymptoms[0];
      updated = true;
    }

    if (updated) {
      await conversation.save();
    }
  }

  determineSpecialtyFromSymptoms(symptoms) {
    const specialtyMap = {
      'dolor de pecho': 'Cardiología',
      'dolor de cabeza': 'Neurología', 
      'dolor de estómago': 'Gastroenterología',
      'tos': 'Neumología',
      'fiebre': 'Medicina Interna',
      'mareos': 'Neurología',
      'náuseas': 'Gastroenterología',
      'disnea': 'Neumología',
      'vómito': 'Gastroenterología',
      'sangrado': 'Medicina Interna'
    };

    for (const symptom of symptoms) {
      if (specialtyMap[symptom]) {
        return specialtyMap[symptom];
      }
    }

    return 'Medicina General';
  }

  extractSuggestedQuestions(responseText, responseType) {
    const questionTemplates = {
      'symptom_details': [
        '¿Del 1 al 10, qué tan intenso es el dolor?',
        '¿El dolor se irradia a otras partes?',
        '¿Qué hace que el dolor mejore o empeore?'
      ],
      'medical_history': [
        '¿Tienes alguna enfermedad crónica?',
        '¿Tomas algún medicamento regularmente?',
        '¿Tienes alergias conocidas?'
      ],
      'detail_inquiry': [
        '¿Cuándo comenzaron los síntomas?',
        '¿Los síntomas han empeorado?',
        '¿Qué tan intensos son del 1 al 10?'
      ]
    };

    return questionTemplates[responseType] || [
      '¿Puedes contarme más detalles?',
      '¿Hay algo más que notes?'
    ];
  }

  /**
   * 🔧 CORRECCIÓN TOTAL: Limpieza de respuestas Watson PRESERVANDO contexto
   */
  cleanWatsonResponse(responseText) {
    console.log('🧹 === DEBUG LIMPIEZA RESPUESTA ===');
    console.log('📝 Texto original:', responseText);
    
    // Si contiene clasificación Manchester, extraerla limpiamente
    const manchesterMatch = responseText.match(/NIVEL (\d)-(\w+)-(\w+)/i);
    if (manchesterMatch) {
      console.log('🎯 Detectada clasificación Manchester:', manchesterMatch[0]);
      console.log('🧹 === FIN DEBUG LIMPIEZA ===');
      return manchesterMatch[0];
    }
    
    // Para cualquier otra respuesta, PRESERVAR COMPLETAMENTE
    let cleaned = responseText.trim();
    
    // Solo eliminar instrucciones técnicas internas si existen
    cleaned = cleaned.replace(/INSTRUCCIONES ESPECÍFICAS:.*$/gm, '');
    cleaned = cleaned.replace(/CONTEXTO ACTUAL:.*$/gm, '');
    cleaned = cleaned.replace(/INFORMACIÓN DEL PACIENTE:.*$/gm, '');
    cleaned = cleaned.replace(/TURNO \d - .*?:/gm, '');
    
    // Limpiar espacios extras pero PRESERVAR contenido
    cleaned = cleaned.replace(/\n\s*\n/g, '\n').trim();
    
    // Solo usar fallback si está completamente vacío
    if (!cleaned || cleaned.length < 5) {
      cleaned = "¿Puedes contarme más detalles sobre cómo te sientes?";
    }
    
    console.log('✅ Texto limpio final:', cleaned);
    console.log('🧹 === FIN DEBUG LIMPIEZA ===');
    
    return cleaned;
  }

  generateFallbackResponse(userMessage, conversation, errorReason) {
    console.log(`🔄 Generando respuesta fallback: ${errorReason}`);
    
    const fallbackResponses = [
      "Entiendo tus síntomas. ¿Puedes contarme qué tan intensos son del 1 al 10?",
      "Gracias por la información. ¿Cuándo comenzaron exactamente estos síntomas?",
      "Veo que estás experimentando molestias. ¿Has notado si algo los mejora o empeora?",
      "Comprendo tu situación. ¿Tienes alguna condición médica previa que deba saber?",
      "Gracias por compartir eso. ¿Has tomado algún medicamento para estos síntomas?"
    ];

    const randomResponse = fallbackResponses[
      Math.floor(Math.random() * fallbackResponses.length)
    ];

    return {
      watsonMessage: randomResponse,
      urgencyUpdate: null,
      extractedInfo: conversationService.extractMedicalInfo(userMessage),
      nextQuestions: this.extractSuggestedQuestions('', 'followup'),
      conversationComplete: false,
      processingTime: 100,
      tokensUsed: 0,
      responseType: 'followup',
      fallbackReason: errorReason
    };
  }

  isConversationReadyToFinalize(conversation) {
    const hasSymptoms = conversation.collectedSymptoms.length > 0;
    const hasEnoughTurns = conversation.watsonMetadata.conversationTurns >= 5;
    const hasChiefComplaint = !!conversation.chiefComplaint;
    
    console.log('🔍 VERIFICANDO SI ESTÁ LISTA PARA FINALIZAR:', {
      hasSymptoms,
      hasEnoughTurns,
      hasChiefComplaint,
      currentTurns: conversation.watsonMetadata.conversationTurns,
      isReady: hasSymptoms && hasEnoughTurns && hasChiefComplaint
    });
    
    return hasSymptoms && hasEnoughTurns && hasChiefComplaint;
  }

  async generateFinalClassification(conversation) {
    try {
      const finalContext = await this.buildFinalClassificationContext(conversation);
      
      const finalPrompt = `Basado en toda la conversación, proporciona la clasificación FINAL según Protocolo Manchester.

${finalContext}

Responde ÚNICAMENTE en el formato: NIVEL X-COLOR-ESPECIALIDAD

Ejemplo: NIVEL 2-NARANJA-CARDIOLOGIA`;

      const response = await watsonController.callTriageManchester(
        "Clasificación final",
        finalPrompt,
        finalContext
      );

      const classificationMatch = response.generated_text?.match(/NIVEL (\d)-(\w+)-(\w+)/i);
      
      if (classificationMatch) {
        const level = parseInt(classificationMatch[1]);
        const color = classificationMatch[2];
        const specialty = classificationMatch[3];
        
        return this.formatManchesterClassification(level, color, specialty, 'watson');
      } else {
        return this.generateSimpleClassification(conversation);
      }

    } catch (error) {
      console.error('❌ Error en clasificación final:', error);
      return this.generateSimpleClassification(conversation);
    }
  }

  async buildFinalClassificationContext(conversation) {
    const messages = await ChatMessage.find({
      conversationId: conversation.conversationId,
      sender: 'user'
    }).sort({ messageSequence: 1 });

    let context = `RESUMEN COMPLETO DE LA CONSULTA:

SÍNTOMAS REPORTADOS: ${conversation.collectedSymptoms.join(', ')}
QUEJA PRINCIPAL: ${conversation.chiefComplaint}
TEMPERATURA: ${conversation.collectedTemperature || 'No reportada'}°C
CONDICIONES PREVIAS: ${conversation.collectedConditions.join(', ') || 'Ninguna'}

CONVERSACIÓN COMPLETA:`;

    messages.forEach((msg, index) => {
      context += `\n${index + 1}. "${msg.content}"`;
    });

    context += `\n\nTURNOS DE CONVERSACIÓN: ${conversation.watsonMetadata.conversationTurns}
DURACIÓN: ${this.calculateConversationDuration(conversation)}`;

    return context;
  }

  generateSimpleClassification(conversation) {
    const symptoms = conversation.collectedSymptoms;
    const temperature = parseFloat(conversation.collectedTemperature) || 0;
    
    const urgentSymptoms = ['dolor de pecho', 'dificultad para respirar', 'sangrado', 'vómito'];
    const hasCriticalSymptom = urgentSymptoms.some(critical => 
      symptoms.some(symptom => symptom.includes(critical))
    );

    let level = 5;
    if (hasCriticalSymptom || temperature >= 39.5) level = 1;
    else if (temperature >= 38.5) level = 2;
    else if (temperature >= 37.5 || symptoms.length >= 3) level = 3;
    else if (symptoms.length >= 1) level = 4;

    const specialty = this.determineSpecialtyFromSymptoms(symptoms);
    
    return this.formatManchesterClassification(level, this.getLevelColorName(level), specialty, 'simple');
  }

  formatManchesterClassification(level, color, specialty, source) {
    const colors = {
      1: { color: '#EF4444', bgColor: '#FEF2F2', label: 'Inmediato' },
      2: { color: '#F97316', bgColor: '#FFF7ED', label: 'Muy Urgente' },
      3: { color: '#EAB308', bgColor: '#FEFCE8', label: 'Urgente' },
      4: { color: '#22C55E', bgColor: '#F0FDF4', label: 'Menos Urgente' },
      5: { color: '#3B82F6', bgColor: '#EFF6FF', label: 'No Urgente' }
    };

    const levelData = colors[level] || colors[5];

    return {
      level,
      color: levelData.color,
      label: levelData.label,
      bgColor: levelData.bgColor,
      specialty: specialty.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, ''),
      source,
      confidence: source === 'watson' ? 0.9 : 0.7
    };
  }

  getLevelColorName(level) {
    const colors = { 1: 'ROJO', 2: 'NARANJA', 3: 'AMARILLO', 4: 'VERDE', 5: 'AZUL' };
    return colors[level] || 'AZUL';
  }

  calculateConversationDuration(conversation) {
    const duration = new Date() - new Date(conversation.startedAt);
    const minutes = Math.floor(duration / 60000);
    return `${minutes} minuto${minutes !== 1 ? 's' : ''}`;
  }
}

export default new WatsonChatService();
//corazon