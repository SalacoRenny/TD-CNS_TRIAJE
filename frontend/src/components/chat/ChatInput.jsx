// ===============================================
// ✏️ CHAT INPUT - CAMPO DE ESCRITURA DE MENSAJES
// frontend/src/components/chat/ChatInput.jsx
// ===============================================

import { useState, useRef, useEffect } from 'react';
import { Send, Mic, Paperclip, Smile, AlertCircle } from 'lucide-react';
import { validateMessage } from '../../services/chatTriageApi';

const ChatInput = ({ 
  onSendMessage, 
  disabled = false, 
  placeholder = "Describe cómo te sientes...",
  showSuggestedQuestions = false,
  suggestedQuestions = [],
  maxLength = 2000
}) => {
  const [message, setMessage] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [validation, setValidation] = useState({ isValid: true, error: '' });
  const textareaRef = useRef(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message]);

  // Validar mensaje en tiempo real
  useEffect(() => {
    if (message.trim().length > 0) {
      const result = validateMessage(message);
      setValidation(result);
    } else {
      setValidation({ isValid: true, error: '' });
    }
  }, [message]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (disabled) return;
    
    const result = validateMessage(message);
    if (!result.isValid) {
      setValidation(result);
      return;
    }

    if (onSendMessage) {
      onSendMessage(result.message);
      setMessage('');
      setValidation({ isValid: true, error: '' });
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleSuggestedQuestion = (question) => {
    if (onSendMessage) {
      onSendMessage(question);
    }
  };

  const characterCount = message.length;
  const isOverLimit = characterCount > maxLength;
  const isNearLimit = characterCount > maxLength * 0.8;

  return (
    <div className="bg-white border-t border-gray-200 p-4">
      {/* Preguntas sugeridas */}
      {showSuggestedQuestions && suggestedQuestions.length > 0 && (
        <div className="mb-4">
          <div className="text-sm text-gray-600 mb-2 flex items-center gap-2">
            <Smile className="w-4 h-4" />
            <span>Preguntas sugeridas:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {suggestedQuestions.map((question, index) => (
              <button
                key={index}
                onClick={() => handleSuggestedQuestion(question)}
                disabled={disabled}
                className="px-3 py-1.5 text-sm bg-gradient-to-r from-green-50 to-teal-50 border border-cns/30 rounded-full text-cns hover:from-cns/10 hover:to-teal-100 hover:border-cns/50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {question}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input principal */}
      <form onSubmit={handleSubmit} className="relative">
        <div className={`relative bg-gray-50 rounded-2xl border-2 transition-all duration-200 ${
          isFocused 
            ? 'border-cns shadow-lg shadow-cns/10' 
            : 'border-gray-200 hover:border-gray-300'
        } ${validation.isValid ? '' : 'border-red-300 bg-red-50'}`}>
          
          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            disabled={disabled}
            placeholder={disabled ? "Esperando respuesta..." : placeholder}
            className="w-full px-4 py-3 pr-16 bg-transparent border-none outline-none resize-none max-h-32 placeholder-gray-400 disabled:cursor-not-allowed"
            rows={1}
            style={{ minHeight: '48px' }}
          />

          {/* Botón de enviar */}
          <div className="absolute right-2 bottom-2">
            <button
              type="submit"
              disabled={disabled || !message.trim() || !validation.isValid}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 ${
                disabled || !message.trim() || !validation.isValid
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-gradient-to-r from-cns to-teal-600 hover:from-cns/90 hover:to-teal-700 hover:scale-105 active:scale-95 shadow-md hover:shadow-lg'
              }`}
            >
              <Send className={`w-4 h-4 ${
                disabled || !message.trim() || !validation.isValid ? 'text-gray-500' : 'text-white'
              }`} />
            </button>
          </div>

          {/* Indicador de estado de escritura */}
          {isFocused && message.trim() && (
            <div className="absolute left-3 top-1 text-xs text-cns">
              Watson analizará tu mensaje...
            </div>
          )}
        </div>

        {/* Footer del input */}
        <div className="flex items-center justify-between mt-2 px-1">
          {/* Contador de caracteres */}
          <div className="flex items-center gap-2 text-xs">
            <span className={`${
              isOverLimit ? 'text-red-500' : 
              isNearLimit ? 'text-yellow-500' : 
              'text-gray-500'
            }`}>
              {characterCount}/{maxLength}
            </span>
            
            {isOverLimit && (
              <div className="flex items-center gap-1 text-red-500">
                <AlertCircle className="w-3 h-3" />
                <span>Mensaje muy largo</span>
              </div>
            )}
          </div>

          {/* Indicadores y ayudas */}
          <div className="flex items-center gap-3 text-xs text-gray-500">
            {/* Indicador de validación */}
            {!validation.isValid && (
              <div className="flex items-center gap-1 text-red-500">
                <AlertCircle className="w-3 h-3" />
                <span>{validation.error}</span>
              </div>
            )}

            {/* Ayuda de teclado */}
            {!disabled && (
              <span className="hidden sm:block">
                Enter para enviar, Shift+Enter para nueva línea
              </span>
            )}

            {/* Estado de Watson */}
            {disabled && (
              <div className="flex items-center gap-1 text-cns">
                <div className="w-2 h-2 bg-cns rounded-full animate-pulse"></div>
                <span>Watson procesando...</span>
              </div>
            )}
          </div>
        </div>

        {/* Indicadores médicos */}
        <div className="mt-3 p-3 bg-gradient-to-r from-green-50 to-teal-50 rounded-lg border border-cns/20">
          <div className="text-xs text-gray-700">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 bg-cns rounded-full"></div>
              <span className="font-medium">Información médica segura</span>
            </div>
            <p className="text-gray-600">
              Describe tus síntomas con detalle. Watson IA analizará tu información según 
              protocolos médicos profesionales y mantendrá tu privacidad.
            </p>
          </div>
        </div>

        {/* Ejemplos de mensajes */}
        {!message && !disabled && (
          <div className="mt-3 text-xs text-gray-500">
            <div className="flex items-center gap-1 mb-1">
              <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
              <span className="font-medium">Ejemplos:</span>
            </div>
            <div className="space-y-1">
              <p>"Me duele la cabeza desde ayer, intensidad 7/10"</p>
              <p>"Tengo fiebre 38.5°C y dolor de garganta"</p>
              <p>"Siento palpitaciones y mareos al caminar"</p>
            </div>
          </div>
        )}
      </form>

      {/* Estilos adicionales */}
      <style jsx>{`
        /* Animación del placeholder cuando está enfocado */
        textarea:focus::placeholder {
          color: #9CA3AF;
          transition: color 0.2s ease;
        }

        /* Scroll suave para textarea */
        textarea {
          scrollbar-width: thin;
          scrollbar-color: #CBD5E0 transparent;
        }

        textarea::-webkit-scrollbar {
          width: 4px;
        }

        textarea::-webkit-scrollbar-track {
          background: transparent;
        }

        textarea::-webkit-scrollbar-thumb {
          background-color: #CBD5E0;
          border-radius: 2px;
        }

        textarea::-webkit-scrollbar-thumb:hover {
          background-color: #9CA3AF;
        }
      `}</style>
    </div>
  );
};

export default ChatInput;