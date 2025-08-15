import React from 'react';

const SpecialtyDistribution = ({ urgencyData }) => {
  if (!urgencyData) return null;

  // 🔧 FUNCIÓN DE NORMALIZACIÓN DE ESPECIALIDADES
  const normalizeSpecialty = (specialty) => {
    if (!specialty) return 'MEDICINA GENERAL';
    
    const specialtyMap = {
      'PNEUMOLOGÍA': 'NEUMOLOGÍA', 'NEUMOLOGÍA': 'NEUMOLOGÍA', 'PNEUMOLOGIA': 'NEUMOLOGÍA',
      'NEUMOLOGIA': 'NEUMOLOGÍA', 'Neumología': 'NEUMOLOGÍA', 'Pneumología': 'NEUMOLOGÍA',
      'CARDIOLOGÍA': 'CARDIOLOGÍA', 'CARDIOLOGIA': 'CARDIOLOGÍA', 'Cardiología': 'CARDIOLOGÍA',
      'CARDIOLOG': 'CARDIOLOGÍA', 'CARDIOL': 'CARDIOLOGÍA',
      'DERMATOLOGÍA': 'DERMATOLOGÍA', 'DERMATOLOGIA': 'DERMATOLOGÍA', 'Dermatología': 'DERMATOLOGÍA',
      'Dermatologia': 'DERMATOLOGÍA',
      'CIRUGÍA': 'CIRUGÍA', 'CIRUGIA': 'CIRUGÍA', 'Cirugía': 'CIRUGÍA', 'CIRUG': 'CIRUGÍA',
      'NEUROLOGÍA': 'NEUROLOGÍA', 'NEUROLOGIA': 'NEUROLOGÍA', 'Neurología': 'NEUROLOGÍA',
      'NEUROG': 'NEUROLOGÍA', 'NEURO': 'NEUROLOGÍA',
      'GASTROENTEROLOGÍA': 'GASTROENTEROLOGÍA', 'GASTROENTEROLOGIA': 'GASTROENTEROLOGÍA',
      'GASTROENTER': 'GASTROENTEROLOGÍA', 'GASTROENT': 'GASTROENTEROLOGÍA',
      'TRAUMATOLOGÍA': 'TRAUMATOLOGÍA', 'TRAUMATOLOGIA': 'TRAUMATOLOGÍA', 'ORTOPEDIA': 'ORTOPEDIA',
      'GINECOLOGÍA': 'GINECOLOGÍA', 'GINECOLOGIA': 'GINECOLOGÍA', 'PEDIATRÍA': 'PEDIATRÍA',
      'PEDIATRIA': 'PEDIATRÍA', 'MEDICINA INTERNA': 'MEDICINA INTERNA', 'MEDICINA GENERAL': 'MEDICINA GENERAL',
      'MEDICINA': 'MEDICINA GENERAL', 'Medicina General': 'MEDICINA GENERAL', 'Medicina Ge': 'MEDICINA GENERAL',
      'OFALMOLOGÍA': 'OFTALMOLOGÍA', 'OFTALMOLOGÍA': 'OFTALMOLOGÍA', 'OTORRINOLARINGOLOGÍA': 'OTORRINOLARINGOLOGÍA',
      'OTORRINOLARI': 'OTORRINOLARINGOLOGÍA', 'ORL': 'OTORRINOLARINGOLOGÍA'
    };
    
    // Primero buscar en el mapa directo
    const normalizedSpecialty = specialtyMap[specialty];
    if (normalizedSpecialty) return normalizedSpecialty;
    
    // Normalización por patrones
    const cleanSpecialty = specialty.toUpperCase().trim();
    if (cleanSpecialty.includes('CARDIO')) return 'CARDIOLOGÍA';
    if (cleanSpecialty.includes('NEUMO') || cleanSpecialty.includes('PNEUMO')) return 'NEUMOLOGÍA';
    if (cleanSpecialty.includes('DERMATO')) return 'DERMATOLOGÍA';
    if (cleanSpecialty.includes('CIRUG')) return 'CIRUGÍA';
    if (cleanSpecialty.includes('NEURO')) return 'NEUROLOGÍA';
    if (cleanSpecialty.includes('OFTALM') || cleanSpecialty.includes('OFALM')) return 'OFTALMOLOGÍA';
    if (cleanSpecialty.includes('GASTRO')) return 'GASTROENTEROLOGÍA';
    if (cleanSpecialty.includes('TRAUMA') || cleanSpecialty.includes('ORTOP')) return 'TRAUMATOLOGÍA';
    if (cleanSpecialty.includes('GINECO')) return 'GINECOLOGÍA';
    if (cleanSpecialty.includes('PEDIATR')) return 'PEDIATRÍA';
    if (cleanSpecialty.includes('OTORRIN')) return 'OTORRINOLARINGOLOGÍA';
    
    return cleanSpecialty || 'MEDICINA GENERAL';
  };

  const specialtyIcons = {
    'CARDIOLOGÍA': { icon: '❤️', color: '#EF4444' },
    'NEUROLOGÍA': { icon: '🧠', color: '#8B5CF6' },
    'GASTROENTEROLOGÍA': { icon: '🫘', color: '#F59E0B' },
    'NEUMOLOGÍA': { icon: '🫁', color: '#06B6D4' },
    'TRAUMATOLOGÍA': { icon: '🦴', color: '#10B981' },
    'DERMATOLOGÍA': { icon: '🎯', color: '#F97316' },
    'MEDICINA GENERAL': { icon: '👩‍⚕️', color: '#6366F1' },
    'MEDICINA INTERNA': { icon: '🩺', color: '#14B8A6' },
    'CIRUGÍA': { icon: '🔪', color: '#DC2626' },
    'GINECOLOGÍA': { icon: '👶', color: '#EC4899' },
    'PEDIATRÍA': { icon: '🧸', color: '#F59E0B' },
    'OFTALMOLOGÍA': { icon: '👁️', color: '#3B82F6' },
    'OTORRINOLARINGOLOGÍA': { icon: '👂', color: '#8B5CF6' },
    'ORTOPEDIA': { icon: '🦴', color: '#10B981' }
  };

  // 🔧 PROCESAR Y NORMALIZAR ESPECIALIDADES
  const processedSpecialties = {};
  
  Object.entries(urgencyData.specialtyDistribution || {}).forEach(([rawName, count]) => {
    const normalizedName = normalizeSpecialty(rawName);
    processedSpecialties[normalizedName] = (processedSpecialties[normalizedName] || 0) + count;
  });

  const specialties = Object.entries(processedSpecialties)
    .map(([name, count]) => ({
      name,
      count,
      icon: specialtyIcons[name]?.icon || '👨‍⚕️',
      color: specialtyIcons[name]?.color || '#64748B'
    }))
    .sort((a, b) => b.count - a.count);

  const total = specialties.reduce((sum, specialty) => sum + specialty.count, 0);
  const maxCount = Math.max(...specialties.map(s => s.count));

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-slate-800">Especialidades Médicas</h3>
          <p className="text-sm text-slate-500">Distribución de casos</p>
        </div>
        <div className="bg-teal-50 p-2 rounded-lg">
          <svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
      </div>

      {specialties.length === 0 ? (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <p className="text-slate-500 text-sm">No hay datos de especialidades</p>
        </div>
      ) : (
        <div className="space-y-4">
          {specialties.map((specialty, index) => {
            const percentage = total > 0 ? ((specialty.count / total) * 100).toFixed(1) : 0;
            const barWidth = maxCount > 0 ? (specialty.count / maxCount) * 100 : 0;

            return (
              <div key={specialty.name} className="group hover:bg-slate-50 p-3 rounded-xl transition-colors">
                <div className="flex items-center space-x-4">
                  {/* Icon */}
                  <div 
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-lg"
                    style={{ backgroundColor: `${specialty.color}20` }}
                  >
                    {specialty.icon}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-slate-800 truncate">
                        {specialty.name}
                      </h4>
                      <div className="flex items-center space-x-2">
                        <span className="text-lg font-bold text-slate-800">
                          {specialty.count}
                        </span>
                        <span className="text-sm text-slate-500">
                          ({percentage}%)
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div 
                        className="h-2 rounded-full transition-all duration-700 ease-out"
                        style={{ 
                          width: `${barWidth}%`, 
                          backgroundColor: specialty.color 
                        }}
                      ></div>
                    </div>
                  </div>

                  {/* Ranking Badge */}
                  <div className="flex-shrink-0">
                    <div 
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white ${
                        index === 0 ? 'bg-yellow-500' : 
                        index === 1 ? 'bg-slate-400' : 
                        index === 2 ? 'bg-amber-600' : 'bg-slate-300'
                      }`}
                    >
                      {index + 1}
                    </div>
                  </div>
                </div>

                {/* Additional Info for Top Specialty */}
                {index === 0 && specialty.count > 0 && (
                  <div className="mt-3 p-2 bg-gradient-to-r from-teal-50 to-emerald-50 rounded-lg border-l-4 border-teal-400">
                    <p className="text-sm text-teal-800">
                      <span className="font-semibold">Especialidad más demandada</span> - 
                      Considerar reforzar el área de {specialty.name}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Summary Stats */}
      {total > 0 && (
        <div className="mt-6 pt-4 border-t border-slate-200">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-slate-800">{specialties.length}</div>
              <div className="text-xs text-slate-500">Especialidades</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-800">{total}</div>
              <div className="text-xs text-slate-500">Total Casos</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SpecialtyDistribution;