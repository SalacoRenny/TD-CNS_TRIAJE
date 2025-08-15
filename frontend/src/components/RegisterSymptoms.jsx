import { useState, useEffect } from "react";
import { useParams } from "react-router-dom"; // 🆕 AGREGAR
import { postSymptomRecord, getPatientRecentContext, getAllPatients } from "../services/api"; // 🆕 Agregar getAllPatients
import { 
Thermometer, CalendarCheck2, User, Activity, Heart, FileText, Send, CheckCircle, 
Brain, Zap, Clock, Sparkles, Shield, Target, Eye, AlertTriangle, Info, 
ChevronDown, ChevronUp, History, Calendar, Stethoscope, TrendingUp, Star,
Award, Cpu, Bot, Microscope, HeartHandshake, Lock, Users, Gauge, Download,
RefreshCw, Plus, ArrowLeft, Search // 🆕 Agregar Search
} from "lucide-react";
import { useUser } from "../context/UserContext";
import PDFGeneratorPatient from "./PDFGeneratorPatient";

const SymptomForm = ({ isAssistantMode = false }) => { // 🆕 Recibir prop
const { user } = useUser();
const { patientId } = useParams(); // 🆕 Para obtener ID del paciente desde URL

console.log("🟩 Usuario activo en RegisterSymptoms:", user);
console.log("🆕 Modo asistente:", isAssistantMode, "- Patient ID:", patientId); // 🆕 Log

// 🆕 Estados para modo asistido
const [selectedPatient, setSelectedPatient] = useState(null);
const [loadingPatient, setLoadingPatient] = useState(false);
const [availablePatients, setAvailablePatients] = useState([]);
const [patientSearchTerm, setPatientSearchTerm] = useState('');
const [showPatientSelector, setShowPatientSelector] = useState(false);

const [formData, setFormData] = useState({
 symptoms: "",
 baseConditions: "",
 notes: "",
 temperature: "",
 edad: "",
 frecuenciaCardiaca: "",
 presionSistolica: "",
 presionDiastolica: "",
 date: "",
});

const [isSubmitting, setIsSubmitting] = useState(false);
const [focusedField, setFocusedField] = useState(null);
const [watsonResult, setWatsonResult] = useState(null);
const [showWatsonResult, setShowWatsonResult] = useState(false);
const [processingStep, setProcessingStep] = useState('');
const [showSuccessModal, setShowSuccessModal] = useState(false);

// Estados existentes para memoria contextual
const [fieldValidation, setFieldValidation] = useState({});
const [isAisanaReady, setIsAisanaReady] = useState(false);
const [historicalContext, setHistoricalContext] = useState(null);
const [showHistorial, setShowHistorial] = useState(false);
const [patientBaseConditions, setPatientBaseConditions] = useState([]);
const [isEditingBaseConditions, setIsEditingBaseConditions] = useState(false);
const [newBaseCondition, setNewBaseCondition] = useState("");

// 🆕 Estado para controlar la vista principal
const [currentView, setCurrentView] = useState('form'); // 'form' | 'result'

// Listas de enfermedades para autocompletado (sin síntomas)
const commonConditions = [
 "diabetes", "hipertensión", "asma", "bronquitis", "EPOC",
 "artritis", "osteoporosis", "fibromialgia", "migraña",
 "epilepsia", "depresión", "ansiedad", "hipotiroidismo", "hipertiroidismo",
 "insuficiencia cardíaca", "arritmia", "angina de pecho",
 "gastritis", "úlcera péptica", "reflujo gastroesofágico",
 "hepatitis", "cirrosis", "cálculos biliares",
 "insuficiencia renal", "cálculos renales", "infección urinaria",
 "osteoartritis", "artritis reumatoide", "lupus",
 "cáncer", "leucemia", "linfoma", "anemia",
 "colesterol alto", "triglicéridos altos", "obesidad"
];

// Estados para autocompletado solo de enfermedades
const [conditionSuggestions, setConditionSuggestions] = useState([]);
const [showConditionSuggestions, setShowConditionSuggestions] = useState(false);
const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);

// 🆕 useEffect para modo asistido - cargar paciente específico
useEffect(() => {
  if (isAssistantMode && patientId) {
    loadSpecificPatient(patientId);
  } else if (isAssistantMode && !patientId) {
    setShowPatientSelector(true);
    loadAvailablePatients();
  }
}, [isAssistantMode, patientId]);

// 🆕 Función para cargar paciente específico
const loadSpecificPatient = async (patientId) => {
  try {
    setLoadingPatient(true);
    const response = await getAllPatients({ limit: 1000 });
    const patient = response.data.patients.find(p => p.userId === patientId);
    
    if (patient) {
      setSelectedPatient(patient);
      console.log('✅ Paciente cargado para asistencia:', patient);
    } else {
      console.error('❌ Paciente no encontrado:', patientId);
    }
  } catch (error) {
    console.error('❌ Error cargando paciente:', error);
  } finally {
    setLoadingPatient(false);
  }
};

// 🆕 Función para cargar lista de pacientes disponibles
const loadAvailablePatients = async () => {
  try {
    const response = await getAllPatients({ limit: 100 });
    setAvailablePatients(response.data.patients || []);
  } catch (error) {
    console.error('❌ Error cargando pacientes:', error);
  }
};

// 🆕 Función para seleccionar paciente
const handleSelectPatient = (patient) => {
  setSelectedPatient(patient);
  setShowPatientSelector(false);
  console.log('✅ Paciente seleccionado para asistencia:', patient);
};

// 🆕 Pacientes filtrados para búsqueda
const filteredPatients = availablePatients.filter(patient =>
  patient.name.toLowerCase().includes(patientSearchTerm.toLowerCase()) ||
  patient.ci.toLowerCase().includes(patientSearchTerm.toLowerCase()) ||
  patient.userId.toLowerCase().includes(patientSearchTerm.toLowerCase())
);

useEffect(() => {
 const now = new Date();
 const formatted = now.toLocaleString("es-BO", {
   dateStyle: "short",
   timeStyle: "short",
 });
 setFormData((prev) => ({ ...prev, date: formatted }));
 
 setTimeout(() => setIsAisanaReady(true), 1000);
}, []);

// Cargar contexto histórico del paciente - 🔧 MODIFICADO para modo asistido
useEffect(() => {
 const loadPatientContext = async () => {
   const userId = getUserId();
   if (userId) {
     try {
       console.log('🔍 Cargando contexto histórico para:', userId);
       const response = await getPatientRecentContext(userId);
       
       if (response.data.hasHistory) {
         setHistoricalContext(response.data);
         console.log('✅ Contexto histórico cargado:', response.data);
         
         if (response.data.baseConditions && response.data.baseConditions.length > 0) {
           setPatientBaseConditions(response.data.baseConditions);
           setFormData(prev => ({
             ...prev,
             baseConditions: response.data.baseConditions.join(", ")
           }));
         }
       }
     } catch (error) {
       console.log('⚠️ No se pudo cargar contexto histórico:', error);
     }
   }
 };

 if (isAisanaReady && getUserId()) { // 🔧 Usar getUserId() modificado
   loadPatientContext();
 }
}, [isAisanaReady, selectedPatient]); // 🔧 Agregar selectedPatient como dependencia

// Validación mejorada con signos vitales (solo si estamos en vista formulario)
useEffect(() => {
 if (currentView !== 'form') return; // 🔧 Solo validar en vista formulario
 
 const validation = {};
 
 if (formData.symptoms.length > 0) {
   if (formData.symptoms.length < 10) {
     validation.symptoms = { status: 'warning', message: 'AISANA necesita más detalles para análisis preciso' };
   } else if (formData.symptoms.length >= 20) {
     validation.symptoms = { status: 'excellent', message: 'Descripción excelente para AISANA' };
   } else {
     validation.symptoms = { status: 'good', message: 'Buena descripción para análisis' };
   }
 }

 if (formData.notes.length > 0) {
   if (formData.notes.length < 15) {
     validation.notes = { status: 'warning', message: 'AISANA requiere más contexto médico' };
   } else if (formData.notes.length >= 50) {
     validation.notes = { status: 'excellent', message: 'Contexto perfecto para análisis AISANA' };
   } else {
     validation.notes = { status: 'good', message: 'Buen contexto médico' };
   }
 }

 // Validar edad
 if (formData.edad) {
   const edad = parseInt(formData.edad);
   if (edad < 0 || edad > 120) {
     validation.edad = { status: 'warning', message: 'Edad debe estar entre 0 y 120 años' };
   } else if (edad >= 65) {
     validation.edad = { status: 'warning', message: 'Paciente de edad avanzada - factor de riesgo' };
   } else {
     validation.edad = { status: 'good', message: 'Edad registrada correctamente' };
   }
 }

 // Validar frecuencia cardíaca
 if (formData.frecuenciaCardiaca) {
   const fc = parseInt(formData.frecuenciaCardiaca);
   if (fc < 30 || fc > 220) {
     validation.frecuenciaCardiaca = { status: 'urgent', message: 'Frecuencia cardíaca fuera de rango crítico' };
   } else if (fc < 50 || fc > 120) {
     validation.frecuenciaCardiaca = { status: 'warning', message: fc < 50 ? 'Bradicardia detectada' : 'Taquicardia detectada' };
   } else {
     validation.frecuenciaCardiaca = { status: 'good', message: 'Frecuencia cardíaca normal' };
   }
 }

 // Validar presión arterial
 if (formData.presionSistolica && formData.presionDiastolica) {
   const sistolica = parseInt(formData.presionSistolica);
   const diastolica = parseInt(formData.presionDiastolica);
   
   if (sistolica >= 180 || diastolica >= 110) {
     validation.presionArterial = { status: 'urgent', message: 'Hipertensión severa - requiere atención inmediata' };
   } else if (sistolica >= 140 || diastolica >= 90) {
     validation.presionArterial = { status: 'warning', message: 'Hipertensión detectada' };
   } else if (sistolica <= 90 || diastolica <= 60) {
     validation.presionArterial = { status: 'warning', message: 'Hipotensión detectada' };
   } else {
     validation.presionArterial = { status: 'good', message: 'Presión arterial normal' };
   }
 }

 // Validar temperatura
 if (formData.temperature) {
   const temp = parseFloat(formData.temperature);
   if (temp > 39) {
     validation.temperature = { status: 'urgent', message: 'Fiebre alta - análisis prioritario AISANA' };
   } else if (temp > 37.5) {
     validation.temperature = { status: 'warning', message: 'Fiebre detectada' };
   } else {
     validation.temperature = { status: 'normal', message: 'Temperatura normal' };
   }
 }

 setFieldValidation(validation);
}, [formData, currentView]); // 🔧 Agregar currentView como dependencia

