// ===============================================
// 🗣️ CHAT TRIAGE PAGE - PÁGINA PRINCIPAL DEL CHAT
// frontend/src/pages/ChatTriagePage.jsx
// ===============================================

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Brain, 
  MessageCircle, 
  ArrowLeft, 
  History, 
  BarChart3,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';

import ChatTriage from '../components/chat/ChatTriage';
import { useUser } from '../context/UserContext';
import { getConversationHistory, getConversationStats } from '../services/chatTriageApi';

const ChatTriagePage = () => {
  const { user } = useUser();
  const navigate = useNavigate();
  
  const [userStats, setUserStats] = useState(null);
  const [recentHistory, setRecentHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  // Cargar estadísticas del usuario
  useEffect(() => {
    if (user?.id) {
      loadUserData();
    }
  }, [user]);

  const loadUserData = async () => {
    try {
      setIsLoadingStats(true);
      
      // Cargar estadísticas y historial en paralelo
      const [statsResult, historyResult] = await Promise.all([
        getConversationStats(user.id),
        getConversationHistory(user.id, { limit: 3 })
      ]);

      if (statsResult.success) {
        setUserStats(statsResult.conversationStats);
      }

      if (historyResult.success) {
        setRecentHistory(historyResult.conversations);
      }

    } catch (error) {
      console.error('❌ Error cargando datos del usuario:', error);
    } finally {
      setIsLoadingStats(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getUrgencyColor = (level) => {
    const colors = {
      1: 'text-red-600 bg-red-100',
      2: 'text-orange-600 bg-orange-100',
      3: 'text-yellow-600 bg-yellow-100',
      4: 'text-green-600 bg-green-100',
      5: 'text-blue-600 bg-blue-100'
    };
    return colors[level] || colors[5];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50 to-green-100">
      {/* Header de la página */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Navegación */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/')}
                className="flex items-center gap-2 text-gray-600 hover:text-cns transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Volver al inicio</span>
              </button>
              
              <div className="h-6 w-px bg-gray-300"></div>
              
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-r from-cns to-teal-600 rounded-lg flex items-center justify-center">
                  <Brain className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-gray-800">
                    Chat Médico Watson IA
                  </h1>
                  <p className="text-sm text-gray-500">
                    Evaluación inteligente de síntomas
                  </p>
                </div>
              </div>
            </div>

            {/* Acciones */}
            <div className="flex items-center gap-3">
              {/* Botón de historial */}
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-sm"
              >
                <History className="w-4 h-4" />
                <span>Historial</span>
                {recentHistory.length > 0 && (
                  <span className="bg-cns text-white text-xs px-2 py-0.5 rounded-full">
                    {recentHistory.length}
                  </span>
                )}
              </button>

              {/* Estadísticas rápidas */}
              {userStats && (
                <div className="hidden md:flex items-center gap-4 text-sm text-gray-600 bg-gray-50 px-4 py-2 rounded-lg">
                  <div className="flex items-center gap-1">
                    <MessageCircle className="w-4 h-4" />
                    <span>{userStats.totalConversations || 0} consultas</span>
                  </div>
                  {userStats.emergencyDetections > 0 && (
                    <div className="flex items-center gap-1 text-red-600">
                      <AlertCircle className="w-4 h-4" />
                      <span>{userStats.emergencyDetections} emergencias</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="max-w-7xl mx-auto">
        <div className="flex">
          {/* Panel lateral (historial/stats) */}
          {showHistory && (
            <div className="w-80 bg-white border-r border-gray-200 h-screen overflow-y-auto">
              <div className="p-4">
                <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <History className="w-5 h-5" />
                  Historial de Consultas
                </h2>

                {/* Estadísticas del usuario */}
                {userStats && (
                  <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-teal-50 rounded-lg border border-cns/20">
                    <h3 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
                      <BarChart3 className="w-4 h-4" />
                      Tus Estadísticas
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total consultas:</span>
                        <span className="font-medium">{userStats.totalConversations || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Completadas:</span>
                        <span className="font-medium">{userStats.completedConversations || 0}</span>
                      </div>
                      {userStats.avgUrgencyLevel && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Urgencia promedio:</span>
                          <span className="font-medium">Nivel {userStats.avgUrgencyLevel.toFixed(1)}</span>
                        </div>
                      )}
                      {userStats.firstConversation && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Primera consulta:</span>
                          <span className="font-medium text-xs">
                            {formatDate(userStats.firstConversation)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Lista de conversaciones recientes */}
                <div className="space-y-3">
                  {isLoadingStats ? (
                    <div className="space-y-3">
                      {[1,2,3].map(i => (
                        <div key={i} className="p-3 bg-gray-100 rounded-lg animate-pulse">
                          <div className="h-4 bg-gray-200 rounded mb-2"></div>
                          <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                        </div>
                      ))}
                    </div>
                  ) : recentHistory.length > 0 ? (
                    recentHistory.map((conversation) => (
                      <div
                        key={conversation.conversationId}
                        className="p-3 border border-gray-200 rounded-lg hover:border-cns/30 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className={`text-xs px-2 py-1 rounded-full ${getUrgencyColor(conversation.currentUrgencyLevel)}`}>
                            Nivel {conversation.currentUrgencyLevel}
                          </span>
                          <span className="text-xs text-gray-500">
                            {formatDate(conversation.startedAt)}
                          </span>
                        </div>
                        
                        <div className="text-sm">
                          <p className="font-medium text-gray-700 truncate">
                            {conversation.chiefComplaint || 'Consulta médica'}
                          </p>
                          <p className="text-gray-500 text-xs">
                            {conversation.currentSpecialty}
                          </p>
                        </div>
                        
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center gap-1">
                            {conversation.status === 'completed' ? (
                              <CheckCircle className="w-3 h-3 text-green-500" />
                            ) : (
                              <Clock className="w-3 h-3 text-yellow-500" />
                            )}
                            <span className="text-xs text-gray-500 capitalize">
                              {conversation.status === 'completed' ? 'Completada' : 'En progreso'}
                            </span>
                          </div>
                          
                          {conversation.emergencyDetected && (
                            <div className="flex items-center gap-1 text-red-600">
                              <AlertCircle className="w-3 h-3" />
                              <span className="text-xs">Emergencia</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p className="text-sm">No hay consultas previas</p>
                      <p className="text-xs">Esta será tu primera consulta</p>
                    </div>
                  )}
                </div>

                {/* Enlace al historial completo */}
                {recentHistory.length > 0 && (
                  <div className="mt-6 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => navigate('/history')}
                      className="w-full text-center text-sm text-cns hover:text-teal-600 transition-colors"
                    >
                      Ver historial completo →
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Área principal del chat */}
          <div className={`flex-1 ${showHistory ? 'max-w-none' : 'max-w-4xl mx-auto'}`}>
            <div className="h-screen">
              <ChatTriage />
            </div>
          </div>
        </div>
      </div>

      {/* Información flotante para primera vez */}
      {(!userStats || userStats.totalConversations === 0) && (
        <div className="fixed bottom-6 left-6 max-w-sm bg-white border-2 border-cns/30 rounded-xl shadow-xl p-4 z-30">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-gradient-to-r from-cns to-teal-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <Brain className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-medium text-gray-800 mb-1">
                ¡Bienvenido al Chat Médico IA!
              </h3>
              <p className="text-sm text-gray-600">
                Watson IA analizará tus síntomas según protocolos médicos profesionales. 
                Describe cómo te sientes para comenzar.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Estilos adicionales */}
      <style jsx>{`
        /* Smooth scrolling */
        .overflow-y-auto {
          scrollbar-width: thin;
          scrollbar-color: #CBD5E0 transparent;
        }
        
        .overflow-y-auto::-webkit-scrollbar {
          width: 6px;
        }
        
        .overflow-y-auto::-webkit-scrollbar-track {
          background: transparent;
        }
        
        .overflow-y-auto::-webkit-scrollbar-thumb {
          background-color: #CBD5E0;
          border-radius: 3px;
        }
        
        .overflow-y-auto::-webkit-scrollbar-thumb:hover {
          background-color: #9CA3AF;
        }
      `}</style>
    </div>
  );
};

export default ChatTriagePage;