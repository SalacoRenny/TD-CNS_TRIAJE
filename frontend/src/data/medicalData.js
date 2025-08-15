// ===============================================
// 📋 DATOS MÉDICOS PARA AUTOCOMPLETADO AISANA
// frontend/src/data/medicalData.js
// ===============================================

// 🩺 SÍNTOMAS PRINCIPALES - Para autocompletado inteligente
export const COMMON_SYMPTOMS = [
  // Dolor (categoría más común)
  'dolor de cabeza',
  'dolor de pecho',
  'dolor abdominal',
  'dolor de espalda',
  'dolor de garganta',
  'dolor de oído',
  'dolor de dientes',
  'dolor de estómago',
  'dolor muscular',
  'dolor articular',
  'dolor de huesos',
  'dolor al respirar',
  'dolor al tragar',
  'dolor intenso',
  'dolor severo',
  'dolor crónico',

  // Respiratorios
  'dificultad para respirar',
  'dificultad respiratoria',
  'falta de aire',
  'tos seca',
  'tos con flema',
  'tos persistente',
  'silbido al respirar',
  'ahogo',
  'respiración entrecortada',

  // Digestivos
  'náuseas',
  'vómitos',
  'diarrea',
  'estreñimiento',
  'acidez estomacal',
  'reflujo',
  'pérdida de apetito',
  'indigestión',

  // Neurológicos
  'mareos',
  'vértigo',
  'confusión',
  'pérdida de memoria',
  'hormigueo',
  'entumecimiento',
  'debilidad muscular',
  'temblores',

  // Cardiovasculares
  'palpitaciones',
  'taquicardia',
  'presión en el pecho',
  'hinchazón de piernas',
  'hinchazón de pies',

  // Generales
  'fiebre',
  'fiebre alta',
  'escalofríos',
  'sudoración excesiva',
  'fatiga',
  'cansancio extremo',
  'pérdida de peso',
  'sangrado',
  'erupción cutánea',
  'picazón',
  'inflamación',
  'hinchazón'
];

// 🏥 ENFERMEDADES PREEXISTENTES - Para autocompletado y validación
export const PREEXISTING_CONDITIONS = [
  // Cardiovasculares
  'diabetes',
  'diabetes tipo 1',
  'diabetes tipo 2',
  'hipertensión',
  'hipertensión arterial',
  'presión alta',
  'enfermedad cardíaca',
  'arritmia',
  'insuficiencia cardíaca',
  'infarto previo',

  // Respiratorios
  'asma',
  'asma bronquial',
  'bronquitis crónica',
  'enfisema',
  'EPOC',
  'apnea del sueño',

  // Endocrinos
  'hipotiroidismo',
  'hipertiroidismo',
  'tiroides',
  'obesidad',
  'síndrome metabólico',

  // Digestivos
  'gastritis',
  'úlcera gástrica',
  'reflujo gastroesofágico',
  'enfermedad de Crohn',
  'colitis ulcerosa',
  'hígado graso',

  // Neurológicos
  'epilepsia',
  'migraña',
  'cefalea tensional',
  'depresión',
  'ansiedad',
  'trastorno bipolar',

  // Musculoesqueléticos
  'artritis',
  'artritis reumatoide',
  'osteoartritis',
  'osteoporosis',
  'fibromialgia',
  'lumbalgia crónica',

  // Renales
  'insuficiencia renal',
  'cálculos renales',
  'infección urinaria recurrente',

  // Hematológicos
  'anemia',
  'anemia ferropénica',
  'leucemia',
  'hemofilia',

  // Dermatológicos
  'psoriasis',
  'eczema',
  'dermatitis atópica',

  // Oftalmológicos
  'glaucoma',
  'cataratas',
  'miopía',

  // Ginecológicos
  'endometriosis',
  'síndrome de ovario poliquístico',
  'menopausia',

  // Otros
  'cáncer',
  'VIH',
  'hepatitis B',
  'hepatitis C',
  'tuberculosis',
  'lupus',
  'esclerosis múltiple'
];

