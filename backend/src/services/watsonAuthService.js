// ===============================================
// 🔧 SOLUCIÓN 2: watsonAuthService.js (VERSIÓN LAZY)
// backend/src/services/watsonAuthService.js
// ===============================================

import axios from 'axios';

/**
 * Servicio de autenticación para IBM Watson
 * Maneja tokens IAM con renovación automática
 * VERSIÓN LAZY - No valida en construcción
 */
class WatsonAuthService {
  constructor() {
    this.token = null;
    this.tokenExpiry = null;
    this.iamUrl = 'https://iam.cloud.ibm.com/identity/token';
    // NO validar aquí - validar en getToken()
  }

  /**
   * Obtiene la API key con validación lazy
   */
  getApiKey() {
    const apiKey = process.env.IBM_WATSON_API_KEY;
    if (!apiKey) {
      throw new Error('IBM_WATSON_API_KEY no configurado en variables de entorno');
    }
    return apiKey;
  }

  /**
   * Obtiene un token válido, renovándolo si es necesario
   * @returns {Promise<string>} Token de autenticación
   */
  async getToken() {
    try {
      // Validar API key solo cuando se necesite
      const apiKey = this.getApiKey();

      // Verificar si el token actual es válido (con 1 minuto de buffer)
      if (this.token && this.tokenExpiry > Date.now() + 60000) {
        return this.token;
      }

      console.log('🔑 Obteniendo nuevo token IBM Watson...');
      
      const response = await axios.post(
        this.iamUrl,
        `grant_type=urn:ibm:params:oauth:grant-type:apikey&apikey=${apiKey}`,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json'
          },
          timeout: 10000 // 10 segundos timeout
        }
      );

      if (!response.data.access_token) {
        throw new Error('No se recibió access_token en la respuesta');
      }

      this.token = response.data.access_token;
      // Calcular expiración con buffer de seguridad de 5 minutos
      this.tokenExpiry = Date.now() + (response.data.expires_in * 1000) - 300000;

      console.log('✅ Token Watson obtenido exitosamente');
      return this.token;
      
    } catch (error) {
      console.error('❌ Error obteniendo token Watson:', error.message);
      
      if (error.response?.status === 400) {
        throw new Error('API Key de Watson inválido');
      } else if (error.response?.status === 401) {
        throw new Error('No autorizado para obtener token Watson');
      } else {
        throw new Error(`Error de autenticación Watson: ${error.message}`);
      }
    }
  }

  /**
   * Invalida el token actual para forzar renovación
   */
  invalidateToken() {
    this.token = null;
    this.tokenExpiry = null;
    console.log('🔄 Token Watson invalidado');
  }

  /**
   * Verifica si el token está próximo a vencer
   * @returns {boolean} True si el token vence en menos de 5 minutos
   */
  isTokenExpiring() {
    return !this.token || this.tokenExpiry <= Date.now() + 300000;
  }
}

// Exportar instancia singleton
export default new WatsonAuthService();
