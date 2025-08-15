import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useUser } from "../context/UserContext";
import { syncUserData } from "../services/api";
import logo from "../assets/cns-logo.png";
import { Menu, X, Search, User, Activity } from "lucide-react";

const Navbar = () => {
  const { user, setUser, updateUserData } = useUser();
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  // ✅ SINCRONIZACIÓN AUTOMÁTICA EN NAVBAR
  useEffect(() => {
    const syncUserIfNeeded = async () => {
      if ((user?.userId || user?.id) && user?.role === 'asegurado') {
        try {
          console.log('🔄 Sincronizando datos del usuario en Navbar...');
          const syncResponse = await syncUserData(user.userId || user.id);
          
          console.log('📊 Datos actuales:', user);
          console.log('📊 Datos nuevos:', syncResponse.data);
          
          // Verificar si hay diferencias
          if (syncResponse.data.fullName !== user.fullName) {
            console.log('🔄 Actualizando contexto desde Navbar...');
            updateUserData(syncResponse.data);
            console.log('✅ Navbar sincronizado:', syncResponse.data.fullName);
          } else {
            console.log('✅ Navbar ya está sincronizado');
          }
        } catch (error) {
          console.log('⚠️ No se pudo sincronizar en Navbar:', error);
        }
      }
    };

    // Sincronizar cuando el componente se monta
    syncUserIfNeeded();
    
    // Y cada 10 segundos para mantener actualizado
    const interval = setInterval(syncUserIfNeeded, 10000);
    
    return () => clearInterval(interval);
  }, [user?.userId, user?.id]); // Se ejecuta cuando cambia el userId

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("cnsUser");
    navigate("/login");
  };

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  // ✨ FUNCIÓN PARA OBTENER RUTAS SEGÚN EL ROL
  const getNavigationItems = () => {
    if (user?.role === 'personal_medico') {
      return [
        { to: "/medical-dashboard", label: "Dashboard Médico", icon: Activity },
        { to: "#patients", label: "Pacientes", external: true },
        { to: "#reports", label: "Reportes", external: true },
        { to: "#analytics", label: "Análisis", external: true }
      ];
    } else {
      return [
        { to: "/", label: "Historial Clínico" },
        { to: "/registersymp", label: "Registro de Síntomas" },
        { to: "#nosotros", label: "Nosotros", external: true },
        { to: "#destacado", label: "Destacado", external: true },
        { to: "#contacto", label: "Contacto", external: true }
      ];
    }
  };

  // ✨ FUNCIÓN PARA OBTENER INFORMACIÓN DEL USUARIO
  const getUserInfo = () => {
    if (user?.role === 'personal_medico') {
      return {
        displayName: `Dr. ${user.name || user.fullName || 'Médico'}`,
        role: 'Personal Médico',
        icon: Activity
      };
    } else {
      return {
        displayName: user?.name || user?.fullName || 'Asegurado',
        role: 'Asegurado',
        icon: User
      };
    }
  };

  const navigationItems = getNavigationItems();
  const userInfo = getUserInfo();
  const IconComponent = userInfo.icon;

  return (
    <header className={`shadow-lg ${user?.role === 'personal_medico' ? 'bg-gradient-to-r from-teal-600 to-emerald-600' : 'bg-cns'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo Section */}
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-xl backdrop-blur-sm border border-white/20">
              <img src={logo} alt="CNS Logo" className="h-8 w-8" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold font-poppins text-white tracking-tight">
                CNS
              </span>
              {user?.role === 'personal_medico' && (
                <span className="text-xs text-white/80 font-medium">
                  Sistema Médico
                </span>
              )}
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <div className="flex items-center gap-8 font-medium text-white/90">
              {navigationItems.map((item, index) => (
                item.external ? (
                  <span 
                    key={index}
                    className="hover:text-white transition-colors duration-200 relative group cursor-pointer"
                  >
                    {item.label}
                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-white transition-all duration-200 group-hover:w-full"></span>
                  </span>
                ) : (
                  <Link 
                    key={index}
                    to={item.to} 
                    className="hover:text-white transition-colors duration-200 relative group flex items-center gap-2"
                  >
                    {item.icon && <item.icon size={16} />}
                    {item.label}
                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-white transition-all duration-200 group-hover:w-full"></span>
                  </Link>
                )
              ))}
            </div>

            {/* Right Side Icons & User */}
            <div className="flex items-center gap-4">
              <button className="p-2 hover:bg-white/10 rounded-lg transition-colors duration-200">
                <Search size={20} className="text-white/80 hover:text-white" />
              </button>
              
              <div className={`flex items-center gap-3 rounded-full px-4 py-2 backdrop-blur-sm ${
                user?.role === 'personal_medico' 
                  ? 'bg-white/10 border border-white/20' 
                  : 'bg-white/10'
              }`}>
                <div className={`p-1 rounded-full ${
                  user?.role === 'personal_medico' 
                    ? 'bg-emerald-500/20' 
                    : 'bg-white/20'
                }`}>
                  <IconComponent size={16} className="text-white" />
                </div>
                <div className="text-right">
                  <div className="text-sm text-white font-medium">
                    {userInfo.displayName}
                  </div>
                  <div className="text-xs text-white/70">
                    {userInfo.role}
                  </div>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="bg-white/20 hover:bg-white/30 text-white font-medium px-5 py-2 rounded-full text-sm transition-all duration-200 backdrop-blur-sm border border-white/20 hover:border-white/40"
              >
                Salir
              </button>
            </div>
          </nav>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button 
              onClick={toggleMenu}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors duration-200"
            >
              {menuOpen ? 
                <X size={24} className="text-white" /> : 
                <Menu size={24} className="text-white" />
              }
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className={`md:hidden backdrop-blur-md border-t border-white/10 ${
          user?.role === 'personal_medico' 
            ? 'bg-teal-600/95' 
            : 'bg-cns/95'
        }`}>
          <div className="px-6 py-4 space-y-4">
            {navigationItems.map((item, index) => (
              item.external ? (
                <span 
                  key={index}
                  className="block text-white/90 hover:text-white font-medium py-2 transition-colors duration-200 cursor-pointer"
                >
                  {item.label}
                </span>
              ) : (
                <Link 
                  key={index}
                  to={item.to} 
                  onClick={toggleMenu} 
                  className="flex items-center gap-3 text-white/90 hover:text-white font-medium py-2 transition-colors duration-200"
                >
                  {item.icon && <item.icon size={18} />}
                  {item.label}
                </Link>
              )
            ))}
            
            <div className="pt-4 border-t border-white/20">
              <div className="flex items-center gap-3 mb-4">
                <div className={`p-1 rounded-full ${
                  user?.role === 'personal_medico' 
                    ? 'bg-emerald-500/20' 
                    : 'bg-white/20'
                }`}>
                  <IconComponent size={16} className="text-white" />
                </div>
                <div>
                  <div className="text-sm font-medium text-white">
                    {userInfo.displayName}
                  </div>
                  <div className="text-xs text-white/70">
                    {userInfo.role}
                  </div>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="w-full bg-white/20 hover:bg-white/30 text-white font-medium px-4 py-2 rounded-full text-sm transition-all duration-200 backdrop-blur-sm border border-white/20"
              >
                Salir
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;