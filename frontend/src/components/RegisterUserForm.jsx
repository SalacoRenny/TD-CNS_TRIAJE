import { useState } from "react";
import {
  AiOutlineUser,
  AiOutlineMail,
  AiOutlineIdcard,
  AiOutlineLock,
  AiOutlineEye,
  AiOutlineEyeInvisible,
  AiOutlinePhone,
  AiOutlineCalendar
} from "react-icons/ai";
import { FaUserTag, FaUserPlus, FaVenusMars } from "react-icons/fa";
import { registerUser } from "../services/api";
import enfermeraImage from "../assets/abuela_enfermera.png";

const RegisterUserForm = () => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    motherLastName: "",
    email: "",
    ci: "",
    phone: "",
    dateOfBirth: "",
    gender: "",
    role: "asegurado",
    password: "",
    confirmPassword: ""
  });

  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
    setSuccess(null);
    setError(null);
  };

  const validate = () => {
    const newErrors = {};
    
    // Validar nombres
    if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(formData.firstName)) {
      newErrors.firstName = "Solo letras y espacios";
    }
    if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(formData.lastName)) {
      newErrors.lastName = "Solo letras y espacios";
    }
    if (formData.motherLastName && !/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(formData.motherLastName)) {
      newErrors.motherLastName = "Solo letras y espacios";
    }
    
    // Validar email
    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Correo inválido";
    }
    
    // Validar CI
    if (!/^\d{7,8}$/.test(formData.ci)) {
      newErrors.ci = "CI debe tener 7 u 8 dígitos";
    }
    
    // Validar teléfono (opcional)
    if (formData.phone && !/^\d{7,8}$/.test(formData.phone)) {
      newErrors.phone = "Teléfono debe tener 7 u 8 dígitos";
    }
    
    // Validar fecha de nacimiento
    if (!formData.dateOfBirth) {
      newErrors.dateOfBirth = "Fecha de nacimiento requerida";
    } else {
      const birthDate = new Date(formData.dateOfBirth);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      if (age < 0 || age > 120) {
        newErrors.dateOfBirth = "Fecha de nacimiento inválida";
      }
    }
    
    // Validar género
    if (!formData.gender) {
      newErrors.gender = "Seleccione un género";
    }
    
    // Validar contraseña
    if (formData.password.length < 8) {
      newErrors.password = "Mínimo 8 caracteres";
    }
    if (!/(?=.*[A-Z])/.test(formData.password)) {
      newErrors.password = "Debe contener al menos una mayúscula";
    }
    if (!/(?=.*\d)/.test(formData.password)) {
      newErrors.password = "Debe contener al menos un número";
    }
    
    // Validar confirmación de contraseña
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Las contraseñas no coinciden";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
  if (!validate()) return;
  setLoading(true);
  
  try {
    // Preparar datos para envío
    const { confirmPassword, ...dataToSend } = formData;
    
    // ✅ USAR LA FUNCIÓN DEL API.JS
    const response = await registerUser(dataToSend);
    
    setSuccess(`✅ Usuario registrado exitosamente con código: ${response.data.user.userId}`);
    setFormData({
      firstName: "",
      lastName: "",
      motherLastName: "",
      email: "",
      ci: "",
      phone: "",
      dateOfBirth: "",
      gender: "",
      role: "asegurado",
      password: "",
      confirmPassword: ""
    });
  } catch (err) {
    console.error('Error en registro:', err);
    const errorMessage = err.response?.data?.error || "Error de conexión al servidor";
    setError(`❌ ${errorMessage}`);
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
      </div>

      <div className="relative bg-white/40 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 grid grid-cols-1 lg:grid-cols-2 overflow-hidden w-full max-w-7xl transform hover:scale-[1.005] transition-all duration-700">
        
        {/* Left Side - Image & Branding */}
        <div className="hidden lg:flex flex-col items-center justify-center bg-gradient-to-br from-cns via-pastelGreen to-emerald-400 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-black/5"></div>
          <div className="relative z-10 text-center text-white p-8">
            <div className="mb-8 transform hover:scale-110 transition-transform duration-500 group">
              <img
                src={enfermeraImage}
                alt="Enfermera"
                className="w-80 h-80 object-cover rounded-3xl shadow-2xl border-4 border-white/40 group-hover:border-white/60 transition-all duration-300"
              />
            </div>
            <h1 className="text-4xl font-bold font-poppins mb-4 text-white drop-shadow-2xl">
              Únete a nosotros
            </h1>
            <p className="text-xl text-white/95 font-medium drop-shadow-lg mb-2">
              Crea tu cuenta en el portal
            </p>
            <p className="text-lg text-white/90 font-normal drop-shadow-md">
              de salud más confiable
            </p>
          </div>
        </div>

        {/* Right Side - Register Form */}
        <div className="bg-white/60 backdrop-blur-md px-8 py-12 lg:px-12 lg:py-16 flex flex-col justify-center relative overflow-y-auto max-h-screen">
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

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Nombres */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Nombres */}
              <div className="group">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nombres *
                </label>
                <div className={`relative flex items-center bg-white/80 backdrop-blur-sm rounded-2xl border-2 transition-all duration-300 ${
                  errors.firstName 
                    ? "border-red-400 shadow-red-100" 
                    : "border-gray-200 group-focus-within:border-cns group-focus-within:shadow-lg group-focus-within:shadow-cns/20"
                }`}>
                  <div className="absolute left-4 p-2 bg-gradient-to-br from-emerald-50 to-cns/10 rounded-xl">
                    <AiOutlineUser className="text-emerald-600 text-xl" />
                  </div>
                  <input
                    type="text"
                    name="firstName"
                    placeholder="Ej: Juan Carlos"
                    value={formData.firstName}
                    onChange={handleChange}
                    className="w-full pl-16 pr-6 py-3 bg-transparent outline-none font-medium placeholder-gray-400"
                  />
                </div>
                {errors.firstName && (
                  <p className="text-red-500 text-sm mt-1 flex items-center">
                    <span className="w-1 h-1 bg-red-500 rounded-full mr-2"></span>
                    {errors.firstName}
                  </p>
                )}
              </div>

              {/* Apellido Paterno */}
              <div className="group">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Apellido Paterno *
                </label>
                <div className={`relative flex items-center bg-white/80 backdrop-blur-sm rounded-2xl border-2 transition-all duration-300 ${
                  errors.lastName 
                    ? "border-red-400 shadow-red-100" 
                    : "border-gray-200 group-focus-within:border-cns group-focus-within:shadow-lg group-focus-within:shadow-cns/20"
                }`}>
                  <div className="absolute left-4 p-2 bg-gradient-to-br from-emerald-50 to-cns/10 rounded-xl">
                    <AiOutlineUser className="text-emerald-600 text-xl" />
                  </div>
                  <input
                    type="text"
                    name="lastName"
                    placeholder="Ej: Pérez"
                    value={formData.lastName}
                    onChange={handleChange}
                    className="w-full pl-16 pr-6 py-3 bg-transparent outline-none font-medium placeholder-gray-400"
                  />
                </div>
                {errors.lastName && (
                  <p className="text-red-500 text-sm mt-1 flex items-center">
                    <span className="w-1 h-1 bg-red-500 rounded-full mr-2"></span>
                    {errors.lastName}
                  </p>
                )}
              </div>
            </div>

            {/* Apellido Materno */}
            <div className="group">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Apellido Materno (opcional)
              </label>
              <div className={`relative flex items-center bg-white/80 backdrop-blur-sm rounded-2xl border-2 transition-all duration-300 ${
                errors.motherLastName 
                  ? "border-red-400 shadow-red-100" 
                  : "border-gray-200 group-focus-within:border-cns group-focus-within:shadow-lg group-focus-within:shadow-cns/20"
              }`}>
                <div className="absolute left-4 p-2 bg-gradient-to-br from-emerald-50 to-cns/10 rounded-xl">
                  <AiOutlineUser className="text-emerald-600 text-xl" />
                </div>
                <input
                  type="text"
                  name="motherLastName"
                  placeholder="Ej: González (opcional)"
                  value={formData.motherLastName}
                  onChange={handleChange}
                  className="w-full pl-16 pr-6 py-3 bg-transparent outline-none font-medium placeholder-gray-400"
                />
              </div>
              {errors.motherLastName && (
                <p className="text-red-500 text-sm mt-1 flex items-center">
                  <span className="w-1 h-1 bg-red-500 rounded-full mr-2"></span>
                  {errors.motherLastName}
                </p>
              )}
            </div>

            {/* Email y CI */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Email */}
              <div className="group">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email *
                </label>
                <div className={`relative flex items-center bg-white/80 backdrop-blur-sm rounded-2xl border-2 transition-all duration-300 ${
                  errors.email 
                    ? "border-red-400 shadow-red-100" 
                    : "border-gray-200 group-focus-within:border-cns group-focus-within:shadow-lg group-focus-within:shadow-cns/20"
                }`}>
                  <div className="absolute left-4 p-2 bg-gradient-to-br from-emerald-50 to-cns/10 rounded-xl">
                    <AiOutlineMail className="text-emerald-600 text-xl" />
                  </div>
                  <input
                    type="email"
                    name="email"
                    placeholder="correo@ejemplo.com"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full pl-16 pr-6 py-3 bg-transparent outline-none font-medium placeholder-gray-400"
                  />
                </div>
                {errors.email && (
                  <p className="text-red-500 text-sm mt-1 flex items-center">
                    <span className="w-1 h-1 bg-red-500 rounded-full mr-2"></span>
                    {errors.email}
                  </p>
                )}
              </div>

              {/* CI */}
              <div className="group">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  CI *
                </label>
                <div className={`relative flex items-center bg-white/80 backdrop-blur-sm rounded-2xl border-2 transition-all duration-300 ${
                  errors.ci 
                    ? "border-red-400 shadow-red-100" 
                    : "border-gray-200 group-focus-within:border-cns group-focus-within:shadow-lg group-focus-within:shadow-cns/20"
                }`}>
                  <div className="absolute left-4 p-2 bg-gradient-to-br from-emerald-50 to-cns/10 rounded-xl">
                    <AiOutlineIdcard className="text-emerald-600 text-xl" />
                  </div>
                  <input
                    type="text"
                    name="ci"
                    placeholder="12345678"
                    value={formData.ci}
                    onChange={handleChange}
                    className="w-full pl-16 pr-6 py-3 bg-transparent outline-none font-medium placeholder-gray-400"
                  />
                </div>
                {errors.ci && (
                  <p className="text-red-500 text-sm mt-1 flex items-center">
                    <span className="w-1 h-1 bg-red-500 rounded-full mr-2"></span>
                    {errors.ci}
                  </p>
                )}
              </div>
            </div>

            {/* Teléfono */}
            <div className="group">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Teléfono (opcional)
              </label>
              <div className={`relative flex items-center bg-white/80 backdrop-blur-sm rounded-2xl border-2 transition-all duration-300 ${
                errors.phone 
                  ? "border-red-400 shadow-red-100" 
                  : "border-gray-200 group-focus-within:border-cns group-focus-within:shadow-lg group-focus-within:shadow-cns/20"
              }`}>
                <div className="absolute left-4 p-2 bg-gradient-to-br from-emerald-50 to-cns/10 rounded-xl">
                  <AiOutlinePhone className="text-emerald-600 text-xl" />
                </div>
                <input
                  type="tel"
                  name="phone"
                  placeholder="70123456"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full pl-16 pr-6 py-3 bg-transparent outline-none font-medium placeholder-gray-400"
                />
              </div>
              {errors.phone && (
                <p className="text-red-500 text-sm mt-1 flex items-center">
                  <span className="w-1 h-1 bg-red-500 rounded-full mr-2"></span>
                  {errors.phone}
                </p>
              )}
            </div>

            {/* Fecha de Nacimiento y Género */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Fecha de Nacimiento */}
              <div className="group">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Fecha de Nacimiento *
                </label>
                <div className={`relative flex items-center bg-white/80 backdrop-blur-sm rounded-2xl border-2 transition-all duration-300 ${
                  errors.dateOfBirth 
                    ? "border-red-400 shadow-red-100" 
                    : "border-gray-200 group-focus-within:border-cns group-focus-within:shadow-lg group-focus-within:shadow-cns/20"
                }`}>
                  <div className="absolute left-4 p-2 bg-gradient-to-br from-emerald-50 to-cns/10 rounded-xl">
                    <AiOutlineCalendar className="text-emerald-600 text-xl" />
                  </div>
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleChange}
                    max={new Date().toISOString().split('T')[0]}
                    className="w-full pl-16 pr-6 py-3 bg-transparent outline-none font-medium"
                  />
                </div>
                {errors.dateOfBirth && (
                  <p className="text-red-500 text-sm mt-1 flex items-center">
                    <span className="w-1 h-1 bg-red-500 rounded-full mr-2"></span>
                    {errors.dateOfBirth}
                  </p>
                )}
              </div>

              {/* Género */}
              <div className="group">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Género *
                </label>
                <div className={`relative flex items-center bg-white/80 backdrop-blur-sm rounded-2xl border-2 transition-all duration-300 ${
                  errors.gender 
                    ? "border-red-400 shadow-red-100" 
                    : "border-gray-200 group-focus-within:border-cns group-focus-within:shadow-lg group-focus-within:shadow-cns/20"
                }`}>
                  <div className="absolute left-4 p-2 bg-gradient-to-br from-emerald-50 to-cns/10 rounded-xl">
                  <FaVenusMars className="text-emerald-600 text-xl" />
                 </div>
                 <select 
                   name="gender" 
                   value={formData.gender} 
                   onChange={handleChange} 
                   className="w-full pl-16 pr-6 py-3 bg-transparent outline-none font-medium text-gray-700 appearance-none cursor-pointer"
                 >
                   <option value="">Seleccionar...</option>
                   <option value="masculino">Masculino</option>
                   <option value="femenino">Femenino</option>
                 </select>
                 <div className="absolute right-4 pointer-events-none">
                   <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                   </svg>
                 </div>
               </div>
               {errors.gender && (
                 <p className="text-red-500 text-sm mt-1 flex items-center">
                   <span className="w-1 h-1 bg-red-500 rounded-full mr-2"></span>
                   {errors.gender}
                 </p>
               )}
             </div>
           </div>

           {/* Tipo de Usuario */}
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
                 className="w-full pl-16 pr-6 py-3 bg-transparent outline-none font-medium text-gray-700 appearance-none cursor-pointer"
               >
                 <option value="asegurado">Asegurado</option>
                 <option value="personal_medico">Personal Médico</option>
                 <option value="asistente">Asistente de Triaje</option>
               </select>
               <div className="absolute right-4 pointer-events-none">
                 <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                 </svg>
               </div>
             </div>
           </div>

           {/* Contraseñas */}
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             {/* Contraseña */}
             <div className="group">
               <label className="block text-sm font-semibold text-gray-700 mb-2">
                 Contraseña *
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
                   className="w-full pl-16 pr-16 py-3 bg-transparent outline-none font-medium placeholder-gray-400"
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
                 <p className="text-red-500 text-sm mt-1 flex items-center">
                   <span className="w-1 h-1 bg-red-500 rounded-full mr-2"></span>
                   {errors.password}
                 </p>
               )}
             </div>

             {/* Confirmar Contraseña */}
             <div className="group">
               <label className="block text-sm font-semibold text-gray-700 mb-2">
                 Confirmar Contraseña *
               </label>
               <div className={`relative flex items-center bg-white/80 backdrop-blur-sm rounded-2xl border-2 transition-all duration-300 ${
                 errors.confirmPassword 
                   ? "border-red-400 shadow-red-100" 
                   : "border-gray-200 group-focus-within:border-cns group-focus-within:shadow-lg group-focus-within:shadow-cns/20"
               }`}>
                 <div className="absolute left-4 p-2 bg-gradient-to-br from-emerald-50 to-cns/10 rounded-xl">
                   <AiOutlineLock className="text-emerald-600 text-xl" />
                 </div>
                 <input
                   type={showConfirmPassword ? "text" : "password"}
                   name="confirmPassword"
                   placeholder="Repetir contraseña"
                   value={formData.confirmPassword}
                   onChange={handleChange}
                   className="w-full pl-16 pr-16 py-3 bg-transparent outline-none font-medium placeholder-gray-400"
                 />
                 <button
                   type="button"
                   onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                   className="absolute right-4 p-2 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors duration-200"
                 >
                   {showConfirmPassword ? <AiOutlineEyeInvisible className="text-xl" /> : <AiOutlineEye className="text-xl" />}
                 </button>
               </div>
               {errors.confirmPassword && (
                 <p className="text-red-500 text-sm mt-1 flex items-center">
                   <span className="w-1 h-1 bg-red-500 rounded-full mr-2"></span>
                   {errors.confirmPassword}
                 </p>
               )}
             </div>
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