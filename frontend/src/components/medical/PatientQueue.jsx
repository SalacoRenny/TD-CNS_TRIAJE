import React, { useState, useEffect, useCallback, useMemo } from 'react';
// 🆕 IMPORTAR BOTONES PDF ESPECÍFICOS
import { TriagePDFButton, HistorialPDFButton } from './PDFGenerator';
import { 
  RefreshCw, Search, Eye, History, CheckCircle, Clock, 
  AlertCircle, Activity, Bot, Zap, User, FileText,
  Calendar, Thermometer, Heart, Stethoscope, Star,
  ArrowRight, Download, X, ChevronRight, Award,
  Shield, Cpu, Target, TrendingUp, UserX, Ban,
  Users // 🆕 Para indicador de asistencia
} from 'lucide-react';
import { 
  getAllRecordsWithTriage, 
  getPatientDetailWithWatson, 
  updateAttentionStatus,
  getPatientRecentContext 
} from '../../services/api';
// 🆕 IMPORTAR CONTEXTO DE USUARIO PARA SESIONES
import { useUser } from '../../context/UserContext';

const PatientQueue = ({ records: initialRecords, onRefresh }) => {
  const { user } = useUser(); // 🆕 Usuario actual para sesiones
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [records, setRecords] = useState(initialRecords || []);
  
  // 🔧 LOADING STATES GRANULARES POR ACCIÓN Y PACIENTE - OPTIMIZADO
  const [mainLoading, setMainLoading] = useState(false);
  const [loadingStates, setLoadingStates] = useState({
    detail: {}, // { patientId: boolean }
    history: {}, // { patientId: boolean }
    statusUpdate: {}, // { patientId: boolean }
  });
  
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [patientDetail, setPatientDetail] = useState(null);
  const [patientHistory, setPatientHistory] = useState(null);

  const [watsonStats, setWatsonStats] = useState({ watson: 0, simple: 0, fallback: 0 });

  useEffect(() => {
    loadRecordsByStatus();
  }, []);

  // 🔧 SINCRONIZAR CON PROPS CUANDO RECORDS CAMBIAN - OPTIMIZADO
  useEffect(() => {
    if (initialRecords && initialRecords.length > 0) {
      setRecords(initialRecords);
      console.log('🔄 PatientQueue sincronizado con nuevos records:', initialRecords.length);
    }
  }, [initialRecords]);

  // 🆕 HELPER PARA OBTENER INFO DEL DOCTOR ACTUAL - MEMOIZADO
  const getCurrentDoctorInfo = useCallback(() => {
    if (!user) return { name: 'Doctor', id: 'unknown' };
    
    // 🚀 USAR MÚLTIPLES CAMPOS PARA OBTENER NOMBRE DEL DOCTOR
    const doctorName = user.fullName || 
                      user.name || 
                      (user.firstName ? `${user.firstName} ${user.lastName}`.trim() : '') ||
                      user.username || 
                      user.email ||
                      'Doctor';
    const doctorId = user._id || user.id || user.userId || 'unknown';
    
    return { name: doctorName, id: doctorId };
  }, [user]);

  // 🔧 HELPER PARA GESTIONAR LOADING STATES GRANULARES - OPTIMIZADO
  const setSpecificLoading = useCallback((action, patientId, isLoading) => {
    setLoadingStates(prev => {
      // 🚀 EVITAR RE-RENDERS INNECESARIOS
      if (prev[action][patientId] === isLoading) return prev;
      
      return {
        ...prev,
        [action]: {
          ...prev[action],
          [patientId]: isLoading
        }
      };
    });
  }, []);

  const loadRecordsByStatus = async () => {
  setMainLoading(true);
  try {
    const response = await getAllRecordsWithTriage({ 
      status: 'all',
      limit: 100
    });
    
    // 🔍 DEBUG CRÍTICO - AGREGAR ESTAS LÍNEAS
    console.log('🔥🔥🔥 RESPONSE COMPLETA DEL BACKEND:', response);
    console.log('🔥🔥🔥 RECORDS RAW:', response.data.records);
    
    if (response.data.records && response.data.records.length > 0) {
      console.log('🔥🔥🔥 PRIMER RECORD DETALLADO:', response.data.records[0]);
      console.log('🔥🔥🔥 PATIENT NAME:', response.data.records[0].patientName);
      console.log('🔥🔥🔥 PATIENT CI:', response.data.records[0].patientCI);
      console.log('🔥🔥🔥 USER ID:', response.data.records[0].userId);
    }
    
    setRecords(response.data.records || []);
    setWatsonStats(response.data.methodStats || { watson: 0, simple: 0, fallback: 0 });
    
  } catch (error) {
    console.error('❌ Error cargando registros:', error);
  } finally {
    setMainLoading(false);
  }
};

  // 🚀 OPTIMIZACIÓN: MEMOIZAR FILTROS PARA EVITAR RECÁLCULOS
  const urgencyFilters = useMemo(() => [
    { key: 'all', label: 'Todos', count: records.length },
    { key: '1', label: 'Inmediato', color: 'bg-red-500', count: records.filter(r => r.urgency?.level === 1).length },
    { key: '2', label: 'Muy Urgente', color: 'bg-orange-500', count: records.filter(r => r.urgency?.level === 2).length },
    { key: '3', label: 'Urgente', color: 'bg-yellow-500', count: records.filter(r => r.urgency?.level === 3).length },
    { key: '4', label: 'Menos Urgente', color: 'bg-green-500', count: records.filter(r => r.urgency?.level === 4).length },
    { key: '5', label: 'No Urgente', color: 'bg-blue-500', count: records.filter(r => r.urgency?.level === 5).length }
  ], [records]);

  // 🆕 NUEVOS TABS DE ESTADO CON "WAITING" Y "DISMISSED" - MEMOIZADO
  const statusTabs = useMemo(() => [
    { 
      key: 'waiting', 
      label: 'En Espera', 
      color: 'text-blue-600 bg-blue-50 border-blue-200',
      icon: <Clock className="w-4 h-4" />,
      count: records.filter(r => !r.attentionStatus || r.attentionStatus === 'pending' || r.attentionStatus === 'waiting').length 
    },
    { 
      key: 'in_progress', 
      label: 'En Atención', 
      color: 'text-orange-600 bg-orange-50 border-orange-200',
      icon: <Activity className="w-4 h-4" />,
      count: records.filter(r => r.attentionStatus === 'in_progress').length 
    },
    { 
      key: 'completed', 
      label: 'Atendidos', 
      color: 'text-green-600 bg-green-50 border-green-200',
      icon: <CheckCircle className="w-4 h-4" />,
      count: records.filter(r => r.attentionStatus === 'completed').length 
    },
    { 
      key: 'dismissed', 
      label: 'Descartados', 
      color: 'text-red-600 bg-red-50 border-red-200',
      icon: <UserX className="w-4 h-4" />,
      count: records.filter(r => r.attentionStatus === 'dismissed').length 
    }
  ], [records]);

  // 🚀 OPTIMIZACIÓN: MEMOIZAR FILTRADO COMPLEJO
  const filteredRecords = useMemo(() => {
    return records.filter(record => {
      const matchesFilter = selectedFilter === 'all' || record.urgency?.level === parseInt(selectedFilter);
      const matchesSearch = searchTerm === '' || (
        record.patientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.patientCI?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.symptoms?.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      
      let matchesStatus = false;
      if (selectedStatus === 'all') {
        matchesStatus = true;
      } else if (selectedStatus === 'waiting') {
        // 🆕 MAPEAR WAITING PARA INCLUIR PENDING Y WAITING
        matchesStatus = !record.attentionStatus || record.attentionStatus === 'pending' || record.attentionStatus === 'waiting';
      } else {
        matchesStatus = record.attentionStatus === selectedStatus;
      }
      
      return matchesFilter && matchesSearch && matchesStatus;
    });
  }, [records, selectedFilter, searchTerm, selectedStatus]);

  // 🔧 ACTUALIZACIÓN OPTIMISTA + DATOS DE DOCTOR - CORREGIDA COMPLETAMENTE
const handleStatusChange = useCallback(async (patientId, newStatus) => {
  try {
    // 🔧 LOADING ESPECÍFICO PARA ESTE PACIENTE
    setSpecificLoading('statusUpdate', patientId, true);
    
    // 🆕 OBTENER INFO DEL DOCTOR ACTUAL
    const doctorInfo = getCurrentDoctorInfo();
    
    // 🔧 ACTUALIZACIÓN OPTIMISTA INMEDIATA - VERSIÓN SEGURA
    const optimisticTimestamp = new Date().toISOString();
    setRecords(prevRecords => {
      return prevRecords.map(record => {
        if (record._id === patientId) {
          // 🚀 CREAR COPIA COMPLETA DEL RECORD SIN PERDER DATOS
          const updatedRecord = JSON.parse(JSON.stringify(record)); // Deep copy
          
          // SOLO ACTUALIZAR CAMPOS DE ESTADO Y DOCTOR
          updatedRecord.attentionStatus = newStatus;
          updatedRecord.attention_updated_at = optimisticTimestamp;

          // 🆕 MANEJO DE DATOS DE DOCTOR SEGÚN ESTADO (SIN TOCAR OTROS CAMPOS)
          if (newStatus === 'in_progress') {
            updatedRecord.attending_doctor = {
              id: doctorInfo.id,
              name: doctorInfo.name,
              assigned_at: optimisticTimestamp
            };
            updatedRecord.completed_by_doctor = null;
            updatedRecord.dismissed_by_doctor = null;
          }
          
          if (newStatus === 'completed') {
            updatedRecord.completed_by_doctor = {
              id: doctorInfo.id,
              name: doctorInfo.name,
              completed_at: optimisticTimestamp
            };
            updatedRecord.dismissed_by_doctor = null;
          }

          if (newStatus === 'dismissed') {
            updatedRecord.dismissed_by_doctor = {
              id: doctorInfo.id,
              name: doctorInfo.name,
              dismissed_at: optimisticTimestamp
            };
            updatedRecord.attending_doctor = null;
            updatedRecord.completed_by_doctor = null;
          }

          if (newStatus === 'waiting') {
            updatedRecord.attending_doctor = null;
            updatedRecord.completed_by_doctor = null;
            updatedRecord.dismissed_by_doctor = null;
          }

          // 🔍 VERIFICACIÓN DE INTEGRIDAD - DEBUG
          console.log(`🔄 Actualización optimista para ${patientId}:`, {
            originalName: record.patientName,
            updatedName: updatedRecord.patientName,
            newStatus: newStatus,
            allFieldsPreserved: updatedRecord.patientName === record.patientName
          });

          return updatedRecord;
        }
        return record; // Retornar record sin cambios para otros pacientes
      });
    });
    
    // 🆕 PROPAGACIÓN INMEDIATA AL DASHBOARD PADRE
    if (onRefresh) {
      console.log(`🚀 Propagación inmediata: ${patientId} → ${newStatus} by ${doctorInfo.name}`);
      onRefresh();
    }
    
    // 🔧 LLAMADA A LA API EN BACKGROUND
    await updateAttentionStatus(patientId, { 
      status: newStatus,
      doctor: doctorInfo
    });
    
    console.log(`✅ Estado confirmado por API: ${patientId} → ${newStatus}`);
    
  } catch (error) {
    console.error('❌ Error actualizando estado:', error);
    // 🔧 ROLLBACK: Recargar datos frescos del backend
    await loadRecordsByStatus();
    alert('Error al actualizar el estado del paciente');
  } finally {
    setSpecificLoading('statusUpdate', patientId, false);
  }
}, [getCurrentDoctorInfo, setSpecificLoading, onRefresh]);

  // 🔧 MODAL DETALLE - LOADING ESPECÍFICO POR PACIENTE - OPTIMIZADO
  const handleViewDetail = useCallback(async (record) => {
    try {
      setSpecificLoading('detail', record._id, true);
      setSelectedPatient(record);
      
      const response = await getPatientDetailWithWatson(record._id);

      console.log('🔍 FRONTEND - Response COMPLETA:', JSON.stringify(response.data, null, 2));
      
      setPatientDetail(response.data);
      setShowDetailModal(true);
      
      console.log('✅ Detalle Watson cargado:', response.data);
    } catch (error) {
      console.error('❌ Error cargando detalle:', error);
      alert('Error al cargar los detalles del paciente');
    } finally {
      setSpecificLoading('detail', record._id, false);
    }
  }, [setSpecificLoading]);

  // 🔧 MODAL HISTORIAL - LOADING ESPECÍFICO POR PACIENTE - OPTIMIZADO
  const handleViewHistory = useCallback(async (record) => {
    try {
      setSpecificLoading('history', record._id, true);
      setSelectedPatient(record);
      
      const patientResponse = await getPatientDetailWithWatson(record._id);
      setPatientDetail(patientResponse.data);
      
      const response = await getPatientRecentContext(record.userId);
      setPatientHistory(response.data);
      setShowHistoryModal(true);
      
      console.log('✅ Historial cargado:', response.data);
    } catch (error) {
      console.error('❌ Error cargando historial:', error);
      alert('Error al cargar el historial del paciente');
    } finally {
      setSpecificLoading('history', record._id, false);
    }
  }, [setSpecificLoading]);

  // 🚀 OPTIMIZACIÓN: MEMOIZAR FUNCIONES QUE NO CAMBIAN
  const getUrgencyIcon = useCallback((level) => {
    switch(level) {
      case 1: return '🚨';
      case 2: return '⚡';
      case 3: return '⚠️';
      case 4: return '🟢';
      case 5: return '🔵';
      default: return '❓';
    }
  }, []);

  const getSpecialtyIcon = useCallback((specialty) => {
    const icons = {
      'Cardiología': '❤️',
      'Neurología': '🧠', 
      'Gastroenterología': '🫘',
      'Neumología': '🫁',
      'PNEUMOLOGÍA': '🫁',
      'Traumatología': '🦴',
      'Dermatología': '🎯',
      'Medicina General': '👩‍⚕️'
    };
    return icons[specialty] || '👨‍⚕️';
  }, []);

  // 🆕 FUNCIÓN PARA OBTENER ESTILO DE ESTADO - MEMOIZADA
  const getStatusDisplay = useCallback((status) => {
    switch(status) {
      case 'waiting':
      case 'pending':
      case undefined:
      case null:
        return { label: 'En espera', style: 'bg-blue-100 text-blue-700' };
      case 'in_progress':
        return { label: 'En atención', style: 'bg-orange-100 text-orange-700' };
      case 'completed':
        return { label: 'Atendido', style: 'bg-green-100 text-green-700' };
      case 'dismissed':
        return { label: 'Descartado', style: 'bg-red-100 text-red-700' };
      default:
        return { label: 'Desconocido', style: 'bg-gray-100 text-gray-700' };
    }
  }, []);

  const handleRefresh = useCallback(async () => {
    setMainLoading(true);
    try {
      await loadRecordsByStatus();
      if (onRefresh) onRefresh();
    } finally {
      setMainLoading(false);
    }
  }, [onRefresh]);

  // 🚀 OPTIMIZACIÓN: MEMOIZAR BÚSQUEDA PARA EVITAR RE-RENDERS
  const handleSearchChange = useCallback((e) => {
    setSearchTerm(e.target.value);
  }, []);

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-500 to-emerald-500 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">Cola de Pacientes Inteligente</h2>
            <p className="text-teal-100 text-sm flex items-center gap-2">
              <Bot className="w-4 h-4" />
              Sistema AISANA + Protocolo Manchester
              {watsonStats.watson > 0 && (
                <span className="bg-white/20 px-2 py-1 rounded-full text-xs">
                  ⚡ {watsonStats.watson} análisis Watson
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleRefresh}
              disabled={mainLoading}
              className="bg-white/20 hover:bg-white/30 backdrop-blur-sm p-2 rounded-lg transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-5 h-5 text-white ${mainLoading ? 'animate-spin' : ''}`} />
            </button>
            <div className="text-white text-sm">
              {filteredRecords.length} pacientes
            </div>
          </div>
        </div>
      </div>

      {/* Tabs de estado ACTUALIZADOS */}
      <div className="px-6 pt-4 border-b border-slate-200">
        <div className="flex space-x-2 mb-4 flex-wrap">
          <button
            onClick={() => setSelectedStatus('all')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-medium transition-all border-2 ${
              selectedStatus === 'all'
                ? 'text-teal-600 bg-teal-50 border-teal-200'
                : 'text-gray-600 bg-gray-50 border-gray-200 hover:bg-gray-100'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>Todos</span>
            <span className="bg-white/80 px-2 py-0.5 rounded-full text-xs font-bold">
              {records.length}
            </span>
          </button>
          {statusTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setSelectedStatus(tab.key)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-medium transition-all border-2 ${
                selectedStatus === tab.key
                  ? tab.color
                  : 'text-gray-600 bg-gray-50 border-gray-200 hover:bg-gray-100'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
              <span className="bg-white/80 px-2 py-0.5 rounded-full text-xs font-bold">
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Filtros - OPTIMIZADO */}
      <div className="p-6 border-b border-slate-200">
        <div className="flex flex-col space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por nombre, CI o síntomas..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {urgencyFilters.map((filter) => (
              <button
                key={filter.key}
                onClick={() => setSelectedFilter(filter.key)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  selectedFilter === filter.key
                    ? 'bg-teal-500 text-white shadow-lg'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {filter.color && (
                  <div className={`w-3 h-3 rounded-full ${filter.color}`}></div>
                )}
                <span>{filter.label}</span>
                <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs">
                  {filter.count}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Lista de Pacientes - ALTURA AMPLIADA */}
      <div className="max-h-[600px] overflow-y-auto">
        {/* 🔧 SOLO MOSTRAR LOADING PRINCIPAL CUANDO SEA NECESARIO */}
        {mainLoading ? (
          <div className="p-8 text-center">
            <div className="flex items-center justify-center gap-3 text-teal-600">
              <Bot className="w-8 h-8 animate-pulse" />
              <span className="text-lg font-medium">Cargando datos Watson...</span>
            </div>
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-slate-500">No hay pacientes que coincidan con los filtros</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
            {filteredRecords.map((record) => (
              <div key={record._id} className="p-6 hover:bg-slate-50 transition-colors">
                <div className="flex items-start space-x-4">
                  {/* Indicador de Prioridad */}
                  <div className="flex-shrink-0">
                    <div 
                      className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg relative`}
                      style={{ backgroundColor: record.urgency?.color }}
                    >
                      {getUrgencyIcon(record.urgency?.level)}
                      {record.isWatsonData && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center">
                          <Bot className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Información del Paciente */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-800">
                          {record.patientName}
                        </h3>
                        <p className="text-sm text-slate-500">CI: {record.patientCI}</p>
                      </div>
                      <div className="text-right">
                        <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium text-white`}
                             style={{ backgroundColor: record.urgency?.color }}>
                          {record.urgency?.label}
                        </div>
                        <p className="text-xs text-slate-500 mt-1">{record.timeAgo}</p>
                        {record.classificationMethod && (
                          <div className="mt-1">
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              record.classificationMethod === 'watson' 
                                ? 'bg-purple-100 text-purple-700' 
                                : 'bg-gray-100 text-gray-600'
                            }`}>
                              {record.classificationMethod === 'watson' ? '🤖 Watson' : '📋 Simple'}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 🆕 INDICADOR DE ASISTENCIA - NUEVO */}
                    {record.isAssisted && record.assistedBy && (
                      <div className="mb-3 p-2 bg-emerald-50 rounded-lg border-l-4 border-emerald-400">
                        <p className="text-sm text-emerald-800 flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          <span className="font-medium">Asistido por:</span>
                          <span className="font-bold">{record.assistedBy.assistantName}</span>
                          <span className="text-xs bg-emerald-100 px-2 py-1 rounded-full">
                            {record.assistedBy.assistantRole}
                          </span>
                        </p>
                      </div>
                    )}

                    {/* Síntomas */}
                    <div className="mb-3">
                      <p className="text-sm text-slate-600 mb-1">Síntomas:</p>
                      <div className="flex flex-wrap gap-1">
                        {record.symptoms?.slice(0, 3).map((symptom, idx) => (
                          <span key={idx} className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-red-100 text-red-700">
                            {symptom}
                          </span>
                        ))}
                        {record.symptoms?.length > 3 && (
                          <span className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-slate-100 text-slate-600">
                            +{record.symptoms.length - 3} más
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Información Médica */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                      <div className="flex items-center space-x-2">
                        <span className="text-2xl">{getSpecialtyIcon(record.suggestedSpecialty)}</span>
                        <div>
                          <p className="text-slate-500">Especialidad</p>
                          <p className="font-medium text-slate-700 flex items-center gap-1">
                            {record.suggestedSpecialty}
                            {record.isWatsonData && (
                              <Zap className="w-3 h-3 text-purple-500" title="Análisis Watson" />
                            )}
                          </p>
                        </div>
                      </div>
                      
                      {record.temperature && (
                        <div className="flex items-center space-x-2">
                          <Thermometer className="w-5 h-5 text-orange-500" />
                          <div>
                            <p className="text-slate-500">Temperatura</p>
                            <p className={`font-medium ${parseFloat(record.temperature) > 37.5 ? 'text-red-600' : 'text-green-600'}`}>
                              {record.temperature}°C
                            </p>
                          </div>
                        </div>
                      )}
                      
                      <div className="flex items-center space-x-2">
                        <Heart className="w-5 h-5 text-pink-500" />
                        <div>
                         <p className="text-slate-500">Condiciones</p>
                         <p className="font-medium text-slate-700">
                           {record.baseConditions?.length || 'Ninguna'}
                         </p>
                       </div>
                     </div>
                   </div>

                   {/* 🆕 MOSTRAR INFO DEL DOCTOR SEGÚN ESTADO */}
                   {record.attending_doctor && record.attentionStatus === 'in_progress' && (
                     <div className="mt-3 p-3 bg-orange-50 rounded-lg border-l-4 border-orange-400">
                       <p className="text-sm text-orange-800">
                         <span className="font-medium">👨‍⚕️ En atención por:</span> Dr. {record.attending_doctor.name}
                       </p>
                     </div>
                   )}
                   
                   {record.attentionStatus === 'completed' && (
                     <div className="mt-3 p-3 bg-green-50 rounded-lg border-l-4 border-green-400">
                       <p className="text-sm text-green-800">
                         <span className="font-medium">✅ Atendido por:</span> Dr. {
                           record.completed_by_doctor?.name || 
                           record.attending_doctor?.name || 
                           getCurrentDoctorInfo().name ||
                           'Doctor'
                         }
                       </p>
                     </div>
                   )}

                   {/* 🆕 MOSTRAR INFO DE DESCARTE */}
                   {record.attentionStatus === 'dismissed' && (
                     <div className="mt-3 p-3 bg-red-50 rounded-lg border-l-4 border-red-400">
                       <p className="text-sm text-red-800">
                         <span className="font-medium">🚫 Descartado por:</span> Dr. {
                           record.dismissed_by_doctor?.name || 
                           getCurrentDoctorInfo().name || 'Doctor'
                        }
                      </p>
                    </div>
                  )}

                  {/* Notas */}
                  {record.notes && (
                    <div className="mt-3 p-3 bg-amber-50 rounded-lg border-l-4 border-amber-400">
                      <p className="text-sm text-amber-800">
                        <span className="font-medium">Nota:</span> {record.notes}
                      </p>
                    </div>
                  )}
                </div>

                {/* Acciones ACTUALIZADAS - OPTIMIZADAS */}
                <div className="flex-shrink-0 flex flex-col space-y-2">
                  <div className={`px-3 py-1 rounded-full text-xs font-medium text-center ${
                    getStatusDisplay(record.attentionStatus).style
                  }`}>
                    {getStatusDisplay(record.attentionStatus).label}
                  </div>

                  {/* 🔧 LOADING ESPECÍFICO POR PACIENTE Y ACCIÓN - OPTIMIZADO */}
                  <button 
                    onClick={() => handleViewDetail(record)}
                    disabled={loadingStates.detail[record._id]}
                    className="bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loadingStates.detail[record._id] ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                    Ver Detalle
                  </button>
                  
                  <button 
                   onClick={() => handleViewHistory(record)}
                   disabled={loadingStates.history[record._id]}
                   className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                 >
                   {loadingStates.history[record._id] ? (
                     <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                   ) : (
                     <History className="w-4 h-4" />
                   )}
                   Historial
                 </button>

                 {/* 🆕 BOTONES DE ESTADO ACTUALIZADOS - OPTIMIZADOS */}
                 {/* Estado: En Espera → Puede ir a Atender o Descartar */}
                 {(!record.attentionStatus || record.attentionStatus === 'pending' || record.attentionStatus === 'waiting') && (
                   <>
                     <button 
                       onClick={() => handleStatusChange(record._id, 'in_progress')}
                       disabled={loadingStates.statusUpdate[record._id]}
                       className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                     >
                       {loadingStates.statusUpdate[record._id] ? (
                         <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                       ) : (
                         <Clock className="w-4 h-4" />
                       )}
                       Atender
                     </button>
                     
                     {/* 🆕 BOTÓN DESCARTAR */}
                     <button 
                       onClick={() => handleStatusChange(record._id, 'dismissed')}
                       disabled={loadingStates.statusUpdate[record._id]}
                       className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                     >
                       {loadingStates.statusUpdate[record._id] ? (
                         <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                       ) : (
                         <Ban className="w-4 h-4" />
                       )}
                       Descartar
                     </button>
                   </>
                 )}
                 
                 {/* Estado: En Progreso → Puede Finalizar o Descartar */}
                 {record.attentionStatus === 'in_progress' && (
                   <>
                     <button 
                       onClick={() => handleStatusChange(record._id, 'completed')}
                       disabled={loadingStates.statusUpdate[record._id]}
                       className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                     >
                       {loadingStates.statusUpdate[record._id] ? (
                         <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                       ) : (
                         <CheckCircle className="w-4 h-4" />
                       )}
                       Finalizar
                     </button>
                     
                     {/* 🆕 BOTÓN DESCARTAR DESDE EN_PROGRESS */}
                     <button 
                       onClick={() => handleStatusChange(record._id, 'dismissed')}
                       disabled={loadingStates.statusUpdate[record._id]}
                       className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                     >
                       {loadingStates.statusUpdate[record._id] ? (
                         <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                       ) : (
                         <UserX className="w-4 h-4" />
                       )}
                       Descartar
                     </button>
                   </>
                 )}

                 {/* 🆕 BOTÓN PARA REACTIVAR PACIENTES DESCARTADOS */}
                 {record.attentionStatus === 'dismissed' && (
                   <button 
                     onClick={() => handleStatusChange(record._id, 'waiting')}
                     disabled={loadingStates.statusUpdate[record._id]}
                     className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                   >
                     {loadingStates.statusUpdate[record._id] ? (
                       <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                     ) : (
                       <RefreshCw className="w-4 h-4" />
                     )}
                     Reactivar
                   </button>
                 )}
               </div>
             </div>
           </div>
         ))}
       </div>
     )}
   </div>

   {/* 🚀 MODALES OPTIMIZADOS CON REACT.MEMO PARA EVITAR RE-RENDERS */}
   {/* Modal de Detalle */}
   {showDetailModal && patientDetail && (
     <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
       <div className="bg-white rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
         <div className="flex items-center justify-between mb-6">
           <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
             <Bot className="w-8 h-8 text-purple-600" />
             Detalle Completo - {patientDetail.patientName}
             {patientDetail.isWatsonData && (
               <Award className="w-6 h-6 text-yellow-500" title="Análisis Watson" />
             )}
             {/* 🆕 INDICADOR DE ASISTENCIA EN MODAL */}
             {patientDetail.isAssisted && patientDetail.assistedBy && (
               <div className="flex items-center gap-2 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm">
                 <Users className="w-4 h-4" />
                 <span>Asistido por {patientDetail.assistedBy.assistantName}</span>
               </div>
             )}
           </h2>
           <button 
             onClick={() => setShowDetailModal(false)}
             className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
           >
             <X className="w-6 h-6" />
           </button>
         </div>

         <div className="grid md:grid-cols-2 gap-6">
           {/* Información básica */}
           <div className="space-y-4">
             <div className="p-4 bg-slate-50 rounded-xl">
               <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                 <User className="w-5 h-5" />
                 Información del Paciente
               </h3>
               <div className="space-y-2 text-sm">
                 <p><strong>Nombre:</strong> {patientDetail.patientName}</p>
                 <p><strong>CI:</strong> {patientDetail.patientCI}</p>
                 <p><strong>Fecha:</strong> {new Date(patientDetail.createdAt).toLocaleString('es-ES')}</p>
                 <p><strong>Tiempo de procesamiento:</strong> {(patientDetail.processingTime / 1000).toFixed(2)} segundos</p>
                 {/* 🆕 INFORMACIÓN DE ASISTENCIA EN DETALLE */}
                 {patientDetail.isAssisted && patientDetail.assistedBy && (
                   <>
                     <p><strong>Asistido por:</strong> {patientDetail.assistedBy.assistantName}</p>
                     <p><strong>Rol asistente:</strong> {patientDetail.assistedBy.assistantRole}</p>
                     <p><strong>Fecha asistencia:</strong> {new Date(patientDetail.assistedBy.timestamp).toLocaleString('es-ES')}</p>
                   </>
                 )}
               </div>
             </div>

             <div className="p-4 bg-red-50 rounded-xl">
               <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                 <Activity className="w-5 h-5" />
                 Síntomas Reportados
               </h3>
               <div className="flex flex-wrap gap-2">
                 {patientDetail.symptoms?.map((symptom, idx) => (
                   <span key={idx} className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm">
                     {symptom}
                   </span>
                 ))}
               </div>
               {patientDetail.notes && (
                 <div className="mt-3 p-3 bg-amber-50 rounded-lg">
                   <p className="text-sm"><strong>Contexto:</strong> {patientDetail.notes}</p>
                 </div>
               )}
             </div>
           </div>

           {/* Clasificación */}
           <div className="space-y-4">
             <div 
               className="p-4 rounded-xl border-2"
               style={{
                 backgroundColor: patientDetail.urgency?.bgColor,
                 borderColor: patientDetail.urgency?.color
               }}
             >
               <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                 <Target className="w-5 h-5" />
                 Clasificación Médica
               </h3>
               <div className="space-y-3">
                 <div className="flex justify-between items-center">
                   <span>Nivel de Urgencia:</span>
                   <span 
                     className="px-3 py-1 rounded-full text-white font-bold"
                     style={{ backgroundColor: patientDetail.urgency?.color }}
                   >
                     Nivel {patientDetail.urgency?.level}
                   </span>
                 </div>
                 <div className="flex justify-between items-center">
                   <span>Especialidad:</span>
                   <span className="font-bold text-purple-700">{patientDetail.specialty}</span>
                 </div>
                 <div className="flex justify-between items-center">
                   <span>Método:</span>
                   <span className={`px-2 py-1 rounded-full text-xs ${
                     patientDetail.classificationMethod === 'watson' 
                       ? 'bg-purple-100 text-purple-700' 
                       : 'bg-gray-100 text-gray-600'
                   }`}>
                     {patientDetail.classificationMethod === 'watson' ? '🤖 Watson IA' : '📋 Protocolo'}
                   </span>
                 </div>
               </div>
             </div>

             {/* Información de seguimiento */}
             {patientDetail.isFollowUp && (
               <div className="p-4 bg-blue-50 rounded-xl">
                 <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                   <Eye className="w-5 h-5" />
                   Consulta de Seguimiento
                 </h3>
                 <div className="space-y-2 text-sm">
                   <p><strong>Secuencia:</strong> #{patientDetail.sessionSequence}</p>
                   <p><strong>Consultas previas:</strong> {patientDetail.historicalConsultationsCount}</p>
                   <p><strong>Contexto histórico:</strong> {patientDetail.hadHistoricalContext ? 'Sí' : 'No'}</p>
                 </div>
               </div>
             )}

             {/* Datos técnicos Watson */}
             {patientDetail.isWatsonData && (
               <div className="p-4 bg-purple-50 rounded-xl">
                 <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                   <Cpu className="w-5 h-5" />
                   Información Watson
                 </h3>
                 <div className="space-y-2 text-sm">
                   <p><strong>Tokens utilizados:</strong> {patientDetail.watsonTokensUsed}</p>
                   <p><strong>Session ID:</strong> {patientDetail.sessionId?.substring(0, 8)}...</p>
                   {patientDetail.fallbackReason && (
                     <p><strong>Fallback:</strong> {patientDetail.fallbackReason}</p>
                   )}
                 </div>
               </div>
             )}
           </div>
         </div>

         {/* Historial de consultas */}
         {patientDetail.patientHistory && patientDetail.patientHistory.length > 0 && (
           <div className="mt-6 p-4 bg-gray-50 rounded-xl">
             <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
               <History className="w-5 h-5" />
               Historial de Consultas ({patientDetail.patientHistory.length})
             </h3>
             <div className="space-y-3 max-h-60 overflow-y-auto">
               {patientDetail.patientHistory.map((consultation, idx) => (
                 <div key={idx} className="p-3 bg-white rounded-lg border">
                   <div className="flex justify-between items-start mb-2">
                     <span className="font-medium text-slate-800">
                       {new Date(consultation.date).toLocaleDateString('es-ES')}
                     </span>
                     <span className={`px-2 py-1 rounded-full text-xs ${
                       consultation.method === 'watson' 
                         ? 'bg-purple-100 text-purple-700' 
                         : 'bg-gray-100 text-gray-600'
                     }`}>
                       Nivel {consultation.urgencyLevel}
                     </span>
                   </div>
                   <p className="text-sm text-slate-600 mb-1">
                     <strong>Síntomas:</strong> {consultation.symptoms?.join(', ')}
                   </p>
                   <p className="text-sm text-slate-600">
                     <strong>Especialidad:</strong> {consultation.specialty}
                   </p>
                 </div>
               ))}
             </div>
           </div>
         )}

         {/* Botones PDF */}
         <div className="mt-6 flex gap-3">
           <TriagePDFButton 
             patientDetail={patientDetail}
             className="flex-1"
           />
           
           {patientDetail.patientHistory && patientDetail.patientHistory.length > 0 && (
             <HistorialPDFButton 
               patientDetail={patientDetail}
               className="flex-1"
             />
           )}
           
           <button 
             onClick={() => setShowDetailModal(false)}
             className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-colors"
           >
             Cerrar
           </button>
         </div>
       </div>
     </div>
   )}

   {/* Modal de Historial - Mantenido igual pero optimizado */}
   {showHistoryModal && patientHistory && (
     <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
       <div className="bg-white rounded-2xl p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
         <div className="flex items-center justify-between mb-6">
           <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
             <History className="w-8 h-8 text-purple-600" />
             Historial Clínico - {selectedPatient?.patientName}
             {/* 🆕 INDICADOR DE ASISTENCIA EN HISTORIAL */}
             {selectedPatient?.isAssisted && selectedPatient?.assistedBy && (
               <div className="flex items-center gap-2 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm">
                 <Users className="w-4 h-4" />
                 <span>Último triaje asistido</span>
               </div>
             )}
           </h2>
           <button 
             onClick={() => setShowHistoryModal(false)}
             className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
           >
             <X className="w-6 h-6" />
           </button>
         </div>

         {patientHistory.hasHistory ? (
           <div className="space-y-6">
             {/* Resumen del paciente */}
             <div className="p-4 bg-purple-50 rounded-xl border border-purple-200">
               <h3 className="font-semibold text-purple-800 mb-3 flex items-center gap-2">
                 <Bot className="w-5 h-5" />
                 Resumen del Paciente
               </h3>
               <div className="grid md:grid-cols-2 gap-4 text-sm">
                 <div>
                   <p><strong>Total consultas:</strong> {patientHistory.totalConsultations}</p>
                   <p><strong>Última consulta:</strong> {patientHistory.lastConsultation.date}</p>
                   <p><strong>Días transcurridos:</strong> {patientHistory.lastConsultation.daysSince}</p>
                 </div>
                 <div>
                   <p><strong>Última especialidad:</strong> {patientHistory.lastConsultation.specialty}</p>
                   <p><strong>Último nivel:</strong> {patientHistory.lastConsultation.level}</p>
                   <p><strong>Temperatura previa:</strong> {patientHistory.lastConsultation.temperature}</p>
                 </div>
               </div>
             </div>

             {/* Enfermedades preexistentes */}
             {patientHistory.baseConditions && patientHistory.baseConditions.length > 0 && (
               <div className="p-4 bg-blue-50 rounded-xl">
                 <h3 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
                   <Heart className="w-5 h-5" />
                   Enfermedades Preexistentes
                 </h3>
                 <div className="flex flex-wrap gap-2">
                   {patientHistory.baseConditions.map((condition, idx) => (
                     <span key={idx} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                       {condition}
                     </span>
                   ))}
                 </div>
               </div>
             )}

             {/* Historial de consultas */}
             <div className="space-y-3">
               <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                 <Calendar className="w-5 h-5" />
                 Historial de Consultas ({patientHistory.consultationHistory.length})
               </h3>
               {patientHistory.consultationHistory.map((consultation, idx) => (
                 <div key={idx} className="p-4 bg-gray-50 rounded-xl border-l-4 border-purple-400">
                   <div className="flex justify-between items-start mb-3">
                     <div>
                       <p className="font-semibold text-slate-800">{consultation.date}</p>
                       <p className="text-sm text-slate-600">Especialidad: {consultation.specialty}</p>
                     </div>
                     <div className="text-right">
                       <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                         consultation.level <= 2 ? 'bg-red-100 text-red-700' :
                         consultation.level === 3 ? 'bg-yellow-100 text-yellow-700' :
                         'bg-green-100 text-green-700'
                       }`}>
                         Nivel {consultation.level}
                       </span>
                       {consultation.temperature && (
                         <p className="text-sm text-slate-500 mt-1">
                           🌡️ {consultation.temperature}
                         </p>
                       )}
                     </div>
                   </div>
                   <div className="space-y-2">
                     <p className="text-sm">
                       <strong>Síntomas:</strong> {consultation.symptoms}
                     </p>
                   </div>
                 </div>
               ))}
             </div>
           </div>
         ) : (
           <div className="text-center py-12">
             <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
               <User className="w-8 h-8 text-gray-400" />
             </div>
             <h3 className="text-lg font-semibold text-gray-800 mb-2">Paciente Nuevo</h3>
             <p className="text-gray-600">Este paciente no tiene historial médico previo en el sistema.</p>
           </div>
         )}

         {/* Botones PDF para historial */}
         <div className="mt-6 flex gap-3">
           {patientHistory.hasHistory && patientDetail ? (
             <HistorialPDFButton 
               patientDetail={patientDetail}
               className="flex-1"
             />
           ) : (
             <div className="flex-1 px-4 py-3 bg-gray-100 text-gray-500 rounded-xl text-center">
               Sin historial para descargar
             </div>
           )}
           
           <button 
             onClick={() => setShowHistoryModal(false)}
             className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-colors"
           >
             Cerrar
           </button>
         </div>
       </div>
     </div>
   )}
 </div>
);
};

export default PatientQueue;