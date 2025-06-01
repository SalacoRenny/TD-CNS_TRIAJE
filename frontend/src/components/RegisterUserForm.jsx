import { useState } from "react";
import {
  AiOutlineUser,
  AiOutlineMail,
  AiOutlineIdcard,
  AiOutlineLock,
  AiOutlineEye,
  AiOutlineEyeInvisible,
} from "react-icons/ai";
import { FaUserTag, FaUserPlus } from "react-icons/fa";
import { postUser } from "../services/api";
import enfermeraImage from "../assets/abuela_enfermera.png";

const RegisterUserForm = () => {
  const [formData, setFormData] = useState({
    userId: "",
    name: "",
    email: "",
    ci: "",
    role: "asegurado",
    password: "",
  });

  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setErrors((prev) => ({ ...prev, [e.target.name]: "" }));
    setSuccess(null);
    setError(null);
  };

  const validate = () => {
    const newErrors = {};
    if (!/^\d+$/.test(formData.userId)) newErrors.userId = "Solo números";
    if (!/^[a-zA-Z\s]+$/.test(formData.name)) newErrors.name = "Solo letras";
    if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = "Correo inválido";
    if (!/^\d+$/.test(formData.ci)) newErrors.ci = "Solo números";
    if (formData.password.length < 8) newErrors.password = "Mínimo 8 caracteres";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await postUser({ ...formData, createdAt: new Date().toISOString() });
      setSuccess("✅ Usuario registrado correctamente");
      setFormData({ userId: "", name: "", email: "", ci: "", role: "asegurado", password: "" });
    } catch {
      setError("❌ Error al registrar el usuario");
    } finally {
      setLoading(false);
    }
  };

  const inputFields = [
    { 
      name: "userId", 
      icon: <AiOutlineIdcard className="text-emerald-600 text-xl" />, 
      placeholder: "Código de asegurado", 
      type: "text",
      label: "Código de Asegurado"
    },
    { 
      name: "name", 
      icon: <AiOutlineUser className="text-emerald-600 text-xl" />, 
      placeholder: "Escribe tu nombre completo", 
      type: "text",
      label: "Nombre Completo"
    },
    { 
      name: "email", 
      icon: <AiOutlineMail className="text-emerald-600 text-xl" />, 
      placeholder: "tu@email.com", 
      type: "email",
      label: "Correo Electrónico"
    },
    { 
      name: "ci", 
      icon: <AiOutlineIdcard className="text-emerald-600 text-xl" />, 
      placeholder: "Número de documento", 
      type: "text",
      label: "CI o Documento"
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-emerald-50 flex items-center justify-center px-4 py-8 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-cns/20 to-pastelGreen/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-blue-200/30 to-cns/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-emerald-100/10 to-blue-100/10 rounded-full blur-3xl animate-spin" style={{ animationDuration: '20s' }}></div>
        
        {/* Additional floating elements */}
        <div className="absolute top-1/4 left-1/4 w-4 h-4 bg-emerald-400/30 rounded-full animate-ping"></div>
        <div className="absolute bottom-1/3 right-1/4 w-2 h-2 bg-cns/40 rounded-full animate-ping delay-700"></div>
        <div className="absolute top-3/4 left-3/4 w-3 h-3 bg-pastelGreen/30 rounded-full animate-ping delay-1500"></div>
      </div>

      <div className="relative bg-white/40 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 grid grid-cols-1 lg:grid-cols-2 overflow-hidden w-full max-w-7xl transform hover:scale-[1.005] transition-all duration-700">
        
        {/* Left Side - Image & Branding */}
        <div className="hidden lg:flex flex-col items-center justify-center bg-gradient-to-br from-cns via-pastelGreen to-emerald-400 relative overflow-hidden">
          {/* Decorative Elements */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-black/5"></div>
          <div className="absolute top-8 left-8 w-24 h-24 bg-white/20 rounded-3xl rotate-12 backdrop-blur-sm border border-white/30"></div>
          <div className="absolute bottom-16 right-8 w-20 h-20 bg-white/25 rounded-full backdrop-blur-sm border border-white/40"></div>
          <div className="absolute top-1/4 right-16 w-16 h-16 bg-white/20 rounded-2xl rotate-45 backdrop-blur-sm border border-white/30"></div>
          <div className="absolute bottom-1/3 left-12 w-12 h-12 bg-white/15 rounded-lg rotate-12 backdrop-blur-sm border border-white/25"></div>
          
          {/* Floating particles */}
          <div className="absolute top-1/3 left-1/3 w-2 h-2 bg-white/60 rounded-full animate-ping"></div>
          <div className="absolute bottom-1/4 left-1/2 w-1 h-1 bg-white/40 rounded-full animate-ping delay-500"></div>
          <div className="absolute top-1/2 right-1/4 w-3 h-3 bg-white/30 rounded-full animate-ping delay-1000"></div>
          
          {/* Main Content */}
          <div className="relative z-10 text-center text-white p-8">
            <div className="mb-8 transform hover:scale-110 transition-transform duration-500 group">
              <div className="relative">
                <img
                  src={enfermeraImage}
                  alt="Enfermera"
                  className="w-80 h-80 object-cover rounded-3xl shadow-2xl border-4 border-white/40 group-hover:border-white/60 transition-all duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent rounded-3xl"></div>
              </div>
            </div>
            <h1 className="text-4xl font-bold font-poppins mb-4 text-white drop-shadow-2xl" style={{ textShadow: '2px 2px 8px rgba(0,0,0,0.3), 0 0 20px rgba(0,0,0,0.2)' }}>
              Únete a nosotros
            </h1>
            <p className="text-xl text-white/95 font-medium drop-shadow-lg mb-2" style={{ textShadow: '1px 1px 4px rgba(0,0,0,0.2)' }}>
              Crea tu cuenta en el portal
            </p>
            <p className="text-lg text-white/90 font-normal drop-shadow-md" style={{ textShadow: '1px 1px 3px rgba(0,0,0,0.2)' }}>
              de salud más confiable
            </p>
          </div>
        </div>

        {/* Right Side - Register Form */}
        <div className="bg-white/60 backdrop-blur-md px-8 py-12 lg:px-12 lg:py-16 flex flex-col justify-center relative overflow-y-auto max-h-screen">
          {/* Decorative Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-cns to-emerald-600 rounded-2xl mb-6 shadow-xl border-2 border-white/30 transform hover:rotate-12 transition-transform duration-300">
              <FaUserPlus className="text-white text-2xl drop-shadow-lg" />
            </div>
            <h2 className="text-4xl font-bold font-poppins mb-2" style={{ 
              background: 'linear-gradient(135deg, #4ade80 0%, #059669 50%, #065f46 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.1))'
            }}>
              Registro de Usuario
            </h2>
            <p className="text-gray-600 font-medium">Completa tus datos para comenzar</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Dynamic Input Fields */}
            {inputFields.map(({ name, icon, placeholder, type, label }) => (
              <div key={name} className="group">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {label}
                </label>
                <div className={`relative flex items-center bg-white/80 backdrop-blur-sm rounded-2xl border-2 transition-all duration-300 ${
                  errors[name] 
                    ? "border-red-400 shadow-red-100" 
                    : "border-gray-200 group-focus-within:border-cns group-focus-within:shadow-lg group-focus-within:shadow-cns/20"
                }`}>
                  <div className="absolute left-4 p-2 bg-gradient-to-br from-emerald-50 to-cns/10 rounded-xl">
                    {icon}
                  </div>
                  <input
                    type={type}
                    name={name}
                    placeholder={placeholder}
                    value={formData[name]}
                    onChange={handleChange}
                    className="w-full pl-16 pr-6 py-4 bg-transparent outline-none font-medium placeholder-gray-400"
                  />
                </div>
                {errors[name] && (
                  <p className="text-red-500 text-sm mt-2 flex items-center animate-shake">
                    <span className="w-1 h-1 bg-red-500 rounded-full mr-2"></span>
                    {errors[name]}
                  </p>
                )}
              </div>
            ))}

            {/* Role Selection */}
            <div className="group">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Tipo de Usuario
              </label>
              <div className="relative flex items-center bg-white/80 backdrop-blur-sm rounded-2xl border-2 border-gray-200 group-focus-within:border-cns group-focus-within:shadow-lg group-focus-within:shadow-cns/20 transition-all duration-300">
                <div className="absolute left-4 p-2 bg-gradient-to-br from-emerald-50 to-cns/10 rounded-xl">
                  <FaUserTag className="text-emerald-600 text-xl" />
                </div>
                <select 
                  name="role" 
                  value={formData.role} 
                  onChange={handleChange} 
                  className="w-full pl-16 pr-6 py-4 bg-transparent outline-none font-medium text-gray-700 appearance-none cursor-pointer"
                >
                  <option value="asegurado">Asegurado</option>
                  <option value="personal_medico">Personal Médico</option>
                </select>
                <div className="absolute right-4 pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                  </svg>
                </div>
              </div>
            </div>

            {/* Password Field */}
            <div className="group">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Contraseña
              </label>
              <div className={`relative flex items-center bg-white/80 backdrop-blur-sm rounded-2xl border-2 transition-all duration-300 ${
                errors.password 
                  ? "border-red-400 shadow-red-100" 
                  : "border-gray-200 group-focus-within:border-cns group-focus-within:shadow-lg group-focus-within:shadow-cns/20"
              }`}>
                <div className="absolute left-4 p-2 bg-gradient-to-br from-emerald-50 to-cns/10 rounded-xl">
                  <AiOutlineLock className="text-emerald-600 text-xl" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Mínimo 8 caracteres"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full pl-16 pr-16 py-4 bg-transparent outline-none font-medium placeholder-gray-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 p-2 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors duration-200"
                >
                  {showPassword ? <AiOutlineEyeInvisible className="text-xl" /> : <AiOutlineEye className="text-xl" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-500 text-sm mt-2 flex items-center animate-shake">
                  <span className="w-1 h-1 bg-red-500 rounded-full mr-2"></span>
                  {errors.password}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-emerald-600 via-cns to-emerald-700 text-white font-bold py-4 px-8 rounded-2xl shadow-xl hover:shadow-2xl hover:shadow-emerald-500/40 transform hover:scale-[1.02] transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none relative overflow-hidden group border border-emerald-500/30 mt-6"
            >
              {loading && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
              )}
              <span className="relative z-10 flex items-center justify-center gap-2">
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Registrando...
                  </>
                ) : (
                  <>
                    <FaUserPlus className="text-lg" />
                    Registrar Usuario
                  </>
                )}
              </span>
            </button>

            {/* Success/Error Messages */}
            {success && (
              <div className="p-4 rounded-2xl backdrop-blur-sm border-2 bg-green-50/80 border-green-200 text-center font-medium text-green-700 transform animate-bounce">
                {success}
              </div>
            )}
            {error && (
              <div className="p-4 rounded-2xl backdrop-blur-sm border-2 bg-red-50/80 border-red-200 text-center font-medium text-red-700 transform animate-bounce">
                {error}
              </div>
            )}

            {/* Login Link */}
            <div className="text-center pt-6 border-t border-gray-200">
              <p className="text-gray-600 font-medium">
                ¿Ya tienes cuenta?{" "}
                <a 
                  href="/login" 
                  className="text-cns font-bold hover:text-pastelGreen transition-colors duration-200 relative group"
                >
                  Inicia sesión
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-cns to-pastelGreen transition-all duration-300 group-hover:w-full"></span>
                </a>
              </p>
            </div>
          </form>
        </div>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-2px); }
          75% { transform: translateX(2px); }
        }
        .animate-shake {
          animation: shake 0.3s ease-in-out;
        }
      `}</style>
    </div>
  );
};

export default RegisterUserForm;