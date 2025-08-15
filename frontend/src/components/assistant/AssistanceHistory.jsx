import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, Calendar, Clock, Activity, Eye, Download, 
  TrendingUp, Award, Filter, Search, RefreshCw,
  Bot, Stethoscope, Heart, Thermometer, CheckCircle,
  ArrowUp, ArrowDown, BarChart3, PieChart, Target,
  User, Star, Zap, Shield, FileText
} from 'lucide-react';
import { useUser } from '../../context/UserContext';

// 🚨 IMPORTANTE: Necesitaremos crear este endpoint en el backend
// import { getAssistantTriageHistory, getAssistantStats } from '../../services/api';

const AssistanceHistory = () => {
  const { user } = useUser();
  const [loading, setLoading] = useState(true);
  const [assistanceData, setAssistanceData] = useState([]);
  const [stats, setStats] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('7days');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('date_desc');

  // 🔧 DATOS SIMULADOS - REEMPLAZAR CON API REAL
  const mockData = useMemo(() => ({
    triages: [
      {
        _id: '1',
        patientName: 'María González',
        patientCI: '12345678',
        urgencyLevel: 2,
        urgencyLabel: 'Muy Urgente',
        urgencyColor: '#f97316',
        specialty: 'Cardiología',
        symptoms: ['dolor de pecho', 'dificultad respiratoria'],
        temperature: '38.2',
        assistedAt: '2024-08-14T08:30:00Z',
        processingTime: 2.5,
        isWatsonAnalysis: true,
        currentStatus: 'completed',
        completedBy: 'Dr. Rodriguez'
      },
      {
        _id: '2',
        patientName: 'Carlos López',
        patientCI: '87654321',
        urgencyLevel: 4,
        urgencyLabel: 'Menos Urgente',
        urgencyColor: '#22c55e',
        specialty: 'Medicina General',
        symptoms: ['dolor de cabeza', 'náuseas'],
        temperature: '37.1',
        assistedAt: '2024-08-14T09:15:00Z',
        processingTime: 1.8,
        isWatsonAnalysis: false,
        currentStatus: 'in_progress',
        attendingDoctor: 'Dr. Martínez'
      },
      {
        _id: '3',
        patientName: 'Ana Rodríguez',
        patientCI: '11223344',
        urgencyLevel: 1,
        urgencyLabel: 'Inmediato',
        urgencyColor: '#ef4444',
        specialty: 'Traumatología',
        symptoms: ['fractura expuesta', 'sangrado severo'],
        temperature: '36.8',
        assistedAt: '2024-08-13T16:45:00Z',
        processingTime: 1.2,
        isWatsonAnalysis: true,
        currentStatus: 'completed',
        completedBy: 'Dr. Silva'
      }
    ],
    stats: {
      totalTriages: 15,
      todayTriages: 3,
      avgProcessingTime: 2.1,
      watsonUsageRate: 73.3,
      urgencyDistribution: {
        level1: 2,
        level2: 4,
        level3: 5,
        level4: 3,
        level5: 1
      },
      specialtyDistribution: {
        'Cardiología': 4,
        'Medicina General': 6,
        'Traumatología': 3,
        'Neumología': 2
      },
      statusDistribution: {
        completed: 12,
        in_progress: 2,
        dismissed: 1
      }
    }
  }), []);

  useEffect(() => {
    loadAssistanceData();
  }, [selectedPeriod]);

  const loadAssistanceData = async () => {
    setLoading(true);
    try {
      // 🚨 REEMPLAZAR CON API REAL:
      // const response = await getAssistantTriageHistory({
      //   assistantId: user._id,
      //   period: selectedPeriod,
      //   limit: 50
      // });
      // setAssistanceData(response.data.triages);
      // setStats(response.data.stats);

      // 🔧 SIMULACIÓN DE CARGA
      await new Promise(resolve => setTimeout(resolve, 1000));
      setAssistanceData(mockData.triages);
      setStats(mockData.stats);
      
    } catch (error) {
      console.error('❌ Error cargando historial de asistencias:', error);
    } finally {
      setLoading(false);
    }
  };

  // 🔧 FILTRADO Y ORDENAMIENTO
  const filteredAndSortedData = useMemo(() => {
    let filtered = assistanceData.filter(item =>
      item.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.patientCI.includes(searchTerm) ||
      item.specialty.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date_desc':
          return new Date(b.assistedAt) - new Date(a.assistedAt);
        case 'date_asc':
          return new Date(a.assistedAt) - new Date(b.assistedAt);
        case 'urgency_high':
          return a.urgencyLevel - b.urgencyLevel;
        case 'urgency_low':
          return b.urgencyLevel - a.urgencyLevel;
        case 'processing_time':
          return a.processingTime - b.processingTime;
        default:
          return 0;
      }
    });
  }, [assistanceData, searchTerm, sortBy]);

  const periodOptions = [
    { value: '7days', label: 'Últimos 7 días' },
    { value: '30days', label: 'Últimos 30 días' },
    { value: '3months', label: 'Últimos 3 meses' },
    { value: 'all', label: 'Todo el historial' }
  ];

  const sortOptions = [
    { value: 'date_desc', label: 'Más reciente' },
    { value: 'date_asc', label: 'Más antiguo' },
    { value: 'urgency_high', label: 'Mayor urgencia' },
    { value: 'urgency_low', label: 'Menor urgencia' },
    { value: 'processing_time', label: 'Tiempo de proceso' }
  ];

  const getStatusBadge = (status) => {
    const styles = {
      completed: 'bg-green-100 text-green-700',
      in_progress: 'bg-orange-100 text-orange-700',
      dismissed: 'bg-red-100 text-red-700',
      waiting: 'bg-blue-100 text-blue-700'
    };
    
    const labels = {
      completed: 'Completado',
      in_progress: 'En Progreso',
      dismissed: 'Descartado',
      waiting: 'En Espera'
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100 text-gray-700'}`}>
        {labels[status] || status}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-3">
              <Users className="w-8 h-8" />
              Mi Historial de Asistencias
            </h1>
            <p className="text-emerald-100 mt-1">
              Registro completo de triajes médicos asistidos
            </p>
          </div>
          <div className="text-right">
            <p className="text-emerald-100 text-sm">Asistente Médico</p>
            <p className="text-xl font-bold">{user?.firstName} {user?.lastName}</p>
          </div>
        </div>
      </div>

      {/* Estadísticas de Resumen */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-emerald-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Asistencias</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalTriages}</p>
              </div>
              <Users className="w-10 h-10 text-emerald-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Hoy</p>
                <p className="text-2xl font-bold text-gray-900">{stats.todayTriages}</p>
              </div>
              <Calendar className="w-10 h-10 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Tiempo Promedio</p>
                <p className="text-2xl font-bold text-gray-900">{stats.avgProcessingTime}min</p>
              </div>
              <Clock className="w-10 h-10 text-purple-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-yellow-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Uso Watson</p>
                <p className="text-2xl font-bold text-gray-900">{stats.watsonUsageRate}%</p>
              </div>
              <Bot className="w-10 h-10 text-yellow-500" />
            </div>
          </div>
        </div>
      )}

      {/* Gráficos de Distribución */}
      {stats && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Distribución por Urgencia */}
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-red-500" />
              Distribución por Urgencia
            </h3>
            <div className="space-y-3">
              {Object.entries(stats.urgencyDistribution).map(([level, count]) => {
                const colors = {
                  level1: 'bg-red-500',
                  level2: 'bg-orange-500',
                  level3: 'bg-yellow-500',
                  level4: 'bg-green-500',
                  level5: 'bg-blue-500'
                };
                const percentage = (count / stats.totalTriages) * 100;
                
                return (
                  <div key={level} className="flex items-center space-x-3">
                    <div className={`w-4 h-4 rounded-full ${colors[level]}`}></div>
                    <span className="text-sm text-gray-600 w-16">Nivel {level.slice(-1)}</span>
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${colors[level]}`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-gray-700 w-12">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Distribución por Especialidad */}
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Stethoscope className="w-5 h-5 text-blue-500" />
              Especialidades Más Asistidas
            </h3>
            <div className="space-y-3">
              {Object.entries(stats.specialtyDistribution).map(([specialty, count]) => {
                const percentage = (count / stats.totalTriages) * 100;
                
                return (
                  <div key={specialty} className="flex items-center space-x-3">
                    <span className="text-sm text-gray-600 w-32 truncate">{specialty}</span>
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div 
                        className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-gray-700 w-12">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Controles de Filtros */}
      <div className="bg-white rounded-xl p-6 shadow-lg">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            {/* Búsqueda */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por paciente, CI o especialidad..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>

            {/* Período */}
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            >
              {periodOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            {/* Ordenamiento */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            >
              {sortOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Botón Actualizar */}
          <button
            onClick={loadAssistanceData}
            disabled={loading}
            className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
        </div>
      </div>

      {/* Lista de Asistencias */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Historial de Asistencias ({filteredAndSortedData.length})
          </h3>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="flex items-center justify-center gap-3 text-emerald-600">
              <Bot className="w-8 h-8 animate-pulse" />
              <span className="text-lg font-medium">Cargando historial...</span>
            </div>
          </div>
        ) : filteredAndSortedData.length === 0 ? (
          <div className="p-8 text-center">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay asistencias registradas</h3>
            <p className="text-gray-600">Aún no has asistido ningún triaje médico en este período.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredAndSortedData.map((assistance) => (
              <div key={assistance._id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start space-x-4">
                  {/* Indicador de Urgencia */}
                  <div className="flex-shrink-0">
                    <div 
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg relative"
                      style={{ backgroundColor: assistance.urgencyColor }}
                    >
                      {assistance.urgencyLevel}
                      {assistance.isWatsonAnalysis && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center">
                          <Bot className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Información Principal */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900">{assistance.patientName}</h4>
                        <p className="text-sm text-gray-600">CI: {assistance.patientCI}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">
                          {new Date(assistance.assistedAt).toLocaleDateString('es-ES')} • {new Date(assistance.assistedAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        {getStatusBadge(assistance.currentStatus)}
                      </div>
                    </div>

                    {/* Detalles Médicos */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                      <div className="flex items-center space-x-2">
                        <Stethoscope className="w-4 h-4 text-blue-500" />
                        <span className="text-sm text-gray-600">{assistance.specialty}</span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Thermometer className="w-4 h-4 text-orange-500" />
                        <span className="text-sm text-gray-600">{assistance.temperature}°C</span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-purple-500" />
                        <span className="text-sm text-gray-600">{assistance.processingTime} min</span>
                      </div>
                    </div>

                    {/* Síntomas */}
                    <div className="mb-3">
                      <p className="text-sm text-gray-600 mb-1">Síntomas asistidos:</p>
                      <div className="flex flex-wrap gap-1">
                        {assistance.symptoms.map((symptom, idx) => (
                          <span key={idx} className="px-2 py-1 bg-red-100 text-red-700 rounded-md text-xs">
                            {symptom}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Estado del Caso */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {assistance.isWatsonAnalysis ? (
                          <div className="flex items-center space-x-1 text-purple-600">
                            <Bot className="w-4 h-4" />
                            <span className="text-sm font-medium">Análisis Watson</span>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-1 text-gray-600">
                            <Shield className="w-4 h-4" />
                            <span className="text-sm">Protocolo Estándar</span>
                          </div>
                        )}
                      </div>

                      <div className="text-sm text-gray-600">
                        {assistance.currentStatus === 'completed' && assistance.completedBy && (
                          <span>✅ Completado por {assistance.completedBy}</span>
                        )}
                        {assistance.currentStatus === 'in_progress' && assistance.attendingDoctor && (
                          <span>🔄 Atendiendo: {assistance.attendingDoctor}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AssistanceHistory;