import React from 'react';

const RecentActivity = ({ records }) => {
  const getActivityIcon = (urgencyLevel) => {
    switch(urgencyLevel) {
      case 1: return { icon: '🚨', color: 'text-red-500', bg: 'bg-red-50' };
      case 2: return { icon: '⚡', color: 'text-orange-500', bg: 'bg-orange-50' };
      case 3: return { icon: '⚠️', color: 'text-yellow-500', bg: 'bg-yellow-50' };
      case 4: return { icon: '🟢', color: 'text-green-500', bg: 'bg-green-50' };
      case 5: return { icon: '🔵', color: 'text-blue-500', bg: 'bg-blue-50' };
      default: return { icon: '❓', color: 'text-slate-500', bg: 'bg-slate-50' };
    }
  };

  const formatTimestamp = (timestamp) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'N/A';
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-slate-800">Actividad Reciente</h3>
          <p className="text-sm text-slate-500">Últimos registros</p>
        </div>
        <div className="bg-emerald-50 p-2 rounded-lg">
          <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      </div>

      {records.length === 0 ? (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-slate-500 text-sm">Sin actividad reciente</p>
        </div>
      ) : (
        <div className="space-y-4">
          {records.map((record, index) => {
            const activity = getActivityIcon(record.urgency?.level);
            
            return (
              <div key={record._id} className="group hover:bg-slate-50 p-3 rounded-xl transition-all duration-200">
                <div className="flex items-start space-x-3">
                  {/* Timeline Indicator */}
                  <div className="relative">
                    <div className={`w-10 h-10 rounded-full ${activity.bg} flex items-center justify-center`}>
                      <span className="text-lg">{activity.icon}</span>
                    </div>
                    {index < records.length - 1 && (
                      <div className="absolute top-10 left-1/2 transform -translate-x-1/2 w-px h-8 bg-slate-200"></div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-semibold text-slate-800 truncate">
                        {record.patientName}
                      </h4>
                      <span className="text-xs text-slate-500">
                        {formatTimestamp(record.createdAt)}
                      </span>
                    </div>
                    
                    <p className="text-sm text-slate-600 mb-2">
                      CI: {record.patientCI} • {record.urgency?.label}
                    </p>
                    
                    {/* Primary Symptom */}
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-slate-500">Síntoma principal:</span>
                      <span className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-red-100 text-red-700">
                        {record.symptoms[0] || 'No especificado'}
                      </span>
                    </div>

                    {/* Temperature if available */}
                    {record.temperature && (
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-xs text-slate-500">Temperatura:</span>
                        <span className={`text-xs font-medium ${
                          parseFloat(record.temperature) > 37.5 ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {record.temperature}°C
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Action Button */}
                  <div className="flex-shrink-0">
                    <button className="opacity-0 group-hover:opacity-100 bg-teal-500 hover:bg-teal-600 text-white p-2 rounded-lg text-xs transition-all duration-200">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Footer */}
      {records.length > 0 && (
        <div className="mt-6 pt-4 border-t border-slate-200">
          <button className="w-full bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white py-3 px-4 rounded-xl font-medium transition-all duration-200 hover:shadow-lg">
            Ver Todo el Historial
          </button>
        </div>
      )}
    </div>
  );
};

export default RecentActivity;