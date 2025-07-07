import axios from 'axios';
import watsonAuthService from '../services/watsonAuthService.js';

/**
 * 
 * SCRIPT watsonController.js
 * Controlador principal para interacciones con IBM Watson
 * Maneja clasificación de triaje Manchester con contexto
 * VERSIÓN CORREGIDA - Compatible con chatTriageController
 */
class WatsonController {
  constructor() {
    this.region = process.env.IBM_WATSON_REGION || 'us-south';
    this.validated = false;
  }

  /**
   * Valida que todas las variables de entorno estén configuradas
   */
  validateConfiguration() {
    if (this.validated) return;

    console.log('🔍 Validando configuración Watson...');
    
    this.deploymentId = process.env.IBM_WATSON_DEPLOYMENT_ID;
    this.projectId = process.env.IBM_WATSON_PROJECT_ID;
    this.apiKey = process.env.IBM_WATSON_API_KEY;
    
    this.baseUrl = `https://${this.region}.ml.cloud.ibm.com`;
    this.deploymentEndpoint = `${this.baseUrl}/ml/v1/deployments/${this.deploymentId}/text/generation`;
    
    const config = {
      deploymentId: this.deploymentId,
      region: this.region,
      projectId: this.projectId,
      apiKey: this.apiKey
    };

    console.log('📋 Configuración detectada:', {
      deploymentId: config.deploymentId ? '✅ Configurado' : '❌ Faltante',
      region: config.region ? '✅ Configurado' : '❌ Faltante',
      projectId: config.projectId ? '✅ Configurado' : '❌ Faltante',
      apiKey: config.apiKey ? '✅ Configurado' : '❌ Faltante'
    });

    const missing = [];
    if (!config.deploymentId) missing.push('IBM_WATSON_DEPLOYMENT_ID');
    if (!config.region) missing.push('IBM_WATSON_REGION');
    if (!config.projectId) missing.push('IBM_WATSON_PROJECT_ID');
    if (!config.apiKey) missing.push('IBM_WATSON_API_KEY');
    
    if (missing.length > 0) {
      console.error('❌ Variables de entorno faltantes:', missing);
      throw new Error(`Variables de entorno faltantes: ${missing.join(', ')}`);
    }

    console.log('✅ Configuración Watson validada correctamente');
    this.validated = true;
  }

