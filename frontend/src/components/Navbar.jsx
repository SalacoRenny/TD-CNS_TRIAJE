import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useUser } from "../context/UserContext";
import logo from "../assets/cns-logo.png";
import { Menu, X, Search, User } from "lucide-react";

const Navbar = () => {
  const { user, setUser } = useUser();
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("cnsUser");
    navigate("/login");
  };

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  return (
    <header className="bg-cns shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo Section */}
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-xl backdrop-blur-sm border border-white/20">
              <img src={logo} alt="CNS Logo" className="h-8 w-8" />
            </div>
            <span className="text-xl font-bold font-poppins text-white tracking-tight">
              CNS
            </span>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <div className="flex items-center gap-8 font-medium text-white/90">
              <Link 
                to="/" 
                className="hover:text-white transition-colors duration-200 relative group"
              >
                Historial Clínico
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-white transition-all duration-200 group-hover:w-full"></span>
              </Link>
              <Link 
                to="/registersymp" 
                className="hover:text-white transition-colors duration-200 relative group"
              >
                Registro de Síntomas
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-white transition-all duration-200 group-hover:w-full"></span>
              </Link>
              <span className="hover:text-white transition-colors duration-200 relative group cursor-pointer">
                Nosotros
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-white transition-all duration-200 group-hover:w-full"></span>
              </span>
              <span className="hover:text-white transition-colors duration-200 relative group cursor-pointer">
                Destacado
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-white transition-all duration-200 group-hover:w-full"></span>
              </span>
              <span className="hover:text-white transition-colors duration-200 relative group cursor-pointer">
                Contacto
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-white transition-all duration-200 group-hover:w-full"></span>
              </span>
            </div>

            {/* Right Side Icons & User */}
            <div className="flex items-center gap-4">
              <button className="p-2 hover:bg-white/10 rounded-lg transition-colors duration-200">
                <Search size={20} className="text-white/80 hover:text-white" />
              </button>
              
              <div className="flex items-center gap-3 bg-white/10 rounded-full px-4 py-2 backdrop-blur-sm">
                <div className="p-1 bg-white/20 rounded-full">
                  <User size={16} className="text-white" />
                </div>
                <span className="text-sm text-white font-medium">
                  {user?.fullName || "Asegurado"}
                </span>
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
        <div className="md:hidden bg-cns/95 backdrop-blur-md border-t border-white/10">
          <div className="px-6 py-4 space-y-4">
            <Link 
              to="/" 
              onClick={toggleMenu} 
              className="block text-white/90 hover:text-white font-medium py-2 transition-colors duration-200"
            >
              Inicio
            </Link>
            <Link
              to="/registersymp"
              onClick={toggleMenu}
              className="block text-white/90 hover:text-white font-medium py-2 transition-colors duration-200"
            >
              Servicios
            </Link>
            <span className="block text-white/90 hover:text-white font-medium py-2 transition-colors duration-200 cursor-pointer">
              Nosotros
            </span>
            <span className="block text-white/90 hover:text-white font-medium py-2 transition-colors duration-200 cursor-pointer">
              Destacado
            </span>
            <span className="block text-white/90 hover:text-white font-medium py-2 transition-colors duration-200 cursor-pointer">
              Contacto
            </span>
            
            <div className="pt-4 border-t border-white/20">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-1 bg-white/20 rounded-full">
                  <User size={16} className="text-white" />
                </div>
                <span className="text-sm font-medium text-white">
                  {user?.fullName || "Asegurado"}
                </span>
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