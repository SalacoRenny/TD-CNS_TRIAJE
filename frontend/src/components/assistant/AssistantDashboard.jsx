import React, { useState, useEffect } from 'react';
import { useUser } from '../../context/UserContext';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  FileText, 
  Activity,
  Stethoscope,
  Search,
  Plus,
  Clock,
  CheckCircle,
  AlertCircle,
  History, // 🆕 Para historial
  Award,   // 🆕 Para éxitos
  TrendingUp, // 🆕 Para estadísticas
  Target,     // 🆕 Para eficiencia
  Bot,        // 🆕 Para Watson
  Zap         // 🆕 Para rapidez
} from 'lucide-react';
import { getAllPatients } from '../../services/api';

// 🚨 IMPORTANTE: Agregar este import cuando esté el endpoint
// import { getAssistantStats } from '../../services/api';

const AssistantDashboard = () => {
  const { user } = useUser();
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // 🆕 ESTADOS PARA ESTADÍSTICAS DE ASISTENCIAS
  const [assistanceStats, setAssistanceStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    loadPatients();
    loadAssistanceStats(); // 🆕 Cargar estadísticas de asistencias
  }, []);

  const loadPatients = async () => {
    try {
      setLoading(true);
      const response = await getAllPatients({ limit: 20 });
      setPatients(response.data.patients || []);
    } catch (error) {
      console.error('Error cargando pacientes:', error);
    } finally {
      setLoading(false);
    }
  };

  // 🆕 FUNCIÓN PARA CARGAR ESTADÍSTICAS DE ASISTENCIAS
  const loadAssistanceStats = async () => {
    try {
      setStatsLoading(true);
      
      // 🚨 REEMPLAZAR CON API REAL:
      // const response = await getAssistantStats({
      //   assistantId: user._id,
      //   period: '7days'
      // });
      // setAssistanceStats(response.data);

      // 🔧 DATOS SIMULADOS - REEMPLAZAR CON API REAL
      await new Promise(resolve => setTimeout(resolve, 1000));
      setAssistanceStats({
        totalTriagesAssisted: 15,
        todayTriages: 3,
        thisWeekTriages: 8,
        avgProcessingTime: 2.1,
        watsonUsageRate: 73.3,
        successRate: 96.7,
        urgencyBreakdown: {
          level1: 2,  // Inmediatos
          level2: 4,  // Muy urgentes
          level3: 5,  // Urgentes
          level4: 3,  // Menos urgentes
          level5: 1   // No urgentes
        },
        recentTriages: [
          {
            patientName: 'María González',
            urgencyLevel: 2,
            specialty: 'Cardiología',
            assistedAt: '2024-08-14T08:30:00Z',
            status: 'completed'
          },
          {
            patientName: 'Carlos López',
            urgencyLevel: 4,
            specialty: 'Medicina General',
            assistedAt: '2024-08-14T09:15:00Z',
            status: 'in_progress'
          }
        ]
      });
      
    } catch (error) {
      console.error('Error cargando estadísticas de asistencias:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  const filteredPatients = patients.filter(patient =>
    patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.ci.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.userId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleTriagePatient = (patient) => {
    navigate(`/assistant-triage/${patient.userId}`);
  };

  // 🔧 ESTADÍSTICAS MEJORADAS CON DATOS DE ASISTENCIAS
  const stats = [
    {
      name: 'Total Pacientes',
      value: patients.length,
      icon: Users,
      color: 'bg-blue-500',
      description: 'Pacientes disponibles'
    },
    {
      name: 'Con Historial',
      value: patients.filter(p => p.hasHistory).length,
      icon: FileText,
      color: 'bg-green-500',
      description: 'Con datos previos'
    },
    // 🆕 MÉTRICAS DE ASISTENCIAS
    {
      name: 'Asistencias Totales',
      value: assistanceStats?.totalTriagesAssisted || 0,
      icon: Stethoscope,
      color: 'bg-emerald-500',
      description: 'Triajes completados',
      isNew: true
    },
    {
      name: 'Hoy',
      value: assistanceStats?.todayTriages || 0,
      icon: Clock,
      color: 'bg-purple-500',
      description: 'Asistencias de hoy',
      isNew: true
    }
  ];

  // 🆕 MÉTRICAS AVANZADAS DE RENDIMIENTO
  const performanceStats = [
    {
      name: 'Tiempo Promedio',
      value: `${assistanceStats?.avgProcessingTime || 0}min`,
      icon: Zap,
      color: 'text-yellow-600 bg-yellow-100',
      trend: 'improving'
    },
    {
      name: 'Uso Watson IA',
      value: `${assistanceStats?.watsonUsageRate || 0}%`,
      icon: Bot,
      color: 'text-purple-600 bg-purple-100',
      trend: 'stable'
    },
    {
      name: 'Tasa de Éxito',
      value: `${assistanceStats?.successRate || 0}%`,
      icon: Award,
      color: 'text-green-600 bg-green-100',
      trend: 'improving'
    },
    {
      name: 'Esta Semana',
      value: assistanceStats?.thisWeekTriages || 0,
      icon: TrendingUp,
      color: 'text-blue-600 bg-blue-100',
      trend: 'stable'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header Mejorado */}
      <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl shadow-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">
              Bienvenido, {user?.firstName || 'Asistente'}
            </h1>
            <p className="text-emerald-100 mt-2 text-lg">
              Panel de control para asistente de triaje médico • Sistema AISANA
            </p>
            {/* 🆕 RESUMEN RÁPIDO DE HOY */}
            {assistanceStats && !statsLoading && (
              <div className="mt-4 flex items-center gap-6 text-emerald-100">
                <div className="flex items-center gap-2">
                  <Stethoscope className="w-5 h-5" />
                  <span>{assistanceStats.todayTriages} asistencias hoy</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  <span>{assistanceStats.avgProcessingTime}min promedio</span>
                </div>
                <div className="flex items-center gap-2">
                  <Bot className="w-5 h-5" />
                  <span>{assistanceStats.watsonUsageRate}% con Watson</span>
                </div>
              </div>
            )}
          </div>
          <div className="flex items-center space-x-4">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
              <Stethoscope className="h-10 w-10 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards Principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.name} className="bg-white rounded-xl shadow-lg p-6 relative overflow-hidden">
              {/* 🆕 INDICADOR DE NUEVA MÉTRICA */}
              {stat.isNew && (
                <div className="absolute top-2 right-2">
                  <span className="bg-emerald-100 text-emerald-600 text-xs font-bold px-2 py-1 rounded-full">
                    NUEVO
                  </span>
                </div>
              )}
              
              <div className="flex items-center">
                <div className={`p-3 rounded-xl ${stat.color} shadow-lg`}>
                  <Icon className="h-7 w-7 text-white" />
                </div>
                <div className="ml-4 flex-1">
                  <p className="text-sm font-medium text-gray-600">
                    {stat.name}
                  </p>
                  <div className="text-3xl font-bold text-gray-900">
                    {statsLoading && stat.isNew ? (
                      <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
                    ) : (
                      stat.value
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {stat.description}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 🆕 MÉTRICAS DE RENDIMIENTO */}
      {assistanceStats && !statsLoading && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Target className="w-6 h-6 text-emerald-600" />
            Métricas de Rendimiento
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {performanceStats.map((metric) => {
              const Icon = metric.icon;
              return (
                <div key={metric.name} className="text-center">
                  <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${metric.color} mb-3`}>
                    <Icon className="w-8 h-8" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-1">{metric.value}</h3>
                  <p className="text-sm text-gray-600">{metric.name}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Quick Actions Actualizado */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
          <Activity className="w-6 h-6 text-emerald-600" />
          Acciones Rápidas
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <button
            onClick={() => navigate('/assistant-triage')}
            className="flex items-center justify-center p-6 border-2 border-dashed border-emerald-300 rounded-xl hover:border-emerald-400 hover:bg-emerald-50 transition-all duration-200 group"
          >
            <div className="text-center">
              <Plus className="h-10 w-10 text-emerald-600 mx-auto mb-3 group-hover:scale-110 transition-transform" />
              <span className="text-emerald-600 font-semibold text-lg">
                Nuevo Triaje
              </span>
              <p className="text-emerald-500 text-sm mt-1">Asistir paciente</p>
            </div>
          </button>

          <button
            onClick={() => navigate('/assistant-patients')}
            className="flex items-center justify-center p-6 border-2 border-dashed border-blue-300 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-all duration-200 group"
          >
            <div className="text-center">
              <Users className="h-10 w-10 text-blue-600 mx-auto mb-3 group-hover:scale-110 transition-transform" />
              <span className="text-blue-600 font-semibold text-lg">
                Ver Pacientes
              </span>
              <p className="text-blue-500 text-sm mt-1">Lista completa</p>
            </div>
          </button>

          {/* 🆕 BOTÓN PARA VER HISTORIAL DE ASISTENCIAS */}
          <button
            onClick={() => navigate('/assistant-history')}
            className="flex items-center justify-center p-6 border-2 border-dashed border-purple-300 rounded-xl hover:border-purple-400 hover:bg-purple-50 transition-all duration-200 group"
          >
            <div className="text-center">
              <History className="h-10 w-10 text-purple-600 mx-auto mb-3 group-hover:scale-110 transition-transform" />
              <span className="text-purple-600 font-semibold text-lg">
                Mi Historial
              </span>
              <p className="text-purple-500 text-sm mt-1">Asistencias previas</p>
            </div>
          </button>

          <button
            className="flex items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-xl hover:border-gray-400 hover:bg-gray-50 transition-all duration-200 group"
            disabled
          >
            <div className="text-center">
              <Activity className="h-10 w-10 text-gray-400 mx-auto mb-3" />
              <span className="text-gray-400 font-semibold text-lg">
                Reportes
              </span>
              <p className="text-xs text-gray-400 mt-1">Próximamente</p>
            </div>
          </button>
        </div>
      </div>

      {/* 🆕 RESUMEN DE ASISTENCIAS RECIENTES */}
      {assistanceStats?.recentTriages && assistanceStats.recentTriages.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <History className="w-6 h-6 text-purple-600" />
              Asistencias Recientes
            </h2>
            <button
              onClick={() => navigate('/assistant-history')}
              className="text-purple-600 hover:text-purple-700 font-medium text-sm"
            >
              Ver todas →
            </button>
          </div>
          
          <div className="space-y-3">
            {assistanceStats.recentTriages.map((triage, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
                    triage.urgencyLevel <= 2 ? 'bg-red-500' :
                    triage.urgencyLevel === 3 ? 'bg-yellow-500' : 'bg-green-500'
                  }`}>
                    {triage.urgencyLevel}
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{triage.patientName}</h3>
                    <p className="text-sm text-gray-600">{triage.specialty}</p>
                  </div>
                </div>
                
                <div className="text-right">
                  <p className="text-xs text-gray-500">
                    {new Date(triage.assistedAt).toLocaleDateString('es-ES')}
                  </p>
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                    triage.status === 'completed' ? 'bg-green-100 text-green-700' :
                    triage.status === 'in_progress' ? 'bg-orange-100 text-orange-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                    {triage.status === 'completed' ? 'Completado' :
                     triage.status === 'in_progress' ? 'En progreso' : 'Pendiente'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pacientes Disponibles (mantenido igual) */}
      <div className="bg-white rounded-xl shadow-lg">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              Pacientes Disponibles para Triaje
            </h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar pacientes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        <div className="overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mx-auto"></div>
              <p className="text-gray-500 mt-2">Cargando pacientes...</p>
            </div>
          ) : filteredPatients.length === 0 ? (
            <div className="p-8 text-center">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No se encontraron pacientes</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredPatients.slice(0, 10).map((patient) => (
                <div key={patient._id} className="p-6 hover:bg-gray-50 transition-colors duration-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                        <span className="text-emerald-600 font-semibold text-lg">
                          {patient.name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {patient.name}
                        </h3>
                        <p className="text-sm text-gray-500">
                          CI: {patient.ci} | Código: {patient.userId}
                        </p>
                        <div className="flex items-center mt-2">
                          {patient.hasHistory ? (
                            <>
                              <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                              <span className="text-xs text-green-600 font-medium">Con historial médico</span>
                            </>
                          ) : (
                            <>
                              <Clock className="h-4 w-4 text-yellow-500 mr-1" />
                              <span className="text-xs text-yellow-600 font-medium">Paciente nuevo</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => handleTriagePatient(patient)}
                      className="flex items-center space-x-2 bg-emerald-600 text-white px-6 py-3 rounded-xl hover:bg-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                    >
                      <Stethoscope className="h-5 w-5" />
                      <span className="font-medium">Iniciar Triaje</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {filteredPatients.length > 10 && (
          <div className="p-4 border-t border-gray-200 text-center">
            <button
              onClick={() => navigate('/assistant-patients')}
              className="text-emerald-600 hover:text-emerald-700 font-medium"
            >
              Ver todos los pacientes ({filteredPatients.length})
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AssistantDashboard;