// 🔧 Función para formatear fechas correctamente
const formatDate = (dateString) => {
 try {
   const date = new Date(dateString);
   return date.toLocaleDateString('es-ES', {
     year: 'numeric',
     month: '2-digit',
     day: '2-digit',
     hour: '2-digit',
     minute: '2-digit'
   });
 } catch (error) {
   return dateString; // Fallback al string original si falla el parseo
 }
};

// Función autocompletado solo para enfermedades
const handleConditionInputChange = (e) => {
 const value = e.target.value;
 setNewBaseCondition(value);

 if (value.length >= 2) {
   const filtered = commonConditions.filter(condition =>
     condition.toLowerCase().includes(value.toLowerCase()) &&
     !patientBaseConditions.some(existing => 
       existing.toLowerCase() === condition.toLowerCase()
     )
   ).slice(0, 5);
   
   setConditionSuggestions(filtered);
   setShowConditionSuggestions(filtered.length > 0);
   setSelectedSuggestionIndex(-1);
 } else {
   setShowConditionSuggestions(false);
 }
};

// Seleccionar sugerencia de enfermedad
const selectConditionSuggestion = (suggestion) => {
 setNewBaseCondition(suggestion);
 setShowConditionSuggestions(false);
 setSelectedSuggestionIndex(-1);
};

// Manejo de teclado para sugerencias
const handleKeyDown = (e, suggestions) => {
 if (!suggestions.length) return;

 switch (e.key) {
   case 'ArrowDown':
     e.preventDefault();
     setSelectedSuggestionIndex(prev => 
       prev < suggestions.length - 1 ? prev + 1 : 0
     );
     break;
   case 'ArrowUp':
     e.preventDefault();
     setSelectedSuggestionIndex(prev => 
       prev > 0 ? prev - 1 : suggestions.length - 1
     );
     break;
   case 'Enter':
     e.preventDefault();
     if (selectedSuggestionIndex >= 0) {
       selectConditionSuggestion(suggestions[selectedSuggestionIndex]);
     }
     break;
   case 'Escape':
     setShowConditionSuggestions(false);
     setSelectedSuggestionIndex(-1);
     break;
 }
};

// Función para calcular confianza real basada en datos
const calculateRealConfidence = (result) => {
 let baseConfidence = 0.7;
 
 if (result.method === 'watson') {
   baseConfidence += 0.15;
 }
 
 if (historicalContext && historicalContext.totalConsultations > 0) {
   baseConfidence += 0.05;
 }
 
 if (formData.symptoms.length > 20) {
   baseConfidence += 0.05;
 }
 
 if (formData.notes.length > 50) {
   baseConfidence += 0.03;
 }
 
 // Factores por signos vitales
 if (formData.temperature) baseConfidence += 0.02;
 if (formData.edad) baseConfidence += 0.02;
 if (formData.frecuenciaCardiaca) baseConfidence += 0.02;
 if (formData.presionSistolica && formData.presionDiastolica) baseConfidence += 0.03;
 
 return Math.min(baseConfidence, 0.95);
};

// Calcular factores individuales dinámicos
const getConfidenceFactors = () => {
 if (!watsonResult) return { method: 0, history: 0, details: 0, objectives: 0, vitals: 0 };
 
 let vitalsBonus = 0;
 if (formData.temperature) vitalsBonus += 2;
 if (formData.edad) vitalsBonus += 2;
 if (formData.frecuenciaCardiaca) vitalsBonus += 2;
 if (formData.presionSistolica && formData.presionDiastolica) vitalsBonus += 3;
 
 return {
   method: watsonResult.method === 'watson' ? 15 : 0,
   history: historicalContext && historicalContext.totalConsultations > 0 ? 5 : 0,
   details: watsonResult.classification.originalSymptomsLength > 20 ? 5 : 0,
   objectives: watsonResult.classification.hadTemperature ? 2 : 0,
   vitals: vitalsBonus
 };
};

const handleChange = (e) => {
 setFormData((prev) => ({
   ...prev,
   [e.target.name]: e.target.value,
 }));
};

// Función para agregar nueva enfermedad preexistente
const handleAddBaseCondition = () => {
 const trimmedCondition = newBaseCondition.trim().toLowerCase();
 
 if (trimmedCondition) {
   const isDuplicate = patientBaseConditions.some(existing => 
     existing.toLowerCase() === trimmedCondition
   );
   
   if (isDuplicate) {
     alert(`⚠️ La enfermedad "${newBaseCondition}" ya está registrada.`);
     return;
   }
   
   const standardCondition = commonConditions.find(condition => 
     condition.toLowerCase() === trimmedCondition
   ) || newBaseCondition.trim();
   
   const updatedConditions = [...patientBaseConditions, standardCondition];
   setPatientBaseConditions(updatedConditions);
   setFormData(prev => ({
     ...prev,
     baseConditions: updatedConditions.join(", ")
   }));
   setNewBaseCondition("");
   setIsEditingBaseConditions(false);
   setShowConditionSuggestions(false);
 }
};

// 🆕 Función para iniciar nueva consulta
const handleNewConsultation = () => {
 // Resetear formulario manteniendo datos persistentes
 setFormData({
   symptoms: "",
   baseConditions: patientBaseConditions.join(", "),
   notes: "",
   temperature: "",
   edad: "",
   frecuenciaCardiaca: "",
   presionSistolica: "",
   presionDiastolica: "",
   date: new Date().toLocaleString("es-BO", {
     dateStyle: "short",
     timeStyle: "short",
   }),
 });
 
 // Limpiar estados del resultado anterior
 setWatsonResult(null);
 setShowWatsonResult(false);
 setShowSuccessModal(false);
 setFieldValidation({});
 
 // Cambiar a vista formulario
 setCurrentView('form');
};

const handleSubmit = async (e) => {
 e.preventDefault();
 setIsSubmitting(true);
 setWatsonResult(null);
 setShowWatsonResult(false);

 const userId = getUserId();
 if (!userId) {
   alert("❌ Error: No se pudo obtener la información del usuario. Por favor, inicia sesión nuevamente.");
   console.error("🚫 Usuario sin ID válido:", isAssistantMode ? selectedPatient : user);
   setIsSubmitting(false);
   return;
 }

 // Payload expandido con signos vitales y 🆕 metadata del asistente
 const payload = {
   userId: userId,
   symptoms: formData.symptoms.split(",").map((s) => s.trim()),
   baseConditions: formData.baseConditions.split(",").map((c) => c.trim()),
   notes: formData.notes.trim(),
   temperature: formData.temperature.trim(),
   edad: formData.edad ? parseInt(formData.edad) : null,
   frecuenciaCardiaca: formData.frecuenciaCardiaca ? parseInt(formData.frecuenciaCardiaca) : null,
   presionArterial: {
     sistolica: formData.presionSistolica ? parseInt(formData.presionSistolica) : null,
     diastolica: formData.presionDiastolica ? parseInt(formData.presionDiastolica) : null,
     texto: formData.presionSistolica && formData.presionDiastolica ? 
            `${formData.presionSistolica}/${formData.presionDiastolica}` : ""
   },
   timestamp: formData.date,
   
   // 🆕 METADATA DEL ASISTENTE
   assistedBy: isAssistantMode ? {
     assistantId: user.userId,
     assistantName: `${user.firstName} ${user.lastName}`,
     assistantRole: user.role,
     timestamp: new Date().toISOString()
   } : null,
   isAssisted: isAssistantMode
 };

 console.log("📋 Payload expandido a enviar:", payload);

 try {
   setProcessingStep('🤖 Activando AISANA con datos vitales...');
   await new Promise(resolve => setTimeout(resolve, 800));
   
   setProcessingStep('🧠 AISANA analizando síntomas y signos vitales...');
   await new Promise(resolve => setTimeout(resolve, 600));
   
   setProcessingStep('⚕️ Aplicando protocolo Manchester avanzado...');
   
   const response = await postSymptomRecord(payload);
   console.log("✅ Respuesta completa del servidor:", response.data);
   
   if (response.data.classification && response.data.watson_info) {
     const realConfidence = calculateRealConfidence(response.data.classification);
     
     setWatsonResult({
       classification: {
         ...response.data.classification,
         confidence: realConfidence,
         primarySymptom: formData.symptoms.split(",")[0]?.trim(),
         originalSymptomsLength: formData.symptoms.length,
         hadTemperature: !!formData.temperature,
         hadVitalSigns: !!(formData.edad || formData.frecuenciaCardiaca || 
                         (formData.presionSistolica && formData.presionDiastolica)),
         originalNotes: formData.notes
       },
       method: response.data.classification.method,
       watson_info: response.data.watson_info,
       session_info: response.data.session_info,
       fallback_reason: response.data.fallback_reason
     });
     setShowWatsonResult(true);
     
     // 🆕 Cambiar a vista de resultado después del análisis exitoso
     setCurrentView('result');
     
     setShowSuccessModal(true);
     setTimeout(() => setShowSuccessModal(false), 4000);
   }

 } catch (error) {
   console.error("❌ Error al enviar el registro:", error);
   alert("Ocurrió un error al enviar los síntomas.");
 } finally {
   setIsSubmitting(false);
   setProcessingStep('');
 }
};

// Clases dinámicas mejoradas con validación
const getInputClasses = (fieldName) => {
 const baseClasses = `w-full px-4 py-3 pl-12 pr-12 rounded-xl border-2 transition-all duration-300 ease-in-out focus:ring-0 focus:outline-none backdrop-blur-sm bg-white/80`;
 
 const validation = fieldValidation[fieldName];
 const isFocused = focusedField === fieldName;
 
 if (isFocused) {
   return `${baseClasses} border-cns shadow-lg shadow-cns/20 bg-gradient-to-br from-green-50 to-teal-50 placeholder-gray-400`;
 }
 
 if (validation) {
   switch (validation.status) {
     case 'excellent':
       return `${baseClasses} border-green-400 bg-gradient-to-br from-green-50 to-emerald-50 placeholder-gray-400`;
     case 'good':
       return `${baseClasses} border-blue-300 bg-gradient-to-br from-blue-50 to-cyan-50 placeholder-gray-400`;
     case 'warning':
       return `${baseClasses} border-amber-300 bg-gradient-to-br from-amber-50 to-yellow-50 placeholder-gray-400`;
     case 'urgent':
       return `${baseClasses} border-red-400 bg-gradient-to-br from-red-50 to-rose-50 placeholder-gray-400`;
     case 'normal':
       return `${baseClasses} border-green-300 bg-gradient-to-br from-green-50 to-teal-50 placeholder-gray-400`;
     default:
       return `${baseClasses} border-gray-200 hover:border-gray-300 placeholder-gray-400`;
   }
 }
 
 return `${baseClasses} border-gray-200 hover:border-gray-300 placeholder-gray-400`;
};

