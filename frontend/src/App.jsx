import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import MedicalLayout from "./components/medical/MedicalLayout";
import AssistantLayout from "./components/assistant/AssistantLayout"; // 🆕 NUEVO LAYOUT
import RegisterSymptoms from "./components/RegisterSymptoms";
import RegisterUserForm from "./components/RegisterUserForm";
import LoginUserForm from "./components/LoginUserForm";
import SymptomHistory from "./components/SymptomHistory";
import HomeAs from "./pages/HomeAs";
import ChatTriagePage from "./pages/ChatTriagePage";
import MedicalDashboard from "./components/medical/MedicalDashboard";
import PatientList from "./components/medical/PatientList";
import MedicalReports from "./components/medical/MedicalReports";
import AssistantDashboard from "./components/assistant/AssistantDashboard"; // 🆕 NUEVO COMPONENTE
import AssistanceHistory from "./components/assistant/AssistanceHistory"; // 🆕 NUEVO COMPONENTE

import { useUser } from "./context/UserContext";

// 🔐 Solo permite acceder si hay sesión activa
const ProtectedRoute = ({ children }) => {
  const { user } = useUser();
  return user ? children : <Navigate to="/login" replace />;
};

// ✨ Solo para personal médico
const MedicalRoute = ({ children }) => {
  const { user } = useUser();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== 'personal_medico') {
    return <Navigate to="/" replace />;
  }

  return children;
};

// 👤 Solo para asegurados
const PatientRoute = ({ children }) => {
  const { user } = useUser();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== 'asegurado') {
    // 🔧 CORREGIDO: Evitar loop infinito, redirigir según rol
    if (user.role === 'personal_medico') {
      return <Navigate to="/medical-dashboard" replace />;
    }
    if (user.role === 'asistente') {
      return <Navigate to="/assistant-dashboard" replace />;
    }
    return <Navigate to="/login" replace />;
  }

  return children;
};

// 🆕 Solo para asistentes - CORREGIDO
const AssistantRoute = ({ children }) => {
  const { user } = useUser();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== 'asistente') {
    // 🔧 CORREGIDO: Redirigir según rol específico
    if (user.role === 'personal_medico') {
      return <Navigate to="/medical-dashboard" replace />;
    }
    if (user.role === 'asegurado') {
      return <Navigate to="/" replace />;
    }
    return <Navigate to="/login" replace />;
  }

  return children;
};

// 🚫 CORREGIDO: Redirección inteligente por rol ACTUALIZADA
const PublicOnlyRoute = ({ children }) => {
  const { user } = useUser();
  
  if (!user) {
    return children;
  }

  // ✅ REDIRIGIR SEGÚN EL ROL DEL USUARIO (INCLUYENDO ASISTENTE)
  switch (user.role) {
    case 'personal_medico':
      return <Navigate to="/medical-dashboard" replace />;
    case 'asegurado':
      return <Navigate to="/" replace />;
    case 'asistente':
      return <Navigate to="/assistant-dashboard" replace />;
    case 'admin':
      return <Navigate to="/admin-dashboard" replace />;
    default:
      return <Navigate to="/" replace />;
  }
};

function App() {
  return (
    <Router>
      <Routes>
        {/* Rutas públicas (sin Layout) */}
        <Route
          path="/login"
          element={
            <PublicOnlyRoute>
              <LoginUserForm />
            </PublicOnlyRoute>
          }
        />

        <Route
          path="/register"
          element={
            <PublicOnlyRoute>
              <RegisterUserForm />
            </PublicOnlyRoute>
          }
        />

        {/* 🏥 RUTAS MÉDICAS - Con protección específica */}
        <Route
          path="/medical-dashboard"
          element={
            <MedicalRoute>
              <MedicalLayout>
                <MedicalDashboard />
              </MedicalLayout>
            </MedicalRoute>
          }
        />

        <Route
          path="/medical-patients"
          element={
            <MedicalRoute>
              <MedicalLayout>
                <PatientList />
              </MedicalLayout>
            </MedicalRoute>
          }
        />

        <Route
          path="/medical-reports"
          element={
            <MedicalRoute>
              <MedicalLayout>
                <MedicalReports />
              </MedicalLayout>
            </MedicalRoute>
          }
        />

        {/* 🆕 RUTAS PARA ASISTENTES - TODAS PROTEGIDAS */}
        <Route
          path="/assistant-dashboard"
          element={
            <AssistantRoute>
              <AssistantLayout>
                <AssistantDashboard />
              </AssistantLayout>
            </AssistantRoute>
          }
        />

        {/* 🔧 CORREGIDO: Ruta de historial ahora protegida */}
        <Route
          path="/assistant-history"
          element={
            <AssistantRoute>
              <AssistantLayout>
                <AssistanceHistory />
              </AssistantLayout>
            </AssistantRoute>
          }
        />

        <Route
          path="/assistant-triage/:patientId?"
          element={
            <AssistantRoute>
              <AssistantLayout>
                <RegisterSymptoms isAssistantMode={true} />
              </AssistantLayout>
            </AssistantRoute>
          }
        />

        {/* 🆕 RUTA ADICIONAL PARA LISTA DE PACIENTES DEL ASISTENTE */}
        <Route
          path="/assistant-patients"
          element={
            <AssistantRoute>
              <AssistantLayout>
                {/* Aquí iría el componente de lista de pacientes para asistente */}
                <div className="p-6">
                  <h1 className="text-2xl font-bold">Lista de Pacientes</h1>
                  <p className="text-gray-600">Componente en desarrollo...</p>
                </div>
              </AssistantLayout>
            </AssistantRoute>
          }
        />

        {/* 👥 Rutas con Layout (solo para asegurados) */}
        <Route
          path="/"
          element={
            <PatientRoute>
              <Layout>
                <HomeAs />
              </Layout>
            </PatientRoute>
          }
        />

        <Route
          path="/history"
          element={
            <PatientRoute>
              <Layout>
                <SymptomHistory />
              </Layout>
            </PatientRoute>
          }
        />

        <Route
          path="/registersymp"
          element={
            <PatientRoute>
              <Layout>
                <RegisterSymptoms />
              </Layout>
            </PatientRoute>
          }
        />

        <Route
          path="/chat-triage"
          element={
            <PatientRoute>
              <ChatTriagePage />
            </PatientRoute>
          }
        />

        {/* 🔄 Ruta de redirección inteligente para usuarios autenticados */}
        <Route
          path="/dashboard"
          element={<SmartRedirect />}
        />

        {/* 🚫 Ruta 404 - Catch all */}
        <Route 
          path="*" 
          element={<Navigate to="/dashboard" replace />} 
        />
      </Routes>
    </Router>
  );
}

// 🎯 Componente para redirección inteligente ACTUALIZADO
const SmartRedirect = () => {
  const { user } = useUser();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  switch (user.role) {
    case 'personal_medico':
      return <Navigate to="/medical-dashboard" replace />;
    case 'asegurado':
      return <Navigate to="/" replace />;
    case 'asistente':
      return <Navigate to="/assistant-dashboard" replace />;
    case 'admin':
      return <Navigate to="/admin-dashboard" replace />;
    default:
      return <Navigate to="/" replace />;
  }
};

export default App;