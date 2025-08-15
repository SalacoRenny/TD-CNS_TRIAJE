// Script LoginUserForm.jsx
import { useState } from "react";
import {
  AiOutlineMail,
  AiOutlineLock,
  AiOutlineEye,
  AiOutlineEyeInvisible,
} from "react-icons/ai";
import { postLogin } from "../services/api";
import loginImage from "../assets/login_image.png";
import { useNavigate } from "react-router-dom";
import { useUser } from "../context/UserContext";

const LoginUserForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const { setUser } = useUser();

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setErrors({});
    setMessage(null);
  };

  const validate = () => {
    const newErrors = {};
    if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = "Correo inválido";
    if (!formData.password) newErrors.password = "Contraseña requerida";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ✅ FUNCIÓN PARA REDIRIGIR POR ROL
// Agregar redirección para asistente en la función redirectByRole:

const redirectByRole = (userRole) => {
  console.log("🔄 Redirigiendo usuario con rol:", userRole);
  
  switch (userRole) {
    case 'personal_medico':
      console.log("👨‍⚕️ Redirigiendo a dashboard médico");
      navigate("/medical-dashboard");
      break;
    case 'asegurado':
      console.log("👤 Redirigiendo a dashboard de asegurado");
      navigate("/");
      break;
    case 'asistente':
      console.log("🤝 Redirigiendo a dashboard de asistente");
      navigate("/assistant-dashboard");
      break;
    case 'admin':
      console.log("👑 Redirigiendo a dashboard de administrador");
      navigate("/admin-dashboard");
      break;
    default:
      console.log("❓ Rol desconocido, redirigiendo a home");
      navigate("/");
      break;
  }
};

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await postLogin(formData);
      console.log("🟩 Respuesta del backend:", res.data);
      const userData = res.data;
      console.log("🟩 Usuario guardado en contexto:", {
        id: userData.userId,
        fullName: userData.name,
        email: userData.email,
        ci: userData.ci,
        role: userData.role
      });

      // ✅ GUARDAR USUARIO EN CONTEXTO
      setUser(userData);
      console.log("✅ Usuario guardado:", userData);
      
      // ✅ REDIRIGIR SEGÚN EL ROL
      redirectByRole(userData.role);
      
      setMessage("✅ Inicio de sesión exitoso");
      console.log("Usuario autenticado:", res.data);
    } catch (err) {
      console.error("❌ Error en login:", err);
      setMessage("❌ Credenciales incorrectas");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-emerald-50 flex items-center justify-center px-4 py-8 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-cns/20 to-pastelGreen/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-blue-200/30 to-cns/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-emerald-100/10 to-blue-100/10 rounded-full blur-3xl animate-spin" style={{ animationDuration: '20s' }}></div>
      </div>

      <div className="relative bg-white/40 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 grid grid-cols-1 lg:grid-cols-2 overflow-hidden w-full max-w-6xl transform hover:scale-[1.01] transition-all duration-500">
        
        {/* Left Side - Image & Branding */}
        <div className="hidden lg:flex flex-col items-center justify-center bg-gradient-to-br from-cns via-pastelGreen to-emerald-400 relative overflow-hidden">
          {/* Decorative Elements */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-black/5"></div>
          <div className="absolute top-10 left-10 w-20 h-20 bg-white/20 rounded-2xl rotate-12 backdrop-blur-sm border border-white/30"></div>
          <div className="absolute bottom-20 right-10 w-16 h-16 bg-white/25 rounded-full backdrop-blur-sm border border-white/40"></div>
          <div className="absolute top-1/3 right-20 w-12 h-12 bg-white/20 rounded-lg rotate-45 backdrop-blur-sm border border-white/30"></div>
          
          {/* Main Content */}
          <div className="relative z-10 text-center text-white p-8">
            <div className="mb-8 transform hover:scale-110 transition-transform duration-300">
              <img
                src={loginImage}
                alt="Login"
                className="w-80 h-80 object-cover rounded-2xl shadow-2xl border-4 border-white/40"
              />
            </div>
            <h1 className="text-4xl font-bold font-poppins mb-4 text-white drop-shadow-2xl" style={{ textShadow: '2px 2px 8px rgba(0,0,0,0.3), 0 0 20px rgba(0,0,0,0.2)' }}>
              Bienvenido de vuelta
            </h1>
            <p className="text-xl text-white/95 font-medium drop-shadow-lg" style={{ textShadow: '1px 1px 4px rgba(0,0,0,0.2)' }}>
              Accede a tu portal de salud
            </p>
          </div>
          
          {/* Floating Elements */}
          <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-white/60 rounded-full animate-ping"></div>
          <div className="absolute bottom-1/3 left-1/3 w-1 h-1 bg-white/40 rounded-full animate-ping delay-500"></div>
          <div className="absolute top-1/2 right-1/3 w-3 h-3 bg-white/30 rounded-full animate-ping delay-1000"></div>
        </div>

        {/* Right Side - Login Form */}
        <div className="bg-white/60 backdrop-blur-md px-8 py-12 lg:px-12 lg:py-16 flex flex-col justify-center relative">
          {/* Decorative Header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-cns to-emerald-600 rounded-2xl mb-6 shadow-xl border-2 border-white/30 transform hover:rotate-12 transition-transform duration-300">
              <AiOutlineLock className="text-white text-2xl drop-shadow-lg" />
            </div>
            <h2 className="text-4xl font-bold font-poppins mb-2" style={{ 
              background: 'linear-gradient(135deg, #4ade80 0%, #059669 50%, #065f46 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.1))'
            }}>
              Iniciar Sesión
            </h2>
            <p className="text-gray-600 font-medium">Ingresa tus credenciales para continuar</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Input */}
            <div className="group">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Correo Electrónico
              </label>
              <div className={`relative flex items-center bg-white/80 backdrop-blur-sm rounded-2xl border-2 transition-all duration-300 ${
                errors.email 
                  ? "border-red-400 shadow-red-100" 
                  : "border-gray-200 group-focus-within:border-cns group-focus-within:shadow-lg group-focus-within:shadow-cns/20"
              }`}>
                <div className="absolute left-4 p-2 bg-gradient-to-br from-cns/10 to-pastelGreen/10 rounded-xl">
                  <AiOutlineMail className="text-cns text-xl" />
                </div>
                <input
                  type="email"
                  name="email"
                  placeholder="tu@email.com"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full pl-16 pr-6 py-4 bg-transparent outline-none font-medium placeholder-gray-400"
                />
              </div>
              {errors.email && (
                <p className="text-red-500 text-sm mt-2 flex items-center">
                  <span className="w-1 h-1 bg-red-500 rounded-full mr-2"></span>
                  {errors.email}
                </p>
              )}
            </div>

            {/* Password Input */}
            <div className="group">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Contraseña
              </label>
              <div className={`relative flex items-center bg-white/80 backdrop-blur-sm rounded-2xl border-2 transition-all duration-300 ${
                errors.password 
                  ? "border-red-400 shadow-red-100" 
                  : "border-gray-200 group-focus-within:border-cns group-focus-within:shadow-lg group-focus-within:shadow-cns/20"
              }`}>
                <div className="absolute left-4 p-2 bg-gradient-to-br from-cns/10 to-pastelGreen/10 rounded-xl">
                  <AiOutlineLock className="text-cns text-xl" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full pl-16 pr-16 py-4 bg-transparent outline-none font-medium placeholder-gray-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 p-2 text-cns hover:bg-cns/10 rounded-xl transition-colors duration-200"
                >
                  {showPassword ? <AiOutlineEyeInvisible className="text-xl" /> : <AiOutlineEye className="text-xl" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-500 text-sm mt-2 flex items-center">
                  <span className="w-1 h-1 bg-red-500 rounded-full mr-2"></span>
                  {errors.password}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-emerald-600 via-cns to-emerald-700 text-white font-bold py-4 px-8 rounded-2xl shadow-xl hover:shadow-2xl hover:shadow-emerald-500/40 transform hover:scale-[1.02] transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none relative overflow-hidden group border border-emerald-500/30"
            >
              {loading && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
              )}
              <span className="relative z-10 flex items-center justify-center gap-2">
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Verificando...
                  </>
                ) : (
                  "Iniciar Sesión"
                )}
              </span>
            </button>

            {/* Message Display */}
            {message && (
              <div className={`p-4 rounded-2xl backdrop-blur-sm border-2 text-center font-medium transform animate-bounce ${
                message.includes("✅") 
                  ? "bg-green-50/80 border-green-200 text-green-700" 
                  : "bg-red-50/80 border-red-200 text-red-700"
              }`}>
                {message}
              </div>
            )}

            {/* Register Link */}
            <div className="text-center pt-6 border-t border-gray-200">
              <p className="text-gray-600 font-medium">
                ¿No tienes cuenta?{" "}
                <a 
                  href="/register" 
                  className="text-cns font-bold hover:text-pastelGreen transition-colors duration-200 relative group"
                >
                  Regístrate aquí
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-cns to-pastelGreen transition-all duration-300 group-hover:w-full"></span>
                </a>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginUserForm;