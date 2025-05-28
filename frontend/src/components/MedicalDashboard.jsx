// frontend/src/components/MedicalDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from './Navbar';
import { 
  FaUsers, 
  FaUserCheck, 
  FaClock, 
  FaExclamationTriangle,
  FaSearch,
  FaFilter,
  FaChartLine,
  FaTemperatureHigh
} from 'react-icons/fa';

const MedicalDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalPacientes: 0,
    atendidos: 0,
    enEspera: 0,
    tiempoPromedio: '0 min',
    urgentes: 0
  });
  const [triageQueue, setTriageQueue] = useState([]);
  const [filteredQueue, setFilteredQueue] = useState([]);
  const [activeFilter, setActiveFilter] = useState('todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [refreshInterval, setRefreshInterval] = useState(null);

  // Configurar axios con el token
  const api = axios.create({
    baseURL: 'http://localhost:3000/api',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  });

  // Función para obtener estadísticas
  const fetchDashboardStats = async () => {
    try {
      const response = await api.get('/medical/dashboard-stats');
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
      if (error.response?.status === 403) {
        setError('No tienes permisos para acceder a esta sección');
      }
    }
  };

  // Función para obtener cola de triaje
  const fetchTriageQueue = async () => {
    try {
      const response = await api.get('/medical/triage-queue');
      if (response.data.success) {
        const formattedQueue = response.data.data.map(record => ({
          id: record._id,
          codigoAsegurado: record.userId?.insuranceCode || 'N/A',
          nombre: record.userId?.fullName || 'Sin nombre',
          edad: calculateAge(record.userId?.birthDate),
          sintomas: record.symptoms,
          temperatura: record.temperature,
          tiempoEspera: calculateWaitTime(record.createdAt),
          prioridad: record.priority,
          color: getPriorityColor(record.priority),
          hora: new Date(record.createdAt).toLocaleTimeString('es-BO', { 
            hour: '2-digit', 
            minute: '2-digit' 
          }),
          status: record.status,
          condiciones: record.preExistingConditions
        }));
        setTriageQueue(formattedQueue);
        setFilteredQueue(formattedQueue); // Inicializar filtrado
      }
    } catch (error) {
      console.error('Error al cargar cola de triaje:', error);
    }
  };

  // Calcular edad
  const calculateAge = (birthDate) => {
    if (!birthDate) return 'N/A';
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  };

  // Calcular tiempo de espera
  const calculateWaitTime = (createdAt) => {
    const now = new Date();
    const created = new Date(createdAt);
    const diffMs = now - created;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 60) {
      return `${diffMins} min`;
    } else {
      const hours = Math.floor(diffMins / 60);
      const mins = diffMins % 60;
      return `${hours}h ${mins}min`;
    }
  };

  // Obtener color según prioridad
  const getPriorityColor = (priority) => {
    const colors = {
      'muy-alta': '#dc2626', // Rojo
      'alta': '#ea580c',     // Naranja
      'media': '#facc15',    // Amarillo
      'baja': '#16a34a',     // Verde
      'muy-baja': '#3b82f6'  // Azul
    };
    return colors[priority] || '#6b7280';
  };

  // Obtener etiqueta de prioridad
  const getPriorityLabel = (priority) => {
    const labels = {
      'muy-alta': 'Muy Alta',
      'alta': 'Alta',
      'media': 'Media',
      'baja': 'Baja',
      'muy-baja': 'Muy Baja'
    };
    return labels[priority] || 'Sin definir';
  };

  // Atender paciente
  const handleAttendPatient = async (patientId) => {
    try {
      const response = await api.put(`/medical/attend-patient/${patientId}`);
      if (response.data.success) {
        alert('Paciente marcado como en atención');
        // Recargar datos
        fetchTriageQueue();
        fetchDashboardStats();
      }
    } catch (error) {
      console.error('Error al atender paciente:', error);
      alert('Error al marcar paciente como en atención');
    }
  };

  // Ver historial del paciente
  const handleViewHistory = (patient) => {
    navigate(`/medical/patient-history/${patient.id}`, { 
      state: { patientName: patient.nombre } 
    });
  };

  // Efecto para cargar datos iniciales
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        fetchDashboardStats(),
        fetchTriageQueue()
      ]);
      setLoading(false);
    };

    loadData();

    // Actualizar cada 30 segundos
    const interval = setInterval(() => {
      fetchTriageQueue();
      fetchDashboardStats();
    }, 30000);

    setRefreshInterval(interval);

    return () => {
      if (interval) clearInterval(interval);
    };
  }, []);

  // Efecto para filtrar la cola
  useEffect(() => {
    let filtered = triageQueue;

    // Filtrar por prioridad
    if (activeFilter !== 'todos') {
      filtered = filtered.filter(patient => patient.prioridad === activeFilter);
    }

    // Filtrar por búsqueda
    if (searchTerm) {
      filtered = filtered.filter(patient => 
        patient.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.codigoAsegurado.includes(searchTerm)
      );
    }

    setFilteredQueue(filtered);
  }, [triageQueue, activeFilter, searchTerm]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando dashboard médico...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 text-xl mb-4">{error}</p>
          <button 
            onClick={() => navigate('/login')} 
            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition"
          >
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Panel de Triaje Médico</h1>
          <p className="text-gray-600 mt-1">
            Gestión de pacientes en sala de emergencias - Actualización automática cada 30 segundos
          </p>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Total Hoy</p>
                <p className="text-2xl font-bold text-gray-800">{stats.totalPacientes}</p>
              </div>
              <FaUsers className="text-blue-500 text-3xl" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Atendidos</p>
                <p className="text-2xl font-bold text-green-600">{stats.atendidos}</p>
              </div>
              <FaUserCheck className="text-green-500 text-3xl" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">En Espera</p>
                <p className="text-2xl font-bold text-orange-600">{stats.enEspera}</p>
              </div>
              <FaClock className="text-orange-500 text-3xl" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">T. Promedio</p>
                <p className="text-2xl font-bold text-purple-600">{stats.tiempoPromedio}</p>
              </div>
              <FaChartLine className="text-purple-500 text-3xl" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border-2 border-red-200 hover:shadow-lg transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Urgentes</p>
                <p className="text-2xl font-bold text-red-600">{stats.urgentes}</p>
              </div>
              <FaExclamationTriangle className="text-red-500 text-3xl" />
            </div>
          </div>
        </div>

        {/* Filtros y búsqueda */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center space-x-2 flex-wrap">
              <FaFilter className="text-gray-500" />
              <button
                onClick={() => setActiveFilter('todos')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                  activeFilter === 'todos' 
                    ? 'bg-green-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Todos ({triageQueue.length})
              </button>
              <button
                onClick={() => setActiveFilter('muy-alta')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                  activeFilter === 'muy-alta' 
                    ? 'bg-red-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Muy Alta
              </button>
              <button
                onClick={() => setActiveFilter('alta')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                  activeFilter === 'alta' 
                    ? 'bg-orange-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Alta
              </button>
              <button
                onClick={() => setActiveFilter('media')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                  activeFilter === 'media' 
                    ? 'bg-yellow-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Media
              </button>
              <button
                onClick={() => setActiveFilter('baja')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                  activeFilter === 'baja' 
                    ? 'bg-green-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Baja
              </button>
            </div>
            
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nombre o código..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 w-full md:w-80"
              />
            </div>
          </div>
        </div>

        {/* Cola de Triaje */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
              <FaUsers />
              Cola de Triaje en Tiempo Real
            </h2>
          </div>
          
          <div className="overflow-x-auto">
            {filteredQueue.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">
                  {searchTerm || activeFilter !== 'todos' 
                    ? 'No se encontraron pacientes con los filtros aplicados'
                    : 'No hay pacientes en la cola de espera'}
                </p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Prioridad
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Código
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Paciente
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Síntomas
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Temp. °C
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tiempo Espera
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Hora
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredQueue.map((patient) => (
                    <tr key={patient.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-4 h-8 rounded"
                            style={{ backgroundColor: patient.color }}
                          />
                          <span className="text-sm font-medium">
                            {getPriorityLabel(patient.prioridad)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {patient.codigoAsegurado}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{patient.nombre}</div>
                          <div className="text-sm text-gray-500">{patient.edad} años</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-xs">
                          <p className="truncate">{patient.sintomas}</p>
                          {patient.condiciones && (
                            <p className="text-xs text-gray-500 mt-1">
                              Condiciones: {patient.condiciones}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <FaTemperatureHigh className={`${
                            patient.temperatura >= 38 ? 'text-red-500' : 'text-gray-400'
                          }`} />
                          <span className={`text-sm font-medium ${
                            patient.temperatura >= 38 ? 'text-red-600' : 'text-gray-600'
                          }`}>
                            {patient.temperatura || 'N/A'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="flex items-center gap-1 text-sm">
                          <FaClock className="text-gray-400" />
                          <span className={`${
                            patient.prioridad === 'muy-alta' || patient.prioridad === 'alta' 
                              ? 'text-red-600 font-semibold' 
                              : 'text-gray-600'
                          }`}>
                            {patient.tiempoEspera}
                          </span>
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {patient.hora}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button 
                          onClick={() => handleAttendPatient(patient.id)}
                          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md transition mr-2"
                        >
                          Atender
                        </button>
                        <button 
                          onClick={() => handleViewHistory(patient)}
                          className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-md transition"
                        >
                          Historial
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Botón para registrar nuevo paciente */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={() => navigate('/medical/register-patient')}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition"
          >
            <FaUsers />
            Registrar Síntomas de Paciente
          </button>
        </div>
      </div>
    </div>
  );
};

export default MedicalDashboard;