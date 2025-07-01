import React, { useContext } from 'react';
import { UserContext } from '../../context/UserContext';
import { useNavigate, useLocation } from 'react-router-dom';
import cnsLogo from '../../assets/cns-logo.png';

const MedicalLayout = ({ children }) => {
  const { user, logout } = useContext(UserContext);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleNavigation = (path) => {
    navigate(path);
  };

  const isActiveRoute = (path) => {
    return location.pathname === path;
  };

  // Verificar acceso
  if (!user || user.role !== 'personal_medico') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full mx-4">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.134 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">Acceso Restringido</h2>
            <p className="text-slate-600 mb-6">
              Esta área está reservada únicamente para el personal médico autorizado.
            </p>
            <button
              onClick={() => navigate('/login')}
              className="w-full bg-teal-500 hover:bg-teal-600 text-white py-3 px-4 rounded-xl font-medium transition-colors"
            >
              Iniciar Sesión
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
  <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
    {/* Navigation Header - COMPARTIDO */}
    <nav className="bg-white/90 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo - ACTUALIZADO CON LOGO REAL */}
          <div className="flex items-center space-x-3">
            {/* Contenedor del logo con imagen real */}
            <div className="bg-gradient-to-r from-teal-500 to-emerald-500 p-1.5 rounded-lg">
              <img 
                src={cnsLogo} 
                alt="CNS Logo" 
                className="w-8 h-8 object-contain"
              />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-800">CNS Triaje</h1>
              <p className="text-xs text-slate-500">Sistema Médico</p>
            </div>
          </div>

          {/* Navigation Links - ✅ CON NAVEGACIÓN REAL */}
          <div className="hidden md:flex items-center space-x-8">
            <button
              onClick={() => handleNavigation('/medical-dashboard')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                isActiveRoute('/medical-dashboard')
                  ? 'bg-teal-50 text-teal-700'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2v0a2 2 0 002-2h10a2 2 0 012 2v0" />
              </svg>
              <span>Dashboard</span>
            </button>
            
            <button
              onClick={() => handleNavigation('/medical-patients')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                isActiveRoute('/medical-patients')
                  ? 'bg-teal-50 text-teal-700'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span>Pacientes</span>
            </button>
            
            <button
              onClick={() => handleNavigation('/medical-reports')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                isActiveRoute('/medical-reports')
                  ? 'bg-teal-50 text-teal-700'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <span>Reportes</span>
            </button>
          </div>

            {/* User Menu */}
            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <div className="relative">
                <button className="relative p-2 rounded-lg hover:bg-slate-100 transition-colors">
                  <svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5-5-5 5h5z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17v-5a6 6 0 10-12 0v5" />
                  </svg>
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></div>
                </button>
              </div>

              {/* User Profile */}
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">
                    {(user?.fullName || user?.name)?.charAt(0).toUpperCase() || 'U'}
                  </span>
                </div>
                <div className="hidden md:block">
                  <p className="text-sm font-medium text-slate-800">
                    Dr. {user?.fullName || user?.name || 'Usuario'}
                  </p>
                  <p className="text-xs text-slate-500">Personal Médico</p>
                </div>
              </div>

              {/* Logout */}
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-4 py-2 rounded-lg text-slate-600 hover:bg-red-50 hover:text-red-700 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span className="hidden md:block">Salir</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="flex-1">
        {children}
      </div>
    </div>
  );
};

export default MedicalLayout;