  /**
   * Llama a Watson para clasificación de triaje Manchester
   * ✅ RETORNA FORMATO COMPATIBLE CON chatTriageController
   */
  async callTriageManchester(sintomasPrincipal, detallesSintomas, contextoHistorial = '') {
    try {
      this.validateConfiguration();
      
      console.log('🤖 Iniciando clasificación Watson Manchester...');
      
      const token = await watsonAuthService.getToken();
      
      const promptCompleto = this.buildContextualPrompt(
        sintomasPrincipal, 
        detallesSintomas, 
        contextoHistorial
      );

      const payload = {
        parameters: {
          prompt_variables: {
            sintoma_principal: sintomasPrincipal,
            detalles_sintomas: promptCompleto
          },
          max_new_tokens: 50,
          min_new_tokens: 10,
          stop_sequences: ["\n", "NIVEL"],
          decoding_method: "greedy",
          repetition_penalty: 1.1
        }
      };

      console.log('📤 Enviando request a Watson:', {
        endpoint: this.deploymentEndpoint,
        sintoma_principal: sintomasPrincipal,
        contexto_incluido: contextoHistorial.length > 0,
        payload: payload
      });

      const response = await axios.post(
        `${this.deploymentEndpoint}?version=2021-05-01`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          timeout: 30000
        }
      );

      console.log('📨 Código de respuesta HTTP Watson:', response.status);
      console.log('📨 Headers de respuesta:', response.headers);

      // ✅ PARSEAR Y DEVOLVER EN FORMATO COMPATIBLE
      const result = this.parseWatsonResponseCompatible(response.data, promptCompleto);
      
      console.log('✅ Respuesta Watson procesada:', {
        clasificacion: result.generated_text || result.clasificacion_completa,
        tokens_usados: result.tokens_info
      });

      return result;

    } catch (error) {
      console.error('❌ Error en Watson API:', error.message);
      
      if (error.response) {
        console.error('📨 Código de error HTTP:', error.response.status);
        console.error('📨 Headers de error:', error.response.headers);
        console.error('📨 Datos de error:', error.response.data);
      }
      
      if (error.response?.status === 401) {
        watsonAuthService.invalidateToken();
        throw new Error('Token Watson expirado - reintente');
      } else if (error.response?.status === 429) {
        throw new Error('Límite de rate Watson excedido - intente más tarde');
      } else if (error.code === 'ECONNABORTED') {
        throw new Error('Timeout en Watson API - servicio lento');
      } else {
        throw new Error(`Error Watson API: ${error.response?.data?.message || error.message}`);
      }
    }
  }

  /**
   * Construye prompt contextual para Watson
   */
  buildContextualPrompt(sintomasPrincipal, detallesSintomas, contextoHistorial) {
    if (!contextoHistorial || contextoHistorial.trim().length === 0) {
      return detallesSintomas;
    }

    return `HISTORIAL MÉDICO PREVIO:
${contextoHistorial}

CONSULTA ACTUAL:
Síntoma principal: ${sintomasPrincipal}
Detalles: ${detallesSintomas}

Considera el historial médico del paciente para una clasificación más precisa según el Protocolo Manchester.`;
  }

  /**
   * ✅ NUEVO: Procesa respuesta en formato COMPATIBLE con chatTriageController
   * @param {Object} rawResponse - Respuesta cruda de Watson
   * @param {string} promptUsado - Prompt enviado a Watson
   * @returns {Object} Respuesta en formato compatible
   */
  parseWatsonResponseCompatible(rawResponse, promptUsado) {
    try {
      console.log('🔍 DEBUG - Respuesta completa de Watson:');
      console.log(JSON.stringify(rawResponse, null, 2));
      
      // Extraer texto generado
      let generatedText = '';
      
      if (rawResponse.body?.results?.[0]?.generated_text) {
        generatedText = rawResponse.body.results[0].generated_text;
        console.log('✅ Texto encontrado en body.results[0].generated_text:', generatedText);
      } else if (rawResponse.results?.[0]?.generated_text) {
        generatedText = rawResponse.results[0].generated_text;
        console.log('✅ Texto encontrado en results[0].generated_text:', generatedText);
      } else if (rawResponse.generated_text) {
        generatedText = rawResponse.generated_text;
        console.log('✅ Texto encontrado en generated_text:', generatedText);
      } else {
        console.log('⚠️ No se encontró texto generado');
        generatedText = '';
      }

      // Extraer información de tokens
      const result = rawResponse.body?.results?.[0] || rawResponse.results?.[0] || {};
      const tokensInfo = {
        input_tokens: result.input_token_count || rawResponse.input_token_count || 0,
        generated_tokens: result.generated_token_count || rawResponse.generated_token_count || 0,
        stop_reason: result.stop_reason || rawResponse.stop_reason || 'unknown'
      };

      console.log('📊 Tokens extraídos:', tokensInfo);

      // ✅ LIMPIAR TEXTO GENERADO
      const cleanText = generatedText.trim();

      // ✅ DETECTAR SI ES CLASIFICACIÓN O PREGUNTA
      const isClassification = /NIVEL\s+\d+-\w+-\w+/i.test(cleanText);
      
      if (isClassification) {
        // Es una clasificación Manchester final
        console.log('🎯 Detectada clasificación Manchester:', cleanText);
        const standardClassification = this.parseClassificationToStandard(cleanText);
        
        // ✅ RETORNAR FORMATO COMPATIBLE PARA CLASIFICACIÓN
        return {
          generated_text: cleanText,
          clasificacion_completa: cleanText,
          clasificacion_estandar: standardClassification,
          tokens_info: tokensInfo,
          model_info: {
            model_id: rawResponse.body?.model_id || rawResponse.model_id || 'unknown',
            model_version: rawResponse.body?.model_version || rawResponse.model_version || 'unknown'
          },
          timestamp: new Date().toISOString(),
          prompt_usado: promptUsado,
          watson_response_raw: rawResponse,
          is_classification: true
        };
      } else {
        // Es una pregunta de seguimiento
        console.log('❓ Detectada pregunta de seguimiento:', cleanText);
        
        // ✅ RETORNAR FORMATO COMPATIBLE PARA PREGUNTA
        return {
          generated_text: cleanText, // ✅ ESTE ES EL CAMPO QUE USA chatTriageController
          tokens_info: tokensInfo,
          model_info: {
            model_id: rawResponse.body?.model_id || rawResponse.model_id || 'unknown',
            model_version: rawResponse.body?.model_version || rawResponse.model_version || 'unknown'
          },
          timestamp: new Date().toISOString(),
          prompt_usado: promptUsado,
          watson_response_raw: rawResponse,
          is_classification: false
        };
      }

    } catch (error) {
      console.error('❌ Error parseando respuesta Watson:', error);
      console.error('🔍 Respuesta que causó el error:', rawResponse);
      
      // ✅ RETORNAR ERROR EN FORMATO COMPATIBLE
      return {
        generated_text: 'Lo siento, tuve un problema técnico. ¿Puedes reformular tu mensaje?',
        tokens_info: { input_tokens: 0, generated_tokens: 0, stop_reason: 'error' },
        error: true,
        error_message: error.message
      };
    }
  }

  /**
   * MANTENER MÉTODO ORIGINAL para compatibilidad con otras partes del sistema
   */
  parseWatsonResponse(rawResponse, promptUsado) {
    // Este método se mantiene para compatibilidad, pero usa el nuevo método internamente
    const compatibleResult = this.parseWatsonResponseCompatible(rawResponse, promptUsado);
    
    // Convertir al formato original si es necesario
    return {
      clasificacion_completa: compatibleResult.generated_text,
      clasificacion_estandar: compatibleResult.clasificacion_estandar || {
        level: 5,
        color: '#3B82F6',
        label: 'No Urgente',
        bgColor: '#EFF6FF',
        specialty: 'Medicina General',
        source: 'watson_error'
      },
      watson_response_raw: compatibleResult.watson_response_raw,
      prompt_usado: compatibleResult.prompt_usado,
      tokens_info: compatibleResult.tokens_info,
      timestamp: compatibleResult.timestamp,
      model_info: compatibleResult.model_info
    };
  }

  /**
   * Convierte respuesta Watson al formato estándar del sistema
   */
  parseClassificationToStandard(watsonResponse) {
    const match = watsonResponse.match(/NIVEL\s+(\d+)-(\w+)-(\w+)/i);
    
    if (!match) {
      console.warn('⚠️ No se pudo parsear respuesta Watson:', watsonResponse);
      return {
        level: 5,
        color: '#3B82F6',
        label: 'No Urgente',
        bgColor: '#EFF6FF',
        specialty: 'Medicina General',
        source: 'watson_error'
      };
    }

    const [, level, color, specialty] = match;
    
    const colorMap = {
      'ROJO': { color: '#EF4444', label: 'Inmediato', bgColor: '#FEF2F2' },
      'NARANJA': { color: '#F97316', label: 'Muy Urgente', bgColor: '#FFF7ED' },
      'AMARILLO': { color: '#EAB308', label: 'Urgente', bgColor: '#FEFCE8' },
      'VERDE': { color: '#22C55E', label: 'Menos Urgente', bgColor: '#F0FDF4' },
      'AZUL': { color: '#3B82F6', label: 'No Urgente', bgColor: '#EFF6FF' }
    };

    const colorInfo = colorMap[color.toUpperCase()] || colorMap['AZUL'];

    return {
      level: parseInt(level),
      ...colorInfo,
      specialty: specialty.charAt(0).toUpperCase() + specialty.slice(1).toLowerCase(),
      source: 'watson'
    };
  }
}

export default new WatsonController();