const labelClasses = "block mb-2 text-cns font-bold text-sm uppercase tracking-wide";

// 🔧 FUNCIÓN MODIFICADA para obtener valor del usuario (modo asistido vs normal)
const getUserDisplayValue = () => {
  if (isAssistantMode) {
    if (loadingPatient) return "Cargando paciente...";
    if (!selectedPatient) return "Seleccionar paciente";
    return `${selectedPatient.name} (${selectedPatient.ci})`;
  }
  
  // Lógica original para modo normal
  if (user === null) return "Cargando...";
  if (user === undefined) return "Error de sesión";
  
  const possibleIds = [user.id, user._id, user.userId, user.codigo, user.codigoAsegurado, user.username, user.email];
  const foundId = possibleIds.find(id => id && id !== "");
  
  if (!foundId) return "Sin código asignado";
  return foundId;
};

// 🔧 FUNCIÓN MODIFICADA para obtener ID del usuario (modo asistido vs normal)
const getUserId = () => {
  if (isAssistantMode && selectedPatient) {
    return selectedPatient.userId;
  }
  
  // Lógica original para modo normal
  if (!user) return null;
  const possibleIds = [user.id, user._id, user.userId, user.codigo, user.codigoAsegurado];
  const foundId = possibleIds.find(id => id && id !== "");
  return foundId ? String(foundId) : null;
};

const getUrgencyColor = (level) => {
 const colors = {
   1: { bg: '#FEF2F2', border: '#EF4444', text: '#B91C1C' },
   2: { bg: '#FFF7ED', border: '#F97316', text: '#C2410C' },
   3: { bg: '#FEFCE8', border: '#EAB308', text: '#A16207' },
   4: { bg: '#F0FDF4', border: '#22C55E', text: '#15803D' },
   5: { bg: '#EFF6FF', border: '#3B82F6', text: '#1D4ED8' }
 };
 return colors[level] || colors[5];
};

// Componente para indicadores de validación
const ValidationIndicator = ({ fieldName }) => {
 const validation = fieldValidation[fieldName];
 if (!validation) return null;

 const icons = {
   excellent: <Target className="w-4 h-4 text-green-500" />,
   good: <CheckCircle className="w-4 h-4 text-blue-500" />,
   warning: <AlertTriangle className="w-4 h-4 text-amber-500" />,
   urgent: <AlertTriangle className="w-4 h-4 text-red-500" />,
   normal: <CheckCircle className="w-4 h-4 text-green-500" />
 };

 return (
   <div className="absolute right-3 top-3 flex items-center gap-1">
     {icons[validation.status]}
   </div>
 );
};

// Componente de sugerencias
const SuggestionsList = ({ suggestions, onSelect, selectedIndex, className = "" }) => {
 if (!suggestions.length) return null;

 return (
   <div className={`absolute z-50 w-full bg-white border-2 border-purple-200 rounded-lg shadow-xl mt-1 max-h-48 overflow-y-auto ${className}`}>
     {suggestions.map((suggestion, index) => (
       <button
         key={index}
         type="button"
         className={`w-full text-left px-4 py-2 hover:bg-purple-50 transition-colors border-b border-gray-100 last:border-b-0 ${
          index === selectedIndex ? 'bg-purple-100 text-purple-800' : 'text-gray-700'
        }`}
        onClick={() => onSelect(suggestion)}
      >
        <span className="font-medium">{suggestion}</span>
      </button>
    ))}
  </div>
);
};

// 🆕 Componente selector de pacientes para modo asistido
const PatientSelector = () => {
 if (!showPatientSelector) return null;

 return (
   <div className="mb-6 p-6 bg-gradient-to-r from-emerald-50 via-teal-50 to-blue-50 border-2 border-emerald-200 rounded-2xl">
     <div className="flex items-center gap-3 mb-4">
       <Users className="w-6 h-6 text-emerald-600" />
       <h3 className="text-lg font-bold text-emerald-800">Seleccionar Paciente para Asistir</h3>
     </div>
     
     <div className="relative mb-4">
       <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
       <input
         type="text"
         placeholder="Buscar por nombre, CI o código..."
         value={patientSearchTerm}
         onChange={(e) => setPatientSearchTerm(e.target.value)}
         className="w-full pl-10 pr-4 py-3 border-2 border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
       />
     </div>

     <div className="max-h-64 overflow-y-auto space-y-2">
       {filteredPatients.length === 0 ? (
         <p className="text-gray-500 text-center py-4">No se encontraron pacientes</p>
       ) : (
         filteredPatients.slice(0, 10).map((patient) => (
           <button
             key={patient._id}
             onClick={() => handleSelectPatient(patient)}
             className="w-full p-4 bg-white rounded-lg border border-emerald-200 hover:border-emerald-400 hover:bg-emerald-50 transition-colors text-left"
           >
             <div className="flex items-center justify-between">
               <div>
                 <h4 className="font-semibold text-gray-900">{patient.name}</h4>
                 <p className="text-sm text-gray-600">CI: {patient.ci} • Código: {patient.userId}</p>
                 <div className="flex items-center mt-1">
                   {patient.hasHistory ? (
                     <>
                       <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                       <span className="text-xs text-green-600">Con historial</span>
                     </>
                   ) : (
                     <>
                       <Clock className="h-4 w-4 text-yellow-500 mr-1" />
                       <span className="text-xs text-yellow-600">Paciente nuevo</span>
                     </>
                   )}
                 </div>
               </div>
               <div className="text-emerald-600">
                 <Stethoscope className="h-6 w-6" />
               </div>
             </div>
           </button>
         ))
       )}
     </div>
   </div>
 );
};

// 🆕 Banner de información del paciente asistido
const AssistedPatientBanner = () => {
 if (!isAssistantMode || !selectedPatient) return null;

 return (
   <div className="mb-6 p-6 bg-gradient-to-r from-emerald-50 via-teal-50 to-blue-50 border-2 border-emerald-200 rounded-2xl">
     <div className="flex items-center justify-between">
       <div className="flex items-center gap-4">
         <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
           <User className="w-6 h-6 text-emerald-600" />
         </div>
         <div>
           <h3 className="text-lg font-bold text-emerald-800 flex items-center gap-2">
             Asistiendo a: {selectedPatient.name}
             <Users className="w-5 h-5" />
           </h3>
           <p className="text-emerald-600">
             CI: {selectedPatient.ci} • Código: {selectedPatient.userId}
           </p>
           <div className="flex items-center mt-1">
             <User className="w-4 h-4 text-teal-600 mr-1" />
             <span className="text-sm text-teal-600">
               Asistido por: {user?.firstName} {user?.lastName} (Asistente)
             </span>
           </div>
         </div>
       </div>
       
       <button
         onClick={() => {
           setSelectedPatient(null);
           setShowPatientSelector(true);
         }}
         className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
       >
         Cambiar Paciente
       </button>
     </div>
   </div>
 );
};

// Componente de memoria contextual con branding AISANA
const HistoricalContextBanner = () => {
if (!historicalContext) return null;

return (
  <div className="mb-6 p-6 bg-gradient-to-r from-purple-50 via-indigo-50 to-blue-50 border-2 border-purple-200 rounded-2xl relative overflow-hidden">
    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-purple-200/30 to-transparent rounded-full -mr-16 -mt-16"></div>
    
    <div className="flex items-center gap-4 relative z-10">
      <div className="relative">
        <Bot className="w-10 h-10 text-purple-600" />
        <Eye className="absolute -top-1 -right-1 w-5 h-5 text-green-500 animate-pulse" />
      </div>
      <div className="flex-1">
        <h3 className="text-xl font-bold text-purple-800 mb-2 flex items-center gap-2">
          🤖 AISANA te reconoce - Paciente conocido
          <Award className="w-5 h-5 text-yellow-500" />
        </h3>
        <div className="text-sm text-purple-700 space-y-1">
          <p><strong>Última consulta:</strong> {formatDate(historicalContext.lastConsultation.date)}</p>
          <p><strong>Síntomas anteriores:</strong> {historicalContext.lastConsultation.symptoms}</p>
          <p><strong>Especialidad previa:</strong> {historicalContext.lastConsultation.specialty}</p>
          <p><strong>Total de consultas:</strong> {historicalContext.totalConsultations}</p>
          {historicalContext.lastConsultation.daysSince <= 7 && (
            <p className="text-orange-600 font-semibold flex items-center gap-1">
              <Clock className="w-4 h-4" />
              Seguimiento reciente ({historicalContext.lastConsultation.daysSince} días)
            </p>
          )}
        </div>
      </div>
      <div className="text-green-600 flex items-center gap-2">
        <CheckCircle className="w-6 h-6" />
        <span className="font-semibold">Memoria AISANA activa</span>
      </div>
    </div>
  </div>
);
};

