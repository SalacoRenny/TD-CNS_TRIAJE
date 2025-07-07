import { useState, useEffect } from "react";
import { postSymptomRecord } from "../services/api";
import { 
  Thermometer, CalendarCheck2, User, Activity, Heart, FileText, Send, CheckCircle, 
  Brain, Zap, Clock, Sparkles, Shield, Target, Eye, AlertTriangle, Info 
} from "lucide-react";
import { useUser } from "../context/UserContext";

const SymptomForm = () => {
  const { user } = useUser();
  console.log("🟩 Usuario activo en RegisterSymptoms:", user);

  const [formData, setFormData] = useState({
    symptoms: "",
    baseConditions: "",
    notes: "",
    temperature: "",
    date: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const [watsonResult, setWatsonResult] = useState(null);
  const [showWatsonResult, setShowWatsonResult] = useState(false);
  const [processingStep, setProcessingStep] = useState('');

  // 🆕 NUEVO: Estados para animaciones y validaciones
  const [fieldValidation, setFieldValidation] = useState({});
  const [isWatsonReady, setIsWatsonReady] = useState(false);

  useEffect(() => {
    const now = new Date();
    const formatted = now.toLocaleString("es-BO", {
      dateStyle: "short",
      timeStyle: "short",
    });
    setFormData((prev) => ({ ...prev, date: formatted }));
    
    // Simular preparación de Watson
    setTimeout(() => setIsWatsonReady(true), 1000);
  }, []);

  // 🧠 Validación inteligente en tiempo real
  useEffect(() => {
    const validation = {};
    
    // Validar síntomas (campo crítico para Watson)
    if (formData.symptoms.length > 0) {
      if (formData.symptoms.length < 10) {
        validation.symptoms = { status: 'warning', message: 'Agrega más detalles para mejor análisis IA' };
      } else if (formData.symptoms.length >= 20) {
        validation.symptoms = { status: 'excellent', message: 'Excelente descripción para Watson IA' };
      } else {
        validation.symptoms = { status: 'good', message: 'Buena descripción' };
      }
    }

    // Validar notas (campo crítico para Watson)
    if (formData.notes.length > 0) {
      if (formData.notes.length < 15) {
        validation.notes = { status: 'warning', message: 'Watson necesita más contexto' };
      } else if (formData.notes.length >= 50) {
        validation.notes = { status: 'excellent', message: 'Contexto perfecto para análisis IA' };
      } else {
        validation.notes = { status: 'good', message: 'Buen contexto' };
      }
    }

    // Validar temperatura
    if (formData.temperature) {
      const temp = parseFloat(formData.temperature);
      if (temp > 39) {
        validation.temperature = { status: 'urgent', message: 'Temperatura alta - análisis prioritario' };
      } else if (temp > 37.5) {
        validation.temperature = { status: 'warning', message: 'Fiebre detectada' };
      } else {
        validation.temperature = { status: 'normal', message: 'Temperatura normal' };
      }
    }

    setFieldValidation(validation);
  }, [formData]);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setWatsonResult(null);
    setShowWatsonResult(false);

    const userId = getUserId();
    if (!userId) {
      alert("❌ Error: No se pudo obtener la información del usuario. Por favor, inicia sesión nuevamente.");
      console.error("🚫 Usuario sin ID válido:", user);
      setIsSubmitting(false);
      return;
    }

    const payload = {
      userId: userId,
      symptoms: formData.symptoms.split(",").map((s) => s.trim()),
      baseConditions: formData.baseConditions.split(",").map((c) => c.trim()),
      notes: formData.notes.trim(),
      temperature: formData.temperature.trim(),
      timestamp: formData.date,
    };

    console.log("📋 Payload a enviar:", payload);

    try {
      setProcessingStep('🧠 Inicializando Watson IA...');
      await new Promise(resolve => setTimeout(resolve, 800));
      
      setProcessingStep('🔍 Analizando síntomas...');
      await new Promise(resolve => setTimeout(resolve, 600));
      
      setProcessingStep('⚕️ Aplicando protocolo Manchester...');
      
      const response = await postSymptomRecord(payload);
      console.log("✅ Respuesta completa del servidor:", response.data);
      
      if (response.data.classification && response.data.watson_info) {
        setWatsonResult({
          classification: response.data.classification,
          method: response.data.classification.method,
          watson_info: response.data.watson_info,
          session_info: response.data.session_info,
          fallback_reason: response.data.fallback_reason
        });
        setShowWatsonResult(true);
      }

      alert("✅ Análisis completado exitosamente");
      
      setFormData({
        symptoms: "",
        baseConditions: "",
        notes: "",
        temperature: "",
        date: new Date().toLocaleString("es-BO", {
          dateStyle: "short",
          timeStyle: "short",
        }),
      });

    } catch (error) {
      console.error("❌ Error al enviar el registro:", error);
      alert("Ocurrió un error al enviar los síntomas.");
    } finally {
      setIsSubmitting(false);
      setProcessingStep('');
    }
  };

  // 🎨 Clases dinámicas mejoradas con validación
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

  const getUserDisplayValue = () => {
    if (user === null) return "Cargando...";
    if (user === undefined) return "Error de sesión";
    
    const possibleIds = [user.id, user._id, user.userId, user.codigo, user.codigoAsegurado, user.username, user.email];
    const foundId = possibleIds.find(id => id && id !== "");
    
    if (!foundId) return "Sin código asignado";
    return foundId;
  };

  const getUserId = () => {
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

  // 🎯 Componente para indicadores de validación
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50 to-green-100 p-6 flex items-center justify-center">
      {/* Partículas flotantes animadas */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-2 h-2 bg-cns/20 rounded-full animate-ping delay-300"></div>
        <div className="absolute top-40 right-32 w-1 h-1 bg-teal-400/30 rounded-full animate-pulse delay-700"></div>
        <div className="absolute bottom-32 left-1/4 w-3 h-3 bg-green-300/20 rounded-full animate-bounce delay-1000"></div>
        <div className="absolute top-1/3 right-20 w-2 h-2 bg-cns/15 rounded-full animate-ping delay-1500"></div>
      </div>

      <div className="relative w-full max-w-5xl">
        {/* Efectos de fondo mejorados */}
        <div className="absolute -top-6 -left-6 w-80 h-80 bg-gradient-to-r from-cns/10 to-teal-300/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-6 -right-6 w-96 h-96 bg-gradient-to-l from-green-400/10 to-emerald-300/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        
        {/* Watson IA Status Banner */}
        <div className="mb-6 p-4 bg-gradient-to-r from-cns/5 via-teal-50 to-green-50 border border-cns/20 rounded-2xl backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Brain className="w-8 h-8 text-cns" />
                <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ${isWatsonReady ? 'bg-green-400 animate-pulse' : 'bg-amber-400 animate-spin'}`}></div>
              </div>
              <div>
                <h3 className="font-bold text-cns">Sistema Watson IA Activo</h3>
                <p className="text-sm text-gray-600">
                  {isWatsonReady ? 'Listo para análisis inteligente' : 'Inicializando sistema...'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-cns">
              <Shield className="w-4 h-4" />
              <span className="font-medium">Protocolo Manchester</span>
            </div>
          </div>
        </div>
        
        <form
          onSubmit={handleSubmit}
          className="relative bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/30 p-10 w-full mx-auto font-sans space-y-8 transform hover:scale-[1.005] transition-all duration-500"
        >
          {/* Header mejorado con efectos Watson */}
          <div className="text-center relative overflow-hidden rounded-2xl bg-gradient-to-r from-cns via-teal-600 to-green-700 p-8 -m-10 mb-10">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer"></div>
            
            {/* Efectos de circuitos */}
            <div className="absolute top-0 left-0 w-full h-full opacity-10">
              <div className="absolute top-2 left-4 w-16 h-0.5 bg-white transform rotate-45"></div>
              <div className="absolute top-4 right-8 w-12 h-0.5 bg-white transform -rotate-45"></div>
              <div className="absolute bottom-2 left-1/3 w-8 h-0.5 bg-white"></div>
              <div className="absolute bottom-4 right-1/4 w-10 h-0.5 bg-white transform rotate-12"></div>
            </div>

            <div className="relative z-10">
              <div className="flex items-center justify-center gap-4 mb-4">
                <Sparkles className="w-8 h-8 text-white animate-pulse" />
                <h2 className="text-4xl font-bold text-white tracking-wide">
                  Análisis Médico IA
                </h2>
                <Brain className="w-8 h-8 text-white animate-pulse delay-300" />
              </div>
              <p className="text-white/90 text-lg">Powered by IBM Watson • Protocolo Manchester</p>
              <div className="w-32 h-1 bg-gradient-to-r from-transparent via-white/70 to-transparent mx-auto mt-4 rounded-full"></div>
            </div>
            
            {/* Indicador de procesamiento mejorado */}
            {(isSubmitting || processingStep) && (
              <div className="mt-6 p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
                <div className="flex items-center justify-center gap-3 text-white">
                  <div className="relative">
                    <Brain className="w-6 h-6 animate-pulse" />
                    <div className="absolute inset-0 w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  </div>
                  <span className="text-lg font-medium">
                    {processingStep || 'Procesando con Watson IA...'}
                  </span>
                </div>
                <div className="mt-3 w-full bg-white/20 rounded-full h-2">
                  <div className="bg-white h-2 rounded-full animate-pulse" style={{width: '70%'}}></div>
                </div>
              </div>
            )}
          </div>

          {/* Campo de Usuario mejorado */}
          <div className="group">
            <label className={labelClasses}>
              <User className="inline w-4 h-4 mr-2" />
              Código del asegurado
            </label>
            <div className="relative">
              <input
                type="text"
                value={getUserDisplayValue()}
                disabled
                className="w-full px-4 py-3 pl-12 pr-12 rounded-xl border-2 border-cns/30 bg-gradient-to-br from-green-50 to-teal-50 cursor-not-allowed text-gray-700 font-mono text-lg"
              />
              <User className="absolute top-3 left-3 text-cns" size={22} />
              <CheckCircle className="absolute top-3 right-3 text-green-500" size={22} />
            </div>
          </div>

          {/* Campo Síntomas - CRÍTICO PARA WATSON */}
          <div className="group">
            <label className={labelClasses}>
              <Activity className="inline w-4 h-4 mr-2" />
              Síntomas actuales
              <span className="ml-2 px-2 py-1 bg-cns/10 text-cns text-xs rounded-full">
                <Brain className="inline w-3 h-3 mr-1" />
                Crítico para IA
              </span>
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

          {/* Campo Enfermedades Preexistentes */}
          <div className="group">
            <label className={labelClasses}>
              <Heart className="inline w-4 h-4 mr-2" />
              Enfermedades preexistentes
            </label>
            <div className="relative">
              <input
                type="text"
                name="baseConditions"
                value={formData.baseConditions}
                onChange={handleChange}
                onFocus={() => setFocusedField('baseConditions')}
                onBlur={() => setFocusedField(null)}
                className={getInputClasses('baseConditions')}
                placeholder="Ej: hipertensión, diabetes, asma, alergias"
              />
              <Heart className={`absolute top-3 left-3 transition-colors duration-300 ${
                focusedField === 'baseConditions' ? 'text-cns' : 'text-gray-400'
              }`} size={20} />
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

          {/* Campo Notas - CRÍTICO PARA WATSON */}
          <div className="group">
            <label className={labelClasses}>
              <FileText className="inline w-4 h-4 mr-2" />
              Contexto detallado
              <span className="ml-2 px-2 py-1 bg-cns/10 text-cns text-xs rounded-full">
                <Brain className="inline w-3 h-3 mr-1" />
                Crítico para IA
              </span>
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

          {/* Resultado Watson mejorado */}
          {showWatsonResult && watsonResult && (
            <div className="mt-10 p-8 bg-gradient-to-br from-green-50 via-teal-50 to-emerald-50 border-2 border-cns/30 rounded-3xl shadow-xl">
              <div className="flex items-center gap-4 mb-6">
                <div className="relative">
                  <Brain className="w-10 h-10 text-cns" />
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full animate-pulse"></div>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-cns">Diagnóstico Watson IA</h3>
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <Zap className="w-4 h-4" />
                    <span className="font-medium">
                      {watsonResult.method === 'watson' ? 'Análisis Watson IA Completo' : 'Clasificación de Respaldo'}
                    </span>
                    <div className="flex items-center gap-1">
                      <Shield className="w-4 h-4" />
                      <span>Protocolo Manchester</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Clasificación principal */}
                <div 
                  className="p-6 rounded-2xl border-2 shadow-lg"
                  style={{
                    backgroundColor: getUrgencyColor(watsonResult.classification.level).bg,
                    borderColor: getUrgencyColor(watsonResult.classification.level).border
                  }}
                >
                  <div className="flex items-center justify-between mb-4">
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
                  <p className="text-gray-600 mb-2 text-lg">{watsonResult.classification.label}</p>
                  <p className="font-bold text-cns text-xl">{watsonResult.classification.specialty}</p>
                  
                  {watsonResult.classification.level <= 2 && (
                    <div className="mt-4 p-3 bg-red-100 border border-red-300 rounded-lg">
                      <div className="flex items-center gap-2 text-red-700">
                        <AlertTriangle className="w-5 h-5" />
                        <span className="font-bold">Atención Prioritaria Requerida</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Información técnica */}
                <div className="p-6 bg-white/70 backdrop-blur-sm rounded-2xl border-2 border-gray-200 shadow-lg">
                  <div className="flex items-center gap-2 mb-4">
                    <Clock className="w-5 h-5 text-gray-500" />
                    <span className="font-bold text-gray-700 text-lg">Información del Análisis</span>
                  </div>
                  
                  {watsonResult.session_info?.is_follow_up && (
                    <div className="flex items-center gap-2 text-blue-600 mb-3 p-2 bg-blue-50 rounded-lg">
                      <Eye className="w-4 h-4" />
                      <span className="font-medium">Consulta de seguimiento detectada</span>
                    </div>
                  )}
                  
                  <div className="space-y-2 text-gray-600">
                    <p className="flex justify-between">
                      <span>Tiempo de procesamiento:</span>
                      <span className="font-bold">{watsonResult.classification.processing_time_ms}ms</span>
                    </p>
                    
                    {watsonResult.watson_info && (
                      <p className="flex justify-between">
                        <span>Tokens utilizados:</span>
                        <span className="font-bold">{watsonResult.watson_info.tokens_used}</span>
                      </p>
                    )}
                    
                    <p className="flex justify-between">
                      <span>Modelo IA:</span>
                      <span className="font-bold">Watson llama-3.3-70b</span>
                    </p>
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

              {/* Barra de confianza mejorada */}
              <div className="mt-6 p-4 bg-white/50 backdrop-blur-sm rounded-xl border border-gray-200">
                <div className="flex justify-between items-center mb-3">
                  <span className="font-bold text-gray-700">Confianza del Diagnóstico</span>
                  <span className="text-2xl font-bold text-cns">
                    {Math.round((watsonResult.classification.confidence || 0.8) * 100)}%
                  </span>
                </div>
                <div className="relative w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-cns via-teal-500 to-green-500 h-4 rounded-full transition-all duration-2000 ease-out shadow-lg"
                    style={{ 
                      width: `${Math.round((watsonResult.classification.confidence || 0.8) * 100)}%`,
                      boxShadow: '0 0 10px rgba(1, 71, 64, 0.3)'
                    }}
                  ></div>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
                </div>
                <p className="text-sm text-gray-600 mt-2 text-center">
                  Basado en análisis de síntomas, contexto histórico y protocolos médicos
                </p>
              </div>

              {/* Recomendaciones adicionales */}
              <div className="mt-6 p-4 bg-gradient-to-r from-cns/5 to-teal-50 rounded-xl border border-cns/20">
                <h4 className="font-bold text-cns mb-2">Recomendaciones del Sistema:</h4>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• Conservar este diagnóstico para el personal médico</li>
                  <li>• Mencionar todos los síntomas descritos durante la consulta</li>
                  {watsonResult.classification.level <= 2 && (
                    <li className="text-red-600 font-bold">• Buscar atención médica inmediata</li>
                  )}
                  {watsonResult.session_info?.is_follow_up && (
                    <li className="text-blue-600">• Informar sobre la evolución desde la consulta anterior</li>
                  )}
                </ul>
              </div>
            </div>
          )}

          {/* Botón de envío revolucionario */}
          <div className="pt-8">
            <button
              type="submit"
              disabled={isSubmitting || !getUserId() || !isWatsonReady}
              className={`group w-full relative overflow-hidden rounded-2xl font-bold py-6 px-8 text-white text-xl tracking-wide transition-all duration-500 transform ${
                isSubmitting || !getUserId() || !isWatsonReady
                  ? 'bg-gray-400 cursor-not-allowed scale-95' 
                  : 'bg-gradient-to-r from-cns via-teal-600 to-green-700 hover:shadow-2xl hover:shadow-cns/40 hover:scale-[1.02] active:scale-[0.98] shadow-xl'
              }`}
            >
              {/* Efectos de fondo animados */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer"></div>
              
              {/* Circuitos animados */}
              <div className="absolute inset-0 opacity-20">
                <div className="absolute top-2 left-1/4 w-8 h-0.5 bg-white animate-pulse"></div>
                <div className="absolute bottom-2 right-1/4 w-6 h-0.5 bg-white animate-pulse delay-500"></div>
                <div className="absolute top-1/2 left-2 w-4 h-0.5 bg-white animate-pulse delay-1000"></div>
                <div className="absolute top-1/2 right-2 w-4 h-0.5 bg-white animate-pulse delay-1500"></div>
              </div>

              <div className="relative z-10 flex items-center justify-center gap-4">
                {isSubmitting ? (
                  <>
                    <div className="relative">
                      <Brain className="w-7 h-7 animate-pulse" />
                      <div className="absolute inset-0 w-7 h-7 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    </div>
                    <span className="text-xl">Analizando con IA...</span>
                  </>
                ) : !getUserId() ? (
                  <>
                    <User className="w-6 h-6" />
                    <span>Esperando usuario...</span>
                  </>
                ) : !isWatsonReady ? (
                  <>
                    <Brain className="w-6 h-6 animate-pulse" />
                    <span>Inicializando Watson...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-6 h-6 group-hover:animate-spin transition-transform duration-500" />
                    <span>Iniciar Análisis Watson IA</span>
                    <Brain className="w-6 h-6 group-hover:scale-110 transition-transform duration-300" />
                  </>
                )}
              </div>

              {/* Barra de progreso cuando está enviando */}
              {isSubmitting && (
                <div className="absolute bottom-0 left-0 h-1 bg-white/30 w-full">
                  <div className="h-1 bg-white animate-pulse" style={{width: '70%'}}></div>
                </div>
              )}
            </button>

            {/* Información adicional del botón */}
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-600">
                <Shield className="inline w-4 h-4 mr-1" />
                Análisis seguro y confidencial • Protocolo Manchester
              </p>
              {isWatsonReady && (
                <p className="text-xs text-cns mt-1 flex items-center justify-center gap-1">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  Watson IA listo para diagnóstico inteligente
                </p>
              )}
            </div>
          </div>
        </form>

        {/* Footer con información Watson */}
        <div className="mt-8 text-center">
          <div className="inline-flex items-center gap-3 px-6 py-3 bg-white/50 backdrop-blur-sm rounded-full border border-cns/20">
            <Brain className="w-5 h-5 text-cns" />
            <span className="text-sm text-gray-700">
              Potenciado por <span className="font-bold text-cns">IBM Watson IA</span>
            </span>
            <Zap className="w-4 h-4 text-teal-500" />
            <span className="text-xs text-gray-500">v4.0 • llama-3.3-70b</span>
          </div>
        </div>
      </div>

      {/* Estilos CSS mejorados */}
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

        .animate-shimmer {
          animation: shimmer 3s infinite;
        }
        
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        
        .animate-glow {
          animation: glow 2s ease-in-out infinite;
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
        
        /* Efectos de enfoque mejorados */
        .group:focus-within .group-focus\\:scale-105 {
          transform: scale(1.05);
        }
        
        /* Animaciones de entrada */
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
        
        /* Hover effects para inputs */
        input:hover, textarea:hover {
          transform: translateY(-1px);
          transition: transform 0.2s ease;
        }
        
        /* Efectos de Watson */
        .watson-pulse {
          animation: watson-pulse 2s infinite;
        }
        
        @keyframes watson-pulse {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.8;
            transform: scale(1.05);
          }
        }
      `}</style>
    </div>
  );
};

export default SymptomForm;