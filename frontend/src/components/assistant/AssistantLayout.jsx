import React from 'react';
import { useUser } from '../../context/UserContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Users, 
  FileText, 
  LogOut, 
  Activity,
  Stethoscope,
  Heart,
  History, // 🆕 Para historial de asistencias
  Bot      // 🆕 Para indicar sistema IA
} from 'lucide-react';

const AssistantLayout = ({ children }) => {
  const { user, logout } = useUser();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleNavigation = (path) => {
    navigate(path);
  };

  // 🔧 NAVEGACIÓN ACTUALIZADA CON NUEVA RUTA
  const navigationItems = [
    {
      name: 'Dashboard',
      path: '/assistant-dashboard',
      icon: Activity,
      current: location.pathname === '/assistant-dashboard',
      description: 'Panel principal'
    },
    {
      name: 'Triaje de Pacientes',
      path: '/assistant-triage',
      icon: Stethoscope,
      current: location.pathname.includes('/assistant-triage'),
      description: 'Asistir nuevos triajes'
    },
    {
      name: 'Lista de Pacientes',
      path: '/assistant-patients',
      icon: Users,
      current: location.pathname === '/assistant-patients',
      description: 'Ver todos los pacientes'
    },
    // 🆕 NUEVA RUTA PARA HISTORIAL DE ASISTENCIAS
    {
      name: 'Mi Historial',
      path: '/assistant-history',
      icon: History,
      current: location.pathname === '/assistant-history',
      description: 'Mis asistencias previas',
      isNew: true
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar Mejorado */}
      <nav className="bg-white shadow-lg border-b-2 border-emerald-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <div className="relative">
                  <Heart className="h-8 w-8 text-emerald-600" />
                  <Bot className="absolute -top-1 -right-1 h-4 w-4 text-purple-600" />
                </div>
                <div className="ml-3">
                  <span className="text-xl font-bold text-gray-900">
                    CNS Asistente
                  </span>
                  <div className="text-xs text-emerald-600 font-medium">
                    Sistema AISANA
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* 🆕 INDICADOR DE ESTADO ACTIVO */}
              <div className="hidden md:flex items-center space-x-2 px-3 py-1 bg-emerald-50 rounded-full">
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                <span className="text-emerald-600 text-sm font-medium">Activo</span>
              </div>

              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-sm">
                    {user?.firstName?.charAt(0) || user?.name?.charAt(0) || 'A'}
                  </span>
                </div>
                <div className="text-sm">
                  <p className="text-gray-900 font-semibold">
                    {user?.name || user?.firstName || 'Asistente'}
                  </p>
                  <p className="text-emerald-600 font-medium">
                    Asistente de Triaje
                  </p>
                </div>
              </div>
              
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 text-gray-500 hover:text-gray-700 transition-colors duration-200 px-4 py-2 rounded-lg hover:bg-gray-100"
              >
                <LogOut className="h-5 w-5" />
                <span className="font-medium">Cerrar Sesión</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Layout Principal */}
      <div className="flex">
        {/* Sidebar Navigation Mejorado */}
        <div className="w-72 bg-white shadow-lg min-h-screen border-r border-gray-200">
          {/* 🆕 HEADER DEL SIDEBAR */}
          <div className="p-6 bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-emerald-200">
            <h3 className="text-sm font-semibold text-emerald-800 uppercase tracking-wide">
              Navegación Principal
            </h3>
            <p className="text-xs text-emerald-600 mt-1">
              Herramientas de asistencia médica
            </p>
          </div>

          <nav className="mt-2 px-3">
            <div className="space-y-2">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.name}
                    onClick={() => handleNavigation(item.path)}
                    className={`w-full group flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 text-left relative ${
                      item.current
                        ? 'bg-emerald-100 text-emerald-900 shadow-md border-l-4 border-emerald-500'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    {/* 🆕 INDICADOR DE NUEVO */}
                    {item.isNew && (
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-purple-500 rounded-full flex items-center justify-center">
                        <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                      </div>
                    )}
                    
                    <Icon
                      className={`mr-4 h-6 w-6 transition-colors ${
                        item.current
                          ? 'text-emerald-600'
                          : 'text-gray-400 group-hover:text-gray-500'
                      }`}
                    />
                    <div className="flex-1">
                      <div className={`font-semibold ${item.current ? 'text-emerald-900' : 'text-gray-700'}`}>
                        {item.name}
                      </div>
                      <div className={`text-xs ${item.current ? 'text-emerald-600' : 'text-gray-500'}`}>
                        {item.description}
                      </div>
                    </div>
                    
                    {/* 🆕 INDICADOR DE PÁGINA ACTIVA */}
                    {item.current && (
                      <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                    )}
                  </button>
                );
              })}
            </div>
          </nav>

          {/* 🆕 INFORMACIÓN ADICIONAL EN SIDEBAR */}
          <div className="mt-8 mx-3 p-4 bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl border border-purple-200">
            <div className="flex items-center space-x-2 mb-2">
              <Bot className="w-5 h-5 text-purple-600" />
              <span className="text-sm font-semibold text-purple-800">Sistema AISANA</span>
            </div>
            <p className="text-xs text-purple-600">
              Inteligencia Artificial para triaje médico avanzado
            </p>
            <div className="mt-3 flex items-center justify-between text-xs">
              <span className="text-purple-600">Estado:</span>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-green-600 font-medium">Operativo</span>
              </div>
            </div>
          </div>

          {/* 🆕 ACCESOS RÁPIDOS */}
          <div className="mt-6 mx-3 p-4 bg-gray-50 rounded-xl">
            <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-3">
              Accesos Rápidos
            </h4>
            <div className="space-y-2">
              <button
                onClick={() => handleNavigation('/assistant-triage')}
                className="w-full text-left px-3 py-2 text-sm text-gray-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
              >
                + Nuevo Triaje
              </button>
              <button
                onClick={() => handleNavigation('/assistant-history')}
                className="w-full text-left px-3 py-2 text-sm text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
              >
                📊 Ver Estadísticas
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 bg-gray-50">
          <main className="py-8 px-6 lg:px-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
};

export default AssistantLayout;