// Modal de éxito espectacular
const SuccessModal = () => {
if (!showSuccessModal || !watsonResult) return null;

return (
  <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border-2 border-purple-200 relative overflow-hidden transform animate-success-bounce">
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-purple-200/30 to-transparent rounded-full -mr-16 -mt-16"></div>
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-green-200/30 to-transparent rounded-full -ml-12 -mb-12"></div>
      
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-4 left-8 w-2 h-2 bg-yellow-400 rounded-full animate-ping"></div>
        <div className="absolute top-8 right-12 w-1 h-1 bg-purple-500 rounded-full animate-pulse delay-300"></div>
        <div className="absolute bottom-8 left-12 w-1.5 h-1.5 bg-green-500 rounded-full animate-bounce delay-500"></div>
        <div className="absolute bottom-12 right-8 w-2 h-2 bg-teal-400 rounded-full animate-ping delay-700"></div>
      </div>

      <div className="relative z-10 text-center">
        <div className="relative mx-auto mb-6 w-20 h-20">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-green-500 rounded-full animate-pulse"></div>
          <div className="absolute inset-2 bg-white rounded-full flex items-center justify-center">
            <Bot className="w-10 h-10 text-purple-600 animate-pulse" />
          </div>
          <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-400 rounded-full flex items-center justify-center animate-bounce">
            <CheckCircle className="w-5 h-5 text-white" />
          </div>
        </div>

        <h2 className="text-2xl font-bold text-purple-800 mb-2">
          🎉 ¡Análisis AISANA Completado!
        </h2>
        
        <p className="text-gray-600 mb-4">
          {isAssistantMode ? 'El diagnóstico del paciente asistido está listo' : 'Tu diagnóstico está listo y ha sido procesado exitosamente'}
        </p>

        <div className="bg-gradient-to-r from-purple-50 to-green-50 rounded-xl p-4 mb-6 border border-purple-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Clasificación:</span>
            <span 
              className="px-3 py-1 rounded-full text-sm font-bold text-white"
              style={{ backgroundColor: getUrgencyColor(watsonResult.classification.level).border }}
            >
              Nivel {watsonResult.classification.level}
            </span>
          </div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Especialidad:</span>
            <span className="text-sm font-bold text-purple-700">
              {watsonResult.classification.specialty}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Confianza:</span>
            <span className="text-sm font-bold text-green-600">
              {Math.round((watsonResult.classification.confidence || 0.8) * 100)}%
            </span>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 text-sm text-gray-600 mb-6">
          <Bot className="w-4 h-4" />
          <span>Análisis realizado con</span>
          <span className="font-bold text-purple-600">
            {watsonResult.method === 'watson' ? 'AISANA + Protocolo Manchester' : 'Protocolo Manchester'}
          </span>
        </div>

        {watsonResult.session_info?.is_follow_up && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
            <div className="flex items-center gap-2 text-blue-700">
              <Eye className="w-4 h-4" />
              <span className="text-sm font-medium">Consulta de seguimiento detectada</span>
            </div>
          </div>
        )}

        {/* 🆕 Indicador de asistencia */}
        {isAssistantMode && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 mb-4">
            <div className="flex items-center gap-2 text-emerald-700">
              <Users className="w-4 h-4" />
              <span className="text-sm font-medium">
                Triaje asistido por {user?.firstName} {user?.lastName}
              </span>
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={() => setShowSuccessModal(false)}
            className="flex-1 bg-gradient-to-r from-purple-600 to-teal-600 text-white font-bold py-3 px-6 rounded-xl hover:from-purple-700 hover:to-teal-700 transition-all duration-300 flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            Ver Diagnóstico
          </button>
          
          <button
            onClick={() => {
              setShowSuccessModal(false);
              setTimeout(() => {
                const element = document.querySelector('.diagnosis-section');
                if (element) {
                  element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
              }, 100);
            }}
            className="px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>

        {watsonResult.classification.level <= 2 && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-sm font-bold">⚠️ Requiere atención médica prioritaria</span>
            </div>
          </div>
        )}
      </div>

      <button
        onClick={() => setShowSuccessModal(false)}
        className="absolute top-4 right-4 w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors"
      >
        <span className="text-gray-500 text-lg">×</span>
      </button>

      <div className="absolute bottom-0 left-0 w-full h-1 bg-gray-200">
        <div className="h-1 bg-gradient-to-r from-purple-500 to-green-500 animate-progress-bar"></div>
      </div>
    </div>
  </div>
);
};

