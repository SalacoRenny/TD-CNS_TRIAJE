// ===============================================
// 💬 CHAT MESSAGE COMPONENT - BURBUJA DE MENSAJE (AISANA)
// frontend/src/components/chat/ChatMessage.jsx
// ===============================================

import { useState, useEffect } from 'react';
import { 
  User, 
  Brain, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  Zap,
  Shield,
  Info,
  Heart,
  Activity,
  FileText,
  Award,
  Timer
} from 'lucide-react';

const ChatMessage = ({ 
  message, 
  isWatson = false, 
  showTimestamp = true,
  urgencyUpdate = null,
  isLatest = false,
  onRetry = null 
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  // Animación de entrada
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // ===============================================
  // 🎨 FUNCIONES DE ESTILO Y FORMATO
  // ===============================================

  // Función para formatear timestamp
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // ✅ ACTUALIZADO: Función para obtener tipo de mensaje y estilo
  const getMessageStyle = () => {
    if (!isWatson) {
      return {
        container: 'ml-auto bg-gradient-to-r from-blue-500 to-teal-600 text-white',
        maxWidth: 'max-w-xs sm:max-w-sm',
        align: 'text-right'
      };
    }

    // ✅ Estilos para mensajes de AISANA según tipo
    const styles = {
      welcome: {
        container: 'mr-auto bg-gradient-to-r from-green-50 to-teal-50 border-2 border-teal-300 text-gray-800',
        maxWidth: 'max-w-sm sm:max-w-md',
        align: 'text-left'
      },
      alert: {
        container: 'mr-auto bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-400 text-gray-800 shadow-lg',
        maxWidth: 'max-w-sm sm:max-w-md',
        align: 'text-left'
      },
      summary: {
        container: 'mr-auto bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-400 text-gray-800 shadow-lg',
        maxWidth: 'max-w-md sm:max-w-lg',
        align: 'text-left'
      },
      question: {
        container: 'mr-auto bg-white border-2 border-gray-300 text-gray-800 shadow-sm',
        maxWidth: 'max-w-sm sm:max-w-md',
        align: 'text-left'
      },
      classification: {
        container: 'mr-auto bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-400 text-gray-800 shadow-lg',
        maxWidth: 'max-w-md sm:max-w-lg',
        align: 'text-left'
      },
      emergency: {
        container: 'mr-auto bg-gradient-to-r from-red-100 to-red-50 border-2 border-red-500 text-gray-800 shadow-xl animate-pulse',
        maxWidth: 'max-w-sm sm:max-w-md',
        align: 'text-left'
      },
      text: {
        container: 'mr-auto bg-white border-2 border-gray-200 text-gray-800 shadow-sm',
        maxWidth: 'max-w-sm sm:max-w-md',
        align: 'text-left'
      }
    };

    return styles[message.messageType] || styles.text;
  };

  // ✅ NUEVO: Detectar y procesar clasificación Manchester en el mensaje
  const parseManchesterClassification = (content) => {
    // Detectar si el mensaje contiene una clasificación final
    const classificationPatterns = [
      /NIVEL (\d)-(\w+)-(\w+)/i,
      /Nivel (\d) - (\w+)/i,
      /Clasificación.*?Nivel (\d)/i
    ];

    for (const pattern of classificationPatterns) {
      const match = content.match(pattern);
      if (match) {
        const level = parseInt(match[1]);
        const color = match[2] || getLevelColorName(level);
        const specialty = match[3] || 'MEDICINA GENERAL';
        
        return {
          isClassification: true,
          level,
          color: color.toUpperCase(),
          specialty: expandSpecialtyName(specialty),
          urgencyInfo: getManchesterInfo(level)
        };
      }
    }

    return { isClassification: false };
  };

  // ✅ NUEVO: Obtener información del protocolo Manchester
  const getManchesterInfo = (level) => {
    const manchesterData = {
      1: {
        label: 'RIESGO VITAL INMEDIATO',
        color: '#DC2626',
        bgColor: '#FEF2F2',
        timeWait: 'Atención inmediata',
        colorName: 'ROJO',
        icon: <AlertTriangle className="w-5 h-5 text-red-600" />,
        urgency: 'CRÍTICO'
      },
      2: {
        label: 'MUY URGENTE',
        color: '#EA580C',
        bgColor: '#FFF7ED',
        timeWait: '10-15 minutos',
        colorName: 'NARANJA',
        icon: <Activity className="w-5 h-5 text-orange-600" />,
        urgency: 'MUY URGENTE'
      },
      3: {
        label: 'URGENTE',
        color: '#CA8A04',
        bgColor: '#FEFCE8',
        timeWait: '60 minutos',
        colorName: 'AMARILLO',
        icon: <Clock className="w-5 h-5 text-yellow-600" />,
        urgency: 'URGENTE'
      },
      4: {
        label: 'NORMAL',
        color: '#16A34A',
        bgColor: '#F0FDF4',
        timeWait: '2 horas',
        colorName: 'VERDE',
        icon: <CheckCircle className="w-5 h-5 text-green-600" />,
        urgency: 'NORMAL'
      },
      5: {
        label: 'NO URGENTE',
        color: '#2563EB',
        bgColor: '#EFF6FF',
        timeWait: '4 horas',
        colorName: 'AZUL',
        icon: <Info className="w-5 h-5 text-blue-600" />,
        urgency: 'NO URGENTE'
      }
    };

    return manchesterData[level] || manchesterData[5];
  };

  // ✅ NUEVO: Expandir nombres de especialidades
  const expandSpecialtyName = (shortName) => {
    const specialtyMap = {
      'CARDIO': 'CARDIOLOGÍA',
      'NEUROLOG': 'NEUROLOGÍA',
      'NEUROL': 'NEUROLOGÍA',
      'GASTRO': 'GASTROENTEROLOGÍA',
      'PNEUMOL': 'NEUMOLOGÍA',
      'NEUMO': 'NEUMOLOGÍA',
      'ORTOP': 'ORTOPEDIA',
      'DERMATO': 'DERMATOLOGÍA',
      'GINECO': 'GINECOLOGÍA',
      'PEDIAT': 'PEDIATRÍA',
      'OFTALMOL': 'OFTALMOLOGÍA',
      'OTORRINO': 'OTORRINOLARINGOLOGÍA',
      'UROL': 'UROLOGÍA',
      'MEDICINA': 'MEDICINA GENERAL',
      'GENERAL': 'MEDICINA GENERAL'
    };

    const normalized = shortName.toUpperCase();
    return specialtyMap[normalized] || shortName.toUpperCase();
  };

  // ✅ NUEVO: Obtener nombre de color del nivel
  const getLevelColorName = (level) => {
    const colors = { 1: 'ROJO', 2: 'NARANJA', 3: 'AMARILLO', 4: 'VERDE', 5: 'AZUL' };
    return colors[level] || 'AZUL';
  };

  // ===============================================
  // 🧩 COMPONENTES ESPECIALIZADOS
  // ===============================================

  // ✅ NUEVO: Componente para mostrar clasificación Manchester
  const ManchesterClassificationDisplay = ({ classification }) => {
    if (!classification.isClassification) return null;

    const urgencyInfo = classification.urgencyInfo;

    return (
      <div 
        className="mt-4 p-4 rounded-xl border-2 shadow-lg"
        style={{ 
          backgroundColor: urgencyInfo.bgColor,
          borderColor: urgencyInfo.color
        }}
      >
        {/* Header de clasificación */}
        <div className="flex items-center gap-3 mb-3">
          {urgencyInfo.icon}
          <div>
            <h4 className="text-lg font-bold" style={{ color: urgencyInfo.color }}>
              PROTOCOLO MANCHESTER
            </h4>
            <p className="text-sm text-gray-600">Clasificación de Emergencias</p>
          </div>
        </div>

        {/* Información principal */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Nivel y urgencia */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div 
                className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-lg"
                style={{ backgroundColor: urgencyInfo.color }}
              >
                {classification.level}
              </div>
              <div>
                <p className="font-semibold text-gray-800">
                  Nivel {classification.level}
                </p>
                <p 
                  className="text-sm font-medium"
                  style={{ color: urgencyInfo.color }}
                >
                  {urgencyInfo.label}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Timer className="w-4 h-4" />
              <span>Tiempo de espera: {urgencyInfo.timeWait}</span>
            </div>
          </div>

          {/* Especialidad */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-gray-600" />
              <div>
                <p className="text-sm text-gray-600">Especialidad recomendada</p>
                <p className="font-semibold text-gray-800">
                  {classification.specialty}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer con acción recomendada */}
        <div className="mt-4 pt-3 border-t border-gray-200">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">
              {getRecommendedAction(classification.level)}
            </span>
          </div>
        </div>
      </div>
    );
  };

  // ✅ NUEVO: Obtener acción recomendada según nivel
  const getRecommendedAction = (level) => {
    const actions = {
      1: 'Dirígete INMEDIATAMENTE a emergencias o llama al 911',
      2: 'Busca atención médica urgente en los próximos 10-15 minutos',
      3: 'Programa una cita médica urgente en las próximas horas',
      4: 'Programa una cita médica en los próximos días',
      5: 'Monitorea síntomas y consulta si persisten o empeoran'
    };
    return actions[level] || actions[5];
  };

  // Componente para mostrar alerta de urgencia
  const UrgencyUpdateAlert = () => {
    if (!urgencyUpdate) return null;

    const getUrgencyColor = (level) => {
      const colors = {
        1: { bg: 'bg-red-100', border: 'border-red-400', text: 'text-red-800', icon: 'text-red-500' },
        2: { bg: 'bg-orange-100', border: 'border-orange-400', text: 'text-orange-800', icon: 'text-orange-500' },
        3: { bg: 'bg-yellow-100', border: 'border-yellow-400', text: 'text-yellow-800', icon: 'text-yellow-500' }
      };
      return colors[level] || colors[3];
    };

    const colors = getUrgencyColor(urgencyUpdate.newLevel);

    return (
      <div className={`mt-3 p-3 rounded-lg border-2 ${colors.bg} ${colors.border}`}>
        <div className="flex items-center gap-2 mb-1">
          <AlertTriangle className={`w-4 h-4 ${colors.icon}`} />
          <span className={`text-sm font-bold ${colors.text}`}>
            AISANA - Urgencia Actualizada
          </span>
        </div>
        <p className={`text-xs ${colors.text}`}>
          Nivel {urgencyUpdate.previousLevel} → Nivel {urgencyUpdate.newLevel}
        </p>
        <p className={`text-xs ${colors.text} mt-1`}>
          {urgencyUpdate.newSpecialty}
        </p>
        {urgencyUpdate.requiresAttention && (
          <div className="flex items-center gap-1 mt-2">
            <Shield className={`w-3 h-3 ${colors.icon}`} />
            <span className={`text-xs font-medium ${colors.text}`}>
              Requiere atención prioritaria
            </span>
          </div>
        )}
      </div>
    );
  };

  // ✅ ACTUALIZADO: Componente para metadatos de AISANA
  const AisanaMetadata = () => {
  if (!isWatson || !showDetails) return null;

  return (
    <div className="mt-2 p-2 bg-gray-50 rounded border text-xs text-gray-600">
      <div className="flex items-center gap-2 mb-1">
        <Brain className="w-3 h-3" />
        <span className="font-medium">Análisis AISANA</span>
      </div>
      
      {/* ✅ EXISTENTE - mantener */}
      {message.watsonResponse?.processingTime && (
        <p>Tiempo de procesamiento: {message.watsonResponse.processingTime}ms</p>
      )}
      {message.watsonResponse?.tokensUsed && (
        <p>Tokens utilizados: {message.watsonResponse.tokensUsed}</p>
      )}
      <p>Tipo de mensaje: {message.messageType}</p>
      
      {/* 🆕 NUEVAS LÍNEAS - agregar después de las existentes */}
      
      {/* Indicador de memoria contextual */}
      {message.hasHistoricalContext && (
        <div className="flex items-center gap-1 text-green-600">
          <FileText className="w-3 h-3" />
          <span>✨ Contexto histórico aplicado</span>
        </div>
      )}
      
      {/* Fase de conversación */}
      {message.conversationPhase !== undefined && (
        <p>
          Fase de conversación: {getPhaseLabel(message.conversationPhase)}
        </p>
      )}
      
      {/* Personalización de saludo */}
      {message.personalizedGreeting && (
        <div className="flex items-center gap-1 text-blue-600">
          <Zap className="w-3 h-3" />
          <span>✨ Saludo personalizado basado en historial</span>
        </div>
      )}
      
      {/* Información del paciente conocido */}
      {message.isReturningPatient && (
        <div className="flex items-center gap-1 text-purple-600">
          <Award className="w-3 h-3" />
          <span>👋 Paciente conocido detectado</span>
        </div>
      )}
      
      {/* ✅ MANTENER líneas existentes */}
      {message.hasPatientHistory && (
        <p>📚 Contexto médico aplicado</p>
      )}
    </div>
  );
};

// 🆕 NUEVA FUNCIÓN - agregar después del componente AisanaMetadata
const getPhaseLabel = (phase) => {
  const phases = {
    0: 'Saludo inicial',
    1: 'Recolección de síntomas',
    2: 'Análisis de detalles', 
    3: 'Evaluación final',
    4: 'Clasificación Manchester'
  };
  return phases[phase] || 'Conversación';
};

  // ===============================================
  // 🎨 PROCESAMIENTO DEL CONTENIDO
  // ===============================================

  const messageStyle = getMessageStyle();
  const classification = parseManchesterClassification(message.content);

  return (
    <div 
      className={`flex items-end gap-3 mb-4 transition-all duration-500 ease-out transform ${
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
      } ${isLatest ? 'animate-pulse-once' : ''}`}
    >
      {/* Avatar */}
      <div className={`flex-shrink-0 ${isWatson ? 'order-1' : 'order-2'}`}>
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
          isWatson 
            ? 'bg-gradient-to-r from-teal-500 to-cyan-600 text-white' 
            : 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
        }`}>
          {isWatson ? (
            <Brain className="w-4 h-4" />
          ) : (
            <User className="w-4 h-4" />
          )}
        </div>
        
        {/* ✅ ACTUALIZADO: Indicador de tipo de mensaje para AISANA */}
        {isWatson && message.messageType !== 'text' && (
          <div className="text-center mt-1">
            {message.messageType === 'welcome' && (
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            )}
            {message.messageType === 'alert' && (
              <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
            )}
            {message.messageType === 'summary' && (
              <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
            )}
            {message.messageType === 'classification' && (
              <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
            )}
            {message.messageType === 'emergency' && (
              <div className="w-2 h-2 bg-red-500 rounded-full animate-ping"></div>
            )}
          </div>
        )}
      </div>

      {/* Mensaje */}
      <div className={`${messageStyle.maxWidth} ${isWatson ? 'order-2' : 'order-1'}`}>
        {/* Header del mensaje */}
        <div className={`flex items-center gap-2 mb-1 ${messageStyle.align}`}>
          <span className="text-xs font-medium text-gray-500">
            {isWatson ? 'AISANA IA' : 'Tú'}
          </span>
          
          {showTimestamp && (
            <span className="text-xs text-gray-400">
              {formatTime(message.timestamp)}
            </span>
          )}
          
          {/* ✅ ACTUALIZADO: Indicadores especiales */}
          {/* ✅ ACTUALIZADO: Indicadores especiales - ENCONTRAR ESTA SECCIÓN Y AGREGAR */}
          {isWatson && message.messageType === 'welcome' && (
            <div className="flex items-center gap-1">
              <Zap className="w-3 h-3 text-green-500" />
              <span className="text-xs text-green-600">
                {/* 🆕 MEJORADO: Detectar si es saludo personalizado */}
                {message.hasHistoricalContext || message.isReturningPatient ? 
                  'Paciente conocido' : 
                  message.personalizedGreeting ? 'Saludo personalizado' : 'Bienvenida'
                }
              </span>
            </div>
          )}
          {/* 🆕 NUEVO: Indicador de memoria contextual */}
          {isWatson && message.hasHistoricalContext && (
            <div className="flex items-center gap-1">
              <FileText className="w-3 h-3 text-purple-500" />
              <span className="text-xs text-purple-600">Con historial</span>
            </div>
          )}
          
          {urgencyUpdate && (
            <AlertTriangle className="w-3 h-3 text-orange-500 animate-bounce" />
          )}

          {classification.isClassification && (
            <div className="flex items-center gap-1">
              <FileText className="w-3 h-3 text-purple-500" />
              <span className="text-xs text-purple-600">Clasificación</span>
            </div>
          )}
        </div>

        {/* Contenido del mensaje */}
        <div 
          className={`${messageStyle.container} ${messageStyle.maxWidth} rounded-2xl p-3 shadow-sm hover:shadow-md transition-shadow duration-200`}
        >
          {/* Texto principal */}
          <div className="whitespace-pre-wrap leading-relaxed">
            {message.content}
          </div>

          {/* ✅ NUEVO: Mostrar información extraída (para mensajes de usuario) */}
          {!isWatson && message.extractedInfo && Object.keys(message.extractedInfo).some(key => 
            Array.isArray(message.extractedInfo[key]) ? message.extractedInfo[key].length > 0 : message.extractedInfo[key]
          ) && (
            <div className="mt-2 pt-2 border-t border-white/20">
              <div className="flex items-center gap-1 text-xs text-white/80 mb-1">
                <Info className="w-3 h-3" />
                <span>Información procesada por AISANA</span>
              </div>
              <div className="text-xs text-white/70 space-y-1">
                {message.extractedInfo.symptoms?.length > 0 && (
                  <div>• Síntomas: {message.extractedInfo.symptoms.join(', ')}</div>
                )}
                {message.extractedInfo.painLevel && (
                  <div>• Nivel de dolor: {message.extractedInfo.painLevel}/10</div>
                )}
                {message.extractedInfo.vitalSigns?.temperature && (
                  <div>• Temperatura: {message.extractedInfo.vitalSigns.temperature}°C</div>
                )}
              </div>
            </div>
          )}

          {/* ✅ ACTUALIZADO: Footer para mensajes de AISANA */}
          {isWatson && (
            <div className="mt-2 pt-2 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Shield className="w-3 h-3" />
                  <span>AISANA - Análisis médico IA</span>
                  {message.hasPatientHistory && (
                    <span className="text-teal-600">• Con historial</span>
                  )}
                </div>
                
                {/* Botón para mostrar detalles */}
                <button
                  onClick={() => setShowDetails(!showDetails)}
                  className="text-xs text-teal-600 hover:text-teal-700 transition-colors"
                >
                  {showDetails ? 'Ocultar' : 'Detalles'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ✅ NUEVO: Mostrar clasificación Manchester si existe */}
        <ManchesterClassificationDisplay classification={classification} />

        {/* Alerta de urgencia */}
        <UrgencyUpdateAlert />

        {/* Metadatos de AISANA */}
        <AisanaMetadata />

        {/* Botón de reintentar (para errores) */}
        {onRetry && (
          <div className="mt-2 text-center">
            <button
              onClick={onRetry}
              className="text-xs text-red-500 hover:text-red-700 underline transition-colors"
            >
              Reintentar mensaje
            </button>
          </div>
        )}
      </div>

      {/* Espacio para alineación */}
      <div className={`flex-shrink-0 w-8 ${isWatson ? 'order-3' : 'order-0'}`}></div>

      {/* ✅ ESTILOS CSS ESPECÍFICOS */}
      <style jsx>{`
        @keyframes pulse-once {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        
        .animate-pulse-once {
          animation: pulse-once 0.6s ease-in-out;
        }

        @keyframes bounce {
          0%, 20%, 53%, 80%, 100% {
            transform: translate3d(0,0,0);
          }
          40%, 43% {
            transform: translate3d(0,-30px,0);
          }
          70% {
            transform: translate3d(0,-15px,0);
          }
          90% {
            transform: translate3d(0,-4px,0);
          }
        }

        @keyframes ping {
          75%, 100% {
            transform: scale(2);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default ChatMessage;