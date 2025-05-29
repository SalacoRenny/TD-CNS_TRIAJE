import React from 'react';

const UrgencyChart = ({ urgencyData }) => {
  if (!urgencyData) return null;

  const urgencyLevels = [
    { key: 'inmediato', label: 'Inmediato', color: '#EF4444', count: urgencyData.urgencyDistribution?.inmediato || 0 },
    { key: 'muyUrgente', label: 'Muy Urgente', color: '#F97316', count: urgencyData.urgencyDistribution?.muyUrgente || 0 },
    { key: 'urgente', label: 'Urgente', color: '#EAB308', count: urgencyData.urgencyDistribution?.urgente || 0 },
    { key: 'menosUrgente', label: 'Menos Urgente', color: '#22C55E', count: urgencyData.urgencyDistribution?.menosUrgente || 0 },
    { key: 'noUrgente', label: 'No Urgente', color: '#3B82F6', count: urgencyData.urgencyDistribution?.noUrgente || 0 }
  ];

  const total = urgencyLevels.reduce((sum, level) => sum + level.count, 0);
  const maxCount = Math.max(...urgencyLevels.map(level => level.count));

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-slate-800">Distribución de Urgencias</h3>
          <p className="text-sm text-slate-500">Clasificación Manchester</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-slate-800">{total}</div>
          <div className="text-xs text-slate-500">Total Casos</div>
        </div>
      </div>

      {/* Donut Chart Visual */}
      <div className="relative w-40 h-40 mx-auto mb-6">
        <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
          {urgencyLevels.map((level, index) => {
            const percentage = total > 0 ? (level.count / total) * 100 : 0;
            const strokeDasharray = `${percentage} ${100 - percentage}`;
            const strokeDashoffset = urgencyLevels
              .slice(0, index)
              .reduce((acc, prev) => acc + (total > 0 ? (prev.count / total) * 100 : 0), 0);

            return (
              <circle
                key={level.key}
                cx="50"
                cy="50"
                r="35"
                fill="transparent"
                stroke={level.color}
                strokeWidth="8"
                strokeDasharray={strokeDasharray}
                strokeDashoffset={-strokeDashoffset}
                className="transition-all duration-500"
              />
            );
          })}
        </svg>
        
        {/* Center Text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-2xl font-bold text-slate-800">{total}</div>
            <div className="text-xs text-slate-500">Pacientes</div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="space-y-3">
        {urgencyLevels.map((level) => {
          const percentage = total > 0 ? ((level.count / total) * 100).toFixed(1) : 0;
          const barWidth = maxCount > 0 ? (level.count / maxCount) * 100 : 0;

          return (
            <div key={level.key} className="flex items-center space-x-3">
              <div 
                className="w-4 h-4 rounded-full flex-shrink-0"
                style={{ backgroundColor: level.color }}
              ></div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-slate-700 truncate">
                    {level.label}
                  </span>
                  <div className="flex items-center space-x-2 text-sm">
                    <span className="font-semibold text-slate-800">{level.count}</span>
                    <span className="text-slate-500">({percentage}%)</span>
                  </div>
                </div>
                
                {/* Progress Bar */}
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div 
                    className="h-2 rounded-full transition-all duration-500"
                    style={{ 
                      width: `${barWidth}%`, 
                      backgroundColor: level.color 
                    }}
                  ></div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Priority Alert */}
      {urgencyData.urgencyDistribution?.inmediato > 0 && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.134 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <p className="text-sm font-medium text-red-800">
              {urgencyData.urgencyDistribution.inmediato} caso(s) requieren atención inmediata
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default UrgencyChart;