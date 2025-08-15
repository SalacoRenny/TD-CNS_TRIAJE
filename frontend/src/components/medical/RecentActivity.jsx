import React, { useState, useEffect, useRef } from 'react';

const RecentActivity = ({ records, onRefresh, updateTrigger, lastUpdate }) => {
  const [activityLog, setActivityLog] = useState([]);
  const [lastUpdateTime, setLastUpdateTime] = useState(new Date());
  const [previousRecords, setPreviousRecords] = useState([]);
  const activityHistory = useRef([]); // Persistir historial completo

  // 🔧 DETECTAR CAMBIOS Y GENERAR NUEVAS ACTIVIDADES (SIN SOBREESCRIBIR)
  useEffect(() => {
    console.log('🔄 RecentActivity - Detectando cambios:', {
      recordsLength: records.length,
      updateTrigger,
      timestamp: new Date().toISOString()
    });

    const detectChangesAndAddActivities = () => {
      const now = new Date();
      const newActivities = [];

      // 🔍 DETECTAR CAMBIOS DE ESTADO
      records.forEach(currentRecord => {
        const previousRecord = previousRecords.find(p => p._id === currentRecord._id);
        
        // 📝 PACIENTE NUEVO (primera vez que aparece)
        if (!previousRecord) {
          newActivities.push({
            id: `${currentRecord._id}_registered_${now.getTime()}`,
            type: 'registration',
            timestamp: currentRecord.createdAt,
            patientName: currentRecord.patientName,
            patientCI: currentRecord.patientCI,
            urgencyLevel: currentRecord.urgency?.level,
            urgencyLabel: currentRecord.urgency?.label,
            description: `Nuevo registro de triaje`,
            detailText: `Síntomas: ${(currentRecord.symptoms || []).slice(0, 2).join(', ')}`,
            icon: '📝',
            color: 'blue',
            sortTime: new Date(currentRecord.createdAt),
            isNew: true,
            priority: 3
          });

          // 🚨 CASO CRÍTICO (si es crítico desde el inicio)
          if (currentRecord.urgency?.level <= 2) {
            newActivities.push({
              id: `${currentRecord._id}_critical_${now.getTime()}`,
              type: 'critical',
              timestamp: currentRecord.createdAt,
              patientName: currentRecord.patientName,
              patientCI: currentRecord.patientCI,
              urgencyLevel: currentRecord.urgency?.level,
              urgencyLabel: currentRecord.urgency?.label,
              description: `🚨 Caso crítico detectado`,
              detailText: `Nivel ${currentRecord.urgency?.level} - ${currentRecord.urgency?.label}`,
              icon: '🚨',
              color: 'red',
              sortTime: new Date(currentRecord.createdAt),
              isNew: true,
              isUrgent: true,
              priority: 0
            });
          }
        } 
        // 🔄 CAMBIO DE ESTADO DETECTADO
        else if (previousRecord.attentionStatus !== currentRecord.attentionStatus) {
          const doctorName = getCurrentDoctorName(currentRecord);
          
          // 👨‍⚕️ PACIENTE AHORA EN ATENCIÓN
          if (currentRecord.attentionStatus === 'in_progress') {
            newActivities.push({
              id: `${currentRecord._id}_attending_${now.getTime()}`,
              type: 'attending',
              timestamp: currentRecord.attention_updated_at || now.toISOString(),
              patientName: currentRecord.patientName,
              patientCI: currentRecord.patientCI,
              urgencyLevel: currentRecord.urgency?.level,
              urgencyLabel: currentRecord.urgency?.label,
              description: `Atención médica iniciada`,
              detailText: `👨‍⚕️ Dr. ${doctorName} ha comenzado la atención`,
              icon: '👨‍⚕️',
              color: 'orange',
              sortTime: new Date(currentRecord.attention_updated_at || now),
              isNew: true,
              priority: 1
            });
          }

          // ✅ PACIENTE ATENCIÓN COMPLETADA
          if (currentRecord.attentionStatus === 'completed') {
            newActivities.push({
              id: `${currentRecord._id}_completed_${now.getTime()}`,
              type: 'completed',
              timestamp: currentRecord.attention_updated_at || now.toISOString(),
              patientName: currentRecord.patientName,
              patientCI: currentRecord.patientCI,
              urgencyLevel: currentRecord.urgency?.level,
              urgencyLabel: currentRecord.urgency?.label,
              description: `Atención médica completada`,
              detailText: `✅ Finalizada por Dr. ${doctorName}`,
              icon: '✅',
              color: 'green',
              sortTime: new Date(currentRecord.attention_updated_at || now),
              isNew: true,
              priority: 1
            });
          }

          // 🚫 PACIENTE DESCARTADO - NUEVO
          if (currentRecord.attentionStatus === 'dismissed') {
            newActivities.push({
              id: `${currentRecord._id}_dismissed_${now.getTime()}`,
              type: 'dismissed',
              timestamp: currentRecord.attention_updated_at || now.toISOString(),
              patientName: currentRecord.patientName,
              patientCI: currentRecord.patientCI,
              urgencyLevel: currentRecord.urgency?.level,
              urgencyLabel: currentRecord.urgency?.label,
              description: `Paciente descartado`,
              detailText: `🚫 Descartado por Dr. ${doctorName}`,
              icon: '🚫',
              color: 'red',
              sortTime: new Date(currentRecord.attention_updated_at || now),
              isNew: true,
              priority: 2
            });
          }

          // 🔄 PACIENTE REACTIVADO - NUEVO
          if ((currentRecord.attentionStatus === 'waiting' || currentRecord.attentionStatus === 'pending') && 
              previousRecord.attentionStatus === 'dismissed') {
            newActivities.push({
              id: `${currentRecord._id}_reactivated_${now.getTime()}`,
              type: 'reactivated',
              timestamp: currentRecord.attention_updated_at || now.toISOString(),
              patientName: currentRecord.patientName,
              patientCI: currentRecord.patientCI,
              urgencyLevel: currentRecord.urgency?.level,
              urgencyLabel: currentRecord.urgency?.label,
              description: `Paciente reactivado`,
              detailText: `🔄 Vuelve a la cola de espera por Dr. ${doctorName}`,
              icon: '🔄',
              color: 'blue',
              sortTime: new Date(currentRecord.attention_updated_at || now),
              isNew: true,
              priority: 2
            });
          }

          // ⏳ PACIENTE VUELVE A ESPERA (desde otros estados no dismissed)
          if ((currentRecord.attentionStatus === 'waiting' || currentRecord.attentionStatus === 'pending') && 
              previousRecord.attentionStatus !== 'dismissed' && 
              previousRecord.attentionStatus !== 'pending' && 
              previousRecord.attentionStatus !== 'waiting') {
            newActivities.push({
              id: `${currentRecord._id}_waiting_again_${now.getTime()}`,
              type: 'waiting_again',
              timestamp: now.toISOString(),
              patientName: currentRecord.patientName,
              patientCI: currentRecord.patientCI,
              urgencyLevel: currentRecord.urgency?.level,
              urgencyLabel: currentRecord.urgency?.label,
              description: `Paciente en espera nuevamente`,
              detailText: `⏳ Requiere nueva asignación médica`,
              icon: '⏳',
              color: 'blue',
              sortTime: now,
              isNew: true,
              priority: 2
            });
          }
        }
      });

      // 🔍 PACIENTES EN ESPERA PROLONGADA - ACTUALIZADO PARA NUEVOS ESTADOS
      const longWaitingPatients = records
        .filter(record => {
          const isWaiting = !record.attentionStatus || 
                           record.attentionStatus === 'pending' || 
                           record.attentionStatus === 'waiting';
          if (!isWaiting) return false;
          
          const waitTime = now - new Date(record.createdAt);
          const waitMinutes = waitTime / (1000 * 60);
          return waitMinutes > 30 && waitMinutes < 35; // Solo entre 30-35 min para evitar spam
        })
        .filter(record => {
          const hasRecentAlert = activityHistory.current.some(activity => 
            activity.patientCI === record.patientCI && 
            activity.type === 'long_waiting' &&
            (now - new Date(activity.timestamp)) < 30 * 60 * 1000
          );
          return !hasRecentAlert;
        });

      longWaitingPatients.forEach(record => {
        const waitMinutes = Math.floor((now - new Date(record.createdAt)) / (1000 * 60));
        newActivities.push({
          id: `${record._id}_long_wait_${now.getTime()}`,
          type: 'long_waiting',
          timestamp: now.toISOString(),
          patientName: record.patientName,
          patientCI: record.patientCI,
          urgencyLevel: record.urgency?.level,
          urgencyLabel: record.urgency?.label,
          description: `⚠️ Espera prolongada`,
          detailText: `${waitMinutes} minutos esperando atención`,
          icon: '⚠️',
          color: 'red',
          sortTime: now,
          isNew: true,
          isUrgent: true,
          priority: 1
        });
      });

      // 📊 AGREGAR NUEVAS ACTIVIDADES AL HISTORIAL
      if (newActivities.length > 0) {
        activityHistory.current = [...activityHistory.current, ...newActivities]
          .sort((a, b) => new Date(b.sortTime) - new Date(a.sortTime))
          .slice(0, 30); // Mantener solo últimas 30 actividades

        console.log(`✨ ${newActivities.length} nuevas actividades agregadas:`, newActivities.map(a => a.description));
      }

      // 🔄 ACTUALIZAR ACTIVIDADES VISIBLES
      const visibleActivities = activityHistory.current
        .slice(0, 30)
        .map((activity) => ({
          ...activity,
          isNew: activity.isNew && (now - new Date(activity.timestamp)) < 10000, // "Nuevo" por 10 segundos
        }));

      setActivityLog(visibleActivities);
      setPreviousRecords([...records]);
      setLastUpdateTime(now);
    };

    detectChangesAndAddActivities();
  }, [records, updateTrigger]);

  // 🔍 HELPER: Obtener nombre del doctor actual - ACTUALIZADO
  const getCurrentDoctorName = (record) => {
    return record.dismissed_by_doctor?.name ||
           record.completed_by_doctor?.name || 
           record.attending_doctor?.name || 
           'Dr. Sistema';
  };

  // 🎨 ESTILOS CONSISTENTES CON PATIENT QUEUE
  const getActivityStyles = (color) => {
    const styles = {
      blue: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200' },
      orange: { bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-200' },
      green: { bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-200' },
      red: { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-200' }
    };
    return styles[color] || styles.blue;
  };

  const formatTime = (timestamp) => {
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffMinutes = Math.floor((now - date) / (1000 * 60));
      
      if (diffMinutes < 1) return 'Ahora mismo';
      if (diffMinutes < 60) return `${diffMinutes}m`;
      if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h`;
      return `${Math.floor(diffMinutes / 1440)}d`;
    } catch {
      return 'N/A';
    }
  };

  // 🆕 FUNCIÓN ACTUALIZADA PARA CONTAR ESTADOS NUEVOS
  const getStatusCounts = () => {
    return {
      waiting: records.filter(r => !r.attentionStatus || r.attentionStatus === 'pending' || r.attentionStatus === 'waiting').length,
      inProgress: records.filter(r => r.attentionStatus === 'in_progress').length,
      completed: records.filter(r => r.attentionStatus === 'completed').length,
      dismissed: records.filter(r => r.attentionStatus === 'dismissed').length,
      critical: records.filter(r => r.urgency?.level <= 2).length
    };
  };

  const statusCounts = getStatusCounts();

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
      {/* 🎨 HEADER IDÉNTICO A PATIENT QUEUE */}
      <div className="bg-gradient-to-r from-teal-500 to-emerald-500 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">Monitor de Actividad</h2>
            <p className="text-teal-100 text-sm flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Sistema AISANA + Tiempo Real
              {activityLog.length > 0 && (
                <span className="bg-white/20 px-2 py-1 rounded-full text-xs">
                  ⚡ {activityLog.length} actividades
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => {
                console.log('🔄 Refresh manual activado');
                onRefresh();
              }}
              className="bg-white/20 hover:bg-white/30 backdrop-blur-sm p-2 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
            <div className="text-white text-sm">
              Trigger: {updateTrigger}
            </div>
          </div>
        </div>
      </div>

      {/* 📊 STATUS TABS ACTUALIZADOS CON NUEVOS ESTADOS */}
      <div className="px-6 pt-4 border-b border-slate-200">
        <div className="flex space-x-2 mb-4 flex-wrap">
          <div className="flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-medium border-2 text-red-600 bg-red-50 border-red-200">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 18.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <span>Críticos</span>
            <span className="bg-white/80 px-2 py-0.5 rounded-full text-xs font-bold">
              {statusCounts.critical}
            </span>
          </div>
          
          <div className="flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-medium border-2 text-blue-600 bg-blue-50 border-blue-200">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>En Espera</span>
            <span className="bg-white/80 px-2 py-0.5 rounded-full text-xs font-bold">
              {statusCounts.waiting}
            </span>
          </div>
          
          <div className="flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-medium border-2 text-orange-600 bg-orange-50 border-orange-200">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
            <span>En Atención</span>
            <span className="bg-white/80 px-2 py-0.5 rounded-full text-xs font-bold">
              {statusCounts.inProgress}
            </span>
          </div>
          
          <div className="flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-medium border-2 text-green-600 bg-green-50 border-green-200">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Completados</span>
            <span className="bg-white/80 px-2 py-0.5 rounded-full text-xs font-bold">
              {statusCounts.completed}
            </span>
          </div>

          {/* 🆕 TAB PARA DESCARTADOS */}
          <div className="flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-medium border-2 text-red-600 bg-red-50 border-red-200">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18 12l-2.454-2.909L12 6l-3.546 3.091L6 12l.364 6.364" />
            </svg>
            <span>Descartados</span>
            <span className="bg-white/80 px-2 py-0.5 rounded-full text-xs font-bold">
              {statusCounts.dismissed}
            </span>
          </div>
        </div>
      </div>

      {/* 🎬 LISTA DE ACTIVIDADES CON ESTILO PATIENT QUEUE */}
      <div className="max-h-[600px] overflow-y-auto">
        {activityLog.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-slate-500">Sin actividad reciente</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
            {activityLog.map((activity, index) => {
              const styles = getActivityStyles(activity.color);
              
              return (
                <div key={activity.id} className={`p-6 hover:bg-slate-50 transition-colors ${
                  activity.isNew ? 'bg-green-50/50 ring-2 ring-green-200' : ''
                }`}>
                  <div className="flex items-start space-x-4">
                    {/* 🎯 INDICADOR DE PRIORIDAD COMO PATIENT QUEUE */}
                    <div className="flex-shrink-0">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg relative ${styles.bg} border-2 ${styles.border}`}>
                        <span className="text-2xl">{activity.icon}</span>
                        {activity.isNew && (
                          <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs font-bold">!</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 📝 INFORMACIÓN DEL PACIENTE COMO PATIENT QUEUE */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h3 className="text-lg font-semibold text-slate-800">
                            {activity.patientName}
                          </h3>
                          <p className="text-sm text-slate-500">CI: {activity.patientCI}</p>
                        </div>
                        <div className="text-right">
                          <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                            activity.type === 'critical' ? 'bg-red-500 text-white' :
                            activity.type === 'attending' ? 'bg-orange-500 text-white' :
                            activity.type === 'completed' ? 'bg-green-500 text-white' :
                            activity.type === 'dismissed' ? 'bg-red-600 text-white' :
                            activity.type === 'reactivated' ? 'bg-blue-500 text-white' :
                            activity.type === 'waiting_again' ? 'bg-blue-400 text-white' :
                            'bg-blue-500 text-white'
                          }`}>
                            {activity.type === 'critical' ? 'CRÍTICO' :
                             activity.type === 'attending' ? 'EN ATENCIÓN' :
                             activity.type === 'completed' ? 'COMPLETADO' :
                             activity.type === 'dismissed' ? 'DESCARTADO' :
                             activity.type === 'reactivated' ? 'REACTIVADO' :
                             activity.type === 'waiting_again' ? 'EN ESPERA' :
                             'REGISTRO'}
                          </div>
                          <p className="text-xs text-slate-500 mt-1">{formatTime(activity.timestamp)}</p>
                          {activity.isNew && (
                            <div className="mt-1">
                              <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700 font-medium">
                                ✨ Nuevo
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* 🎬 DESCRIPCIÓN DE LA ACTIVIDAD */}
                      <div className="mb-3">
                        <p className="text-sm text-slate-600 mb-1">
                          <span className="font-medium">{activity.description}</span>
                        </p>
                        {activity.detailText && (
                          <p className="text-sm text-slate-600">
                            {activity.detailText}
                          </p>
                        )}
                      </div>

                      {/* 🏷️ URGENCY LABEL */}
                      {activity.urgencyLabel && (
                        <div className="flex items-center space-x-2">
                          <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${
                            activity.urgencyLevel <= 2 ? 'bg-red-100 text-red-700' :
                            activity.urgencyLevel === 3 ? 'bg-yellow-100 text-yellow-700' :
                            'bg-green-100 text-green-700'
                          }`}>
                            {activity.urgencyLabel}
                          </span>
                          {activity.isUrgent && (
                            <span className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-red-100 text-red-700 font-medium">
                              🚨 Urgente
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 📊 FOOTER COMO PATIENT QUEUE */}
      <div className="px-6 py-3 bg-slate-50 border-t border-slate-200">
        <div className="flex items-center justify-between text-sm text-slate-500">
          <span>📈 Actividades en tiempo real</span>
          <span>Última actualización: {formatTime(lastUpdateTime)}</span>
        </div>
      </div>
    </div>
  );
};

export default RecentActivity;