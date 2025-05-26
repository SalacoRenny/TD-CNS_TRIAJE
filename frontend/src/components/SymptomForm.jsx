import { useState, useEffect } from "react";
import { postSymptomRecord } from "../services/api";
import { Thermometer, CalendarCheck2 } from "lucide-react";
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
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-2xl mx-auto font-sans space-y-6 animate-fade-in"
    >
      <h2 className="text-2xl font-bold text-cns border-b pb-2">
        Registro de Síntomas
      </h2>

      <div>
        <label className="block mb-1 text-cns font-semibold">
          Código del asegurado
        </label>
        <input
          type="text"
          value={user?.id || "No disponible"}
          disabled
          className="w-full px-4 py-2 rounded-lg border border-gray-300 bg-gray-100 cursor-not-allowed"
        />
      </div>

      <div>
        <label className="block mb-1 text-cns font-semibold">
          Síntomas actuales
        </label>
        <input
          type="text"
          name="symptoms"
          value={formData.symptoms}
          onChange={handleChange}
          className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-cns focus:outline-none"
          placeholder="Ej: fiebre, tos, dolor de cabeza"
          required
        />
      </div>

      <div>
        <label className="block mb-1 text-cns font-semibold">
          Enfermedades preexistentes
        </label>
        <input
          type="text"
          name="baseConditions"
          value={formData.baseConditions}
          onChange={handleChange}
          className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-cns focus:outline-none"
          placeholder="Ej: hipertensión, asma"
        />
      </div>

      <div>
        <label className="block mb-1 text-cns font-semibold">
          Temperatura corporal (°C)
        </label>
        <div className="relative">
          <input
            type="number"
            step="0.1"
            name="temperature"
            value={formData.temperature}
            onChange={handleChange}
            className="w-full px-4 py-2 pl-10 rounded-lg border border-gray-300 focus:ring-2 focus:ring-cns focus:outline-none"
            placeholder="Ej: 38.2"
          />
          <Thermometer className="absolute top-2.5 left-2 text-cns" size={20} />
        </div>
      </div>

      <div>
        <label className="block mb-1 text-cns font-semibold">
          Notas adicionales
        </label>
        <textarea
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          rows={4}
          className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-cns focus:outline-none"
          placeholder="Ej: Inició hace 2 días, no ha tomado medicación..."
        />
      </div>

      <div>
        <label className="block mb-1 text-cns font-semibold">
          Fecha y hora del registro
        </label>
        <div className="flex items-center gap-2">
          <CalendarCheck2 className="text-cns" size={20} />
          <span className="text-gray-700">{formData.date}</span>
        </div>
      </div>

      <div className="text-right">
        <button
          type="submit"
          className="bg-cns text-white px-6 py-2 rounded-full font-semibold hover:bg-[#002b4a] transition"
        >
          Enviar registro
        </button>
      </div>
    </form>
  );
};

export default SymptomForm;