const HistorialExpandible = () => {
if (!historicalContext?.consultationHistory) return null;

return (
  <div className="mt-4">
    <button
      onClick={() => setShowHistorial(!showHistorial)}
      className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors"
    >
      <History className="w-4 h-4" />
      <span className="font-medium">Ver historial completo ({historicalContext.totalConsultations} consultas)</span>
      {showHistorial ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
    </button>

    {showHistorial && (
      <div className="mt-4 space-y-3 max-h-64 overflow-y-auto">
        {historicalContext.consultationHistory.map((consulta, index) => (
          <div key={index} className="p-4 bg-white/60 rounded-lg border border-blue-200">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-500" />
                <span className="font-semibold text-blue-800">{formatDate(consulta.date)}</span>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium`}
                    style={{backgroundColor: getUrgencyColor(consulta.level).bg}}>
                Nivel {consulta.level}
              </span>
            </div>
            <div className="space-y-1 text-sm">
              <p><strong>Síntomas:</strong> {consulta.symptoms}</p>
              <p><strong>Especialidad:</strong> {consulta.specialty}</p>
              {consulta.temperature && (
                <p><strong>Temperatura:</strong> {consulta.temperature}°C</p>
              )}
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
);
};

// 🆕 Componente para mostrar solo el resultado (Vista Result)
const ResultOnlyView = () => {
if (!showWatsonResult || !watsonResult) return null;

return (
  <div className="diagnosis-section mt-10 p-8 bg-gradient-to-br from-purple-50 via-teal-50 to-emerald-50 border-2 border-purple-300 rounded-3xl shadow-xl relative overflow-hidden">
    <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-purple-200/20 to-transparent rounded-full -mr-20 -mt-20"></div>
    <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-teal-200/20 to-transparent rounded-full -ml-16 -mb-16"></div>
    
    <div className="flex items-center gap-4 mb-6 relative z-10">
      <div className="relative">
        <Bot className="w-12 h-12 text-purple-600" />
        <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-400 rounded-full animate-pulse flex items-center justify-center">
          <Cpu className="w-3 h-3 text-white" />
        </div>
      </div>
      <div>
        <h3 className="text-3xl font-bold text-purple-800 flex items-center gap-2">
          Diagnóstico AISANA Completado
          <Award className="w-7 h-7 text-yellow-500 animate-pulse" />
        </h3>
        <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
          <div className="flex items-center gap-1">
            <Zap className="w-4 h-4" />
            <span className="font-medium">
              {watsonResult.method === 'watson' ? 'Análisis AISANA Completo' : 'Clasificación de Respaldo'}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Shield className="w-4 h-4" />
            <span>Protocolo Manchester</span>
          </div>
          <div className="flex items-center gap-1">
            <Lock className="w-4 h-4 text-green-600" />
            <span className="text-green-600 font-medium">Seguro</span>
          </div>
          {/* 🆕 Indicador de asistencia */}
          {isAssistantMode && (
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4 text-emerald-600" />
              <span className="text-emerald-600 font-medium">Asistido</span>
            </div>
          )}
        </div>
      </div>
    </div>

    <div className="grid md:grid-cols-2 gap-6 relative z-10">
      {/* Clasificación principal con síntoma detectado */}
      <div 
        className="p-6 rounded-2xl border-2 shadow-lg relative overflow-hidden"
        style={{
          backgroundColor: getUrgencyColor(watsonResult.classification.level).bg,
          borderColor: getUrgencyColor(watsonResult.classification.level).border
        }}
      >
        <div className="absolute top-2 right-2 w-16 h-16 bg-white/10 rounded-full animate-pulse"></div>
        
        <div className="flex items-center justify-between mb-4 relative z-10">
          <span className="font-bold text-gray-700 text-lg">Nivel de Urgencia</span>
          <span 
            className="px-4 py-2 rounded-full text-lg font-bold shadow-md"
            style={{
              backgroundColor: getUrgencyColor(watsonResult.classification.level).border,
              color: 'white'
            }}
          >
            Nivel {watsonResult.classification.level}
          </span>
        </div>
        <p className="text-gray-600 mb-3 text-lg font-medium">{watsonResult.classification.label}</p>
        
        {watsonResult.classification.primarySymptom && (
          <div className="mb-3 p-3 bg-white/50 rounded-lg border border-white/60">
            <p className="text-sm font-medium text-gray-700 mb-1">Síntoma principal detectado:</p>
            <p className="font-bold text-gray-800">{watsonResult.classification.primarySymptom}</p>
          </div>
        )}
        
        <div className="w-full">
          <p className="font-bold text-purple-800 text-xl break-words leading-tight flex items-center gap-2">
            <Stethoscope className="w-5 h-5" />
            {watsonResult.classification.specialty}
          </p>
        </div>
        
        {watsonResult.classification.level <= 2 && (
          <div className="mt-4 p-3 bg-red-100 border border-red-300 rounded-lg">
            <div className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="w-5 h-5" />
              <span className="font-bold">Atención Prioritaria Requerida</span>
            </div>
          </div>
        )}
      </div>

      {/* INFORMACIÓN MÉDICA CON SIGNOS VITALES */}
      <div className="p-6 bg-white/70 backdrop-blur-sm rounded-2xl border-2 border-gray-200 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-blue-100/30 to-transparent rounded-full -mr-10 -mt-10"></div>
        
        <div className="flex items-center gap-2 mb-4 relative z-10">
          <HeartHandshake className="w-6 h-6 text-purple-600" />
          <span className="font-bold text-gray-700 text-lg">Información Médica</span>
        </div>
        
        {/* 🆕 Información de asistencia */}
        {isAssistantMode && selectedPatient && (
          <div className="flex items-center gap-2 text-emerald-600 mb-3 p-2 bg-emerald-50 rounded-lg">
            <Users className="w-4 h-4" />
            <span className="font-medium">
              Paciente: {selectedPatient.name} (Asistido por {user?.firstName} {user?.lastName})
            </span>
          </div>
        )}
        
        {watsonResult.session_info?.is_follow_up && (
          <div className="flex items-center gap-2 text-blue-600 mb-3 p-2 bg-blue-50 rounded-lg">
            <Eye className="w-4 h-4" />
            <span className="font-medium">Consulta de seguimiento detectada</span>
          </div>
        )}
        
        {/* MOSTRAR SIGNOS VITALES ANALIZADOS */}
        {(formData.edad || formData.frecuenciaCardiaca || formData.temperature || 
          (formData.presionSistolica && formData.presionDiastolica)) && (
          <div className="mb-4 p-3 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg">
            <div className="text-purple-700 text-sm">
              <p className="font-semibold mb-2 flex items-center gap-1">
                <Activity className="w-4 h-4" />
                Signos vitales analizados:
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {formData.edad && <p>• Edad: {formData.edad} años</p>}
                {formData.temperature && <p>• Temperatura: {formData.temperature}°C</p>}
                {formData.frecuenciaCardiaca && <p>• FC: {formData.frecuenciaCardiaca} lpm</p>}
                {(formData.presionSistolica && formData.presionDiastolica) && 
                  <p>• PA: {formData.presionSistolica}/{formData.presionDiastolica} mmHg</p>}
              </div>
            </div>
          </div>
        )}
        
        <div className="space-y-3 text-gray-600 relative z-10">
          <div className="flex justify-between">
            <span>Método de análisis:</span>
            <span className="font-bold text-purple-700">
              {watsonResult.method === 'watson' ? 'IA + Protocolo Manchester' : 'Protocolo Manchester'}
            </span>
          </div>
          
          <div className="flex justify-between">
            <span>Confianza diagnóstica:</span>
            <span className="font-bold text-green-600">
              {Math.round((watsonResult.classification.confidence || 0.8) * 100)}%
            </span>
          </div>
          
          {historicalContext && (
            <div className="mt-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
              <div className="text-purple-700 text-sm">
                <p className="font-semibold mb-1 flex items-center gap-1">
                  <Bot className="w-4 h-4" />
                  Contexto histórico considerado:
                </p>
                <p>• {historicalContext.totalConsultations} consultas previas</p>
                <p>• Última especialidad: {historicalContext.lastConsultation.specialty}</p>
                {historicalContext.lastConsultation.daysSince <= 7 && (
                  <p>• Seguimiento reciente ({historicalContext.lastConsultation.daysSince} días)</p>
                )}
              </div>
            </div>
          )}
          
          <div className="flex justify-between">
            <span>Hora de análisis:</span>
            <span className="font-bold">{new Date().toLocaleTimeString('es-BO')}</span>
          </div>
        </div>

        {watsonResult.fallback_reason && (
          <div className="mt-4 p-3 bg-amber-50 border border-amber-300 rounded-lg">
            <div className="flex items-center gap-2 text-amber-700">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-sm font-medium">{watsonResult.fallback_reason}</span>
            </div>
          </div>
        )}
      </div>
    </div>

    {/* Barra de confianza con factores de signos vitales */}
    <div className="mt-6 p-6 bg-white/50 backdrop-blur-sm rounded-xl border border-gray-200 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-300 via-teal-300 to-green-300 animate-pulse"></div>
      
      <div className="flex justify-between items-center mb-3">
        <span className="font-bold text-gray-700 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-purple-600" />
          Confianza del Diagnóstico
        </span>
        <span className="text-3xl font-bold text-purple-700 flex items-center gap-2">
          {Math.round((watsonResult.classification.confidence || 0.8) * 100)}%
          <Star className="w-6 h-6 text-yellow-500" />
        </span>
      </div>
      <div className="relative w-full bg-gray-200 rounded-full h-5 overflow-hidden">
        <div 
          className="bg-gradient-to-r from-purple-500 via-teal-500 to-green-500 h-5 rounded-full transition-all duration-3000 ease-out shadow-lg relative"
          style={{ 
            width: `${Math.round((watsonResult.classification.confidence || 0.8) * 100)}%`,
            boxShadow: '0 0 15px rgba(147, 51, 234, 0.4)'
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
        </div>
      </div>
      <p className="text-sm text-gray-600 mt-3 text-center font-medium">
        Basado en análisis de síntomas, signos vitales, contexto histórico y protocolos médicos
      </p>
      
      {/* Factores de confianza con signos vitales */}
      <div className="mt4 grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
        {(() => {
          const factors = getConfidenceFactors();
          return (
            <>
              <div className="text-center p-2 bg-purple-50 rounded">
                <Bot className="w-4 h-4 mx-auto mb-1 text-purple-600" />
                <p className="font-medium">Método IA</p>
                <p className="text-purple-600">+{factors.method}%</p>
              </div>
              <div className="text-center p-2 bg-blue-50 rounded">
                <History className="w-4 h-4 mx-auto mb-1 text-blue-600" />
                <p className="font-medium">Historial</p>
                <p className="text-blue-600">+{factors.history}%</p>
              </div>
              <div className="text-center p-2 bg-green-50 rounded">
                <FileText className="w-4 h-4 mx-auto mb-1 text-green-600" />
                <p className="font-medium">Detalles</p>
                <p className="text-green-600">+{factors.details}%</p>
              </div>
              <div className="text-center p-2 bg-teal-50 rounded">
                <Thermometer className="w-4 h-4 mx-auto mb-1 text-teal-600" />
                <p className="font-medium">Objetivos</p>
                <p className="text-teal-600">+{factors.objectives}%</p>
              </div>
              <div className="text-center p-2 bg-rose-50 rounded">
                <Activity className="w-4 h-4 mx-auto mb-1 text-rose-600" />
                <p className="font-medium">Signos Vitales</p>
                <p className="text-rose-600">+{factors.vitals}%</p>
              </div>
            </>
          );
        })()}
      </div>
    </div>

    {/* Botón descargar PDF paciente - CORREGIDO con funcionalidad sin validación */}
    <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border-2 border-blue-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Download className="w-6 h-6 text-blue-600" />
          <div>
            <h4 className="font-bold text-blue-800">Resumen del Diagnóstico</h4>
            <p className="text-sm text-blue-600">
              {isAssistantMode ? 'Descarga el reporte médico del paciente asistido' : 'Descarga tu reporte médico personal'}
            </p>
          </div>
        </div>
        <div onClick={(e) => e.stopPropagation()}>
          <PDFGeneratorPatient 
            patientData={{
              // ✅ DATOS BÁSICOS DEL USUARIO - 🔧 Modificado para modo asistido
              patientName: isAssistantMode ? selectedPatient?.name : (user?.fullName || user?.name || 'Paciente'),
              patientCI: isAssistantMode ? selectedPatient?.ci : (user?.ci || getUserId()),
              
              // ✅ SÍNTOMAS CORRECTOS - USAR WATSON DATA
              symptoms: [watsonResult.classification.primarySymptom || 'Sin síntomas especificados'],
              notes: watsonResult.classification.originalNotes || formData.notes || '',
              
              // ✅ SIGNOS VITALES 
              temperature: formData.temperature || null,
              edad: formData.edad || null,
              frecuenciaCardiaca: formData.frecuenciaCardiaca || null,
              presionArterial: (formData.presionSistolica && formData.presionDiastolica) ? 
                              `${formData.presionSistolica}/${formData.presionDiastolica}` : null,
              
              // ✅ CLASIFICACIÓN WATSON COMPLETA
              classification: {
                level: watsonResult.classification.level,
                label: watsonResult.classification.label,
                specialty: watsonResult.classification.specialty,
                confidence: watsonResult.classification.confidence
              },
              
              // ✅ DATOS ADICIONALES - 🔧 Modificado para modo asistido
              method: watsonResult.method,
              timestamp: formData.date,
              isWatsonData: true,
              isFollowUp: watsonResult.session_info?.is_follow_up || false,
              
              // 🆕 DATOS DE ASISTENCIA
              isAssisted: isAssistantMode,
              assistedBy: isAssistantMode ? `${user?.firstName} ${user?.lastName}` : null
            }}
            className="bg-blue-600 hover:bg-blue-700"
          />
        </div>
      </div>
    </div>

    {/* Recomendaciones mejoradas con AISANA */}
    <div className="mt-6 p-6 bg-gradient-to-r from-purple-50 via-teal-50 to-green-50 rounded-xl border-2 border-purple-200 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-purple-200/20 to-transparent rounded-full -mr-12 -mt-12"></div>
      
      <h4 className="font-bold text-purple-800 mb-3 flex items-center gap-2 text-lg relative z-10">
        <Bot className="w-6 h-6" />
        Recomendaciones del Sistema AISANA:
      </h4>
      <ul className="text-sm text-gray-700 space-y-2 relative z-10">
        <li className="flex items-start gap-2">
          <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
          <span>Conservar este diagnóstico para el personal médico</span>
        </li>
        <li className="flex items-start gap-2">
          <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
          <span>Mencionar todos los síntomas descritos durante la consulta</span>
        </li>
        {/* 🆕 Recomendación específica para modo asistido */}
        {isAssistantMode && (
          <li className="flex items-start gap-2">
            <Users className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
            <span className="text-emerald-600">El paciente debe presentarse con este reporte de triaje asistido</span>
          </li>
        )}
        {/* Recomendaciones basadas en signos vitales */}
        {(formData.edad || formData.frecuenciaCardiaca || formData.temperature || 
          (formData.presionSistolica && formData.presionDiastolica)) && (
          <li className="flex items-start gap-2">
            <Activity className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
            <span className="text-purple-600">Informar al médico sobre los signos vitales registrados</span>
          </li>
        )}
        {watsonResult.classification.level <= 2 && (
          <li className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
            <span className="text-red-600 font-bold">Buscar atención médica inmediata</span>
          </li>
        )}
        {watsonResult.session_info?.is_follow_up && (
          <li className="flex items-start gap-2">
            <Eye className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <span className="text-blue-600">Informar sobre la evolución desde la consulta anterior</span>
          </li>
        )}
        {historicalContext && (
          <li className="flex items-start gap-2">
            <History className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
            <span className="text-purple-600">Mostrar al médico el historial de consultas previas</span>
          </li>
        )}
      </ul>
    </div>

    <HistorialExpandible />

    {/* 🆕 Botón para Nueva Consulta - 🔧 Modificado para modo asistido */}
    <div className="mt-8 text-center">
      <button
        onClick={handleNewConsultation}
        className="group bg-gradient-to-r from-purple-600 via-teal-600 to-green-700 text-white font-bold py-4 px-8 rounded-2xl hover:shadow-2xl hover:shadow-purple-500/40 hover:scale-105 transition-all duration-500 flex items-center justify-center gap-3 mx-auto"
      >
        <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" />
        <span className="text-lg">
          {isAssistantMode ? 'Asistir Nuevo Paciente' : 'Realizar Nueva Consulta'}
        </span>
        <RefreshCw className="w-6 h-6 group-hover:animate-spin" />
      </button>
      <p className="text-sm text-gray-600 mt-3">
        {isAssistantMode 
          ? '¿Necesitas asistir a otro paciente? Inicia una nueva consulta'
          : '¿Tienes nuevos síntomas? Inicia una nueva consulta con AISANA'
        }
      </p>
    </div>
  </div>
);
};

// 🔧 Validación de acceso para modo asistido
if (isAssistantMode && !selectedPatient && !showPatientSelector) {
 return (
   <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50 to-green-100 p-6 flex items-center justify-center">
     <div className="bg-white rounded-2xl p-8 shadow-xl border border-emerald-200">
       <div className="text-center">
         <Users className="w-16 h-16 text-emerald-600 mx-auto mb-4" />
         <h2 className="text-2xl font-bold text-gray-900 mb-2">Cargando información del paciente...</h2>
         <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mx-auto"></div>
       </div>
     </div>
   </div>
 );
}

return (
<div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50 to-green-100 p-6 flex items-center justify-center">
  <div className="fixed inset-0 overflow-hidden pointer-events-none">
    <div className="absolute top-20 left-20 w-3 h-3 bg-purple-300/30 rounded-full animate-ping delay-300"></div>
    <div className="absolute top-40 right-32 w-2 h-2 bg-teal-400/40 rounded-full animate-pulse delay-700"></div>
    <div className="absolute bottom-32 left-1/4 w-4 h-4 bg-green-300/25 rounded-full animate-bounce delay-1000"></div>
    <div className="absolute top-1/3 right-20 w-2 h-2 bg-cns/20 rounded-full animate-ping delay-1500"></div>
    <div className="absolute bottom-1/4 right-1/3 w-3 h-3 bg-purple-400/20 rounded-full animate-pulse delay-2000"></div>
  </div>

  <div className="relative w-full max-w-5xl">
    <div className="absolute -top-6 -left-6 w-80 h-80 bg-gradient-to-r from-cns/10 to-teal-300/10 rounded-full blur-3xl animate-pulse"></div>
    <div className="absolute -bottom-6 -right-6 w-96 h-96 bg-gradient-to-l from-purple-400/10 to-emerald-300/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
    
    {/* 🆕 Condicional de Vista */}
    {currentView === 'result' ? (
      // Vista Solo Resultado
      <div>
        {/* AISANA Status Banner Simplificado para Vista Resultado */}
        <div className="mb-6 p-4 bg-gradient-to-r from-green-50 via-teal-50 to-blue-50 border-2 border-green-200 rounded-2xl backdrop-blur-sm relative overflow-hidden">
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Bot className="w-8 h-8 text-green-600" />
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full animate-pulse">
                  <CheckCircle className="w-2 h-2 text-white m-1" />
                </div>
              </div>
              <div>
                <h3 className="font-bold text-green-800 text-lg flex items-center gap-2">
                  Diagnóstico AISANA Completado
                  <CheckCircle className="w-5 h-5 text-green-500" />
                </h3>
                <p className="text-sm text-gray-600">
                  {isAssistantMode 
                    ? 'El análisis del paciente asistido ha sido procesado exitosamente'
                    : 'Tu análisis médico ha sido procesado exitosamente'
                  }
                </p>
              </div>
            </div>
            <button
              onClick={handleNewConsultation}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="font-medium">
                {isAssistantMode ? 'Nuevo Paciente' : 'Volver al Formulario'}
              </span>
            </button>
          </div>
        </div>

        <AssistedPatientBanner />
        <HistoricalContextBanner />
        <ResultOnlyView />
      </div>
    ) : (
      // Vista Formulario Original
      <div>
        {/* 🆕 Selector de pacientes para modo asistido */}
        <PatientSelector />
        
        {/* 🆕 Banner del paciente asistido */}
        <AssistedPatientBanner />

        {/* AISANA Status Banner Mejorado */}
        <div className="mb-6 p-6 bg-gradient-to-r from-purple-50 via-teal-50 to-green-50 border-2 border-purple-200 rounded-2xl backdrop-blur-sm relative overflow-hidden">
          <div className="absolute inset-0 opacity-5">
            <div className="absolute top-2 left-8 w-16 h-0.5 bg-purple-600 transform rotate-12"></div>
            <div className="absolute bottom-3 right-12 w-12 h-0.5 bg-teal-600 transform -rotate-12"></div>
            <div className="absolute top-1/2 left-4 w-8 h-0.5 bg-green-600"></div>
          </div>
          
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Bot className="w-10 h-10 text-purple-600" />
                <div className={`absolute -top-1 -right-1 w-4 h-4 rounded-full ${isAisanaReady ? 'bg-green-400 animate-pulse' : 'bg-amber-400 animate-spin'}`}>
                  {isAisanaReady && <Cpu className="w-2 h-2 text-white m-1" />}
                </div>
              </div>
              <div>
                <h3 className="font-bold text-purple-800 text-xl flex items-center gap-2">
                  Sistema AISANA Activo
                  <Star className="w-5 h-5 text-yellow-500 animate-pulse" />
                  {/* 🆕 Indicador de modo asistido */}
                  {isAssistantMode && (
                    <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-sm rounded-full">
                      Modo Asistido
                    </span>
                  )}
                </h3>
                <p className="text-sm text-gray-600">
                  {isAisanaReady 
                    ? (isAssistantMode 
                        ? '🤖 IA médica lista para triaje asistido'
                        : '🤖 IA médica lista para análisis inteligente'
                      )
                    : '⚡ Inicializando sistema...'
                  }
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-purple-700">
              <Shield className="w-5 h-5" />
              <span className="font-medium">Protocolo Manchester</span>
              <Lock className="w-4 h-4 text-green-600" />
            </div>
          </div>
        </div>

        <HistoricalContextBanner />
        
        {/* 🔧 Solo mostrar formulario si hay paciente seleccionado (en modo asistido) o si es modo normal */}
        {(!isAssistantMode || selectedPatient) && (
          <form
            onSubmit={handleSubmit}
            className="relative bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/30 p-10 w-full mx-auto font-sans space-y-8 transform hover:scale-[1.005] transition-all duration-500"
          >
            {/* Header mejorado con branding AISANA */}
            <div className="text-center relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-600 via-teal-600 to-green-700 p-8 -m-10 mb-10">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer"></div>
              
              <div className="absolute inset-0 opacity-15">
                <div className="absolute top-2 left-4 w-20 h-0.5 bg-white transform rotate-45 animate-pulse"></div>
                <div className="absolute top-4 right-8 w-16 h-0.5 bg-white transform -rotate-45 animate-pulse delay-500"></div>
                <div className="absolute bottom-2 left-1/3 w-12 h-0.5 bg-white animate-pulse delay-1000"></div>
                <div className="absolute bottom-4 right-1/4 w-14 h-0.5 bg-white transform rotate-12 animate-pulse delay-1500"></div>
                <div className="absolute top-1/2 left-1/4 w-8 h-0.5 bg-white animate-pulse delay-300"></div>
                <div className="absolute top-1/3 right-1/3 w-10 h-0.5 bg-white transform -rotate-6 animate-pulse delay-700"></div>
              </div>

              <div className="relative z-10">
                <div className="flex items-center justify-center gap-4 mb-4">
                  <Bot className="w-10 h-10 text-white animate-pulse" />
                  <h2 className="text-4xl font-bold text-white tracking-wide bg-gradient-to-r from-white via-yellow-100 to-white bg-clip-text">
                    {isAssistantMode ? 'Triaje Asistido AISANA' : 'Diagnóstico AISANA'}
                  </h2>
                  <Microscope className="w-10 h-10 text-white animate-pulse delay-300" />
                </div>
                <p className="text-white/90 text-lg font-medium">
                  {isAssistantMode ? 'Asistencia Médica Profesional • Protocolo Manchester' : 'IA Médica Avanzada • Protocolo Manchester'}
                </p>
                <div className="w-40 h-1 bg-gradient-to-r from-transparent via-white/70 to-transparent mx-auto mt-4 rounded-full"></div>
              </div>
              
              {(isSubmitting || processingStep) && (
                <div className="mt-6 p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
                  <div className="flex items-center justify-center gap-3 text-white">
                    <div className="relative">
                      <Bot className="w-7 h-7 animate-pulse" />
                      <div className="absolute inset-0 w-7 h-7 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    </div>
                    <span className="text-lg font-medium">
                      {processingStep || '🤖 AISANA procesando datos médicos...'}
                    </span>
                  </div>
                  <div className="mt-3 w-full bg-white/20 rounded-full h-3">
                    <div className="bg-gradient-to-r from-purple-300 via-teal-300 to-green-300 h-3 rounded-full animate-pulse" style={{width: '75%'}}></div>
                  </div>
                </div>
              )}
            </div>

            {/* Campo de Usuario mejorado - 🔧 Modificado para modo asistido */}
            <div className="group">
              <label className={labelClasses}>
                <User className="inline w-4 h-4 mr-2" />
                {isAssistantMode ? 'Paciente asistido' : 'Código del asegurado'}
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={getUserDisplayValue()}
                  disabled
                  className={`w-full px-4 py-3 pl-12 pr-12 rounded-xl border-2 cursor-not-allowed text-gray-700 font-mono text-lg ${
                    isAssistantMode 
                      ? 'border-emerald-300 bg-gradient-to-br from-emerald-50 to-teal-50'
                      : 'border-cns/30 bg-gradient-to-br from-green-50 to-teal-50'
                  }`}
                />
                <User className={`absolute top-3 left-3 ${isAssistantMode ? 'text-emerald-600' : 'text-cns'}`} size={22} />
                <CheckCircle className="absolute top-3 right-3 text-green-500" size={22} />
              </div>
              {/* 🆕 Indicador de modo asistido */}
              {isAssistantMode && (
                <p className="mt-2 text-sm text-emerald-600 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  <span>Triaje realizado por asistente médico</span>
                </p>
              )}
            </div>

            {/* Campo síntomas SIN autocompletado */}
            <div className="group">
              <label className={labelClasses}>
                <Activity className="inline w-4 h-4 mr-2" />
                Síntomas actuales
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="symptoms"
                  value={formData.symptoms}
                  onChange={handleChange}
                  onFocus={() => setFocusedField('symptoms')}
                  onBlur={() => setFocusedField(null)}
                  className={getInputClasses('symptoms')}
                  placeholder="Ej: dolor de pecho, dificultad para respirar, mareos severos"
                  required
                  autoComplete="off"
                />
                <Activity className={`absolute top-3 left-3 transition-all duration-300 ${
                  focusedField === 'symptoms' ? 'text-cns scale-110' : 'text-gray-400'
                }`} size={20} />
                <ValidationIndicator fieldName="symptoms" />
              </div>
              {fieldValidation.symptoms && (
                <p className="mt-2 text-sm flex items-center gap-2">
                  <Info className="w-4 h-4" />
                  <span className={`
                    ${fieldValidation.symptoms.status === 'excellent' ? 'text-green-600' : ''}
                    ${fieldValidation.symptoms.status === 'good' ? 'text-blue-600' : ''}
                    ${fieldValidation.symptoms.status === 'warning' ? 'text-amber-600' : ''}
                  `}>
                    {fieldValidation.symptoms.message}
                  </span>
                </p>
              )}
            </div>

            {/* Campo enfermedades preexistentes con autocompletado */}
            <div className="group">
              <label className={labelClasses}>
                <Heart className="inline w-4 h-4 mr-2" />
                Enfermedades preexistentes
                {patientBaseConditions.length > 0 && (
                  <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-600 text-xs rounded-full">
                    {patientBaseConditions.length} registradas
                  </span>
                )}
              </label>
              
              {patientBaseConditions.length > 0 && (
                <div className="mb-3 p-4 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-xl border-2 border-blue-200 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-blue-200/20 to-transparent rounded-full -mr-10 -mt-10"></div>
                  
                  <div className="flex items-center justify-between mb-3 relative z-10">
                    <div className="flex items-center gap-2">
                      <Heart className="w-5 h-5 text-blue-600" />
                      <span className="text-sm font-bold text-blue-800">Enfermedades ya registradas:</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsEditingBaseConditions(!isEditingBaseConditions)}
                      className="px-3 py-1 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1"
                    >
                      {isEditingBaseConditions ? (
                        <>
                          <span>Cancelar</span>
                          <span className="text-xs">✕</span>
                        </>
                      ) : (
                        <>
                          <span>Agregar nueva</span>
                          <span className="text-xs">+</span>
                        </>
                      )}
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2 relative z-10">
                    {patientBaseConditions.map((condition, index) => (
                      <div key={index} className="group relative">
                        <div className="px-4 py-2 bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 rounded-full text-sm font-medium border border-blue-300 shadow-sm hover:shadow-md transition-all duration-200 flex items-center gap-2">
                          <Heart className="w-3 h-3" />
                          <span>{condition}</span>
                          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {(isEditingBaseConditions || patientBaseConditions.length === 0) && (
                <div className="space-y-3">
                  <div className="relative">
                    <input
                      type="text"
                      value={newBaseCondition}
                      onChange={handleConditionInputChange}
                      onFocus={() => setFocusedField('baseConditions')}
                      onBlur={() => {
                        setFocusedField(null);
                        setTimeout(() => setShowConditionSuggestions(false), 150);
                      }}
                      onKeyDown={(e) => handleKeyDown(e, conditionSuggestions)}
                      className={getInputClasses('baseConditions')}
                      placeholder="Ej: diabetes, hipertensión, asma..."
                      autoComplete="off"
                    />
                    <Heart className={`absolute top-3 left-3 transition-colors duration-300 ${
                      focusedField === 'baseConditions' ? 'text-cns' : 'text-gray-400'
                    }`} size={20} />
                    
                    {showConditionSuggestions && (
                      <SuggestionsList
                        suggestions={conditionSuggestions}
                        onSelect={selectConditionSuggestion}
                        selectedIndex={selectedSuggestionIndex}
                      />
                    )}
                  </div>
                  
                  {newBaseCondition.trim() && (
                    <button
                      type="button"
                      onClick={handleAddBaseCondition}
                      className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Agregar enfermedad preexistente
                    </button>
                  )}</div>
            )}
            
            <input
              type="hidden"
              name="baseConditions"
              value={formData.baseConditions}
            />
          </div>

          {/* Sección signos vitales */}
          <div className="bg-gradient-to-r from-purple-50 via-blue-50 to-teal-50 p-6 rounded-2xl border-2 border-purple-200">
            <h3 className="text-lg font-bold text-purple-800 mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Signos Vitales
            </h3>
            
            <div className="grid md:grid-cols-2 gap-6">
              {/* Campo Edad */}
              <div className="group">
                <label className={labelClasses}>
                  <Users className="inline w-4 h-4 mr-2" />
                  Edad (años)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    name="edad"
                    value={formData.edad}
                    onChange={handleChange}
                    onFocus={() => setFocusedField('edad')}
                    onBlur={() => setFocusedField(null)}
                    className={getInputClasses('edad')}
                    placeholder="Ej: 35"
                    min="0"
                    max="120"
                  />
                  <Users className={`absolute top-3 left-3 transition-all duration-300 ${
                    focusedField === 'edad' ? 'text-cns scale-110' : 'text-gray-400'
                  }`} size={20} />
                  <ValidationIndicator fieldName="edad" />
                </div>
                {fieldValidation.edad && (
                  <p className="mt-2 text-sm flex items-center gap-2">
                    <Info className="w-4 h-4" />
                    <span className={`
                      ${fieldValidation.edad.status === 'good' ? 'text-green-600' : ''}
                      ${fieldValidation.edad.status === 'warning' ? 'text-amber-600' : ''}
                    `}>
                      {fieldValidation.edad.message}
                    </span>
                  </p>
                )}
              </div>

              {/* Campo Frecuencia Cardíaca */}
              <div className="group">
                <label className={labelClasses}>
                  <Heart className="inline w-4 h-4 mr-2" />
                  Frecuencia Cardíaca (latidos/min)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    name="frecuenciaCardiaca"
                    value={formData.frecuenciaCardiaca}
                    onChange={handleChange}
                    onFocus={() => setFocusedField('frecuenciaCardiaca')}
                    onBlur={() => setFocusedField(null)}
                    className={getInputClasses('frecuenciaCardiaca')}
                    placeholder="Ej: 72"
                    min="30"
                    max="220"
                  />
                  <Heart className={`absolute top-3 left-3 transition-all duration-300 ${
                    focusedField === 'frecuenciaCardiaca' ? 'text-cns scale-110' : 'text-gray-400'
                  }`} size={20} />
                  <ValidationIndicator fieldName="frecuenciaCardiaca" />
                </div>
                {fieldValidation.frecuenciaCardiaca && (
                  <p className="mt-2 text-sm flex items-center gap-2">
                    <Info className="w-4 h-4" />
                    <span className={`
                     ${fieldValidation.frecuenciaCardiaca.status === 'good' ? 'text-green-600' : ''}
                      ${fieldValidation.frecuenciaCardiaca.status === 'warning' ? 'text-amber-600' : ''}
                      ${fieldValidation.frecuenciaCardiaca.status === 'urgent' ? 'text-red-600' : ''}
                    `}>
                      {fieldValidation.frecuenciaCardiaca.message}
                    </span>
                  </p>
                )}
              </div>
            </div>

            {/* Campos Presión Arterial */}
            <div className="mt-6">
              <label className={labelClasses}>
                <Gauge className="inline w-4 h-4 mr-2" />
                Presión Arterial (mmHg)
              </label>
              <div className="grid grid-cols-2 gap-4">
                <div className="relative">
                  <input
                    type="number"
                    name="presionSistolica"
                    value={formData.presionSistolica}
                    onChange={handleChange}
                    onFocus={() => setFocusedField('presionSistolica')}
                    onBlur={() => setFocusedField(null)}
                    className={getInputClasses('presionArterial')}
                    placeholder="Sistólica: 120"
                    min="70"
                    max="250"
                  />
                  <Gauge className={`absolute top-3 left-3 transition-all duration-300 ${
                    focusedField === 'presionSistolica' ? 'text-cns scale-110' : 'text-gray-400'
                  }`} size={20} />
                </div>
                <div className="relative">
                  <input
                    type="number"
                    name="presionDiastolica"
                    value={formData.presionDiastolica}
                    onChange={handleChange}
                    onFocus={() => setFocusedField('presionDiastolica')}
                    onBlur={() => setFocusedField(null)}
                    className={getInputClasses('presionArterial')}
                    placeholder="Diastólica: 80"
                    min="40"
                    max="150"
                  />
                  <Gauge className={`absolute top-3 left-3 transition-all duration-300 ${
                    focusedField === 'presionDiastolica' ? 'text-cns scale-110' : 'text-gray-400'
                  }`} size={20} />
                </div>
              </div>
              {fieldValidation.presionArterial && (
                <p className="mt-2 text-sm flex items-center gap-2">
                  <Info className="w-4 h-4" />
                  <span className={`
                    ${fieldValidation.presionArterial.status === 'good' ? 'text-green-600' : ''}
                    ${fieldValidation.presionArterial.status === 'warning' ? 'text-amber-600' : ''}
                    ${fieldValidation.presionArterial.status === 'urgent' ? 'text-red-600' : ''}
                  `}>
                    {fieldValidation.presionArterial.message}
                  </span>
                </p>
              )}
            </div>
          </div>

          {/* Campo Temperatura */}
          <div className="group">
            <label className={labelClasses}>
              <Thermometer className="inline w-4 h-4 mr-2" />
              Temperatura corporal (°C)
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.1"
                name="temperature"
                value={formData.temperature}
                onChange={handleChange}
                onFocus={() => setFocusedField('temperature')}
                onBlur={() => setFocusedField(null)}
                className={getInputClasses('temperature')}
                placeholder="Ej: 38.2"
              />
              <Thermometer className={`absolute top-3 left-3 transition-all duration-300 ${
                focusedField === 'temperature' ? 'text-cns scale-110' : 'text-gray-400'
              }`} size={20} />
              <ValidationIndicator fieldName="temperature" />
              {formData.temperature && (
                <div className={`absolute right-12 top-3 text-sm font-bold ${
                  parseFloat(formData.temperature) > 37.5 ? 'text-red-500' : 'text-green-500'
                }`}>
                  {parseFloat(formData.temperature) > 37.5 ? '🔥' : '✅'}
                </div>
              )}
            </div>
            {fieldValidation.temperature && (
              <p className="mt-2 text-sm flex items-center gap-2">
                <Info className="w-4 h-4" />
                <span className={`
                  ${fieldValidation.temperature.status === 'normal' ? 'text-green-600' : ''}
                  ${fieldValidation.temperature.status === 'warning' ? 'text-amber-600' : ''}
                  ${fieldValidation.temperature.status === 'urgent' ? 'text-red-600' : ''}
                `}>
                  {fieldValidation.temperature.message}
                </span>
              </p>
            )}
          </div>

          {/* Campo Notas */}
          <div className="group">
            <label className={labelClasses}>
              <FileText className="inline w-4 h-4 mr-2" />
              Contexto detallado
            </label>
            <div className="relative">
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                onFocus={() => setFocusedField('notes')}
                onBlur={() => setFocusedField(null)}
                rows={5}
                className={`${getInputClasses('notes')} pl-12 min-h-[140px] resize-none`}
                placeholder="IMPORTANTE: Describe intensidad del dolor (1-10), duración exacta, medicación tomada, factores que mejoran/empeoran, síntomas asociados..."
              />
              <FileText className={`absolute top-3 left-3 transition-colors duration-300 ${
                focusedField === 'notes' ? 'text-cns' : 'text-gray-400'
              }`} size={20} />
              <ValidationIndicator fieldName="notes" />
            </div>
            {fieldValidation.notes && (
              <p className="mt-2 text-sm flex items-center gap-2">
                <Info className="w-4 h-4" />
                <span className={`
                  ${fieldValidation.notes.status === 'excellent' ? 'text-green-600' : ''}
                  ${fieldValidation.notes.status === 'good' ? 'text-blue-600' : ''}
                  ${fieldValidation.notes.status === 'warning' ? 'text-amber-600' : ''}
                `}>
                  {fieldValidation.notes.message}
                </span>
              </p>
            )}
          </div>

          {/* Campo Fecha mejorado */}
          <div className="group">
            <label className={labelClasses}>
              <CalendarCheck2 className="inline w-4 h-4 mr-2" />
              Fecha y hora del registro
            </label>
            <div className="flex items-center gap-4 bg-gradient-to-r from-green-50 via-teal-50 to-emerald-50 border-2 border-cns/20 rounded-xl p-4">
              <CalendarCheck2 className="text-cns animate-pulse" size={28} />
              <span className="text-gray-700 font-bold text-xl">{formData.date}</span>
              <div className="ml-auto flex items-center gap-2 text-sm text-cns">
                <Clock className="w-4 h-4" />
                <span>En tiempo real</span>
              </div>
            </div>
          </div>

          {/* Botón de envío revolucionario con AISANA - 🔧 Modificado para modo asistido */}
          <div className="pt-8">
            <button
              type="submit"
              disabled={isSubmitting || !getUserId() || !isAisanaReady}
              className={`group w-full relative overflow-hidden rounded-2xl font-bold py-6 px-8 text-white text-xl tracking-wide transition-all duration-500 transform ${
                isSubmitting || !getUserId() || !isAisanaReady
                  ? 'bg-gray-400 cursor-not-allowed scale-95' 
                  : 'bg-gradient-to-r from-purple-600 via-teal-600 to-green-700 hover:shadow-2xl hover:shadow-purple-500/40 hover:scale-[1.02] active:scale-[0.98] shadow-xl'
              }`}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent animate-shimmer"></div>
              
              <div className="absolute inset-0 opacity-20">
                <div className="absolute top-3 left-1/4 w-12 h-0.5 bg-white animate-pulse"></div>
                <div className="absolute bottom-3 right-1/4 w-8 h-0.5 bg-white animate-pulse delay-500"></div>
                <div className="absolute top-1/2 left-4 w-6 h-0.5 bg-white animate-pulse delay-1000"></div>
                <div className="absolute top-1/2 right-4 w-6 h-0.5 bg-white animate-pulse delay-1500"></div>
                <div className="absolute top-2 right-8 w-4 h-0.5 bg-white transform rotate-45 animate-pulse delay-300"></div>
                <div className="absolute bottom-2 left-8 w-4 h-0.5 bg-white transform -rotate-45 animate-pulse delay-700"></div>
              </div>

              <div className="relative z-10 flex items-center justify-center gap-4">
                {isSubmitting ? (
                  <>
                    <div className="relative">
                      <Bot className="w-8 h-8 animate-pulse" />
                      <div className="absolute inset-0 w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    </div>
                    <span className="text-xl">
                      {isAssistantMode ? 'AISANA analizando paciente asistido...' : 'AISANA analizando con signos vitales...'}
                    </span>
                  </>
                ) : !getUserId() ? (
                  <>
                    <User className="w-6 h-6" />
                    <span>{isAssistantMode ? 'Esperando selección de paciente...' : 'Esperando usuario...'}</span>
                  </>
                ) : !isAisanaReady ? (
                  <>
                    <Bot className="w-6 h-6 animate-pulse" />
                    <span>Inicializando AISANA...</span>
                  </>
                ) : (
                  <>
                    <Bot className="w-7 h-7 group-hover:animate-pulse transition-transform duration-500" />
                    <span>
                      {isAssistantMode ? 'Iniciar Análisis AISANA Asistido' : 'Iniciar Análisis AISANA Completo'}
                    </span>
                    <Activity className="w-7 h-7 group-hover:scale-110 transition-transform duration-300" />
                  </>
                )}
              </div>

              {isSubmitting && (
                <div className="absolute bottom-0 left-0 h-1 bg-white/30 w-full">
                  <div className="h-1 bg-gradient-to-r from-purple-300 via-teal-300 to-green-300 animate-pulse" style={{width: '80%'}}></div>
                </div>
              )}
            </button>

            <div className="mt-4 text-center">
              <p className="text-sm text-gray-600 flex items-center justify-center gap-2">
                <Shield className="w-4 h-4" />
                <span>Análisis seguro y confidencial</span>
                <span>•</span>
                <span>Protocolo Manchester</span>
                <Lock className="w-4 h-4 text-green-600" />
              </p>
              {isAisanaReady && (
                <div className="text-xs text-purple-700 mt-2 flex items-center justify-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="font-medium">
                    {isAssistantMode 
                      ? 'AISANA lista para triaje asistido con signos vitales'
                      : 'AISANA lista para diagnóstico inteligente con signos vitales'
                    }
                  </span>
                  <Activity className="w-4 h-4" />
                </div>
              )}
            </div>
          </div>
        </form>
        )}
      </div>
    )}

    <SuccessModal />

    <div className="mt-8 text-center">
      <div className="inline-flex items-center gap-3 px-8 py-4 bg-white/60 backdrop-blur-sm rounded-full border-2 border-purple-200 shadow-lg">
        <Bot className="w-6 h-6 text-purple-600" />
        <span className="text-sm text-gray-700">
          Potenciado por <span className="font-bold text-purple-700">IBM Watson</span>
          {/* 🆕 Indicador de modo asistido */}
          {isAssistantMode && (
            <>
              <span className="mx-2">•</span>
              <span className="font-bold text-emerald-700">Modo Asistido</span>
            </>
          )}
        </span>
        <Zap className="w-5 h-5 text-teal-500" />
      </div>
    </div>
  </div>

  <style>{`
    @keyframes shimmer {
      0% { transform: translateX(-100%); }
      100% { transform: translateX(100%); }
    }
    
    @keyframes float {
      0%, 100% { transform: translateY(0px); }
      50% { transform: translateY(-10px); }
    }
    
    @keyframes glow {
      0%, 100% { box-shadow: 0 0 5px rgba(1, 71, 64, 0.2); }
      50% { box-shadow: 0 0 20px rgba(1, 71, 64, 0.4); }
    }

    @keyframes aisana-pulse {
      0%, 100% {
        opacity: 1;
        transform: scale(1);
        box-shadow: 0 0 0 0 rgba(147, 51, 234, 0.7);
      }
      50% {
        opacity: 0.9;
        transform: scale(1.05);
        box-shadow: 0 0 0 10px rgba(147, 51, 234, 0);
      }
    }

    @keyframes circuit-flow {
      0% { transform: translateX(-100%) scaleX(0); }
      50% { transform: translateX(0%) scaleX(1); }
      100% { transform: translateX(100%) scaleX(0); }
    }

    .animate-shimmer {
      animation: shimmer 3s infinite;
    }
    
    .animate-float {
      animation: float 3s ease-in-out infinite;
    }
    
    .animate-glow {
      animation: glow 2s ease-in-out infinite;
    }

    .animate-aisana-pulse {
      animation: aisana-pulse 2s infinite;
    }

    .animate-circuit-flow {
      animation: circuit-flow 4s ease-in-out infinite;
    }
    
    .text-cns {
      color: #014740;
    }
    
    .bg-cns {
      background-color: #014740;
    }
    
    .border-cns {
      border-color: #014740;
    }
    
    .shadow-cns\/20 {
      box-shadow: 0 10px 15px -3px rgba(1, 71, 64, 0.2);
    }
    
    .shadow-cns\/30 {
      box-shadow: 0 25px 50px -12px rgba(1, 71, 64, 0.3);
    }
    
    .shadow-cns\/40 {
      box-shadow: 0 25px 50px -12px rgba(1, 71, 64, 0.4);
    }

    .shadow-purple-500\/40 {
      box-shadow: 0 25px 50px -12px rgba(147, 51, 234, 0.4);
    }
    
    .group:focus-within .group-focus\\:scale-105 {
      transform: scale(1.05);
    }
    
    .group {
      animation: fadeInUp 0.6s ease-out forwards;
    }
    
    .group:nth-child(1) { animation-delay: 0.1s; opacity: 0; }
    .group:nth-child(2) { animation-delay: 0.2s; opacity: 0; }
    .group:nth-child(3) { animation-delay: 0.3s; opacity: 0; }
    .group:nth-child(4) { animation-delay: 0.4s; opacity: 0; }
    .group:nth-child(5) { animation-delay: 0.5s; opacity: 0; }
    .group:nth-child(6) { animation-delay: 0.6s; opacity: 0; }
    .group:nth-child(7) { animation-delay: 0.7s; opacity: 0; }
    .group:nth-child(8) { animation-delay: 0.8s; opacity: 0; }
    .group:nth-child(9) { animation-delay: 0.9s; opacity: 0; }
    
    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(30px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    input:hover, textarea:hover {
      transform: translateY(-1px);
      transition: transform 0.2s ease;
    }
    
    .aisana-pulse {
      animation: aisana-pulse 2s infinite;
    }
    
    .confidence-bar {
      background: linear-gradient(90deg, #9333ea, #14b8a6, #22c55e);
      background-size: 200% 100%;
      animation: confidence-flow 3s ease-in-out infinite;
    }
    
    @keyframes confidence-flow {
      0%, 100% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
    }

    .tech-circuit {
      position: relative;
      overflow: hidden;
    }

    .tech-circuit::before {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(147, 51, 234, 0.3), transparent);
      animation: circuit-sweep 3s infinite;
    }

    @keyframes circuit-sweep {
      0% { left: -100%; }
      100% { left: 100%; }
    }

    .bg-gradient-aisana {
      background: linear-gradient(135deg, #9333ea, #14b8a6, #22c55e);
    }

    .text-gradient-aisana {
      background: linear-gradient(135deg, #9333ea, #14b8a6, #22c55e);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .transition-all-smooth {
      transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .glow-aisana {
      box-shadow: 0 0 20px rgba(147, 51, 234, 0.3);
      transition: box-shadow 0.3s ease;
    }

    .glow-aisana:hover {
      box-shadow: 0 0 30px rgba(147, 51, 234, 0.5);
    }

    @keyframes typing {
      from { width: 0; }
      to { width: 100%; }
    }

    .typing-effect {
      overflow: hidden;
      white-space: nowrap;
      animation: typing 2s steps(40, end);
    }

    .particle-float {
      animation: particle-float 6s ease-in-out infinite;
    }

    @keyframes particle-float {
      0%, 100% { 
        transform: translateY(0px) rotate(0deg);
        opacity: 0.7;
      }
      25% { 
        transform: translateY(-10px) rotate(90deg);
        opacity: 1;
      }
      50% { 
        transform: translateY(-5px) rotate(180deg);
        opacity: 0.8;
      }
      75% { 
        transform: translateY(-15px) rotate(270deg);
        opacity: 0.9;
      }
    }

    .loading-dots::after {
      content: '';
      animation: loading-dots 1.5s infinite;
    }

    @keyframes loading-dots {
      0%, 20% { content: '.'; }
      40% { content: '..'; }
      60%, 100% { content: '...'; }
    }

    .smooth-scroll {
      scroll-behavior: smooth;
    }

    .glass-effect {
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.2);
    }

    .success-bounce {
      animation: success-bounce 0.6s ease-out;
    }

    @keyframes success-bounce {
      0% { transform: scale(0.3); opacity: 0; }
      50% { transform: scale(1.05); opacity: 0.8; }
      70% { transform: scale(0.9); opacity: 0.9; }
      100% { transform: scale(1); opacity: 1; }
    }

    .animate-progress-bar {
      animation: progress-bar 4s linear;
    }

    @keyframes progress-bar {
      0% { width: 100%; }
      100% { width: 0%; }
    }

    .btn-hover-effect {
      position: relative;
      overflow: hidden;
    }

    .btn-hover-effect::before {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
      transition: left 0.5s ease;
    }

    .btn-hover-effect:hover::before {
      left: 100%;
    }
  `}</style>
</div>
);
};

export default SymptomForm;