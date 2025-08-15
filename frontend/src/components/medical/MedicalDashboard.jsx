import React, { useState, useEffect } from 'react';
import { getDashboardStats, getAllRecordsWithTriage, getUrgencyAnalysis } from '../../services/api';
import { useUser } from '../../context/UserContext';
import StatsCards from './StatsCards';
import PatientQueue from './PatientQueue';
import UrgencyChart from './UrgencyChart';
import SpecialtyDistribution from './SpecialtyDistribution';
import RecentActivity from './RecentActivity';

const MedicalDashboard = () => {
  const { user } = useUser();
  const [stats, setStats] = useState(null);
  const [recentRecords, setRecentRecords] = useState([]);
  const [urgencyData, setUrgencyData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [lastUpdate, setLastUpdate] = useState(new Date());
  // 🆕 Estado para forzar re-render de actividad
  const [activityUpdateTrigger, setActivityUpdateTrigger] = useState(0);

  useEffect(() => {
    loadDashboardData();
    
    // Actualizar reloj cada segundo
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    // 🔧 Actualización más frecuente - cada 10 segundos
    const dataTimer = setInterval(() => {
      loadDashboardData();
    }, 10000);

    return () => {
      clearInterval(timer);
      clearInterval(dataTimer);
    };
  }, []);

  const loadDashboardData = async () => {
    try {
      const [statsRes, recordsRes, urgencyRes] = await Promise.all([
        getDashboardStats(),
        getAllRecordsWithTriage({ limit: 100 }), // 🔧 Más registros para mejor tracking
        getUrgencyAnalysis()
      ]);

      setStats(statsRes.data);
      setRecentRecords(recordsRes.data.records);
      setUrgencyData(urgencyRes.data);
      setLastUpdate(new Date());
      // 🆕 Triggear actualización de actividad
      setActivityUpdateTrigger(prev => prev + 1);
      setLoading(false);
      
      console.log('📊 Dashboard actualizado:', {
        records: recordsRes.data.records?.length,
        trigger: activityUpdateTrigger + 1
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setLoading(false);
    }
  };

// 🆕 Función específica para actualizar después de cambios de estado
const handlePatientStatusUpdate = async () => {
  console.log('🔄 Actualizando dashboard después de cambio de estado...');
  
  // 🔧 TRIGGER INMEDIATO ANTES DE RECARGAR
  setActivityUpdateTrigger(prev => {
    const newTrigger = prev + 1;
    console.log(`📊 Nuevo trigger: ${newTrigger}`);
    return newTrigger;
  });
  
  // 🔧 PEQUEÑO DELAY PARA ASEGURAR QUE EL BACKEND SE ACTUALIZÓ
  setTimeout(async () => {
    await loadDashboardData();
  }, 500); // 500ms delay
};
  const getUserName = () => {
    if (!user) return "Doctor";
    
    const possibleNames = [
      user.name,
      user.fullName,
      user.nombre,
      user.nombreCompleto,
      user.firstName,
      user.username,
      user.email?.split('@')[0]
    ];
    
    const foundName = possibleNames.find(name => name && name !== "");
    return foundName || "Doctor";
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Buenos días";
    if (hour < 18) return "Buenas tardes";
    return "Buenas noches";
  };

  const getUserTitle = () => {
    if (!user) return "Dr.";
    
    const titles = {
      'medico': 'Dr.',
      'doctor': 'Dr.',
      'enfermera': 'Enf.',
      'enfermero': 'Enf.',
      'nurse': 'Enf.',
      'admin': 'Admin.',
      'administrador': 'Admin.'
    };
    
    return titles[user.role?.toLowerCase()] || 
           titles[user.tipo?.toLowerCase()] || 
           titles[user.profession?.toLowerCase()] || 
           "Dr.";
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-2xl shadow-xl">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
          <p className="text-slate-600 mt-4 text-center">Cargando dashboard médico...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-gradient-to-r from-teal-500 to-green-500 p-3 rounded-xl">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-800">Dashboard Médico CNS</h1>
                <p className="text-slate-600 text-sm">
                  {getGreeting()}, {getUserTitle()} {getUserName()}
                  {!user && (
                    <span className="inline-flex items-center gap-1 ml-2">
                      <div className="w-3 h-3 border border-slate-400/30 border-t-slate-400 rounded-full animate-spin"></div>
                    </span>
                  )}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-6">
              <div className="text-right">
                <div className="text-2xl font-mono font-bold text-slate-800">
                  {formatTime(currentTime)}
                </div>
                <div className="text-sm text-slate-600 capitalize">
                  {formatDate(currentTime)}
                </div>
                {/* 🆕 Última actualización */}
                <div className="text-xs text-slate-500">
                  Última actualización: {formatTime(lastUpdate)}
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse"></div>
                <span className="text-sm text-slate-600">Sistema Activo</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Cards */}
        <StatsCards stats={stats} />

        {/* 🔧 LAYOUT MEJORADO CON ACTIVIDAD EN TIEMPO REAL */}
        <div className="grid grid-cols-12 gap-8 mt-8">
          {/* Left Column - Patient Queue + Recent Activity */}
          <div className="col-span-12 lg:col-span-8 space-y-6">
            {/* Patient Queue */}
            <PatientQueue 
              records={recentRecords} 
              onRefresh={handlePatientStatusUpdate} // 🔧 Función específica para cambios de estado
            />
            
            {/* 🆕 Recent Activity debajo de Patient Queue con actualizaciones en tiempo real */}
            <RecentActivity 
              records={recentRecords} 
              onRefresh={handlePatientStatusUpdate}
              updateTrigger={activityUpdateTrigger} // 🆕 Trigger para forzar actualización inmediata
              lastUpdate={lastUpdate}
            />
          </div>
          
          {/* Right Column - Charts */}
          <div className="col-span-12 lg:col-span-4 space-y-6">
            {/* Urgency Chart */}
            <UrgencyChart urgencyData={urgencyData} />
            
            {/* Specialty Distribution */}
            <SpecialtyDistribution urgencyData={urgencyData} />
          </div>
        </div>

        {/* 🆕 Debug Info (remover en producción) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-4 p-3 bg-gray-100 rounded-lg text-xs text-gray-600">
            <p>🔧 Debug: Trigger={activityUpdateTrigger} | Records={recentRecords.length} | Última actualización={formatTime(lastUpdate)}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MedicalDashboard;