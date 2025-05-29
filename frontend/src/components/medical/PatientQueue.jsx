import React, { useState } from 'react';

const PatientQueue = ({ records, onRefresh }) => {
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const urgencyFilters = [
    { key: 'all', label: 'Todos', count: records.length },
    { key: '1', label: 'Inmediato', color: 'bg-red-500', count: records.filter(r => r.urgency?.level === 1).length },
    { key: '2', label: 'Muy Urgente', color: 'bg-orange-500', count: records.filter(r => r.urgency?.level === 2).length },
    { key: '3', label: 'Urgente', color: 'bg-yellow-500', count: records.filter(r => r.urgency?.level === 3).length },
    { key: '4', label: 'Menos Urgente', color: 'bg-green-500', count: records.filter(r => r.urgency?.level === 4).length },
    { key: '5', label: 'No Urgente', color: 'bg-blue-500', count: records.filter(r => r.urgency?.level === 5).length }
  ];

  const filteredRecords = records.filter(record => {
    const matchesFilter = selectedFilter === 'all' || record.urgency?.level === parseInt(selectedFilter);
    const matchesSearch = record.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.patientCI.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.symptoms.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  const getUrgencyIcon = (level) => {
    switch(level) {
      case 1: return '🚨';
      case 2: return '⚡';
      case 3: return '⚠️';
      case 4: return '🟢';
      case 5: return '🔵';
      default: return '❓';
    }
  };

  const getSpecialtyIcon = (specialty) => {
    const icons = {
      'Cardiología': '❤️',
      'Neurología': '🧠',
      'Gastroenterología': '🫘',
      'Neumología': '🫁',
      'Traumatología': '🦴',
      'Dermatología': '🎯',
      'Medicina General': '👩‍⚕️'
    };
    return icons[specialty] || '👨‍⚕️';
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-500 to-emerald-500 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">Cola de Pacientes</h2>
            <p className="text-teal-100 text-sm">Sistema de Triaje Inteligente</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={onRefresh}
              className="bg-white/20 hover:bg-white/30 backdrop-blur-sm p-2 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
            <div className="text-white text-sm">
              {filteredRecords.length} pacientes
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="p-6 border-b border-slate-200">
        <div className="flex flex-col space-y-4">
          {/* Search */}
          <div className="relative">
            <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Buscar por nombre, CI o síntomas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>

          {/* Urgency Filters */}
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

      {/* Patient List */}
      <div className="max-h-96 overflow-y-auto">
        {filteredRecords.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <p className="text-slate-500">No hay pacientes que coincidan con los filtros</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
            {filteredRecords.map((record, index) => (
              <div key={record._id} className="p-6 hover:bg-slate-50 transition-colors">
                <div className="flex items-start space-x-4">
                  {/* Priority Indicator */}
                  <div className="flex-shrink-0">
                    <div 
                      className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg`}
                      style={{ backgroundColor: record.urgency?.color }}
                    >
                      {getUrgencyIcon(record.urgency?.level)}
                    </div>
                  </div>

                  {/* Patient Info */}
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
                      </div>
                    </div>

                    {/* Symptoms */}
                    <div className="mb-3">
                      <p className="text-sm text-slate-600 mb-1">Síntomas:</p>
                      <div className="flex flex-wrap gap-1">
                        {record.symptoms.slice(0, 3).map((symptom, idx) => (
                          <span key={idx} className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-red-100 text-red-700">
                            {symptom}
                          </span>
                        ))}
                        {record.symptoms.length > 3 && (
                          <span className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-slate-100 text-slate-600">
                            +{record.symptoms.length - 3} más
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Medical Info */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                      <div className="flex items-center space-x-2">
                        <span className="text-2xl">{getSpecialtyIcon(record.suggestedSpecialty)}</span>
                        <div>
                          <p className="text-slate-500">Especialidad</p>
                          <p className="font-medium text-slate-700">{record.suggestedSpecialty}</p>
                        </div>
                      </div>
                      
                      {record.temperature && (
                        <div className="flex items-center space-x-2">
                          <span className="text-2xl">🌡️</span>
                          <div>
                            <p className="text-slate-500">Temperatura</p>
                            <p className={`font-medium ${parseFloat(record.temperature) > 37.5 ? 'text-red-600' : 'text-green-600'}`}>
                              {record.temperature}°C
                            </p>
                          </div>
                        </div>
                      )}
                      
                      <div className="flex items-center space-x-2">
                        <span className="text-2xl">📋</span>
                        <div>
                          <p className="text-slate-500">Condiciones</p>
                          <p className="font-medium text-slate-700">
                            {record.baseConditions.length || 'Ninguna'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Notes */}
                    {record.notes && (
                      <div className="mt-3 p-3 bg-amber-50 rounded-lg border-l-4 border-amber-400">
                        <p className="text-sm text-amber-800">
                          <span className="font-medium">Nota:</span> {record.notes}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex-shrink-0 flex flex-col space-y-2">
                    <button className="bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                      Ver Detalle
                    </button>
                    <button className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                      Historial
                    </button>
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

export default PatientQueue;