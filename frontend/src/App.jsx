import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import MedicalLayout from "./components/medical/MedicalLayout";
import RegisterSymptoms from "./components/RegisterSymptoms";
import RegisterUserForm from "./components/RegisterUserForm";
import LoginUserForm from "./components/LoginUserForm";
import SymptomHistory from "./components/SymptomHistory";
import HomeAs from "./pages/HomeAs";
import ChatTriagePage from "./pages/ChatTriagePage"; // 🆕 NUEVA PÁGINA
import MedicalDashboard from "./components/medical/MedicalDashboard";
import PatientList from "./components/medical/PatientList";
import MedicalReports from "./components/medical/MedicalReports";
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
    return <Navigate to="/medical-dashboard" replace />;
  }

  return children;
};

// 🚫 CORREGIDO: Redirección inteligente por rol
const PublicOnlyRoute = ({ children }) => {
  const { user } = useUser();
  
  if (!user) {
    return children; // No hay usuario, mostrar la página pública
  }

  // ✅ REDIRIGIR SEGÚN EL ROL DEL USUARIO
  switch (user.role) {
    case 'personal_medico':
      return <Navigate to="/medical-dashboard" replace />;
    case 'asegurado':
      return <Navigate to="/" replace />;
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

        {/* 🔮 RUTAS FUTURAS PARA SISTEMA MÉDICO */}
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

        {/* 🆕 NUEVA RUTA: CHAT MÉDICO WATSON IA */}
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
      </Routes>
    </Router>
  );
}

// 🎯 Componente para redirección inteligente
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
    case 'admin':
      return <Navigate to="/admin-dashboard" replace />;
    default:
      return <Navigate to="/" replace />;
  }
};

export default App;

//Totalmente funcional. Chat Watson IA integrado.