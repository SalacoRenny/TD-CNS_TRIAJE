// ===============================================
// ⏳ TYPING INDICATOR - WATSON ESTÁ PENSANDO
// frontend/src/components/chat/TypingIndicator.jsx
// ===============================================

import { Brain, Sparkles, Zap } from 'lucide-react';

const TypingIndicator = ({ 
  message = "Watson está analizando...", 
  showProgress = false,
  processingStep = "",
  isVisible = true 
}) => {
  
  if (!isVisible) return null;

  return (
    <div className="flex items-end gap-3 mb-4 animate-fade-in">
      {/* Avatar de Watson */}
      <div className="flex-shrink-0">
        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-cns to-teal-600 text-white flex items-center justify-center">
          <Brain className="w-4 h-4 animate-pulse" />
        </div>
        {/* Indicador de actividad */}
        <div className="text-center mt-1">
          <div className="w-2 h-2 bg-cns rounded-full animate-ping"></div>
        </div>
      </div>

      {/* Contenedor del mensaje */}
      <div className="max-w-sm sm:max-w-md">
        {/* Header */}
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-medium text-gray-500">Watson IA</span>
          <div className="flex items-center gap-1">
            <div className="w-1 h-1 bg-cns rounded-full animate-bounce"></div>
            <div className="w-1 h-1 bg-cns rounded-full animate-bounce delay-100"></div>
            <div className="w-1 h-1 bg-cns rounded-full animate-bounce delay-200"></div>
          </div>
        </div>

        {/* Burbuja de typing */}
        <div className="bg-white border-2 border-gray-200 rounded-2xl p-4 shadow-sm relative overflow-hidden">
          {/* Efecto de "pensando" */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cns/5 to-transparent animate-shimmer"></div>
          
          <div className="relative z-10">
            {/* Mensaje principal */}
            <div className="flex items-center gap-3 mb-2">
              <div className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-cns animate-pulse" />
                <Sparkles className="w-4 h-4 text-teal-500 animate-spin" />
              </div>
              <span className="text-gray-700 font-medium">{message}</span>
            </div>

            {/* Paso de procesamiento específico */}
            {processingStep && (
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                <Zap className="w-4 h-4 text-yellow-500" />
                <span>{processingStep}</span>
              </div>
            )}

            {/* Animación de puntos de typing */}
            <div className="flex items-center gap-1">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-cns rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-cns rounded-full animate-bounce delay-150"></div>
                <div className="w-2 h-2 bg-cns rounded-full animate-bounce delay-300"></div>
              </div>
              <span className="text-xs text-gray-500 ml-2">Analizando síntomas</span>
            </div>

            {/* Barra de progreso (opcional) */}
            {showProgress && (
              <div className="mt-3">
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div className="bg-gradient-to-r from-cns to-teal-500 h-1.5 rounded-full animate-progress"></div>
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Procesando</span>
                  <span>IA Médica</span>
                </div>
              </div>
            )}

            {/* Indicadores de capacidades Watson */}
            <div className="mt-3 pt-2 border-t border-gray-100">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
                  <span>Protocolo Manchester</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
                  <span>Memoria contextual</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Indicador de tiempo estimado */}
        <div className="mt-2 text-center">
          <span className="text-xs text-gray-400">
            Tiempo estimado: ~2 segundos
          </span>
        </div>
      </div>

      {/* Espacio para alineación */}
      <div className="flex-shrink-0 w-8"></div>

      {/* Estilos CSS personalizados */}
      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }

        @keyframes progress {
          0% {
            width: 0%;
          }
          50% {
            width: 60%;
          }
          100% {
            width: 100%;
          }
        }

        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }

        .animate-shimmer {
          animation: shimmer 2s infinite;
        }

        .animate-progress {
          animation: progress 3s ease-in-out infinite;
        }

        .delay-100 {
          animation-delay: 0.1s;
        }

        .delay-150 {
          animation-delay: 0.15s;
        }

        .delay-200 {
          animation-delay: 0.2s;
        }

        .delay-300 {
          animation-delay: 0.3s;
        }
      `}</style>
    </div>
  );
};

export default TypingIndicator;