// 🎯 FUNCIÓN DE FILTRADO INTELIGENTE
export const filterSuggestions = (input, dataArray, maxResults = 8) => {
  if (!input || input.length < 2) return [];
  
  const normalizedInput = input.toLowerCase().trim();
  
  // Filtrar coincidencias
  const matches = dataArray.filter(item => 
    item.toLowerCase().includes(normalizedInput)
  );
  
  // Ordenar por relevancia (coincidencias exactas primero)
  const sortedMatches = matches.sort((a, b) => {
    const aLower = a.toLowerCase();
    const bLower = b.toLowerCase();
    
    // Prioridad 1: Comienza con el texto
    const aStartsWith = aLower.startsWith(normalizedInput);
    const bStartsWith = bLower.startsWith(normalizedInput);
    
    if (aStartsWith && !bStartsWith) return -1;
    if (!aStartsWith && bStartsWith) return 1;
    
    // Prioridad 2: Longitud (más corto = más relevante)
    return a.length - b.length;
  });
  
  return sortedMatches.slice(0, maxResults);
};

// 🔍 FUNCIÓN DE VALIDACIÓN ANTI-DUPLICADOS
export const validateNoDuplicates = (newCondition, existingConditions) => {
  if (!newCondition || !newCondition.trim()) return { isValid: false, reason: 'Condición vacía' };
  
  const normalized = newCondition.toLowerCase().trim();
  
  // Verificar duplicados exactos
  const exactDuplicate = existingConditions.find(condition => 
    condition.toLowerCase().trim() === normalized
  );
  
  if (exactDuplicate) {
    return { 
      isValid: false, 
      reason: `Ya existe: "${exactDuplicate}"`,
      duplicate: exactDuplicate 
    };
  }
  
  // Verificar similitudes (diabetes vs Diabetes vs DIABETES)
  const similarDuplicate = existingConditions.find(condition => {
    const conditionNorm = condition.toLowerCase().trim();
    return conditionNorm.includes(normalized) || normalized.includes(conditionNorm);
  });
  
  if (similarDuplicate) {
    return { 
      isValid: false, 
      reason: `Similar a: "${similarDuplicate}"`,
      duplicate: similarDuplicate 
    };
  }
  
  return { isValid: true };
};

// 📊 FUNCIÓN PARA OBTENER ESTADÍSTICAS DE USO
export const getUsageStats = (userHistory) => {
  if (!userHistory || userHistory.length === 0) return null;
  
  const allSymptoms = userHistory.flatMap(record => record.symptoms || []);
  const allConditions = userHistory.flatMap(record => record.baseConditions || []);
  
  // Síntomas más frecuentes
  const symptomFreq = {};
  allSymptoms.forEach(symptom => {
    const normalized = symptom.toLowerCase().trim();
    symptomFreq[normalized] = (symptomFreq[normalized] || 0) + 1;
  });
  
  // Condiciones más frecuentes
  const conditionFreq = {};
  allConditions.forEach(condition => {
    const normalized = condition.toLowerCase().trim();
    conditionFreq[normalized] = (conditionFreq[normalized] || 0) + 1;
  });
  
  return {
    mostFrequentSymptoms: Object.entries(symptomFreq)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([symptom, count]) => ({ symptom, count })),
    mostFrequentConditions: Object.entries(conditionFreq)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([condition, count]) => ({ condition, count }))
  };
};

// 🎨 CONFIGURACIÓN DE COLORES PARA SUGERENCIAS
export const SUGGESTION_STYLES = {
  container: "absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto",
  item: "px-4 py-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors duration-200",
  itemActive: "px-4 py-3 bg-blue-100 cursor-pointer border-b border-gray-100 last:border-b-0",
  highlight: "font-semibold text-blue-600",
  noResults: "px-4 py-3 text-gray-500 italic text-center"
};

export default {
  COMMON_SYMPTOMS,
  PREEXISTING_CONDITIONS,
  filterSuggestions,
  validateNoDuplicates,
  getUsageStats,
  SUGGESTION_STYLES
};