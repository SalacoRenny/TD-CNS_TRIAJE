// SCRIPT sessionService.js
import { v4 as uuidv4 } from 'uuid';
import SymptomRecord from '../models/SymptomRecord.js';
import User from '../models/User.js';

/**
 * Servicio de gestión de sesiones y memoria contextual
 * Maneja el historial médico por paciente para IA contextual
 */
class SessionService {
  /**
   * Crea una nueva sesión de triaje para un paciente
   * @param {string} userId - ID del usuario/paciente
   * @returns {Promise<Object>} Información de la nueva sesión
   */
  async createNewSession(userId) {
    try {
      console.log(`📋 Creando nueva sesión para usuario: ${userId}`);
      
      // Buscar la última sesión del usuario
      const lastRecord = await SymptomRecord.findOne({ userId })
        .sort({ createdAt: -1 })
        .select('sessionId createdAt');

      const sessionId = uuidv4();
      const now = new Date();
      
      // Determinar si es una sesión de seguimiento
      const isFollowUp = lastRecord && 
        (now - lastRecord.createdAt) < (24 * 60 * 60 * 1000); // Menos de 24 horas

      const sessionInfo = {
        sessionId,
        previousSessionId: lastRecord?.sessionId || null,
        sequence: 1,
        isFollowUp,
        createdAt: now
      };

      console.log(`✅ Sesión creada: ${sessionId}`, {
        es_seguimiento: isFollowUp,
        sesion_previa: sessionInfo.previousSessionId ? 'Sí' : 'No'
      });

      return sessionInfo;

    } catch (error) {
      console.error('❌ Error creando sesión:', error);
      throw new Error('Error al crear sesión de triaje');
    }
  }

  /**
   * Obtiene el historial de sesiones de un paciente
   * @param {string} userId - ID del usuario
   * @param {number} limit - Límite de registros (default: 5)
   * @returns {Promise<Array>} Historial de síntomas
   */
  async getSessionHistory(userId, limit = 5) {
    try {
      console.log(`📚 Obteniendo historial para usuario: ${userId} (últimos ${limit})`);

      const history = await SymptomRecord.find({ userId })
        .sort({ createdAt: -1 })
        .limit(limit)
        .select('symptoms baseConditions temperature edad frecuenciaCardiaca presionArterial final_classification watson_response createdAt sessionId')
        .lean();

      console.log(`📖 Historial obtenido: ${history.length} registros`);
      return history;

    } catch (error) {
      console.error('❌ Error obteniendo historial:', error);
      throw new Error('Error al obtener historial médico');
    }
  }

  /**
   * Construye prompt contextual para Watson basado en historial
   * @param {string} userId - ID del usuario
   * @param {string} newSymptoms - Síntomas actuales
   * @param {string} newDetails - Detalles actuales
   * @returns {Promise<Object>} Información contextual
   */
  async buildContextualPrompt(userId, newSymptoms, newDetails) {
    try {
      console.log(`🧠 Construyendo contexto para usuario: ${userId}`);
      
      // 🔍 DEBUG: Construcción Contexto SessionService
      console.log('📚 === DEBUG SESSION SERVICE ===');
      console.log('🔧 Parámetros recibidos:', {
        userId,
        newSymptoms: newSymptoms?.substring(0, 50) + '...',
        newDetails: newDetails?.substring(0, 50) + '...'
      });

      // Obtener información del usuario
      const user = await User.findOne({ userId })
        .select('name age gender dateOfBirth status')
        .lean();

      console.log('👤 Usuario encontrado:', {
        userFound: !!user,
        userName: user?.name || 'No disponible',
        userAge: user?.age || 'No disponible'
      });

      // Obtener historial reciente (últimas 3 consultas)
      const history = await this.getSessionHistory(userId, 3);
      
      console.log('📖 Historial obtenido:', {
        userId,
        historyLength: history.length,
        hasHistory: history.length > 0,
        historyIds: history.map(h => h.sessionId || h._id)
      });

      if (history.length > 0) {
        console.log('📋 Primera consulta previa:', {
          fecha: history[0].createdAt,
          symptoms: history[0].symptoms,
          classification: history[0].final_classification?.specialty || 'No clasificado'
        });
      }

      if (history.length === 0) {
        console.log('📝 Primera consulta - sin contexto histórico');
        console.log('📚 === FIN DEBUG SESSION SERVICE ===');
        return {
          contextualPrompt: newDetails,
          hasHistory: false,
          historyCount: 0,
          userInfo: user
        };
      }

      // Construir contexto histórico
      console.log('🔨 Construyendo contexto histórico...');
      const contextualPrompt = this.formatHistoricalContext(user, history, newSymptoms, newDetails);

      console.log(`🧠 Contexto construido con ${history.length} consultas previas`);
      console.log('🧠 Contexto final construido:', {
        hasHistory: contextualPrompt.includes('HISTORIAL DE CONSULTAS PREVIAS:'),
        contextLength: contextualPrompt.length,
        historyCount: history.length,
        incluyePalabrasClave: {
          incluyeHistorial: contextualPrompt.includes('HISTORIAL DE CONSULTAS PREVIAS:'),
          incluyeConsultas: contextualPrompt.includes('CONSULTAS PREVIAS:'),
          incluyeTextoConsultas: contextualPrompt.includes('consultas previas')
        }
      });
      
      // 🔍 DEBUG ADICIONAL: Mostrar fragmento del contexto construido
      console.log('📝 Fragmento del contexto (primeros 300 chars):', contextualPrompt.substring(0, 300) + '...');
      
      console.log('📚 === FIN DEBUG SESSION SERVICE ===');

      return {
        contextualPrompt,
        hasHistory: true,
        historyCount: history.length,
        userInfo: user,
        lastConsultation: history[0]?.createdAt
      };

    } catch (error) {
      console.error('❌ Error construyendo contexto:', error);
      console.log('📚 === FIN DEBUG SESSION SERVICE (ERROR) ===');
      // En caso de error, devolver sin contexto para no bloquear el flujo
      return {
        contextualPrompt: newDetails,
        hasHistory: false,
        historyCount: 0,
        error: error.message
      };
    }
  }

  /**
   * Formatea el contexto histórico para enviar a Watson
   * @param {Object} user - Información del usuario
   * @param {Array} history - Historial de consultas
   * @param {string} newSymptoms - Síntomas actuales
   * @param {string} newDetails - Detalles actuales
   * @returns {string} Prompt contextual formateado
   */
  formatHistoricalContext(user, history, newSymptoms, newDetails) {
    // 🔍 DEBUG: Formateo de contexto
    console.log('📝 === DEBUG FORMATEO CONTEXTO ===');
    console.log('📋 Formateando contexto histórico:', {
      userInfo: !!user,
      historyLength: history?.length || 0,
      newSymptoms: newSymptoms?.substring(0, 30) + '...',
      newDetails: newDetails?.substring(0, 30) + '...'
    });

    const userInfo = this.formatUserInfo(user);
    const historyText = this.formatConsultationHistory(history);
    
    const formattedContext = `INFORMACIÓN DEL PACIENTE:
${userInfo}

HISTORIAL DE CONSULTAS PREVIAS:
${historyText}

CONSULTA ACTUAL:
- Síntomas: ${newSymptoms}
- Detalles: ${newDetails}

INSTRUCCIONES: Considera toda la información del paciente y su historial médico para una clasificación más precisa según el Protocolo Manchester. Presta especial atención a patrones recurrentes o evolución de síntomas.`;

    console.log('✅ Contexto formateado exitosamente:', {
      totalLength: formattedContext.length,
      incluyeHistorial: formattedContext.includes('HISTORIAL DE CONSULTAS PREVIAS:'),
      incluyeInstrucciones: formattedContext.includes('INSTRUCCIONES:')
    });
    console.log('📝 === FIN DEBUG FORMATEO CONTEXTO ===');

    return formattedContext;
  }

