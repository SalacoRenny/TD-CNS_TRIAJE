import { useState, useEffect } from "react";
import { postSymptomRecord } from "../services/api";
import { Thermometer, CalendarCheck2, User, Activity, Heart, FileText, Send, CheckCircle } from "lucide-react";
import { useUser } from "../context/UserContext";

const SymptomForm = () => {
  // Usando el contexto real del usuario como en el código original
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

  useEffect(() => {
    const now = new Date();
    const formatted = now.toLocaleString("es-BO", {
      dateStyle: "short",
      timeStyle: "short",
    });
    setFormData((prev) => ({ ...prev, date: formatted }));
  }, []);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Usando la función real de la API como en el código original
    const payload = {
      userId: user?.id, // ✅ Se usa el ID del usuario logueado
      symptoms: formData.symptoms.split(",").map((s) => s.trim()),
      baseConditions: formData.baseConditions.split(",").map((c) => c.trim()),
      notes: formData.notes.trim(),
      temperature: formData.temperature.trim(),
      timestamp: formData.date,
    };

    try {
      const response = await postSymptomRecord(payload);
      alert("✅ Registro enviado correctamente");
      console.log("Respuesta del servidor:", response.data);
      
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
    }
  };

  const inputClasses = (fieldName) => `
    w-full px-4 py-3 pl-12 rounded-xl border-2 transition-all duration-300 ease-in-out
    ${focusedField === fieldName 
      ? 'border-cns shadow-lg shadow-cns/20 bg-gradient-to-br from-green-50 to-teal-50' 
      : 'border-gray-200 hover:border-gray-300'
    }
    focus:ring-0 focus:outline-none placeholder-gray-400
    backdrop-blur-sm bg-white/80
  `;

  const labelClasses = "block mb-2 text-cns font-bold text-sm uppercase tracking-wide";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50 to-green-100 p-6 flex items-center justify-center">
      <div className="relative w-full max-w-4xl">
        {/* Decorative background elements */}
        <div className="absolute -top-4 -left-4 w-72 h-72 bg-cns/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-4 -right-4 w-96 h-96 bg-teal-300/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        
        <form
          onSubmit={handleSubmit}
          className="relative bg-white/70 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-10 w-full mx-auto font-sans space-y-8 transform hover:scale-[1.01] transition-all duration-500"
        >
          {/* Header with animated gradient */}
          <div className="text-center relative overflow-hidden rounded-2xl bg-gradient-to-r from-cns via-teal-600 to-green-700 p-6 -m-10 mb-8">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer"></div>
            <h2 className="text-3xl font-bold text-white relative z-10 tracking-wide">
              Registro de Síntomas
            </h2>
            <div className="w-24 h-1 bg-white/50 mx-auto mt-3 rounded-full"></div>
          </div>

          {/* User ID Field */}
          <div className="group">
            <label className={labelClasses}>
              Código del asegurado
            </label>
            <div className="relative">
              <input
                type="text"
                value={user?.id || "No disponible"}
                disabled
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-gradient-to-br from-gray-50 to-gray-100 cursor-not-allowed text-gray-600 font-mono"
              />
            </div>
          </div>

          {/* Symptoms Field */}
          <div className="group">
            <label className={labelClasses}>
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
                className={inputClasses('symptoms')}
                placeholder="Ej: fiebre, tos, dolor de cabeza"
                required
              />
              <Activity className={`absolute top-3 left-3 transition-colors duration-300 ${
                focusedField === 'symptoms' ? 'text-cns' : 'text-gray-400'
              }`} size={20} />
            </div>
          </div>

          {/* Base Conditions Field */}
          <div className="group">
            <label className={labelClasses}>
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
                className={inputClasses('baseConditions')}
                placeholder="Ej: hipertensión, asma"
              />
              <Heart className={`absolute top-3 left-3 transition-colors duration-300 ${
                focusedField === 'baseConditions' ? 'text-cns' : 'text-gray-400'
              }`} size={20} />
            </div>
          </div>

          {/* Temperature Field */}
          <div className="group">
            <label className={labelClasses}>
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
                className={inputClasses('temperature')}
                placeholder="Ej: 38.2"
              />
              <Thermometer className={`absolute top-3 left-3 transition-all duration-300 ${
                focusedField === 'temperature' ? 'text-cns scale-110' : 'text-gray-400'
              }`} size={20} />
              {formData.temperature && (
                <div className={`absolute right-3 top-3 text-sm font-bold ${
                  parseFloat(formData.temperature) > 37.5 ? 'text-red-500' : 'text-green-500'
                }`}>
                  {parseFloat(formData.temperature) > 37.5 ? '🔥' : '✅'}
                </div>
              )}
            </div>
          </div>

          {/* Notes Field */}
          <div className="group">
            <label className={labelClasses}>
              Notas adicionales
            </label>
            <div className="relative">
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                onFocus={() => setFocusedField('notes')}
                onBlur={() => setFocusedField(null)}
                rows={4}
                className={`${inputClasses('notes')} pl-12 min-h-[120px] resize-none`}
                placeholder="Ej: Inició hace 2 días, no ha tomado medicación..."
              />
              <FileText className={`absolute top-3 left-3 transition-colors duration-300 ${
                focusedField === 'notes' ? 'text-cns' : 'text-gray-400'
              }`} size={20} />
            </div>
          </div>

          {/* Date Display */}
          <div className="group">
            <label className={labelClasses}>
              Fecha y hora del registro
            </label>
            <div className="flex items-center gap-3 bg-gradient-to-r from-green-50 to-teal-50 border-2 border-green-200 rounded-xl p-4">
              <CalendarCheck2 className="text-cns animate-pulse" size={24} />
              <span className="text-gray-700 font-semibold text-lg">{formData.date}</span>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-6">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full relative overflow-hidden rounded-2xl font-bold py-4 px-8 text-white text-lg tracking-wide transition-all duration-300 transform ${
                isSubmitting 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-cns via-teal-600 to-green-700 hover:shadow-2xl hover:shadow-cns/30 hover:scale-[1.02] active:scale-[0.98]'
              }`}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer"></div>
              <div className="relative z-10 flex items-center justify-center gap-3">
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send size={20} />
                    Enviar registro
                  </>
                )}
              </div>
            </button>
          </div>
        </form>
      </div>

      <style jsx>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer 3s infinite;
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
        .hover\\:bg-\\[\\#002b4a\\]:hover {
          background-color: #013d36;
        }
      `}</style>
    </div>
  );
};

export default SymptomForm;


//todo lo avanzado es funcional, queda quitar el navbar del inicio de sesión y del registro de sesion, mejorar los elementos del navbar.