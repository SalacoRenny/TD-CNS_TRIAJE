import React from 'react';

const StatsCards = ({ stats }) => {
  const cards = [
    {
      title: 'Consultas Hoy',
      value: stats?.consultasHoy || 0,
      subtitle: `+${stats?.progreso || 0}% del mes`,
      icon: (
        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      ),
      gradient: 'from-blue-500 to-blue-600',
      bgGradient: 'from-blue-50 to-blue-100',
      change: '+12%',
      changeColor: 'text-blue-600'
    },
    {
      title: 'Esta Semana',
      value: stats?.consultasSemana || 0,
      subtitle: `Últimos 7 días`,
      icon: (
        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      gradient: 'from-emerald-500 to-teal-500',
      bgGradient: 'from-emerald-50 to-teal-50',
      change: '+8%',
      changeColor: 'text-emerald-600'
    },
    {
      title: 'Total Pacientes',
      value: stats?.totalPacientes || 0,
      subtitle: 'Pacientes únicos',
      icon: (
        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      gradient: 'from-purple-500 to-indigo-500',
      bgGradient: 'from-purple-50 to-indigo-50',
      change: '+15%',
      changeColor: 'text-purple-600'
    },
    {
      title: 'Temp. Promedio',
      value: `${stats?.temperaturaPromedio || 'N/A'}°C`,
      subtitle: 'Temperatura corporal',
      icon: (
        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l3-3 3 3v13a6 6 0 11-6 0z" />
        </svg>
      ),
      gradient: 'from-orange-500 to-red-500',
      bgGradient: 'from-orange-50 to-red-50',
      change: stats?.temperaturaPromedio > 37 ? 'Alto' : 'Normal',
      changeColor: stats?.temperaturaPromedio > 37 ? 'text-red-600' : 'text-green-600'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card, index) => (
        <div 
          key={index}
          className={`bg-gradient-to-br ${card.bgGradient} rounded-2xl p-6 border border-white/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105`}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-600 mb-1">
                {card.title}
              </p>
              <p className="text-3xl font-bold text-slate-800 mb-2">
                {card.value}
              </p>
              <p className="text-xs text-slate-500">
                {card.subtitle}
              </p>
            </div>
            
            <div className={`bg-gradient-to-r ${card.gradient} p-3 rounded-xl shadow-lg`}>
              {card.icon}
            </div>
          </div>
          
          <div className="mt-4 flex items-center">
            <span className={`text-sm font-semibold ${card.changeColor} flex items-center`}>
              {card.change.includes('+') ? (
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                </svg>
              ) : card.change === 'Normal' ? (
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.134 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              )}
              {card.change}
            </span>
            <span className="text-xs text-slate-400 ml-2">vs. ayer</span>
          </div>
          
          {/* Mini progress bar */}
          <div className="mt-3">
            <div className="w-full bg-white/50 rounded-full h-1.5">
              <div 
                className={`bg-gradient-to-r ${card.gradient} h-1.5 rounded-full transition-all duration-500`}
                style={{ width: `${Math.min(((card.value || 0) / 100) * 100, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default StatsCards;