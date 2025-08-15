// ===============================================
// 🚨 URGENCY ALERT - ALERTAS DE URGENCIA MÉDICA
// frontend/src/components/chat/UrgencyAlert.jsx
// ===============================================

import { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  Phone, 
  MapPin, 
  Clock, 
  Shield, 
  X,
  ExternalLink 
} from 'lucide-react';

const UrgencyAlert = ({ 
  urgencyLevel, 
  specialty, 
  reason, 
  onDismiss = null,
  showEmergencyActions = true,
  isVisible = true 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [shouldPulse, setShouldPulse] = useState(true);

  // Detener animación después de unos segundos
  useEffect(() => {
    const timer = setTimeout(() => setShouldPulse(false), 10000);
    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) return null;

  // Configuración por nivel de urgencia
  const getUrgencyConfig = (level) => {
    const configs = {
      1: {
        title: 'EMERGENCIA CRÍTICA',
        color: 'red',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-400',
        textColor: 'text-red-800',
        iconColor: 'text-red-500',
        gradientColor: 'from-red-100 to-red-200',
        priority: 'INMEDIATO',
        timeframe: 'Atención inmediata',
        action: 'Dirígete a emergencias AHORA'
      },
      2: {
        title: 'URGENCIA ALTA',
        color: 'orange',
        bgColor: 'bg-orange-50',
        borderColor: 'border-orange-400',
        textColor: 'text-orange-800',
        iconColor: 'text-orange-500',
        gradientColor: 'from-orange-100 to-orange-200',
        priority: 'MUY URGENTE',
        timeframe: '10-15 minutos',
        action: 'Busca atención médica urgente'
      },
      3: {
        title: 'ATENCIÓN URGENTE',
        color: 'yellow',
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-400',
        textColor: 'text-yellow-800',
        iconColor: 'text-yellow-600',
        gradientColor: 'from-yellow-100 to-yellow-200',
        priority: 'URGENTE',
        timeframe: '60 minutos',
        action: 'Programa cita médica hoy'
      }
    };
    
    return configs[level] || configs[3];
  };

  const config = getUrgencyConfig(urgencyLevel);

  return (
    <div className={`fixed top-4 right-4 z-50 max-w-sm w-full transform transition-all duration-500 ${
      isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
    }`}>
      <div className={`
        ${config.bgColor} ${config.borderColor} border-2 rounded-2xl shadow-2xl
        ${shouldPulse && urgencyLevel <= 2 ? 'animate-pulse' : ''}
        overflow-hidden backdrop-blur-sm
      `}>
        {/* Header */}
        <div className={`bg-gradient-to-r ${config.gradientColor} p-4`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className={`w-6 h-6 ${config.iconColor} ${
                urgencyLevel <= 2 ? 'animate-bounce' : ''
              }`} />
              <h3 className={`font-bold text-lg ${config.textColor}`}>
                {config.title}
              </h3>
            </div>
            
            {onDismiss && (
              <button
                onClick={onDismiss}
                className={`w-6 h-6 rounded-full ${config.textColor} hover:bg-white/20 flex items-center justify-center transition-colors`}
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Nivel y especialidad */}
          <div className="flex items-center gap-3">
            <div className={`px-3 py-1 bg-white/20 rounded-full text-sm font-medium ${config.textColor}`}>
              Nivel {urgencyLevel} - {config.priority}
            </div>
            <div className={`text-sm ${config.textColor}`}>
              {specialty}
            </div>
          </div>
        </div>

        {/* Contenido principal */}
        <div className="p-4">
          {/* Razón */}
          <div className="mb-4">
            <h4 className={`font-medium ${config.textColor} mb-1`}>Motivo:</h4>
            <p className="text-gray-700 text-sm">{reason}</p>
          </div>

          {/* Tiempo recomendado */}
          <div className="flex items-center gap-2 mb-4">
            <Clock className={`w-4 h-4 ${config.iconColor}`} />
            <span className={`text-sm font-medium ${config.textColor}`}>
              {config.timeframe}
            </span>
            <span className="text-gray-600 text-sm">recomendado</span>
          </div>

          {/* Acción recomendada */}
          <div className={`p-3 bg-white/50 rounded-lg border border-white/20 mb-4`}>
            <div className="flex items-center gap-2 mb-1">
              <Shield className={`w-4 h-4 ${config.iconColor}`} />
              <span className={`font-medium text-sm ${config.textColor}`}>
                Acción recomendada:
              </span>
            </div>
            <p className="text-gray-700 text-sm">{config.action}</p>
          </div>

          {/* Botón expandir/contraer */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={`w-full text-center text-sm ${config.textColor} hover:underline transition-colors mb-3`}
          >
            {isExpanded ? 'Menos información' : 'Más información'}
          </button>

          {/* Información expandida */}
          {isExpanded && (
            <div className="space-y-3 border-t border-white/20 pt-3">
              {/* Qué hacer */}
              <div>
                <h5 className={`font-medium ${config.textColor} text-sm mb-1`}>
                  Qué hacer mientras tanto:
                </h5>
                <ul className="text-xs text-gray-600 space-y-1">
                  {urgencyLevel <= 2 ? (
                    <>
                      <li>• Mantente en reposo</li>
                      <li>• No conduzcas</li>
                      <li>• Ten a alguien contigo</li>
                      <li>• Prepara tu documentación médica</li>
                    </>
                  ) : (
                    <>
                      <li>• Monitorea tus síntomas</li>
                      <li>• Evita actividad física intensa</li>
                      <li>• Mantente hidratado</li>
                      <li>• Anota cambios en síntomas</li>
                    </>
                  )}
                </ul>
              </div>

              {/* Señales de alarma */}
              <div>
                <h5 className={`font-medium ${config.textColor} text-sm mb-1`}>
                  Busca atención inmediata si:
                </h5>
                <ul className="text-xs text-gray-600 space-y-1">
                  <li>• Los síntomas empeoran</li>
                  <li>• Aparecen síntomas nuevos</li>
                  <li>• Tienes dificultad para respirar</li>
                  <li>• Pierdes el conocimiento</li>
                </ul>
              </div>
            </div>
          )}

          {/* Acciones de emergencia */}
          {showEmergencyActions && urgencyLevel <= 2 && (
            <div className="space-y-2">
              {/* Llamar emergencias */}
              <button
                onClick={() => window.open('tel:911', '_self')}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors"
              >
                <Phone className="w-4 h-4" />
                Llamar 911
              </button>

              {/* Ubicar hospital */}
              <button
                onClick={() => window.open('https://maps.google.com/search/hospital+cerca', '_blank')}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors"
              >
                <MapPin className="w-4 h-4" />
                Hospital más cercano
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 pb-4">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>Análisis Watson IA</span>
            <span>Protocolo Manchester</span>
          </div>
        </div>

        {/* Indicador de urgencia visual */}
        {urgencyLevel <= 2 && (
          <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${
            urgencyLevel === 1 ? 'from-red-400 to-red-600' : 'from-orange-400 to-orange-600'
          } ${shouldPulse ? 'animate-pulse' : ''}`}></div>
        )}
      </div>

      {/* Overlay de fondo para emergencias críticas */}
      {urgencyLevel === 1 && (
        <div className="fixed inset-0 bg-red-900/10 pointer-events-none z-40 animate-pulse"></div>
      )}

      {/* Estilos adicionales */}
      <style jsx>{`
        @keyframes emergencyPulse {
          0%, 100% { 
            opacity: 1; 
            transform: scale(1);
          }
          50% { 
            opacity: 0.8; 
            transform: scale(1.02);
          }
        }

        .emergency-pulse {
          animation: emergencyPulse 1.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default UrgencyAlert;