  /**
   * Formatea información básica del usuario
   * @param {Object} user - Datos del usuario
   * @returns {string} Información formateada
   */
  formatUserInfo(user) {
    if (!user) return '- Información del paciente no disponible';

    const parts = [];
    
    if (user.name) parts.push(`- Nombre: ${user.name}`);
    if (user.age) parts.push(`- Edad: ${user.age} años`);
    if (user.gender) parts.push(`- Género: ${user.gender}`);
    if (user.status) parts.push(`- Estado: ${user.status}`);

    return parts.length > 0 ? parts.join('\n') : '- Información básica del paciente';
  }

  /**
   * Formatea historial de consultas para contexto
   * @param {Array} history - Historial de consultas
   * @returns {string} Historial formateado
   */
  formatConsultationHistory(history) {
    if (!history || history.length === 0) {
      return '- Sin consultas previas registradas';
    }

    return history.map((record, index) => {
      const fecha = new Date(record.createdAt).toLocaleDateString('es-ES');
      const symptoms = record.symptoms?.join(', ') || 'No especificados';
      const classification = record.final_classification?.specialty || 'No clasificado';
      const urgencyLevel = record.final_classification?.level || 'N/A';
      const temperature = record.temperature || 'No registrada';

      // 🆕 Formatear signos vitales adicionales
      const edad = record.edad ? `${record.edad} años` : 'No registrada';
      const fc = record.frecuenciaCardiaca ? `${record.frecuenciaCardiaca} lpm` : 'No registrada';
      const pa = record.presionArterial?.sistolica && record.presionArterial?.diastolica ? 
                `${record.presionArterial.sistolica}/${record.presionArterial.diastolica} mmHg` : 'No registrada';

return `${index + 1}. Consulta del ${fecha}:
   - Síntomas: ${symptoms}
   - Edad: ${edad}
   - Temperatura: ${temperature}°C
   - Frecuencia cardíaca: ${fc}
   - Presión arterial: ${pa}
   - Clasificación previa: Nivel ${urgencyLevel} - ${classification}
   - Condiciones base: ${record.baseConditions?.join(', ') || 'Ninguna'}`;
    }).join('\n\n');
  }

  /**
   * Actualiza el estado del usuario después de una consulta
   * @param {string} userId - ID del usuario
   * @returns {Promise<void>}
   */
  async updateUserTriageStatus(userId) {
    try {
      await User.findOneAndUpdate(
        { userId },
        { 
          status: 'con_historial',
          lastTriageDate: new Date(),
          updatedAt: new Date()
        }
      );

      console.log(`✅ Estado actualizado para usuario: ${userId}`);
    } catch (error) {
      console.error('❌ Error actualizando estado usuario:', error);
      // No es crítico, no bloquea el flujo
    }
  }

  /**
   * Obtiene estadísticas de sesiones por usuario
   * @param {string} userId - ID del usuario
   * @returns {Promise<Object>} Estadísticas
   */
  async getUserSessionStats(userId) {
    try {
      const stats = await SymptomRecord.aggregate([
        { $match: { userId } },
        {
          $group: {
            _id: null,
            totalConsultas: { $sum: 1 },
            primeraConsulta: { $min: '$createdAt' },
            ultimaConsulta: { $max: '$createdAt' },
            sesionesUnicas: { $addToSet: '$sessionId' }
          }
        }
      ]);

      if (stats.length === 0) {
        return {
          totalConsultas: 0,
          totalSesiones: 0,
          primeraConsulta: null,
          ultimaConsulta: null
        };
      }

      const stat = stats[0];
      return {
        totalConsultas: stat.totalConsultas,
        totalSesiones: stat.sesionesUnicas.length,
        primeraConsulta: stat.primeraConsulta,
        ultimaConsulta: stat.ultimaConsulta
      };

    } catch (error) {
      console.error('❌ Error obteniendo estadísticas:', error);
      return null;
    }
  }
}

export default new SessionService();